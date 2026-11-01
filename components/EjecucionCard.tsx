import Link from 'next/link';
import { AlertTriangle, ChevronRight } from 'lucide-react';
import { fmtHora } from '@/lib/format';
import type { Ejecucion } from '@/lib/types';

export const ESTADO_EJ: Record<string, { texto: string; punto: string }> = {
  ok: { texto: 'Correcta', punto: 'bg-verde' },
  parcial: { texto: 'Parcial', punto: 'bg-ambar' },
  error: { texto: 'Con error', punto: 'bg-rojo' },
  en_curso: { texto: 'En curso', punto: 'bg-muted' },
};

export function Cifra({ valor, etiqueta }: { valor: number; etiqueta: string }) {
  return (
    <div className="min-w-0 flex-1 text-center">
      <p className="num text-[28px] font-semibold leading-tight">{valor}</p>
      <p className="meta">{etiqueta}</p>
    </div>
  );
}

/** Una búsqueda del agente: hora, estado y tres cifras grandes. Al tocarla se abre su detalle. */
export default function EjecucionCard({ e }: { e: Ejecucion }) {
  const est = ESTADO_EJ[e.estado] ?? ESTADO_EJ.en_curso;
  const fallos = e.fuentes_error ?? [];
  const tipo = e.tipo === 'diaria' ? 'Diaria' : e.tipo === 'prueba' ? 'Prueba' : e.tipo;
  return (
    <Link href={`/registro?ej=${e.id}`} className="card block p-5">
      <div className="flex items-center gap-2">
        <span aria-hidden className={`size-2.5 shrink-0 rounded-full ${est.punto}`} />
        <span className="num text-[17px] font-semibold">{fmtHora(e.iniciada_en)}</span>
        <span className="meta">{tipo} · {est.texto}</span>
        <ChevronRight size={18} aria-hidden className="ml-auto shrink-0 text-muted" />
      </div>
      <div className="mt-4 flex divide-x divide-border">
        <Cifra valor={e.total_nuevas} etiqueta="nuevas" />
        <Cifra valor={e.total_descartadas} etiqueta="descartadas" />
        <Cifra valor={e.total_ya_conocidas} etiqueta="ya conocidas" />
      </div>
      {fallos.length > 0 && (
        <p className="mt-3 inline-flex max-w-full items-center gap-1 rounded-full bg-surface-2 px-3 py-1 text-sm font-medium text-ambar">
          <AlertTriangle size={14} aria-hidden className="shrink-0" />
          <span className="truncate">{fallos.length === 1 ? `${fallos[0]} falló` : `${fallos.length} fuentes fallaron`}</span>
        </p>
      )}
    </Link>
  );
}
