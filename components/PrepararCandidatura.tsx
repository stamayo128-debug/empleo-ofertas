'use client';

import { useOptimistic } from 'react';
import { ExternalLink } from 'lucide-react';
import { useGuardar } from './useGuardar';
import { useToast } from './Toast';

export default function PrepararCandidatura({
  id, marcada, driveUrl, cvDocUrl, cvVersion,
}: { id: number; marcada: boolean; driveUrl: string | null; cvDocUrl: string | null; cvVersion: number }) {
  const [optimista, setOptimista] = useOptimistic(marcada);
  const { guardar, pendiente } = useGuardar(id);
  const toast = useToast();

  if (cvDocUrl) {
    return (
      <a href={cvDocUrl} target="_blank" rel="noopener noreferrer" className="btn">
        Abrir CV adaptado (v{cvVersion}) <ExternalLink size={16} aria-hidden />
        <span className="sr-only">(se abre en otra pestaña)</span>
      </a>
    );
  }

  // Solo hay enlace a carpeta en ofertas antiguas que tengan carpeta_drive_url.
  if (driveUrl) {
    return (
      <a href={driveUrl} target="_blank" rel="noopener noreferrer" className="btn">
        Carpeta en Drive <ExternalLink size={16} aria-hidden />
        <span className="sr-only">(se abre en otra pestaña)</span>
      </a>
    );
  }

  function alternar(valor: boolean) {
    guardar({ preparar_candidatura: valor }, {
      optimista: () => setOptimista(valor),
      alTerminar: (r) => {
        if (r.ok) toast.mostrar(valor ? 'Candidatura marcada para preparar' : 'Marca quitada');
      },
    });
  }

  return optimista ? (
    <div className="flex flex-wrap items-center gap-3">
      <span className="text-[15px]">Candidatura pendiente de preparar.</span>
      <button type="button" className="btn" disabled={pendiente} onClick={() => alternar(false)}>Quitar marca</button>
    </div>
  ) : (
    <button type="button" className="btn btn-primary" disabled={pendiente} onClick={() => alternar(true)}>
      Preparar candidatura
    </button>
  );
}
