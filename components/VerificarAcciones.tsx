'use client';

import { useTransition } from 'react';
import Link from 'next/link';
import { Check, GitMerge } from 'lucide-react';
import { fusionarOfertas, marcarVerificada } from '@/lib/actions';
import { useToast } from './Toast';

function useVerificar(id: number) {
  const toast = useToast();
  const [pendiente, iniciar] = useTransition();

  function verificar() {
    iniciar(async () => {
      let r: Awaited<ReturnType<typeof marcarVerificada>>;
      try {
        r = await marcarVerificada({ id, verificada: true });
      } catch {
        r = { ok: false, error: 'No se pudo guardar' };
      }
      if (!r.ok) { toast.mostrar(r.error); return; }
      toast.mostrar('Marcada como verificada', {
        etiqueta: 'Deshacer',
        fn: () => {
          void (async () => {
            try {
              const d = await marcarVerificada({ id, verificada: false });
              toast.mostrar(d.ok ? 'Verificación deshecha' : d.error);
            } catch {
              toast.mostrar('No se pudo guardar');
            }
          })();
        },
      });
    });
  }
  return { verificar, pendiente };
}

/** Botón corto para la tarjeta de la pestaña "Por verificar". */
export function VerificadaBoton({ id }: { id: number }) {
  const { verificar, pendiente } = useVerificar(id);
  return (
    <button type="button" className="btn" disabled={pendiente} onClick={verificar}>
      <Check size={16} aria-hidden /> Ya está verificada
    </button>
  );
}

/** Acciones del aviso "Por verificar" en el panel: verificar o fusionar con la posible duplicada. */
export default function VerificarAcciones({
  id, codigo, posibleId, posibleCodigo,
}: { id: number; codigo: string; posibleId: number | null; posibleCodigo: string | null }) {
  const toast = useToast();
  const { verificar, pendiente } = useVerificar(id);
  const [fusionando, iniciarFusion] = useTransition();

  function fusionar() {
    if (!posibleId || !posibleCodigo) return;
    const texto = `¿Fusionar ${codigo} con ${posibleCodigo}? ${codigo} pasará a Descartada y ${posibleCodigo} se quedará con sus fuentes y datos.`;
    if (!window.confirm(texto)) return;
    iniciarFusion(async () => {
      let r: Awaited<ReturnType<typeof fusionarOfertas>>;
      try {
        // La oferta abierta es la duplicada; la otra se queda como principal.
        r = await fusionarOfertas({ principal: posibleId, duplicada: id });
      } catch {
        r = { ok: false, error: 'No se pudo fusionar' };
      }
      toast.mostrar(r.ok ? `Fusionada con ${posibleCodigo}` : r.error);
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" className="btn" disabled={pendiente || fusionando} onClick={verificar}>
        <Check size={16} aria-hidden /> Ya está verificada
      </button>
      {posibleId && posibleCodigo && (
        <>
          <button type="button" className="btn" disabled={pendiente || fusionando} onClick={fusionar}>
            <GitMerge size={16} aria-hidden /> Fusionar con {posibleCodigo}
          </button>
          <Link href={`/?tab=todas&descartadas=1&sel=${posibleId}`} className="btn">Ver {posibleCodigo}</Link>
        </>
      )}
    </div>
  );
}
