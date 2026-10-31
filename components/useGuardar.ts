'use client';

import { useTransition } from 'react';
import { actualizarOferta, type ResultadoGuardar } from '@/lib/actions';
import { useToast } from './Toast';

/** Guarda un parche en una oferta; llama a `alTerminar` con el resultado. */
export function useGuardar(id: number) {
  const toast = useToast();
  const [pendiente, iniciar] = useTransition();

  function guardar(
    parche: Record<string, unknown>,
    opciones: { optimista?: () => void; alTerminar?: (r: ResultadoGuardar) => void } = {},
  ) {
    iniciar(async () => {
      opciones.optimista?.();
      let r: ResultadoGuardar;
      try {
        r = await actualizarOferta(id, parche);
      } catch {
        r = { ok: false, error: 'No se pudo guardar' };
      }
      if (!r.ok) toast.mostrar('No se pudo guardar');
      opciones.alTerminar?.(r);
    });
  }
  return { guardar, pendiente };
}
