'use client';

import { useOptimistic, useTransition } from 'react';
import { Bookmark } from 'lucide-react';
import { alternarGuardada } from '@/lib/actions';
import { useToast } from './Toast';

/** Marcador de "guardar para después". Cambia al instante y se corrige si el servidor falla. */
export default function BotonGuardar({ id, guardada }: { id: number; guardada: boolean }) {
  const [, iniciar] = useTransition();
  const [estado, setEstado] = useOptimistic(guardada);
  const toast = useToast();

  function cambiar(nuevo: boolean, conDeshacer: boolean) {
    iniciar(async () => {
      setEstado(nuevo);
      try {
        const r = await alternarGuardada(id, nuevo);
        if (!r.ok) { toast.mostrar(r.error); return; }
        toast.mostrar(
          nuevo ? 'Oferta guardada' : 'Quitada de guardadas',
          conDeshacer ? { etiqueta: 'Deshacer', fn: () => cambiar(!nuevo, false) } : undefined,
        );
      } catch {
        toast.mostrar('No se pudo guardar');
      }
    });
  }

  return (
    <button
      type="button"
      onClick={() => cambiar(!estado, true)}
      aria-pressed={estado}
      aria-label={estado ? 'Quitar de guardadas' : 'Guardar oferta'}
      className={`icon-btn ${estado ? 'text-save' : 'text-muted'}`}
    >
      <Bookmark size={20} aria-hidden fill={estado ? 'currentColor' : 'none'} />
    </button>
  );
}
