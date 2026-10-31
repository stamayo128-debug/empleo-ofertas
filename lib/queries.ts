import 'server-only';
import { cache } from 'react';
import { db, fetchAll, ok } from './db';
import { ZONAS_FILTRO, type TabId } from './constantes';
import type { Filtros } from './filtros';
import type { Busqueda, Criterios, CuadreBusqueda, Descarte, DescartadaPorTi, Ejecucion, Evento, NotaAgente, Oferta } from './types';
import { hoyMadrid, inicioDiaMadrid, restarDias } from './format';

const SIN_DESCARTADAS = 'Descartada';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function baseTab(q: any, tab: TabId, incluirDescartadas: boolean) {
  switch (tab) {
    case 'hoy':
      return q.eq('es_de_hoy', true).neq('estado', SIN_DESCARTADAS);
    case 'revisar':
      return q.is('revisada_en', null).neq('estado', SIN_DESCARTADAS);
    case 'verificar':
      return q.eq('por_verificar', true);
    case 'porenviar':
      return q.in('estado', ['Pendiente', 'Mensaje preparado']);
    case 'enviadas':
      return q.in('estado', ['Postulado', 'Entrevista', 'Rechazado']);
    default:
      return incluirDescartadas ? q : q.neq('estado', SIN_DESCARTADAS);
  }
}

