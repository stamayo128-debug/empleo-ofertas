'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from './db';
import { ENCAJES, ESTADOS, MOTIVOS_DESCARTE_USUARIO, RESPUESTAS } from './constantes';
import { apagarBusquedasDeSitio, actualizarRadioBusquedas, crearBusquedasDeTema } from './busquedas-servidor';
import { juntarPerfil, MAX_PERFIL } from './perfil';
import { obtenerCriterios } from './queries';
import { requireSession } from './session';
import { enZonaPreferente } from './ubicacion';

const texto = (max: number) =>
  z.string().max(max).transform((s) => (s.trim() === '' ? null : s)).nullable();

// Lista blanca de campos editables. Cualquier otra clave se rechaza (strictObject).
const parche = z.strictObject({
  estado: z.enum(ESTADOS),
  respuesta_tipo: z.enum(RESPUESTAS),
  respuesta: texto(4000),
  notas: texto(20000),
  cv_adaptado: z.boolean(),
  mensaje_revisado: z.boolean(),
  version_cv: texto(100),
  fecha_envio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  canal_contacto: texto(100),
  preparar_candidatura: z.boolean(),
  encaje: z.enum(ENCAJES),
}).partial();

const idSchema = z.number().int().positive();

export type ResultadoGuardar =
  | { ok: true; estado: string; fecha_envio: string | null; proximo_seguimiento: string | null }
  | { ok: false; error: string };

// Campos que no cambian nada visible en las listas: no hace falta revalidar la página.
const SIN_REVALIDAR = new Set(['notas', 'respuesta', 'version_cv', 'canal_contacto']);

export async function actualizarOferta(idEntrada: number, parcheEntrada: unknown): Promise<ResultadoGuardar> {
  await requireSession();
  const id = idSchema.safeParse(idEntrada);
  const datos = parche.safeParse(parcheEntrada);
  if (!id.success || !datos.success) return { ok: false, error: 'Datos no válidos' };
  const claves = Object.keys(datos.data);
  if (claves.length === 0) return { ok: false, error: 'Nada que guardar' };

  const res = await db().from('ofertas').update(datos.data).eq('id', id.data)
    .select('estado,fecha_envio,proximo_seguimiento').single();
  if (res.error || !res.data) {
    console.error('[actualizarOferta]', res.error?.code ?? '');
    return { ok: false, error: 'No se pudo guardar' };
  }
  if (!claves.every((c) => SIN_REVALIDAR.has(c))) revalidatePath('/');
  return { ok: true, ...(res.data as { estado: string; fecha_envio: string | null; proximo_seguimiento: string | null }) };
}

export async function recuperarDescarte(idEntrada: number): Promise<{ ok: true; ofertaId: number } | { ok: false; error: string }> {
  await requireSession();
  const id = idSchema.safeParse(idEntrada);
  if (!id.success) return { ok: false, error: 'Datos no válidos' };

  const { data: d, error } = await db().from('descartes').select('*').eq('id', id.data).maybeSingle();
  if (error || !d) return { ok: false, error: 'No se encontró el descarte' };
  if (d.recuperada_como) return { ok: false, error: 'Ya estaba recuperada' };

  const zonasValidas = ['bizkaia', 'madrid', 'remoto_espana', 'euskadi_otra', 'otra'];
  // Si el lugar está en tus municipios preferentes (o es Leganés) la oferta recuperada entra como Madrid,
  // en vez de heredar la zona 'otra' con la que el agente la descartó.
  const criterios = await obtenerCriterios().catch(() => null);
  const zona = enZonaPreferente(d.lugar, criterios?.municipios_madrid_preferentes)
    ? 'madrid'
    : zonasValidas.includes(d.zona) ? d.zona : 'otra';
  const ins = await db().from('ofertas').insert({
    puesto: d.puesto || 'Sin título',
    empresa: d.empresa || 'Sin empresa',
    lugar: d.lugar,
    zona,
    plataforma: d.plataforma,
    url: d.url ?? '',
    url_canonica: d.url_canonica ?? `descarte:${d.id}`,
    fecha_publicacion: d.fecha_publicacion,
    encaje: 'Medio',
    origen: 'recuperada',
    busqueda_id: d.busqueda_id,
  }).select('id').single();
  if (ins.error || !ins.data) {
    console.error('[recuperarDescarte]', ins.error?.code ?? '');
    return { ok: false, error: 'No se pudo recuperar (puede que la oferta ya exista)' };
  }
  const upd = await db().from('descartes').update({ recuperada_como: ins.data.id }).eq('id', d.id);
  if (upd.error) console.error('[recuperarDescarte:enlace]', upd.error.code ?? '');
  revalidatePath('/');
  revalidatePath('/descartadas');
  return { ok: true, ofertaId: ins.data.id as number };
}

