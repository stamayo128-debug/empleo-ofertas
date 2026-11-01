'use client';

import { useState, useTransition } from 'react';
import { guardarPuestos } from '@/lib/actions';
import ListaEditable from './ListaEditable';
import { useToast } from './Toast';

const limpiar = (l: string[]) => {
  const vistos = new Set<string>();
  return l.map((x) => x.trim()).filter((x) => {
    const k = x.toLowerCase();
    if (!x || vistos.has(k)) return false;
    vistos.add(k);
    return true;
  });
};

/** Los puestos que se buscan, en dos listas cortas. Se guardan con el botón. */
export default function PuestosForm({ objetivo, adyacentes }: { objetivo: string[]; adyacentes: string[] }) {
  const toast = useToast();
  const [pendiente, iniciar] = useTransition();
  const [a, setA] = useState<string[]>(objetivo);
  const [b, setB] = useState<string[]>(adyacentes);
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        iniciar(async () => {
          let r: Awaited<ReturnType<typeof guardarPuestos>>;
          try {
            r = await guardarPuestos({ puestos_objetivo: limpiar(a), puestos_adyacentes: limpiar(b) });
          } catch {
            r = { ok: false, error: 'No se pudo guardar' };
          }
          if (r.ok) toast.mostrar('Puestos guardados'); else { setError(r.error); toast.mostrar(r.error); }
        });
      }}
    >
      <div className="space-y-2">
        <h3 className="text-[15px] font-semibold">Me interesan mucho</h3>
        <ListaEditable nombre="Puesto que me interesa" items={a} onChange={setA} anadir="Añadir puesto" vacio="Aún no hay ninguno." />
      </div>
      <div className="space-y-2">
        <h3 className="text-[15px] font-semibold">También me valen</h3>
        <ListaEditable nombre="Puesto que también me vale" items={b} onChange={setB} anadir="Añadir puesto" vacio="Aún no hay ninguno." />
      </div>
      {error && <p role="alert" className="rounded-tile border border-rojo px-3 py-2 text-sm text-rojo">{error}</p>}
      <button type="submit" className="btn btn-primary w-full" disabled={pendiente}>{pendiente ? 'Guardando…' : 'Guardar puestos'}</button>
    </form>
  );
}
