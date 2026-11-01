'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { deshacerDescartes } from '@/lib/actions';
import { useToast } from './Toast';

/** Recupera una oferta que descartaste tú: vuelve a Ofertas como pendiente. */
export default function RecuperarOferta({ id }: { id: number }) {
  const [pendiente, iniciar] = useTransition();
  const [hecho, setHecho] = useState(false);
  const toast = useToast();

  if (hecho) {
    return <Link href={`/?sel=${id}`} className="inline-flex min-h-11 items-center text-[15px] font-medium text-accent underline-offset-2 hover:underline">↺ Recuperada: ver oferta</Link>;
  }
  return (
    <button
      type="button" className="btn" disabled={pendiente}
      onClick={() => iniciar(async () => {
        try {
          const r = await deshacerDescartes([{ id, estado_anterior: 'Pendiente' }]);
          if (r.ok) { setHecho(true); toast.mostrar('Recuperada: vuelve a Ofertas'); } else toast.mostrar(r.error);
        } catch {
          toast.mostrar('No se pudo recuperar');
        }
      })}
    >
      {pendiente ? 'Recuperando…' : 'Recuperar'}
    </button>
  );
}