// ---------- Ajustes: sitios donde busco y puestos ----------
const nombreSitio = z.string().trim().min(2).max(80);
const radioSitio = z.number().int().min(1).max(200);
const listaPuestos = z.array(z.string().trim().min(1).max(120)).max(60);
type Resultado = { ok: true } | { ok: false; error: string };

export async function anadirUbicacion(nombre: unknown, radio: unknown): Promise<Resultado> {
  await requireSession();
  const n = nombreSitio.safeParse(nombre);
  const r = radioSitio.safeParse(radio);
  if (!n.success || !r.success) return { ok: false, error: 'Escribe el nombre del sitio y un radio válido' };
  const ult = await db().from('ubicaciones').select('orden').order('orden', { ascending: false }).limit(1);
  const orden = ((ult.data?.[0] as { orden?: number } | undefined)?.orden ?? 0) + 1;
  const res = await db().from('ubicaciones').insert({ nombre: n.data, radio_km: r.data, orden });
  if (res.error) {
    if (res.error.code === '23505') return { ok: false, error: 'Ese sitio ya está en la lista' };
    console.error('[anadirUbicacion]', res.error.code ?? '');
    return { ok: false, error: 'No se pudo añadir' };
  }
  revalidatePath('/ajustes', 'layout');
  return { ok: true };
}

export async function cambiarUbicacion(idEntrada: unknown, cambios: unknown): Promise<Resultado> {
  await requireSession();
  const id = idSchema.safeParse(idEntrada);
  const c = z.strictObject({ radio_km: radioSitio.optional(), activa: z.boolean().optional() }).safeParse(cambios);
  if (!id.success || !c.success || Object.keys(c.data).length === 0) return { ok: false, error: 'Datos no válidos' };
  const res = await db().from('ubicaciones').update(c.data).eq('id', id.data).select('id,nombre,radio_km');
  if (res.error || !res.data || res.data.length === 0) {
    console.error('[cambiarUbicacion]', res.error?.code ?? 'sin filas');
    return { ok: false, error: 'No se pudo guardar' };
  }
  const sitio = res.data[0] as { nombre: string; radio_km: number };
  if (c.data.activa === false) await apagarBusquedasDeSitio(sitio.nombre); // sin sitio activo no se busca allí
  if (c.data.radio_km !== undefined) await actualizarRadioBusquedas(sitio);
  revalidatePath('/ajustes', 'layout');
  return { ok: true };
}

export async function quitarUbicacion(idEntrada: unknown): Promise<Resultado> {
  await requireSession();
  const id = idSchema.safeParse(idEntrada);
  if (!id.success) return { ok: false, error: 'Datos no válidos' };
  const previo = await db().from('ubicaciones').select('nombre').eq('id', id.data).maybeSingle();
  const res = await db().from('ubicaciones').delete().eq('id', id.data);
  if (res.error) {
    console.error('[quitarUbicacion]', res.error.code ?? '');
    return { ok: false, error: 'No se pudo quitar' };
  }
  const nombre = (previo.data as { nombre?: string } | null)?.nombre;
  if (nombre) await apagarBusquedasDeSitio(nombre); // que no sigan gastando búsquedas de un sitio que ya no existe
  revalidatePath('/ajustes', 'layout');
  return { ok: true };
}

/** «Aceptar remoto desde España». Solo toca ese campo de los criterios. */
export async function cambiarRemoto(valor: unknown): Promise<Resultado> {
  await requireSession();
  const v = z.boolean().safeParse(valor);
  if (!v.success) return { ok: false, error: 'Datos no válidos' };
  const res = await db().from('criterios_busqueda').update({ aceptar_remoto_espana: v.data }).eq('activo', true).select('id');
  if (res.error || !res.data || res.data.length === 0) {
    console.error('[cambiarRemoto]', res.error?.code ?? 'sin filas');
    return { ok: false, error: 'No se pudo guardar' };
  }
  revalidatePath('/ajustes', 'layout');
  return { ok: true };
}

