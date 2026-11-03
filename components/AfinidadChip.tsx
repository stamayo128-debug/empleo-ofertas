/**
 * Color de la afinidad: una escala continua de ámbar (baja) a verde (alta) que se oscurece un poco para que el
 * texto se lea bien. El dato es el número; el color solo ayuda a verlo de un vistazo.
 */
export function colorAfinidad(afinidad: number): { texto: string; fondo: string; barra: string } {
  const t = Math.round(Math.min(1, Math.max(0, (afinidad - 30) / 60)) * 100);
  const mezcla = `color-mix(in srgb, var(--verde) ${t}%, var(--ambar))`;
  return {
    texto: `color-mix(in srgb, ${mezcla} 80%, var(--text))`,
    fondo: `color-mix(in srgb, ${mezcla} 14%, transparent)`,
    barra: mezcla,
  };
}

/** «87 %». No se muestra si la oferta aún no tiene afinidad. */
export default function AfinidadChip({ afinidad }: { afinidad: number | null }) {
  if (afinidad == null) return null;
  const c = colorAfinidad(afinidad);
  return (
    <span
      className="chip num min-h-8 font-semibold shadow-none"
      style={{ color: c.texto, backgroundColor: c.fondo }}
      aria-label={`Afinidad con tu perfil: ${afinidad} por ciento`}
    >
      {afinidad} %
    </span>
  );
}

/** Barra de la afinidad para el detalle. */
export function AfinidadBarra({ afinidad }: { afinidad: number }) {
  return (
    <div
      role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={afinidad}
      aria-label={`Afinidad con tu perfil: ${afinidad} por ciento`}
      className="h-2 w-full overflow-hidden rounded-full bg-surface-2"
    >
      <div className="h-full rounded-full" style={{ width: `${afinidad}%`, backgroundColor: colorAfinidad(afinidad).barra }} />
    </div>
  );
}
