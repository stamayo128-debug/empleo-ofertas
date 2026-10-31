'use client';

import { useState } from 'react';
import { FileSpreadsheet } from 'lucide-react';
import { useToast } from './Toast';

export default function ExcelBoton({ fila = false }: { fila?: boolean }) {
  const [generando, setGenerando] = useState(false);
  const toast = useToast();

  async function descargar() {
    setGenerando(true);
    try {
      const res = await fetch('/api/export', { cache: 'no-store' });
      if (!res.ok) throw new Error('export');
      const blob = await res.blob();
      const nombre = /filename="([^"]+)"/.exec(res.headers.get('content-disposition') ?? '')?.[1] ?? 'ofertas.xlsx';
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = nombre;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      toast.mostrar('No se pudo generar el Excel');
    } finally {
      setGenerando(false);
    }
  }

  if (fila) {
    return (
      <button type="button" onClick={descargar} disabled={generando} className="flex min-h-14 w-full items-center gap-3 px-5 text-left text-[15px] font-medium disabled:opacity-60">
        <FileSpreadsheet size={20} aria-hidden className="text-accent" />
        {generando ? 'Generando Excel…' : 'Descargar Excel'}
      </button>
    );
  }
  return (
    <button type="button" className="btn" onClick={descargar} disabled={generando} aria-label={generando ? 'Generando Excel' : 'Descargar Excel'}>
      <FileSpreadsheet size={18} aria-hidden />
      <span className="hidden md:inline">{generando ? 'Generando…' : 'Excel'}</span>
    </button>
  );
}