/** Los dos listados de puestos. Solo toca esos dos campos (el resto de criterios no se reescribe). */
export async function guardarPuestos(datos: unknown): Promise<Resultado> {
  await requireSession();
  const p = z.strictObject({ puestos_objetivo: listaPuestos, puestos_adyacentes: listaPuestos }).safeParse(datos);
  if (!p.success) return { ok: false, error: 'Datos no válidos' };
  const res = await db().from('criterios_busqueda').update(p.data).eq('activo', true).select('id');
  if (res.error || !res.data || res.data.length === 0) {
    console.error('[guardarPuestos]', res.error?.code ?? 'sin filas');
    return { ok: false, error: 'No se pudo guardar' };
  }
  revalidatePath('/ajustes', 'layout');
  revalidatePath('/criterios');
  return { ok: true };
}

/** Enciende o apaga las búsquedas de un tema en un sitio (todos los portales a la vez). Si el sitio aún no las tiene, las crea. */
export async function cambiarBusquedas(sitio: unknown, tema: unknown, activa: unknown): Promise<Resultado> {
  await requireSession();
  const d = z.strictObject({ sitio: z.string().trim().min(1).max(80), tema: z.string().trim().min(1).max(60), activa: z.boolean() }).safeParse({ sitio, tema, activa });
  if (!d.success) return { ok: false, error: 'Datos no válidos' };

  const existentes = await db().from('consultas').select('id').eq('sitio', d.data.sitio).eq('tema', d.data.tema);
  if (!existentes.error && (existentes.data ?? []).length === 0) {
    if (!d.data.activa) return { ok: true };
    const [lugar, info] = await Promise.all([
      db().from('ubicaciones').select('nombre,radio_km,activa').eq('nombre', d.data.sitio).maybeSingle(),
      db().from('temas_busqueda').select('nombre').eq('clave', d.data.tema).maybeSingle(),
    ]);
    const u = lugar.data as { nombre: string; radio_km: number; activa: boolean } | null;
    if (!u || !u.activa) return { ok: false, error: 'Ese sitio no está activo' };
    const creadas = await crearBusquedasDeTema(u, d.data.tema, (info.data as { nombre?: string } | null)?.nombre ?? d.data.tema);
    if (creadas === 0) return { ok: false, error: 'No hay una búsqueda de este tema que se pueda copiar a este sitio' };
    revalidatePath('/ajustes', 'layout');
    return { ok: true };
  }

  const res = await db().from('consultas').update({ activa: d.data.activa, updated_at: new Date().toISOString() }).eq('sitio', d.data.sitio).eq('tema', d.data.tema).select('id');
  if (res.error || !res.data || res.data.length === 0) {
    console.error('[cambiarBusquedas]', res.error?.code ?? 'sin filas');
    return { ok: false, error: 'No se pudo guardar' };
  }
  revalidatePath('/ajustes', 'layout');
  return { ok: true };
}

/** El perfil, por apartados. Se junta en un solo texto y solo se toca ese campo de los criterios. */
export async function guardarPerfil(datos: unknown): Promise<Resultado> {
  await requireSession();
  const parte = z.string().max(MAX_PERFIL);
  const p = z.strictObject({ quien: parte, experiencia: parte, se: parte, no: parte, busco: parte }).safeParse(datos);
  if (!p.success) return { ok: false, error: 'Datos no válidos' };
  const texto = juntarPerfil(p.data);
  if (texto.length > MAX_PERFIL) return { ok: false, error: `El perfil no puede pasar de ${MAX_PERFIL} caracteres (ahora tiene ${texto.length})` };
  const res = await db().from('criterios_busqueda').update({ perfil_candidato: texto === '' ? null : texto }).eq('activo', true).select('id');
  if (res.error || !res.data || res.data.length === 0) {
    console.error('[guardarPerfil]', res.error?.code ?? 'sin filas');
    return { ok: false, error: 'No se pudo guardar' };
  }
  revalidatePath('/ajustes', 'layout');
  revalidatePath('/criterios');
  return { ok: true };
}

// ---------- Guardar una oferta para verla después ----------
export async function alternarGuardada(idEntrada: number, guardada: boolean): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireSession();
  const id = idSchema.safeParse(idEntrada);
  if (!id.success || typeof guardada !== 'boolean') return { ok: false, error: 'Datos no válidos' };
  const res = await db().from('ofertas').update({ guardada_en: guardada ? new Date().toISOString() : null })
    .eq('id', id.data).select('id').maybeSingle();
  if (res.error || !res.data) {
    console.error('[alternarGuardada]', res.error?.code ?? '');
    return { ok: false, error: 'No se pudo guardar' };
  }
  revalidatePath('/');
  revalidatePath('/guardadas');
  return { ok: true };
}

