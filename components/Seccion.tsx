import { Children } from 'react';
import { ChevronDown } from 'lucide-react';

/** Bloque plegable del panel de detalle. Sin contenido no se dibuja. */
export default function Seccion({
  id, titulo, abierta = false, resumen, children,
}: { id: string; titulo: string; abierta?: boolean; resumen?: string; children?: React.ReactNode }) {
  if (Children.toArray(children).length === 0) return null;
  return (
    <details open={abierta} className="group rounded-[10px] border border-border">
      <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 px-3 py-2 [&::-webkit-details-marker]:hidden">
        <h3 id={`s-${id}`} className="text-base font-semibold">{titulo}</h3>
        {resumen && <span className="meta">{resumen}</span>}
        <ChevronDown size={18} aria-hidden className="ml-auto shrink-0 text-muted transition-transform group-open:rotate-180" />
      </summary>
      <div className="space-y-4 border-t border-border p-3">{children}</div>
    </details>
  );
}
