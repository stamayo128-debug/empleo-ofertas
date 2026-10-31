'use client';

import { useOptimistic } from 'react';
import { ESTADOS } from '@/lib/constantes';
import { fmtCorta } from '@/lib/format';
import { useGuardar } from './useGuardar';
import { useToast } from './Toast';

export default function EstadoSelect({
  id, estado, fechaEnvio, className = '',
}: { id: number; estado: string; fechaEnvio: string | null; className?: string }) {
  const [optimista, setOptimista] = useOptimistic(estado);
  const { guardar } = useGuardar(id);
  const toast = useToast();

  function cambiar(nuevo: string) {
    if (nuevo === estado) return;
    const anterior = estado;
    guardar({ estado: nuevo }, {
      optimista: () => setOptimista(nuevo),
      alTerminar: (r) => {
        if (!r.ok) return;
        const msg = nuevo === 'Postulado' && r.proximo_seguimiento
          ? `Estado → Postulado · Seguimiento el ${fmtCorta(r.proximo_seguimiento)}`
          : `Estado → ${nuevo}`;
        toast.mostrar(msg, {
          etiqueta: 'Deshacer',
          fn: () => {
            const revertir: Record<string, unknown> = { estado: anterior };
            // Si la fecha de envío la puso sola el cambio a Postulado, se quita al deshacer.
            if (nuevo === 'Postulado' && !fechaEnvio) revertir.fecha_envio = null;
            guardar(revertir);
          },
        });
      },
    });
  }

  return (
    <div className={className}>
      <label htmlFor={`estado-${id}`} className="sr-only">Estado</label>
      <select
        id={`estado-${id}`} className="input w-auto min-w-44" value={optimista}
        onChange={(e) => cambiar(e.target.value)}
      >
        {ESTADOS.map((e) => <option key={e} value={e}>{e}</option>)}
      </select>
    </div>
  );
}
