'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Archive, Briefcase, History, SlidersHorizontal } from 'lucide-react';

const ENLACES = [
  { href: '/', etiqueta: 'Ofertas', Icono: Briefcase },
  { href: '/descartes', etiqueta: 'Descartes', Icono: Archive },
  { href: '/criterios', etiqueta: 'Criterios', Icono: SlidersHorizontal },
  { href: '/historial', etiqueta: 'Historial', Icono: History },
];

function activo(path: string, href: string) {
  return href === '/' ? path === '/' : path.startsWith(href);
}

export function NavEscritorio() {
  const path = usePathname();
  return (
    <nav aria-label="Principal" className="hidden items-center gap-1 md:flex">
      {ENLACES.map(({ href, etiqueta }) => (
        <Link
          key={href} href={href} aria-current={activo(path, href) ? 'page' : undefined}
          className={`inline-flex min-h-11 items-center rounded-[10px] px-3 text-[15px] font-medium ${activo(path, href) ? 'bg-accent-soft text-accent' : 'text-muted hover:text-fg'}`}
        >
          {etiqueta}
        </Link>
      ))}
    </nav>
  );
}

export function NavMovil() {
  const path = usePathname();
  return (
    <nav aria-label="Principal" className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] md:hidden">
      {ENLACES.map(({ href, etiqueta, Icono }) => (
        <Link
          key={href} href={href} aria-current={activo(path, href) ? 'page' : undefined}
          className={`flex min-h-12 flex-col items-center justify-center gap-0.5 py-1 text-xs font-medium ${activo(path, href) ? 'text-accent' : 'text-muted'}`}
        >
          <Icono size={20} aria-hidden />
          {etiqueta}
        </Link>
      ))}
    </nav>
  );
}
