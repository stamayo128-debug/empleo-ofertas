'use client';

import { useState, useTransition } from 'react';
import { archivarNota } from '@/lib/actions';
import { fmtDia } from '@/lib/format';
import type { NotaAgente } from '@/lib/types';
import { useToast } from './Toast';

export default function NotasAgenteLista({ notas }: { notas: NotaAgente[] }) {
  const toast = useToast();
  const [pendiente, iniciar] = useTransition();
  const [ocultas, setOcultas] = useState<Set<number>>(new Set());
  const visibles = notas.filter((n) => !ocultas.has(n.id));

  function archivar(id: number) {
    iniciar(async () => {
      let r: Awaited<ReturnType<typeof archivarNota>>;
      try {
        r = await archivarNota(id);
      } catch {
        r = { ok: false, error: 'No se pudo guardar' };
      }
      if (r.ok) {
        setOcultas((s) => new Set(s).add(id));
        toast.mostrar('Nota archivada');
      } else {
        toast.mostrar(r.error);
      }
    });
  }

  return (
    <section className="card">
      <details>
        <summary className="flex min-h-11 cursor-pointer items-center justify-between gap-3 p-4 text-[16px] font-semibold">
          <span>Lo que recuerda el agente</span>
          <span className="num meta font-normal">{visibles.length}</span>
        </summary>
        <div className="border-t border-border p-4">
          {visibles.length === 0 ? (
            <p className="meta">El agente no tiene notas activas.</p>
          ) : (
            <ul className="space-y-3">
              {visibles.map((n) => (
                <li key={n.id} className="flex items-start justify-between gap-3 border-b border-border pb-3 last:border-b-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="meta">
                      <span className="badge border-border text-muted">{n.tipo}</span>{' '}
                      <span className="num">{fmtDia(n.actualizada_en)}</span>
                      {n.autor ? ` · ${n.autor}` : ''}
                    </p>
                    <p className="mt-1 whitespace-pre-wrap break-words text-[15px]">{n.texto}</p>
                  </div>
                  <button type="button" className="btn shrink-0" disabled={pendiente} onClick={() => archivar(n.id)}>
                    Archivar
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </details>
    </section>
  );
}
