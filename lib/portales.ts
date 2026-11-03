/** Agrupa los portales en pocos: LinkedIn, InfoJobs, Indeed, Tecnoempleo, Welcome to the Jungle, teletrabajo y «Otros portales». Sin dependencias: sirve en servidor y cliente. */
export const PORTALES = [
  { valor: 'linkedin', etiqueta: 'LinkedIn' },
  { valor: 'infojobs', etiqueta: 'InfoJobs' },
  { valor: 'indeed', etiqueta: 'Indeed' },
  { valor: 'tecnoempleo', etiqueta: 'Tecnoempleo' },
  { valor: 'wttj', etiqueta: 'Welcome to the Jungle' },
  { valor: 'remoto', etiqueta: 'Portales de teletrabajo' },
  { valor: 'otros', etiqueta: 'Otros portales' },
] as const;
export type PortalGrupo = (typeof PORTALES)[number]['valor'];

export function grupoPortal(nombre: string | null | undefined): PortalGrupo {
  const n = (nombre ?? '').toLowerCase();
  if (n.includes('linkedin')) return 'linkedin';
  if (n.includes('infojobs')) return 'infojobs';
  if (n.includes('indeed')) return 'indeed';
  if (n.includes('tecnoempleo')) return 'tecnoempleo';
  if (/welcome to the jungle|welcometothejungle|wttj/.test(n)) return 'wttj';
  if (/^remoto$|remotive|remoteok|weworkremotely|himalayas|jobicy|arbeitnow/.test(n)) return 'remoto';
  return 'otros';
}

/** Portales con nombre propio y fijo en el botón de la tarjeta. Los de teletrabajo y «otros» muestran su dominio. */
const NOMBRE_FIJO: Partial<Record<PortalGrupo, string>> = {
  linkedin: 'LinkedIn', infojobs: 'InfoJobs', indeed: 'Indeed', tecnoempleo: 'Tecnoempleo', wttj: 'WTTJ',
};

/** Nombre corto para el botón de la tarjeta: «LinkedIn», «Indeed»… o el dominio sin prefijos («lever.co», «remotive.com»). */
export function nombrePortal(nombre: string | null | undefined): string {
  const fijo = NOMBRE_FIJO[grupoPortal(nombre)];
  if (fijo) return fijo;
  let n = (nombre ?? '').trim();
  if (!n) return 'Oferta';
  if (/^[\w-]+(\.[\w-]+)+$/.test(n)) n = n.replace(/^((www|es|jobs|job|careers|careers-es)\.)+/i, '');
  return n.length > 22 ? `${n.slice(0, 21)}…` : n;
}
