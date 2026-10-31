'use client';

import { useOptimistic, useTransition } from 'react';
import { Check } from 'lucide-react';
import { fmtCorta, hoyMadrid } from '@/lib/format';
import { useEnviar } from './useEnviar';

const PENDIENTES = ['Pendiente', 'Mensaje preparado'];

export default function EnviadaBoton({
  id, estado, fechaEnvio, className = '',
}: { id: number; estado: string; fechaEnvio: string | null; className?: string }) {
  const [optimista, setOptimista] = useOptimistic<{ estado: string; fecha: string | null }>({ estado, fecha: fechaEnvio });
  const [pendiente, iniciar] = useTransition();
  const { marcar } = useEnviar();

  if (!PENDIENTES.includes(optimista.estado)) {
    if (!['Postulado', 'Entrevista', 'Rechazado'].includes(optimista.estado)) return null;
    return (
      <p className={`inline-flex min-h-11 items-center gap-1 text-[15px] font-medium text-verde ${className}`}>
        <Check size={16} aria-hidden /> Enviada{optimista.fecha ? ` el ${fmtCorta(optimista.fecha)}` : ''}
      </p>
    );
  }

  return (
    <button
      type="button" className={`btn ${className}`} aria-pressed={false} disabled={pendiente}
      onClick={() => {
        iniciar(async () => {
          setOptimista({ estado: 'Postulado', fecha: hoyMadrid() });
          await marcar([id]);
        });
      }}
    >
      <Check size={16} aria-hidden /> Marcar como enviada
    </button>
  );
}
