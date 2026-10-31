'use client';

import { useId, useRef, useState } from 'react';

const PESTANAS = [
  { id: 'descripcion', etiqueta: 'Descripción' },
  { id: 'candidatura', etiqueta: 'Candidatura' },
  { id: 'empresa', etiqueta: 'Empresa' },
] as const;
type Id = (typeof PESTANAS)[number]['id'];

/** Pestañas del detalle. El contenido llega ya renderizado desde el servidor; aquí solo se muestra uno a la vez. */
export default function DetallePestanas({
  descripcion, candidatura, empresa,
}: { descripcion: React.ReactNode; candidatura: React.ReactNode; empresa: React.ReactNode }) {
  const [activa, setActiva] = useState<Id>('descripcion');
  const base = useId();
  const botones = useRef<(HTMLButtonElement | null)[]>([]);
  const paneles: Record<Id, React.ReactNode> = { descripcion, candidatura, empresa };

  function alTeclear(e: React.KeyboardEvent, i: number) {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const n = (i + (e.key === 'ArrowRight' ? 1 : PESTANAS.length - 1)) % PESTANAS.length;
    setActiva(PESTANAS[n].id);
    botones.current[n]?.focus();
  }

  return (
    <div className="space-y-5">
      <div role="tablist" aria-label="Secciones de la oferta" className="seg">
        {PESTANAS.map((p, i) => {
          const on = activa === p.id;
          return (
            <button
              key={p.id} ref={(el) => { botones.current[i] = el; }}
              type="button" role="tab" id={`${base}-${p.id}`} aria-selected={on} aria-controls={`${base}-p-${p.id}`}
              tabIndex={on ? 0 : -1}
              onClick={() => setActiva(p.id)} onKeyDown={(e) => alTeclear(e, i)}
              className={`min-h-11 flex-1 rounded-full px-3 text-[15px] font-medium ${on ? 'bg-surface text-fg shadow-btn' : 'text-muted'}`}
            >
              {p.etiqueta}
            </button>
          );
        })}
      </div>
      {PESTANAS.map((p) => (
        <div key={p.id} role="tabpanel" id={`${base}-p-${p.id}`} aria-labelledby={`${base}-${p.id}`} hidden={activa !== p.id} className="space-y-5">
          {paneles[p.id]}
        </div>
      ))}
    </div>
  );
}
