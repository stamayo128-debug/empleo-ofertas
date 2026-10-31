'use client';

import { useState } from 'react';

/** Texto largo cortado a 3 líneas con «Leer más». Si es corto se muestra entero. */
export default function LeerMas({ texto }: { texto: string }) {
  const [abierto, setAbierto] = useState(false);
  const largo = texto.length > 220;
  return (
    <div>
      <p className={`whitespace-pre-wrap text-[15px] leading-relaxed ${largo && !abierto ? 'line-clamp-3' : ''}`}>{texto}</p>
      {largo && (
        <button type="button" onClick={() => setAbierto(!abierto)} aria-expanded={abierto} className="mt-1 min-h-11 text-[15px] font-medium text-accent">
          {abierto ? 'Leer menos' : 'Leer más'}
        </button>
      )}
    </div>
  );
}
