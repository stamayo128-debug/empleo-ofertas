import 'server-only';
import { db } from './db';

type Fila = {
  plataforma: string; actor: string; actor_respaldo: string | null; descripcion: string; parametros: Record<string, unknown>;
  campo_ventana: string | null; valor_24h: string | null; valor_7d: string | null; dias_semana: number[]; sitio: string; tema: string;
};
type Sitio = { nombre: string; radio_km: number };

/** Palabra con la que cada sitio de referencia aparece en el texto de Google Jobs. */
const PALABRA_REFERENCIA: Record<string, string> = { 'Leganés': 'Madrid', Bilbao: 'Bilbao' };

/** Millas que pide LinkedIn para un radio en km. */
const millas = (km: number) => String(Math.max(1, Math.round(km * 0.621)));

/** Copia los parámetros de una búsqueda cambiando solo el lugar. Devuelve null si ese portal no depende de un lugar. */
export function parametrosParaSitio(actor: string, base: Record<string, unknown>, refSitio: string, sitio: Sitio): Record<string, unknown> | null {
  const p: Record<string, unknown> = JSON.parse(JSON.stringify(base));
  switch (actor) {
    case 'valig/linkedin-jobs-scraper': {
      p.location = `${sitio.nombre}, Spain`;
      const previos = Array.isArray(p.urlParam) ? (p.urlParam as unknown[]) : [];
      const conservar = previos.filter((x) => {
        const k = typeof x === 'string' ? x.split('=')[0] : (x as { key?: string })?.key;
        return k !== 'distance' && k !== 'f_WT';
      });
      p.urlParam = [...conservar, { key: 'distance', value: millas(sitio.radio_km) }];
      return p;
    }
    case 'valig/indeed-jobs-scraper':
      p.location = sitio.nombre;
      return p;
    case 'nomad-agent/infojobs-scraper':
      p.locations = [sitio.nombre];
      return p;
    case 'serpapi/google_jobs': {
      const q = String(p.q ?? '');
      const palabra = PALABRA_REFERENCIA[refSitio] ?? refSitio;
      p.q = q.toLowerCase().includes(palabra.toLowerCase())
        ? q.replace(new RegExp(palabra, 'ig'), sitio.nombre)
        : `${q} ${sitio.nombre}`.trim();
      return p;
    }
    default:
      return null;
  }
}

/** Crea las búsquedas de un tema para un sitio nuevo copiándolas de otro sitio con presencia física. Devuelve cuántas creó. */
export async function crearBusquedasDeTema(sitio: Sitio, tema: string, nombreTema: string): Promise<number> {
  const origen = await db().from('consultas')
    .select('plataforma,actor,actor_respaldo,descripcion,parametros,campo_ventana,valor_24h,valor_7d,dias_semana,sitio,tema')
    .eq('tema', tema).not('sitio', 'in', '("remoto","varios")').order('id');
  const filas = (origen.data ?? []) as Fila[];
  if (filas.length === 0) return 0;
  const refSitio = filas[0].sitio;
  const nuevas = filas
    .filter((f) => f.sitio === refSitio)
    .map((f) => {
      const parametros = parametrosParaSitio(f.actor, f.parametros, f.sitio, sitio);
      if (!parametros) return null;
      return {
        plataforma: f.plataforma, actor: f.actor, actor_respaldo: f.actor_respaldo,
        descripcion: `${nombreTema} · ${sitio.nombre} (${f.plataforma})`,
        parametros, campo_ventana: f.campo_ventana, valor_24h: f.valor_24h, valor_7d: f.valor_7d,
        dias_semana: f.dias_semana, activa: true, tema, sitio: sitio.nombre,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);
  if (nuevas.length === 0) return 0;
  const res = await db().from('consultas').insert(nuevas).select('id');
  if (res.error) { console.error('[crearBusquedasDeTema]', res.error.code ?? ''); return 0; }
  return res.data?.length ?? 0;
}

/** Apaga todas las búsquedas de un sitio (al quitarlo o desactivarlo) para que no sigan gastando. */
export async function apagarBusquedasDeSitio(nombre: string): Promise<void> {
  const res = await db().from('consultas').update({ activa: false, updated_at: new Date().toISOString() }).eq('sitio', nombre);
  if (res.error) console.error('[apagarBusquedasDeSitio]', res.error.code ?? '');
}

/** Pone al día la distancia de LinkedIn de un sitio cuando cambia su radio. */
export async function actualizarRadioBusquedas(sitio: Sitio): Promise<void> {
  const res = await db().from('consultas').select('id,parametros').eq('sitio', sitio.nombre).eq('actor', 'valig/linkedin-jobs-scraper');
  for (const f of (res.data ?? []) as { id: number; parametros: Record<string, unknown> }[]) {
    const p = parametrosParaSitio('valig/linkedin-jobs-scraper', f.parametros, sitio.nombre, sitio);
    if (p) await db().from('consultas').update({ parametros: p, updated_at: new Date().toISOString() }).eq('id', f.id);
  }
}
