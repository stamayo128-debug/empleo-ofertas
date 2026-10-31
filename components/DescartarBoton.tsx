'use client';

import { useId, useRef, useState } from 'react';
import { Ban } from 'lucide-react';
import { descartarOfertas, deshacerDescartes, type CambioDescarte } from '@/lib/actions';
import { MOTIVOS_DESCARTE_USUARIO } from '@/lib/constantes';
import { useToast } from './Toast';

/**
 * Botón "Descartar…": abre un diálogo con el motivo (lista cerrada) y una nota opcional.
 * Al guardar avisa con "Deshacer"; el aviso llama a la acción directamente, así que
 * sigue funcionando aunque este componente se desmonte al refrescar la lista.
 */
export default function DescartarBoton({
  ids, etiqueta = 'Descartar…', className = '', alTerminar,
}: { ids: number[]; etiqueta?: string; className?: string; alTerminar?: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const uid = useId();
  const [motivo, setMotivo] = useState<string>(MOTIVOS_DESCARTE_USUARIO[0].valor);
  const [nota, setNota] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const toast = useToast();

  function abrir() {
    setError('');
    ref.current?.showModal();
  }
  function cerrar() {
    ref.current?.close();
  }

  async function deshacer(cambios: CambioDescarte[]) {
    try {
      const r = await deshacerDescartes(cambios);
      toast.mostrar(r.ok ? 'Descarte deshecho' : r.error);
    } catch {
      toast.mostrar('No se pudo deshacer');
    }
  }

  async function confirmar(e: React.FormEvent) {
    e.preventDefault();
    if (guardando || ids.length === 0) return;
    setGuardando(true);
    setError('');
    let r: Awaited<ReturnType<typeof descartarOfertas>>;
    try {
      r = await descartarOfertas({ ids, motivo, detalle: nota.trim() === '' ? undefined : nota.trim() });
    } catch {
      r = { ok: false, error: 'No se pudo descartar' };
    }
    setGuardando(false);
    if (!r.ok) { setError(r.error); return; }
    cerrar();
    setNota('');
    const cambios = r.cambios;
    toast.mostrar(
      cambios.length === 1 ? 'Descartada' : `${cambios.length} ofertas descartadas`,
      { etiqueta: 'Deshacer', fn: () => { void deshacer(cambios); } },
      8000,
    );
    alTerminar?.();
  }

  return (
    <>
      <button type="button" className={`btn ${className}`} disabled={ids.length === 0} onClick={abrir}>
        <Ban size={16} aria-hidden /> {etiqueta}
      </button>
      <dialog
        ref={ref}
        aria-labelledby={`${uid}-t`}
        className="m-auto w-[min(30rem,calc(100vw-2rem))] rounded-tile border border-border bg-surface p-4 text-fg backdrop:bg-black/50"
        onClick={(e) => { if (e.target === ref.current) cerrar(); }}
      >
        <form onSubmit={confirmar} className="space-y-4">
          <h2 id={`${uid}-t`} className="text-lg font-semibold">
            {ids.length === 1 ? 'Descartar esta oferta' : `Descartar ${ids.length} ofertas`}
          </h2>
          <fieldset>
            <legend className="label">Motivo</legend>
            <div className="max-h-[45dvh] overflow-y-auto">
              {MOTIVOS_DESCARTE_USUARIO.map((m) => (
                <label key={m.valor} className="flex min-h-11 items-center gap-3 text-[15px]">
                  <input
                    type="radio" name={`${uid}-motivo`} value={m.valor} className="size-5 accent-[var(--accent)]"
                    checked={motivo === m.valor} onChange={() => setMotivo(m.valor)}
                  />
                  {m.etiqueta}
                </label>
              ))}
            </div>
          </fieldset>
          <div>
            <label htmlFor={`${uid}-nota`} className="label">Nota (opcional)</label>
            <textarea
              id={`${uid}-nota`} rows={3} maxLength={300} className="input py-2" value={nota}
              onChange={(e) => setNota(e.target.value)}
            />
            <p className="meta num mt-1">{nota.length}/300</p>
          </div>
          {error && <p role="alert" className="text-sm font-medium text-rojo">{error}</p>}
          <div className="flex justify-end gap-3">
            <button type="button" className="btn" onClick={cerrar}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={guardando}>
              {guardando ? 'Descartando…' : 'Descartar'}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
