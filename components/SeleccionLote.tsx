'use client';

import { createContext, useContext, useState } from 'react';
import { CheckSquare } from 'lucide-react';
import { useToast } from './Toast';
import DescartarBoton from './DescartarBoton';
import { useEnviar } from './useEnviar';

const MAX = 200;

type Ctx = {
  activo: boolean;
  seleccion: Set<number>;
  alternar: (id: number) => void;
};
const SeleccionCtx = createContext<Ctx | null>(null);
export const useSeleccion = () => useContext(SeleccionCtx);

/** Solo se monta en la pestaña "Por enviar". */
export function SeleccionProvider({ children }: { children: React.ReactNode }) {
  const [activo, setActivo] = useState(false);
  const [seleccion, setSeleccion] = useState<Set<number>>(new Set());
  const [guardando, setGuardando] = useState(false);
  const toast = useToast();
  const { marcar } = useEnviar();

  function alternar(id: number) {
    const sig = new Set(seleccion);
    if (sig.has(id)) sig.delete(id);
    else if (sig.size >= MAX) { toast.mostrar(`Máximo ${MAX} a la vez`); return; }
    else sig.add(id);
    setSeleccion(sig);
  }
  function cancelar() { setActivo(false); setSeleccion(new Set()); }
  async function confirmar() {
    if (seleccion.size === 0 || guardando) return;
    setGuardando(true);
    const ok = await marcar([...seleccion]);
    setGuardando(false);
    if (ok) cancelar();
  }

  return (
    <SeleccionCtx.Provider value={{ activo, seleccion, alternar }}>
      {!activo && (
        <button type="button" className="btn" onClick={() => setActivo(true)}>
          <CheckSquare size={18} aria-hidden /> Seleccionar varias
        </button>
      )}
      {children}
      {activo && (
        <div className="fixed inset-x-0 bottom-[calc(6.25rem+env(safe-area-inset-bottom))] z-40 flex justify-center px-4 md:bottom-6">
          <div role="region" aria-label="Marcado en lote" className="flex max-w-full flex-wrap items-center justify-center gap-2 rounded-tile border border-border bg-surface px-4 py-2 shadow-lg">
            <span className="num text-[15px] font-medium" aria-live="polite">
              {seleccion.size} {seleccion.size === 1 ? 'seleccionada' : 'seleccionadas'}
            </span>
            <button type="button" className="btn btn-primary" disabled={seleccion.size === 0 || guardando} onClick={confirmar}>
              Marcar como enviadas
            </button>
            <DescartarBoton ids={[...seleccion]} etiqueta="Descartar seleccionadas" alTerminar={cancelar} />
            <button type="button" className="btn" onClick={cancelar}>Cancelar</button>
          </div>
        </div>
      )}
    </SeleccionCtx.Provider>
  );
}
