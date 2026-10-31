'use client';

import { useSeleccion } from './SeleccionLote';

export default function CasillaLote({ id, puesto, empresa }: { id: number; puesto: string; empresa: string }) {
  const s = useSeleccion();
  if (!s || !s.activo) return null;
  return (
    <label className="flex size-11 shrink-0 cursor-pointer items-center justify-center">
      <input
        type="checkbox" className="size-6 accent-[var(--accent)]"
        checked={s.seleccion.has(id)} onChange={() => s.alternar(id)}
        aria-label={`Seleccionar ${puesto} — ${empresa}`}
      />
    </label>
  );
}
