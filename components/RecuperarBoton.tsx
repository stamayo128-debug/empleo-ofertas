'use client';

import { useTransition } from 'react';
import { recuperarDescarte } from '@/lib/actions';
import { useToast } from './Toast';

export default function RecuperarBoton({ id }: { id: number }) {
  const [pendiente, iniciar] = useTransition();
  const toast = useToast();
  return (
    <button
      type="button" className="btn" disabled={pendiente}
      onClick={() => iniciar(async () => {
        try {
          const r = await recuperarDescarte(id);
          toast.mostrar(r.ok ? 'Recuperada: ya está en Por revisar' : r.error);
        } catch {
          toast.mostrar('No se pudo recuperar');
        }
      })}
    >
      {pendiente ? 'Recuperando…' : 'Recuperar'}
    </button>
  );
}
