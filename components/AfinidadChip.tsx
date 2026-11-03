import type { Oferta } from '@/lib/types';

type Etiqueta = NonNullable<Oferta['afinidad_etiqueta']>;

/** Colores por etiqueta. Siempre llevan texto: el color nunca es la única señal. */
const ESTILO: Record<Etiqueta, string> = {
  'Muy afín': 'bg-[color-mix(in_srgb,var(--verde)_14%,transparent)] text-verde',
  'Afín': 'bg-accent-soft text-accent',
  'Poco afín': 'bg-[color-mix(in_srgb,var(--ambar)_14%,transparent)] text-ambar',
};

/** «87 % · Muy afín». No se muestra si la oferta aún no tiene afinidad. */
export default function AfinidadChip({ afinidad, etiqueta }: { afinidad: number | null; etiqueta: Etiqueta | null }) {
  if (afinidad == null || !etiqueta) return null;
  return (
    <span
      className={`chip min-h-8 font-semibold shadow-none ${ESTILO[etiqueta]}`}
      aria-label={`Afinidad con tu perfil: ${afinidad} por ciento, ${etiqueta.toLowerCase()}`}
    >
      <span className="num">{afinidad} %</span> · {etiqueta}
    </span>
  );
}

/** Barra de la afinidad para el detalle. */
export function AfinidadBarra({ afinidad, etiqueta }: { afinidad: number; etiqueta: Etiqueta }) {
  const color = etiqueta === 'Muy afín' ? 'bg-verde' : etiqueta === 'Afín' ? 'bg-accent' : 'bg-ambar';
  return (
    <div
      role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={afinidad}
      aria-label={`Afinidad con tu perfil: ${afinidad} por ciento, ${etiqueta.toLowerCase()}`}
      className="h-2 w-full overflow-hidden rounded-full bg-surface-2"
    >
      <div className={`h-full rounded-full ${color}`} style={{ width: `${afinidad}%` }} />
    </div>
  );
}
