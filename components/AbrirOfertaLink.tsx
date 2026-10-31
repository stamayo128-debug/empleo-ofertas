'use client';

import { useEffect } from 'react';
import { ExternalLink } from 'lucide-react';
import { useToast } from './Toast';
import { useEnviar } from './useEnviar';

const CLAVE = 'ofertaAbierta';
const MAX_EDAD_MS = 60 * 60 * 1000;

/** Enlace "Abrir oferta": si la oferta está pendiente de enviar, recuerda cuál se abrió. */
export default function AbrirOfertaLink({
  id, empresa, estado, url, className, etiqueta = 'Abrir oferta', children,
}: { id: number; empresa: string; estado: string; url: string; className: string; etiqueta?: string; children?: React.ReactNode }) {
  return (
    <a
      href={url} target="_blank" rel="noopener noreferrer" className={className}
      onClick={() => {
        if (estado !== 'Pendiente' && estado !== 'Mensaje preparado') return;
        try {
          sessionStorage.setItem(CLAVE, JSON.stringify({ id, empresa: empresa.slice(0, 120), t: Date.now() }));
        } catch { /* sin almacenamiento: simplemente no habrá recordatorio */ }
      }}
    >
      {etiqueta} <ExternalLink size={16} aria-hidden />
      <span className="sr-only">(se abre en otra pestaña)</span>
      {children}
    </a>
  );
}

/** Se monta una vez en el layout: al volver a la pestaña pregunta si se envió la solicitud. */
export function RecordatorioEnvio() {
  const toast = useToast();
  const { marcar } = useEnviar();

  useEffect(() => {
    function alCambiar() {
      if (document.visibilityState !== 'visible') return;
      let datos: { id?: unknown; empresa?: unknown; t?: unknown } | null = null;
      try {
        const bruto = sessionStorage.getItem(CLAVE);
        if (!bruto) return;
        sessionStorage.removeItem(CLAVE);
        datos = JSON.parse(bruto);
      } catch { return; }
      if (!datos || typeof datos.id !== 'number' || !Number.isInteger(datos.id) || datos.id <= 0) return;
      if (typeof datos.t !== 'number' || Date.now() - datos.t > MAX_EDAD_MS) return;
      const id = datos.id;
      const empresa = typeof datos.empresa === 'string' ? datos.empresa : 'esta empresa';
      toast.mostrar(
        `¿Enviaste la solicitud a ${empresa}?`,
        { etiqueta: 'Sí, marcar', fn: () => { void marcar([id]); } },
        10000,
      );
    }
    document.addEventListener('visibilitychange', alCambiar);
    return () => document.removeEventListener('visibilitychange', alCambiar);
  }, [toast, marcar]);

  return null;
}