/** Quita caracteres con significado especial en filtros PostgREST / ilike. */
function limpiarBusqueda(s: string): string {
  return s.replace(/[,()%*_\\:"'`;]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function aplicarFiltros(q: any, f: Filtros) {
  if (f.plat.length) q = q.in('plataforma', f.plat);
  if (f.estado) q = q.eq('estado', f.estado);
  if (f.encaje) q = q.eq('encaje', f.encaje);
  if (f.mod === 'remoto') q = q.eq('es_remoto', true);
  else if (f.mod) q = q.eq('modalidad', f.mod);
  if (f.sal === 'si') q = q.eq('tiene_salario', true);
  else if (f.sal === 'no') q = q.eq('tiene_salario', false);
  if (f.exp === 'max1') q = q.in('tramo_experiencia', ['sin_experiencia', 'hasta_1']);
  else if (f.exp === 'max2') q = q.in('tramo_experiencia', ['sin_experiencia', 'hasta_1', 'hasta_2']);
  else if (f.exp === 'mas2') q = q.eq('tramo_experiencia', 'mas_de_2');
  else if (f.exp === 'no_indica') q = q.eq('tramo_experiencia', 'no_indica');
  if (f.zona === 'otra') q = q.in('zona', ['otra', 'euskadi_otra']);
  else if (ZONAS_FILTRO.some((z) => z.valor === f.zona)) q = q.eq('zona', f.zona);
  const t = limpiarBusqueda(f.q);
  if (t) q = q.or(`puesto.ilike.*${t}*,empresa.ilike.*${t}*,lugar.ilike.*${t}*,municipio.ilike.*${t}*`);
  return q;
}

export async function contadoresTabs(): Promise<Record<TabId, number>> {
  const tabs: TabId[] = ['hoy', 'revisar', 'verificar', 'porenviar', 'enviadas', 'todas'];
  const res = await Promise.all(
    tabs.map((t) => baseTab(db().from('v_ofertas_web').select('id', { count: 'exact', head: true }), t, false)),
  );
  const out = {} as Record<TabId, number>;
  tabs.forEach((t, i) => {
    const r = res[i] as { count: number | null; error: { message: string } | null };
    if (r.error) throw new Error('Error de base de datos');
    out[t] = r.count ?? 0;
  });
  return out;
}

export async function listarOfertas(f: Filtros): Promise<{ filas: Oferta[]; total: number }> {
  let q = db().from('v_ofertas_web').select('*', { count: 'exact' });
  q = aplicarFiltros(baseTab(q, f.tab, f.descartadas), f);

  const porPublicacion = f.orden === 'publicacion';
  const porDeteccion = f.orden === 'deteccion';
  if (porDeteccion) {
    q = q.order('fecha_deteccion', { ascending: false });
  } else if (porPublicacion) {
    q = q.order('fecha_publicacion', { ascending: false, nullsFirst: false });
  } else if (f.tab === 'hoy') {
    q = q.order('encaje', { ascending: true }).order('fecha_publicacion', { ascending: false, nullsFirst: false });
  } else if (f.tab === 'porenviar') {
    q = q.order('encaje', { ascending: true }).order('fecha_publicacion', { ascending: false, nullsFirst: false });
  } else if (f.tab === 'enviadas') {
    q = q.order('orden_enviadas', { ascending: true }).order('proximo_seguimiento', { ascending: true, nullsFirst: false });
  } else {
    q = q.order('fecha_deteccion', { ascending: false });
  }
  q = q.order('id', { ascending: false }).range(0, f.lim - 1);

  const res = (await q) as unknown as { data: Oferta[] | null; count: number | null; error: { message: string } | null };
  const filas = ok<Oferta[]>(res as never) ?? [];
  return { filas, total: res.count ?? filas.length };
}

export const plataformasDisponibles = cache(async (): Promise<string[]> => {
  // Equivale a "select distinct plataforma": PostgREST no tiene DISTINCT, se deduplica aquí.
  const filas = await fetchAll<{ plataforma: string }>('ofertas', 'plataforma', 'id');
  return [...new Set(filas.map((x) => x.plataforma).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es'));
});

export async function obtenerOferta(id: number): Promise<Oferta | null> {
  const res = await db().from('v_ofertas_web').select('*').eq('id', id).maybeSingle();
  return ok<Oferta | null>(res as never);
}

export async function eventosDeOferta(id: number): Promise<Evento[]> {
  const res = await db().from('eventos_oferta').select('*').eq('oferta_id', id)
    .order('creado_en', { ascending: false }).order('id', { ascending: false }).range(0, 99);
  return ok<Evento[]>(res as never) ?? [];
}

/** Primera vez que se abre la oferta: rellena revisada_en. */
export async function marcarRevisada(id: number): Promise<void> {
  const res = await db().from('ofertas').update({ revisada_en: new Date().toISOString() })
    .eq('id', id).is('revisada_en', null);
  ok(res as never);
}

export const ultimaEjecucion = cache(async (): Promise<Ejecucion | null> => {
  const res = await db().from('ejecuciones').select('*').neq('tipo', 'prueba')
    .order('iniciada_en', { ascending: false }).limit(1);
  const filas = ok<Ejecucion[]>(res as never) ?? [];
  return filas[0] ?? null;
});

// ---------- Descartes ----------
export type FiltroDescartes = { motivo: string; plat: string; rango: 'hoy' | '7' | '30'; lim: number };

export async function listarDescartes(f: FiltroDescartes): Promise<{ filas: Descarte[]; total: number }> {
  const hoy = hoyMadrid();
  const desde = f.rango === 'hoy' ? inicioDiaMadrid(hoy) : inicioDiaMadrid(restarDias(hoy, f.rango === '7' ? 6 : 29));
  // fusionado_en: los descartes 'duplicada' ya absorbidos como fuente de otra oferta no se listan.
  let q = db().from('descartes').select('*', { count: 'exact' }).gte('primera_vez', desde).is('fusionado_en', null);
  if (f.motivo) q = q.eq('motivo', f.motivo);
  if (f.plat) q = q.eq('plataforma', f.plat);
  q = q.order('primera_vez', { ascending: false }).order('id', { ascending: false }).range(0, f.lim - 1);
  const res = (await q) as unknown as { data: Descarte[] | null; count: number | null; error: { message: string } | null };
  const filas = ok<Descarte[]>(res as never) ?? [];
  return { filas, total: res.count ?? filas.length };
}

/** Ofertas descartadas a mano desde la web (con motivo y nota), las más recientes primero. */
export async function descartadasPorTi(lim: number): Promise<{ filas: DescartadaPorTi[]; total: number }> {
  const res = (await db().from('v_ofertas_web')
    .select('id,codigo,puesto,empresa,descarte_usuario_motivo,descarte_usuario_detalle,descartada_en', { count: 'exact' })
    .not('descarte_usuario_motivo', 'is', null)
    .order('descartada_en', { ascending: false, nullsFirst: false })
    .order('id', { ascending: false })
    .range(0, lim - 1)) as unknown as { data: DescartadaPorTi[] | null; count: number | null; error: { message: string } | null };
  const filas = ok<DescartadaPorTi[]>(res as never) ?? [];
  return { filas, total: res.count ?? filas.length };
}

export async function resumenMotivos30d(): Promise<{ motivo: string; n_30d: number }[]> {
  const res = await db().from('v_descartes_motivos').select('motivo,n_30d');
  return (ok<{ motivo: string; n_30d: number }[]>(res as never) ?? []).map((x) => ({ motivo: x.motivo, n_30d: Number(x.n_30d) }));
}

export async function plataformasDescartes(): Promise<string[]> {
  const filas = await fetchAll<{ plataforma: string }>('descartes', 'plataforma', 'id');
  return [...new Set(filas.map((x) => x.plataforma).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es'));
}

export async function descartesDeHoy(): Promise<number> {
  const res = await db().from('descartes').select('id', { count: 'exact', head: true })
    .gte('primera_vez', inicioDiaMadrid(hoyMadrid()));
  return (res as unknown as { count: number | null }).count ?? 0;
}

// ---------- Historial ----------
export async function listarEjecuciones(lim: number): Promise<{ filas: Ejecucion[]; total: number }> {
  const res = (await db().from('ejecuciones').select('*', { count: 'exact' })
    .order('iniciada_en', { ascending: false }).order('id', { ascending: false })
    .range(0, lim - 1)) as unknown as { data: Ejecucion[] | null; count: number | null; error: { message: string } | null };
  const filas = ok<Ejecucion[]>(res as never) ?? [];
  return { filas, total: res.count ?? filas.length };
}

export async function busquedasDe(ids: number[]): Promise<Busqueda[]> {
  if (!ids.length) return [];
  return fetchAll<Busqueda>('busquedas', '*', 'id', (q) => q.in('ejecucion_id', ids));
}

export async function cuadreDe(ids: number[]): Promise<CuadreBusqueda[]> {
  if (!ids.length) return [];
  return fetchAll<CuadreBusqueda>('v_cuadre_busquedas_v2', 'id,ejecucion_id,resultados_scraper,cola_pendiente', 'id', (q) => q.in('ejecucion_id', ids));
}

// ---------- Criterios y notas del agente ----------
export async function obtenerCriterios(): Promise<Criterios | null> {
  const res = await db().from('criterios_busqueda').select('*').eq('activo', true).maybeSingle();
  return ok<Criterios | null>(res as never);
}

export async function notasAgente(): Promise<NotaAgente[]> {
  const res = await db().from('agente_notas')
    .select('id,tipo,clave,texto,prioridad,autor,actualizada_en,caduca_en')
    .eq('activa', true).order('prioridad').order('actualizada_en', { ascending: false }).range(0, 49);
  return ok<NotaAgente[]>(res as never) ?? [];
}
