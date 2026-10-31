'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { recuperarDescarte } from '@/lib/actions';
import { useToast } from './Toast';

export default function RecuperarBoton({ id, sugerida = false }: { id: number; sugerida?: boolean }) {
  const [pendiente, iniciar] = useTransition();
  const [ofertaId, setOfertaId] = useState<number | null>(null);
  const toast = useToast();

  // Tras recuperar, la fila cambia al instante a "Recuperada" con enlace a la oferta.
  if (ofertaId) {
    return (
      <Link href={`/?tab=todas&origen=recuperada&sel=${ofertaId}`} className="inline-flex min-h-11 items-center text-[15px] font-medium text-accent underline-offset-2 hover:underline">
        ↺ Recuperada: ver oferta
      </Link>
    );
  }
  return (
    <button
      type="button" className={sugerida ? 'btn btn-primary' : 'btn'} disabled={pendiente}
      onClick={() => iniciar(async () => {
        try {
          const r = await recuperarDescarte(id);
          if (r.ok) {
            setOfertaId(r.ofertaId);
            toast.mostrar('Recuperada: ya está en Ofertas, marcada como recuperada');
          } else {
            toast.mostrar(r.error);
          }
        } catch {
          toast.mostrar('No se pudo recuperar');
        }
      })}
    >
      {pendiente ? 'Recuperando…' : 'Recuperar'}
    </button>
  );
}
