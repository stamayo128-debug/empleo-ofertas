'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, X } from 'lucide-react';

export default function DetalleShell({
  titulo, cerrarHref, children,
}: { titulo: string; cerrarHref: string; children: React.ReactNode }) {
  const router = useRouter();
  const ref = useRef<HTMLHeadingElement>(null);

  useEffect(() => { ref.current?.focus({ preventScroll: true }); }, [titulo]);
  useEffect(() => {
    const alPulsar = (e: KeyboardEvent) => { if (e.key === 'Escape') router.push(cerrarHref); };
    document.addEventListener('keydown', alPulsar);
    return () => document.removeEventListener('keydown', alPulsar);
  }, [router, cerrarHref]);

  return (
    <section aria-labelledby="detalle-titulo" className="card p-4 md:p-5">
      <div className="mb-3 flex items-center justify-between">
        <Link href={cerrarHref} className="btn lg:hidden"><ArrowLeft size={18} aria-hidden /> Volver</Link>
        <Link href={cerrarHref} className="btn ml-auto hidden lg:inline-flex" aria-label="Cerrar detalle">
          <X size={18} aria-hidden />
        </Link>
      </div>
      <h2 id="detalle-titulo" ref={ref} tabIndex={-1} className="text-[19px] font-semibold leading-snug outline-none">
        {titulo}
      </h2>
      <div className="mt-4 space-y-6">{children}</div>
    </section>
  );
}
