'use client';

import CopiarTexto from './CopiarTexto';

export default function CopiarEnlace({ url }: { url: string }) {
  return <CopiarTexto texto={url} etiqueta="Copiar enlace" etiquetaHecho="Copiado" />;
}