// ---------- Marcado rápido de "solicitud enviada" ----------
const idsSchema = z.array(z.number().int().positive()).min(1).max(200);
const cambioSchema = z.array(z.strictObject({
  id: z.number().int().positive(),
  estado_anterior: z.enum(['Pendiente', 'Mensaje preparado']),
  fecha_envio_anterior: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
})).min(1).max(200);

export type CambioEnvio = {
  id: number;
  estado_anterior: string;
  fecha_envio_anterior: string | null;
  fecha_envio: string;
  proximo_seguimiento: string;
};

export async function marcarEnviadas(ids: unknown): Promise<{ ok: true; cambios: CambioEnvio[] } | { ok: false; error: string }> {
  await requireSession();
  const p = idsSchema.safeParse(ids);
  if (!p.success) return { ok: false, error: 'Datos no válidos' };
  const res = await db().rpc('marcar_enviadas', { p_ids: [...new Set(p.data)] });
  if (res.error || !Array.isArray(res.data)) {
    console.error('[marcarEnviadas]', res.error?.code ?? '');
    return { ok: false, error: 'No se pudo guardar' };
  }
  revalidatePath('/');
  return { ok: true, cambios: res.data as CambioEnvio[] };
}

export async function deshacerEnvios(cambios: unknown): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireSession();
  const p = cambioSchema.safeParse(cambios);
  if (!p.success) return { ok: false, error: 'Datos no válidos' };
  const items = p.data.map(({ id, estado_anterior, fecha_envio_anterior }) => ({ id, estado_anterior, fecha_envio_anterior }));
  const res = await db().rpc('revertir_envios', { p_items: items });
  if (res.error) {
    console.error('[deshacerEnvios]', res.error.code ?? '');
    return { ok: false, error: 'No se pudo guardar' };
  }
  revalidatePath('/');
  return { ok: true };
}

// ---------- Descartes manuales ----------
const motivoSchema = z.enum(MOTIVOS_DESCARTE_USUARIO.map((m) => m.valor) as [string, ...string[]]);
const descarteSchema = z.strictObject({
  ids: z.array(z.number().int().positive()).min(1).max(200),
  motivo: motivoSchema,
  detalle: z.string().max(300).optional(),
});
const deshacerDescarteSchema = z.array(z.strictObject({
  id: z.number().int().positive(),
  estado_anterior: z.enum(ESTADOS.filter((e) => e !== 'Descartada') as [string, ...string[]]),
})).min(1).max(200);

export type CambioDescarte = { id: number; estado_anterior: string };

export async function descartarOfertas(entrada: unknown): Promise<{ ok: true; cambios: CambioDescarte[] } | { ok: false; error: string }> {
  await requireSession();
  const p = descarteSchema.safeParse(entrada);
  if (!p.success) return { ok: false, error: 'Datos no válidos' };
  const detalle = p.data.detalle?.trim() ?? '';
  const res = await db().rpc('descartar_ofertas', {
    p_ids: [...new Set(p.data.ids)],
    p_motivo: p.data.motivo,
    p_detalle: detalle === '' ? null : detalle,
  });
  if (res.error || !Array.isArray(res.data)) {
    console.error('[descartarOfertas]', res.error?.code ?? '');
    return { ok: false, error: 'No se pudo descartar' };
  }
  // Solo se conservan los dos campos que luego acepta "Deshacer".
  const cambios: CambioDescarte[] = (res.data as { id?: unknown; estado_anterior?: unknown }[])
    .filter((c) => typeof c.id === 'number' && typeof c.estado_anterior === 'string')
    .map((c) => ({ id: c.id as number, estado_anterior: c.estado_anterior as string }));
  if (cambios.length === 0) return { ok: false, error: 'Ya estaban descartadas' };
  revalidatePath('/');
  revalidatePath('/descartadas');
  return { ok: true, cambios };
}

export async function deshacerDescartes(cambios: unknown): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireSession();
  const p = deshacerDescarteSchema.safeParse(cambios);
  if (!p.success) return { ok: false, error: 'Datos no válidos' };
  const res = await db().rpc('revertir_descartes', { p_items: p.data.map(({ id, estado_anterior }) => ({ id, estado_anterior })) });
  if (res.error) {
    console.error('[deshacerDescartes]', res.error.code ?? '');
    return { ok: false, error: 'No se pudo deshacer' };
  }
  revalidatePath('/');
  revalidatePath('/descartadas');
  return { ok: true };
}

// ---------- Por verificar ----------
const verificadaSchema = z.strictObject({ id: idSchema, verificada: z.boolean() });
const fusionSchema = z.strictObject({ principal: idSchema, duplicada: idSchema });

