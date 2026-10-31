const TONOS = [200, 160, 28, 280, 340, 45, 100, 230];

/** Inicial de la empresa sobre un color estable (siempre el mismo para la misma empresa). No inventa logos. */
export default function Avatar({ nombre, grande = false }: { nombre: string; grande?: boolean }) {
  let h = 2166136261; // FNV-1a: reparte mejor los colores entre nombres parecidos
  for (const c of nombre.trim().toLowerCase()) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0;
  h = ((h ^ (h >>> 15)) >>> 0); h = Math.imul(h, 2246822519) >>> 0; h = ((h ^ (h >>> 13)) >>> 0); // mezcla final (siempre sin signo)
  const tono = TONOS[h % TONOS.length];
  const inicial = (nombre.trim().match(/[\p{L}\p{N}]/u)?.[0] ?? '?').toUpperCase();
  return (
    <span
      aria-hidden
      className={`grid shrink-0 place-items-center rounded-full font-semibold ${grande ? 'size-20 text-3xl' : 'size-11 text-lg'}`}
      style={{
        background: `color-mix(in srgb, hsl(${tono} 75% 50%) 20%, var(--surface))`,
        color: `color-mix(in srgb, hsl(${tono} 70% 38%) 75%, var(--text))`,
      }}
    >
      {inicial}
    </span>
  );
}
