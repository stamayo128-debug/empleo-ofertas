'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';

export default function FiltrosSheet({
  abierto, onCerrar, onAplicar, onLimpiar, children,
}: { abierto: boolean; onCerrar: () => void; onAplicar: () => void; onLimpiar: () => void; children: React.ReactNode }) {
  useEffect(() => {
    if (!abierto) return;
    const alPulsar = (e: KeyboardEvent) => { if (e.key === 'Escape') onCerrar(); };
    document.addEventListener('keydown', alPulsar);
    return () => document.removeEventListener('keydown', alPulsar);
  }, [abierto, onCerrar]);

  if (!abierto) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/50" onClick={onCerrar}>
      <div
        role="dialog" aria-modal="true" aria-labelledby="filtros-titulo"
        className="max-h-[85dvh] w-full overflow-y-auto rounded-t-[16px] border border-border bg-surface p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 id="filtros-titulo" className="text-lg font-semibold">Filtros</h2>
          <button type="button" className="btn" onClick={onCerrar} aria-label="Cerrar filtros"><X size={18} aria-hidden /></button>
        </div>
        <div className="space-y-4">{children}</div>
        <div className="mt-5 flex gap-3">
          <button type="button" className="btn flex-1" onClick={onLimpiar}>Limpiar</button>
          <button type="button" className="btn btn-primary flex-1" onClick={onAplicar}>Aplicar</button>
        </div>
      </div>
    </div>
  );
}
