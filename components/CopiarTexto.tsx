'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

/** Copia un texto al portapapeles y avisa con el propio botón. */
export default function CopiarTexto({
  texto, etiqueta = 'Copiar', etiquetaHecho = 'Copiado', className = '',
}: { texto: string; etiqueta?: string; etiquetaHecho?: string; className?: string }) {
  const [copiado, setCopiado] = useState(false);
  async function copiar() {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch { /* sin permiso de portapapeles */ }
  }
  return (
    <button type="button" className={`btn ${className}`} onClick={copiar}>
      {copiado ? <Check size={16} aria-hidden /> : <Copy size={16} aria-hidden />}
      <span aria-live="polite">{copiado ? etiquetaHecho : etiqueta}</span>
    </button>
  );
}
