'use client';

import { useEffect, useRef, useState } from 'react';
import { actualizarOferta } from '@/lib/actions';

type Estado = 'quieto' | 'pendiente' | 'guardando' | 'guardado' | 'error';

export default function NotasEditor({ id, inicial }: { id: number; inicial: string }) {
  const [texto, setTexto] = useState(inicial);
  const [estado, setEstado] = useState<Estado>('quieto');
  const ultimoGuardado = useRef(inicial);
  const actual = useRef(inicial);
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function guardar() {
    if (temporizador.current) clearTimeout(temporizador.current);
    temporizador.current = null;
    const valor = actual.current;
    if (valor === ultimoGuardado.current) { setEstado('quieto'); return; }
    setEstado('guardando');
    try {
      const r = await actualizarOferta(id, { notas: valor });
      if (r.ok) { ultimoGuardado.current = valor; setEstado(actual.current === valor ? 'guardado' : 'pendiente'); }
      else setEstado('error');
    } catch {
      setEstado('error');
    }
  }

  function cambiar(v: string) {
    setTexto(v);
    actual.current = v;
    setEstado('pendiente');
    if (temporizador.current) clearTimeout(temporizador.current);
    temporizador.current = setTimeout(guardar, 800);
  }

  useEffect(() => () => { if (temporizador.current) clearTimeout(temporizador.current); }, []);

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <label htmlFor="notas" className="text-sm font-medium text-muted">Notas</label>
        <span className="meta" aria-live="polite">
          {estado === 'guardado' && 'Guardado'}
          {estado === 'guardando' && 'Guardando…'}
          {estado === 'error' && <span className="text-rojo">No se pudo guardar</span>}
        </span>
      </div>
      <textarea
        id="notas" rows={5} maxLength={20000} className="input py-2" value={texto}
        onChange={(e) => cambiar(e.target.value)} onBlur={guardar}
      />
    </div>
  );
}
