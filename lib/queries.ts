import 'server-only';
import { cache } from 'react';
import { db, fetchAll, ok } from './db';
import type { Filtros } from './filtros';
import type { Busqueda, Criterios, CuadreBusqueda, Descarte, DescartadaPorTi, Ejecucion, Evento, NotaAgente, Oferta, OfertaLista } from './types';
import { hoyMadrid, inicioDiaMadrid, restarDias } from './format';
import { grupoPortal } from './portales';

const SIN_DESCARTADAS = 'Descartada';

/** Columnas de v_ofertas_web que necesita la lista (ver OfertaLista en types.ts). */
const COLUMNAS_LISTA = [
  'id', 'codigo', 'puesto', 'empresa', 'lugar', 'municipio', 'modalidad', 'plataforma', 'plataforma_principal',
  'url', 'url_principal', 'fuentes', 'fecha_publicacion', 'fecha_publicacion_estimada', 'salario', 'tiene_salario',
  'descripcion_clara', 'calidad_datos', 'encaje', 'estado', 'sin_revisar', 'por_verificar', 'origen',
  'respuesta_tipo', 'proximo_seguimiento', 'fecha_envio', 'descarte_usuario_motivo', 'guardada_en',
  'tramo_experiencia', 'fecha_deteccion',
].join(',');

/** Ids de las ofertas que están en alguno de los portales elegidos (en cualquiera de sus fuentes, no solo la principal). */
async function idsPorPortal(grupos: string[]): Promise<number[]> {
  const [fuentes, principales] = await Promise.all([
    fetchAll<{ oferta_id: number; plataforma: string }>('ofertas_fuentes', 'oferta_id,plataforma', 'id'),
    fetchAll<{ id: number; plataforma_principal: string }>('v_ofertas_web', 'id,plataforma_principal', 'id'),
  ]);
  const ids = new Set<number>();
  for (const f of fuentes) if (grupos.includes(grupoPortal(f.plataforma))) ids.add(f.oferta_id);
  for (const o of principales) if (grupos.includes(grupoPortal(o.plataforma_principal))) ids.add(o.id);
  return [...ids];
}

/** Ofertas activas (las descartadas tienen su propia pantalla), las más nuevas primero. */
export async function listarOfertas(f: Filtros): Promise<{ filas: OfertaLista[]; total: number }> {
  let q = db().from('v_ofertas_web').select(COLUMNAS_LISTA, { count: 'exact' }).neq('estado', SIN_DESCARTADAS);
  if (f.plat.length) {
    const ids = await idsPorPortal(f.plat);
    if (ids.length === 0) return { filas: [], total: 0 };
    q = q.in('id', ids);
  }
  if (f.dia) {
    const hoy = hoyMadrid();
    q = q.gte('fecha_deteccion', f.dia === 'hoy' ? hoy : restarDias(hoy, Number(f.dia) - 1));
  }
  q = q.order('fecha_deteccion', { ascending: false }).order('id', { ascending: false }).range(0, f.lim - 1);
  const res = (await q) as unknown as { data: OfertaLista[] | null; count: number | null; error: { message: string } | null };
  const filas = ok<OfertaLista[]>(res as never) ?? [];
  return { filas, total: res.count ?? filas.length };
}

/** Ofertas guardadas con el marcador, la última guardada primero. */
export async function listarGuardadas(lim = 200): Promise<OfertaLista[]> {
  const res = await db().from('v_ofertas_web').select(COLUMNAS_LISTA)
    .not('guardada_en', 'is', null)
    .order('guardada_en', { ascending: false }).order('id', { ascending: false }).range(0, lim - 1);
  return ok<OfertaLista[]>(res as never) ?? [];
}

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

export async function obtenerEjecucion(id: number): Promise<Ejecucion | null> {
  const res = await db().from('ejecuciones').select('*').eq('id', id).maybeSingle();
  return ok<Ejecucion | null>(res as never);
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
