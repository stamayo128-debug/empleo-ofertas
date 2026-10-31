const TZ = 'Europe/Madrid';

const fDia = new Intl.DateTimeFormat('es-ES', { timeZone: TZ, day: '2-digit', month: '2-digit', year: 'numeric' });
const fCorta = new Intl.DateTimeFormat('es-ES', { timeZone: TZ, day: '2-digit', month: '2-digit' });
const fHora = new Intl.DateTimeFormat('es-ES', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hour12: false });
const fISO = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' });

/** Fecha de hoy en Madrid, formato AAAA-MM-DD. */
export function hoyMadrid(): string {
  return fISO.format(new Date());
}

/** Fecha (AAAA-MM-DD) de un instante, en Madrid. */
export function diaMadrid(ts: string | Date): string {
  return fISO.format(typeof ts === 'string' ? new Date(ts) : ts);
}

function desfaseMs(d: Date): number {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone: TZ, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    }).formatToParts(d).map((x) => [x.type, x.value]),
  );
  const local = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
  return local - Math.floor(d.getTime() / 1000) * 1000;
}

/** Instante (ISO UTC) en el que empieza el día de Madrid indicado (AAAA-MM-DD). */
export function inicioDiaMadrid(dia: string): string {
  const [y, m, d] = dia.split('-').map(Number);
  const utc = Date.UTC(y, m - 1, d);
  let t = utc - desfaseMs(new Date(utc));
  t = utc - desfaseMs(new Date(t));
  return new Date(t).toISOString();
}

/** Resta días a una fecha AAAA-MM-DD. */
export function restarDias(dia: string, n: number): string {
  const [y, m, d] = dia.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d - n)).toISOString().slice(0, 10);
}

/** dd/mm/aaaa de una fecha-sola (AAAA-MM-DD) o de un instante. */
export function fmtDia(v?: string | null): string {
  if (!v) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return `${v.slice(8, 10)}/${v.slice(5, 7)}/${v.slice(0, 4)}`;
  const d = new Date(v);
  return isNaN(d.getTime()) ? '' : fDia.format(d);
}

/** dd/mm */
export function fmtCorta(v?: string | null): string {
  if (!v) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return `${v.slice(8, 10)}/${v.slice(5, 7)}`;
  const d = new Date(v);
  return isNaN(d.getTime()) ? '' : fCorta.format(d);
}

export function fmtHora(v?: string | null): string {
  if (!v) return '';
  const d = new Date(v);
  return isNaN(d.getTime()) ? '' : fHora.format(d);
}

export function fmtFechaHora(v?: string | null): string {
  if (!v) return '';
  return `${fmtDia(v)} ${fmtHora(v)}`;
}

/** Diferencia en días entre hoy (Madrid) y una fecha AAAA-MM-DD o instante. */
export function diasDesde(v: string): number {
  const dia = /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : diaMadrid(v);
  const [y, m, d] = dia.split('-').map(Number);
  const [y2, m2, d2] = hoyMadrid().split('-').map(Number);
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y, m - 1, d)) / 86400000);
}

export function publicadaTexto(fecha: string | null, estimada: boolean): string {
  if (!fecha) return 'Sin fecha';
  const n = diasDesde(fecha);
  const pre = estimada ? '≈ ' : '';
  if (n <= 0) return `${pre}publicada hoy`;
  if (n === 1) return `${pre}publicada ayer`;
  if (n <= 30) return `${pre}publicada hace ${n} días`;
  return `${pre}publicada el ${fmtDia(fecha)}`;
}

/** Solo devuelve la URL si es http(s); evita esquemas como javascript:. */
export function urlSegura(u?: string | null): string | null {
  if (!u) return null;
  const t = u.trim();
  if (!t) return null;
  try {
    const p = new URL(t);
    return p.protocol === 'http:' || p.protocol === 'https:' ? t : null;
  } catch {
    return null;
  }
}

/** Lista de textos no vacíos (acepta null/undefined). */
export function lista(v?: string[] | null): string[] {
  return (v ?? []).map((x) => (typeof x === 'string' ? x.trim() : '')).filter(Boolean);
}

/** Texto no vacío o null. */
export function txt(v?: string | null): string | null {
  const t = typeof v === 'string' ? v.trim() : '';
  return t ? t : null;
}

/** herramientas ∪ aptitudes sin duplicados (herramientas primero). */
export function herramientasYAptitudes(h?: string[] | null, a?: string[] | null): string[] {
  const vistos = new Set<string>();
  const out: string[] = [];
  for (const x of [...lista(h), ...lista(a)]) {
    const k = x.toLocaleLowerCase('es');
    if (!vistos.has(k)) { vistos.add(k); out.push(x); }
  }
  return out;
}
