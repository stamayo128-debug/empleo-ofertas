import type { PortalGrupo } from './portales';

/** Los motivos técnicos del agente y los que eliges tú, agrupados en pocas categorías con nombre normal. */
export const CATEGORIAS = [
  { id: 'requisitos', etiqueta: 'No cumplo los requisitos' },
  { id: 'no_busco', etiqueta: 'No es lo que busco' },
  { id: 'zona', etiqueta: 'Fuera de tu zona' },
  { id: 'antigua', etiqueta: 'Antigua o cerrada' },
  { id: 'repetida', etiqueta: 'Repetida' },
  { id: 'otros', etiqueta: 'Otros' },
] as const;
export type CategoriaId = (typeof CATEGORIAS)[number]['id'];

const DEL_AGENTE: Record<string, CategoriaId> = {
  nivel_senior: 'requisitos', experiencia_excesiva: 'requisitos', idioma: 'requisitos', requiere_convenio: 'requisitos',
  area_no_relacionada: 'no_busco', area_vision_artificial: 'no_busco', area_mlops_devops: 'no_busco', area_automatizacion_industrial: 'no_busco',
  ubicacion_fuera: 'zona', ubicacion_cercana_sin_remoto: 'zona',
  antigua: 'antigua', cerrada: 'antigua', duplicada: 'repetida',
};
const DEL_USUARIO: Record<string, CategoriaId> = {
  nivel_alto: 'requisitos', experiencia: 'requisitos', no_me_interesa: 'no_busco', sector_o_empresa: 'no_busco',
  ubicacion: 'zona', cerrada: 'antigua', duplicada: 'repetida',
};

export function categoriaDe(motivo: string | null | undefined, origen: 'agente' | 'tu'): CategoriaId {
  const m = motivo ?? '';
  return (origen === 'agente' ? DEL_AGENTE[m] : DEL_USUARIO[m]) ?? 'otros';
}

/** Una descartada, venga de donde venga (el agente o tú). */
export type Descartada = {
  clave: string;
  origen: 'agente' | 'tu';
  /** Id del descarte del agente (origen agente) o de la oferta (origen tu). */
  id: number;
  fecha: string | null;
  portal: string;
  grupo: PortalGrupo;
  categoria: CategoriaId;
  puesto: string;
  empresa: string;
  lugar: string | null;
  razon: string | null;
  url: string | null;
  /** Oferta activa en la que se convirtió al recuperarla (solo descartes del agente ya recuperados). */
  recuperadaComo: number | null;
};

export type FiltroDescartadas = { plat: PortalGrupo[]; cat: string; lim: number };