export async function marcarVerificada(entrada: unknown): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireSession();
  const p = verificadaSchema.safeParse(entrada);
  if (!p.success) return { ok: false, error: 'Datos no válidos' };
  const res = await db().rpc('marcar_verificada', { p_id: p.data.id, p_verificada: p.data.verificada });
  if (res.error || res.data === 0) {
    console.error('[marcarVerificada]', res.error?.code ?? 'sin filas');
    return { ok: false, error: 'No se pudo guardar' };
  }
  revalidatePath('/');
  return { ok: true };
}

export async function fusionarOfertas(entrada: unknown): Promise<{ ok: true; principal: string } | { ok: false; error: string }> {
  await requireSession();
  const p = fusionSchema.safeParse(entrada);
  if (!p.success) return { ok: false, error: 'Datos no válidos' };
  const res = await db().rpc('fusionar_ofertas', { p_principal: p.data.principal, p_duplicada: p.data.duplicada });
  if (res.error) {
    console.error('[fusionarOfertas]', res.error.code ?? '');
    // P0001 = excepción propia de la función (mensaje pensado para personas, p. ej. "La duplicada ya tiene candidatura").
    const legible = res.error.code === 'P0001' && res.error.message ? res.error.message.slice(0, 160) : null;
    return { ok: false, error: legible ?? 'No se pudo fusionar' };
  }
  const principal = (res.data as { principal?: unknown } | null)?.principal;
  revalidatePath('/');
  revalidatePath('/descartadas');
  return { ok: true, principal: typeof principal === 'string' ? principal : '' };
}

// ---------- Criterios de búsqueda ----------
const lista = (max = 120) => z.array(z.string().trim().min(1).max(max)).max(60);

const criteriosSchema = z.strictObject({
  perfil_candidato: z.string().trim().max(3000),
  indicaciones_extra: z.string().trim().max(2000),
  puestos_objetivo: lista(),
  puestos_adyacentes: lista(),
  puestos_excluidos: lista(),
  palabras_senior: lista(),
  palabras_ambiguas: lista(),
  palabras_junior: lista(),
  municipios_bizkaia: lista(120),
  municipios_madrid_preferentes: lista(),
  zonas_cercanas: lista(),
  idiomas_candidato: lista(),
  anios_max_alto: z.number().min(0).max(30),
  anios_max_aceptable: z.number().min(0).max(30),
  antiguedad_max_dias: z.number().int().min(1).max(365),
  max_detalle_por_ejecucion: z.number().int().min(0).max(200),
  presupuesto_apify_mes_usd: z.number().min(0).max(1000),
  aceptar_cercanas_hibrido: z.boolean(),
  aceptar_madrid_presencial: z.boolean(),
  aceptar_remoto_espana: z.boolean(),
}).refine((d) => d.anios_max_alto <= d.anios_max_aceptable, {
  message: 'Los años para encaje Alto no pueden superar los aceptables',
  path: ['anios_max_alto'],
});

export type ResultadoCriterios = { ok: true } | { ok: false; error: string };

export async function guardarCriterios(datos: unknown): Promise<ResultadoCriterios> {
  await requireSession();
  const p = criteriosSchema.safeParse(datos);
  if (!p.success) return { ok: false, error: p.error.issues[0]?.message?.startsWith('Los años') ? p.error.issues[0].message : 'Datos no válidos' };
  const d = p.data;
  const res = await db().from('criterios_busqueda').update({
    ...d,
    perfil_candidato: d.perfil_candidato === '' ? null : d.perfil_candidato,
    indicaciones_extra: d.indicaciones_extra === '' ? null : d.indicaciones_extra,
  }).eq('activo', true).select('id');
  if (res.error || !res.data || res.data.length === 0) {
    console.error('[guardarCriterios]', res.error?.code ?? 'sin filas');
    return { ok: false, error: 'No se pudo guardar' };
  }
  revalidatePath('/criterios');
  return { ok: true };
}

export async function archivarNota(idEntrada: unknown): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireSession();
  const id = idSchema.safeParse(idEntrada);
  if (!id.success) return { ok: false, error: 'Datos no válidos' };
  const res = await db().from('agente_notas').update({ activa: false }).eq('id', id.data).select('id');
  if (res.error || !res.data || res.data.length === 0) {
    console.error('[archivarNota]', res.error?.code ?? 'sin filas');
    return { ok: false, error: 'No se pudo guardar' };
  }
  revalidatePath('/criterios');
  return { ok: true };
}
