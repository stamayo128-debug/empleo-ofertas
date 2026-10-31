'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, X } from 'lucide-react';

/**
 * Marco del detalle. En móvil ocupa toda la pantalla (cabecera fija con atrás, empresa y guardar, y barra de acción abajo).
 * En escritorio sigue siendo un panel lateral.
 */
export default function DetalleShell({
  titulo, empresa, cerrarHref, guardar, barra, children,
}: { titulo: string; empresa: string; cerrarHref: string; guardar: React.ReactNode; barra: React.ReactNode; children: React.ReactNode }) {
  const router = useRouter();
  const ref = useRef<HTMLHeadingElement>(null);

  useEffect(() => { ref.current?.focus({ preventScroll: true }); }, [titulo]);
  useEffect(() => {
    const alPulsar = (e: KeyboardEvent) => { if (e.key === 'Escape') router.push(cerrarHref); };
    document.addEventListener('keydown', alPulsar);
    return () => document.removeEventListener('keydown', alPulsar);
  }, [router, cerrarHref]);
  // En móvil el detalle tapa la página: se bloquea el scroll de detrás mientras está abierto.
  useEffect(() => {
    const movil = window.matchMedia('(max-width: 1023px)');
    if (!movil.matches) return;
    const anterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = anterior; };
  }, []);

  return (
    <section
      aria-labelledby="detalle-titulo"
      className="fixed inset-0 z-50 overflow-y-auto bg-bg lg:static lg:z-auto lg:overflow-visible lg:rounded-card lg:bg-surface lg:shadow-card"
    >
      <div className="glass sticky top-0 z-10 flex h-[60px] items-center gap-3 px-5 lg:static lg:bg-transparent lg:backdrop-blur-none">
        <Link href={cerrarHref} className="icon-btn lg:hidden" aria-label="Volver a la lista"><ArrowLeft size={20} aria-hidden /></Link>
        <p className="min-w-0 flex-1 truncate text-center text-[17px] font-semibold lg:text-left">{empresa}</p>
        {guardar}
        <Link href={cerrarHref} className="icon-btn hidden lg:grid" aria-label="Cerrar detalle"><X size={20} aria-hidden /></Link>
      </div>
      <div className="px-5 pb-36 pt-2 lg:pb-5">
        <h2 id="detalle-titulo" ref={ref} tabIndex={-1} className="sr-only outline-none">{titulo}</h2>
        {children}
      </div>
      <div className="glass fixed inset-x-0 bottom-0 z-[60] border-t border-border/60 px-5 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 lg:sticky lg:bottom-0 lg:z-10 lg:rounded-b-card lg:bg-surface">
        {barra}
      </div>
    </section>
  );
}
