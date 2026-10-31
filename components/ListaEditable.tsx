'use client';

import { useRef, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { normaliza } from '@/lib/ubicacion';

/**
 * Lista de textos editable en el sitio: cada elemento es una fila que se cambia escribiendo encima,
 * con su botón para quitarlo, un «Añadir» y, si se pasan, sugerencias de un toque.
 */
export default function ListaEditable({
  nombre, items, onChange, anadir = 'Añadir', vacio, sugerencias = [],
}: {
  nombre: string;
  items: string[];
  onChange: (items: string[]) => void;
  anadir?: string;
  vacio?: string;
  sugerencias?: string[];
}) {
  const [foco, setFoco] = useState<number | null>(null);
  const refs = useRef<(HTMLTextAreaElement | null)[]>([]);
  const existentes = new Set(items.map(normaliza));
  const faltan = sugerencias.filter((s) => !existentes.has(normaliza(s)));

  function cambiar(i: number, v: string) {
    onChange(items.map((x, j) => (j === i ? v : x)));
  }
  function quitar(i: number) {
    onChange(items.filter((_, j) => j !== i));
  }
  function nuevo(texto = '') {
    onChange([...items, texto]);
    if (!texto) setFoco(items.length);
  }

  return (
    <div className="space-y-3">
      {items.length === 0 && vacio && <p className="meta">{vacio}</p>}
      <ul className="space-y-2">
        {items.map((x, i) => (
          <li key={i} className="flex items-start gap-2">
            <textarea
              ref={(el) => {
                refs.current[i] = el;
                if (el && foco === i) { el.focus(); setFoco(null); }
              }}
              aria-label={`${nombre} ${i + 1}`}
              rows={1}
              maxLength={120}
              spellCheck={false}
              value={x}
              onChange={(e) => cambiar(i, e.target.value.replace(/\n/g, ' '))}
              className="input min-h-11 flex-1 resize-none rounded-tile py-2.5 [field-sizing:content]"
            />
            <button type="button" onClick={() => quitar(i)} aria-label={`Quitar «${x || nombre}»`} className="icon-btn size-11 text-muted">
              <X size={18} aria-hidden />
            </button>
          </li>
        ))}
      </ul>
      <button type="button" onClick={() => nuevo()} className="btn">
        <Plus size={18} aria-hidden /> {anadir}
      </button>
      {faltan.length > 0 && (
        <div>
          <p className="meta mb-2">Sugerencias (toca para añadir)</p>
          <div className="flex flex-wrap gap-2">
            {faltan.map((s) => (
              <button key={s} type="button" onClick={() => nuevo(s)} className="chip min-h-10 text-accent">
                <Plus size={14} aria-hidden /> {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
