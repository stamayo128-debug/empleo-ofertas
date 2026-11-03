import { PORTALES, type PortalGrupo } from './portales';

export type SP = Record<string, string | string[] | undefined>;

export const DIAS = [
  { valor: 'hoy', etiqueta: 'Hoy' },
  { valor: '7', etiqueta: 'Últimos 7 días' },
  { valor: '30', etiqueta: 'Últimos 30 días' },
] as const;

export const AFINIDADES = [
  { valor: 'muy', etiqueta: 'Muy afín' },
  { valor: 'afin', etiqueta: 'Afín' },
  { valor: 'poco', etiqueta: 'Poco afín' },
] as const;

export const ORDENES = [
  { valor: '', etiqueta: 'Más recientes' },
  { valor: 'afinidad', etiqueta: 'Más afines primero' },
] as const;

/** Filtros de la pantalla Ofertas: portal, fecha y afinidad, y el orden (más la oferta abierta y cuántas se muestran). */
export type Filtros = {
  plat: PortalGrupo[];
  dia: string;
  af: string[];
  orden: string;
  lim: number;
  sel: number | null;
};

const uno = (v: string | string[] | undefined): string => (Array.isArray(v) ? v[0] ?? '' : v ?? '');
const varios = (v: string | string[] | undefined): string[] => (Array.isArray(v) ? v : v ? [v] : []);

export function parseFiltros(sp: SP): Filtros {
  const validos = new Set<string>(PORTALES.map((p) => p.valor));
  const plat = [...new Set(varios(sp.plat).filter((p) => validos.has(p)))] as PortalGrupo[];
  const dia = DIAS.some((d) => d.valor === uno(sp.dia)) ? uno(sp.dia) : '';
  const afValidas = new Set<string>(AFINIDADES.map((a) => a.valor));
  const af = [...new Set(varios(sp.af).filter((a) => afValidas.has(a)))];
  const orden = ORDENES.some((o) => o.valor !== '' && o.valor === uno(sp.orden)) ? uno(sp.orden) : '';
  const lim = Math.min(Math.max(parseInt(uno(sp.lim), 10) || 50, 50), 500);
  const sel = parseInt(uno(sp.sel), 10);
  return { plat, dia, af, orden, lim, sel: Number.isInteger(sel) && sel > 0 ? sel : null };
}

/** URL de la pantalla Ofertas con los filtros dados (sin valores por defecto). */
export function hrefOfertas(f: Partial<Filtros>, extra: { sel?: number | null; lim?: number | null } = {}): string {
  const p = new URLSearchParams();
  f.plat?.forEach((x) => p.append('plat', x));
  if (f.dia) p.set('dia', f.dia);
  f.af?.forEach((x) => p.append('af', x));
  if (f.orden) p.set('orden', f.orden);
  if (extra.lim && extra.lim > 50) p.set('lim', String(extra.lim));
  if (extra.sel) p.set('sel', String(extra.sel));
  const s = p.toString();
  return s ? `/?${s}` : '/';
}

export function filtrosActivos(f: Filtros): number {
  return f.plat.length + (f.dia ? 1 : 0) + f.af.length + (f.orden ? 1 : 0);
}
