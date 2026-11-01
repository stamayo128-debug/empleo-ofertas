/** Agrupa los portales en pocos: LinkedIn, InfoJobs, Indeed y «Otros portales». Sin dependencias: sirve en servidor y cliente. */
export const PORTALES = [
  { valor: 'linkedin', etiqueta: 'LinkedIn' },
  { valor: 'infojobs', etiqueta: 'InfoJobs' },
  { valor: 'indeed', etiqueta: 'Indeed' },
  { valor: 'otros', etiqueta: 'Otros portales' },
] as const;
export type PortalGrupo = (typeof PORTALES)[number]['valor'];

export function grupoPortal(nombre: string | null | undefined): PortalGrupo {
  const n = (nombre ?? '').toLowerCase();
  if (n.includes('linkedin')) return 'linkedin';
  if (n.includes('infojobs')) return 'infojobs';
  if (n.includes('indeed')) return 'indeed';
  return 'otros';
}

/** Nombre corto para el botón de la tarjeta: «LinkedIn», «Indeed»… o el dominio sin prefijos («lever.co»). */
export function nombrePortal(nombre: string | null | undefined): string {
  const g = grupoPortal(nombre);
  const fijo = PORTALES.find((p) => p.valor === g && g !== 'otros');
  if (fijo) return fijo.etiqueta;
  let n = (nombre ?? '').trim();
  if (!n) return 'Oferta';
  if (/^[\w-]+(\.[\w-]+)+$/.test(n)) n = n.replace(/^((www|es|jobs|job|careers|careers-es)\.)+/i, '');
  return n.length > 22 ? `${n.slice(0, 21)}…` : n;
}
