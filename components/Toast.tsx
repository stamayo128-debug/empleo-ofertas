'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

type Aviso = { id: number; texto: string; accion?: { etiqueta: string; fn: () => void } };
type Ctx = { mostrar: (texto: string, accion?: Aviso['accion'], duracionMs?: number) => void };

const ToastCtx = createContext<Ctx>({ mostrar: () => {} });
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [aviso, setAviso] = useState<Aviso | null>(null);
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);
  const contador = useRef(0);

  const cerrar = useCallback(() => setAviso(null), []);
  const mostrar = useCallback((texto: string, accion?: Aviso['accion'], duracionMs = 5000) => {
    if (temporizador.current) clearTimeout(temporizador.current);
    contador.current += 1;
    setAviso({ id: contador.current, texto, accion });
    temporizador.current = setTimeout(cerrar, duracionMs);
  }, [cerrar]);

  useEffect(() => () => { if (temporizador.current) clearTimeout(temporizador.current); }, []);

  return (
    <ToastCtx.Provider value={{ mostrar }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-[calc(6.25rem+env(safe-area-inset-bottom))] z-50 flex justify-center px-4 md:bottom-6" aria-live="polite" role="status">
        {aviso && (
          <div key={aviso.id} className="pointer-events-auto flex max-w-md items-center gap-3 rounded-tile border border-border bg-fg px-4 py-2 text-[15px] text-bg">
            <span>{aviso.texto}</span>
            {aviso.accion && (
              <button
                type="button"
                className="min-h-11 rounded px-2 font-semibold underline underline-offset-2"
                onClick={() => { aviso.accion?.fn(); cerrar(); }}
              >
                {aviso.accion.etiqueta}
              </button>
            )}
          </div>
        )}
      </div>
    </ToastCtx.Provider>
  );
}
