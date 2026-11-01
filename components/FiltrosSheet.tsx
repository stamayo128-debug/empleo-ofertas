'use client';

import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export default function FiltrosSheet({
  abierto, onCerrar, onAplicar, onLimpiar, children,
}: { abierto: boolean; onCerrar: () => void; onAplicar: () => void; onLimpiar: () => void; children: React.ReactNode }) {
  const dialogo = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!abierto) return;
    // Bloquea el scroll de la página de fondo y lleva el foco al diálogo mientras está abierto.
    const anterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const foco = document.activeElement as HTMLElement | null;
    dialogo.current?.focus();
    const alPulsar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onCerrar(); return; }
      if (e.key !== 'Tab' || !dialogo.current) return;
      // El foco se queda dentro del diálogo: Tab y Mayús+Tab dan la vuelta entre sus controles.
      const foco = [...dialogo.current.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')]
        .filter((el) => !(el as HTMLButtonElement).disabled && el.offsetParent !== null);
      if (foco.length === 0) return;
      const primero = foco[0];
      const ultimo = foco[foco.length - 1];
      const actual = document.activeElement;
      if (e.shiftKey && (actual === primero || actual === dialogo.current)) { e.preventDefault(); ultimo.focus(); }
      else if (!e.shiftKey && (actual === ultimo || !dialogo.current.contains(actual))) { e.preventDefault(); primero.focus(); }
    };
    document.addEventListener('keydown', alPulsar);
    return () => {
      document.removeEventListener('keydown', alPulsar);
      document.body.style.overflow = anterior;
      foco?.focus?.();
    };
  }, [abierto, onCerrar]);

  if (!abierto) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/50" onClick={onCerrar}>
      <div
        ref={dialogo} tabIndex={-1}
        role="dialog" aria-modal="true" aria-labelledby="filtros-titulo"
        className="max-h-[85dvh] w-full overflow-y-auto overscroll-contain rounded-t-[16px] border border-border bg-surface p-4 pb-[max(1rem,env(safe-area-inset-bottom))] outline-none"
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
