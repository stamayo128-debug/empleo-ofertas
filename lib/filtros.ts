import { DIA_FILTRO, ENCAJES, ESTADOS, EXPERIENCIA_FILTRO, MODALIDAD_FILTRO, ORDENES, SALARIO_FILTRO, TABS, ZONAS_FILTRO, type OrdenId, type TabId } from './constantes';

export type SP = Record<string, string | string[] | undefined>;

export type Filtros = {
  tab: TabId;
  plat: string[];
  estado: string;
  encaje: string;
  zona: string;
  mod: string;
  sal: string;
  exp: string;
  /** Detectadas en los últimos N días ('hoy' | '7' | '30'). */
  dia: string;
  /** 'recuperada' = solo las recuperadas desde Descartes. */
  origen: string;
  q: string;
  orden: OrdenId;
  descartadas: boolean;
  lim: number;
  sel: number | null;
};

const uno = (v: string | string[] | undefined): string => (Array.isArray(v) ? v[0] ?? '' : v ?? '');
const varios = (v: string | string[] | undefined): string[] => (Array.isArray(v) ? v : v ? [v] : []);

export function parseFiltros(sp: SP): Filtros {
  const tabRaw = uno(sp.tab) === 'seguimiento' ? 'enviadas' : uno(sp.tab); // enlaces antiguos
  const tab = TABS.find((t) => t.id === tabRaw)?.id ?? 'hoy';
  const estado = (ESTADOS as readonly string[]).includes(uno(sp.estado)) ? uno(sp.estado) : '';
  const encaje = (ENCAJES as readonly string[]).includes(uno(sp.encaje)) ? uno(sp.encaje) : '';
  const zona = ZONAS_FILTRO.some((z) => z.valor === uno(sp.zona)) ? uno(sp.zona) : '';
  const mod = MODALIDAD_FILTRO.some((m) => m.valor === uno(sp.mod)) ? uno(sp.mod) : '';
  const sal = SALARIO_FILTRO.some((m) => m.valor === uno(sp.sal)) ? uno(sp.sal) : '';
  const exp = EXPERIENCIA_FILTRO.some((m) => m.valor === uno(sp.exp)) ? uno(sp.exp) : '';
  const dia = DIA_FILTRO.some((m) => m.valor === uno(sp.dia)) ? uno(sp.dia) : '';
  const origen = uno(sp.origen) === 'recuperada' ? 'recuperada' : '';
  const orden = ORDENES.find((o) => o.id === uno(sp.orden))?.id ?? 'relevancia';
  const lim = Math.min(Math.max(parseInt(uno(sp.lim), 10) || 50, 50), 500);
  const sel = parseInt(uno(sp.sel), 10);
  return {
    tab,
    plat: varios(sp.plat).map((p) => p.slice(0, 60)).filter(Boolean).slice(0, 20),
    estado, encaje, zona, mod, sal, exp, dia, origen,
    q: uno(sp.q).slice(0, 80),
    orden,
    descartadas: uno(sp.descartadas) === '1',
    lim,
    sel: Number.isInteger(sel) && sel > 0 ? sel : null,
  };
}

/** Construye una URL de la pantalla Ofertas con los filtros dados (sin valores por defecto). */
export function hrefOfertas(f: Partial<Filtros>, extra: { sel?: number | null; lim?: number | null } = {}): string {
  const p = new URLSearchParams();
  if (f.tab && f.tab !== 'hoy') p.set('tab', f.tab);
  f.plat?.forEach((x) => p.append('plat', x));
  if (f.estado) p.set('estado', f.estado);
  if (f.encaje) p.set('encaje', f.encaje);
  if (f.zona) p.set('zona', f.zona);
  if (f.mod) p.set('mod', f.mod);
  if (f.sal) p.set('sal', f.sal);
  if (f.exp) p.set('exp', f.exp);
  if (f.dia) p.set('dia', f.dia);
  if (f.origen) p.set('origen', f.origen);
  if (f.q) p.set('q', f.q);
  if (f.orden && f.orden !== 'relevancia') p.set('orden', f.orden);
  if (f.descartadas) p.set('descartadas', '1');
  if (extra.lim && extra.lim > 50) p.set('lim', String(extra.lim));
  if (extra.sel) p.set('sel', String(extra.sel));
  const s = p.toString();
  return s ? `/?${s}` : '/';
}

export function filtrosActivos(f: Filtros): number {
  return f.plat.length + (f.estado ? 1 : 0) + (f.encaje ? 1 : 0) + (f.zona ? 1 : 0) +
    (f.mod ? 1 : 0) + (f.sal ? 1 : 0) + (f.exp ? 1 : 0) + (f.dia ? 1 : 0) + (f.origen ? 1 : 0) + (f.q ? 1 : 0);
}
