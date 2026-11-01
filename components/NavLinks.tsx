'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Archive, Bookmark, Briefcase, History, Settings } from 'lucide-react';

type Icono = typeof Briefcase;

const ENLACES: { href: string; etiqueta: string; Icono: Icono }[] = [
  { href: '/', etiqueta: 'Ofertas', Icono: Briefcase },
  { href: '/guardadas', etiqueta: 'Guardadas', Icono: Bookmark },
  { href: '/descartadas', etiqueta: 'Descartadas', Icono: Archive },
  { href: '/registro', etiqueta: 'Registro', Icono: History },
  { href: '/ajustes', etiqueta: 'Ajustes', Icono: Settings },
];

function activo(path: string, href: string) {
  if (href === '/ajustes') return path.startsWith('/ajustes') || path.startsWith('/criterios'); // Criterios cuelga de Ajustes
  return href === '/' ? path === '/' : path.startsWith(href);
}

export function NavEscritorio() {
  const path = usePathname();
  return (
    <nav aria-label="Principal" className="ml-auto hidden items-center gap-1 md:flex">
      {ENLACES.map(({ href, etiqueta }) => (
        <Link
          key={href} href={href} aria-current={activo(path, href) ? 'page' : undefined}
          className={`inline-flex min-h-11 items-center rounded-full px-4 text-[15px] font-medium ${activo(path, href) ? 'bg-accent-soft text-accent' : 'text-muted hover:text-fg'}`}
        >
          {etiqueta}
        </Link>
      ))}
    </nav>
  );
}

function Item({ href, etiqueta, Icono, path }: { href: string; etiqueta: string; Icono: Icono; path: string }) {
  const on = activo(path, href);
  return (
    <Link
      href={href} aria-current={on ? 'page' : undefined}
      className={`flex min-h-14 min-w-0 flex-col items-center justify-center gap-0.5 text-[11px] font-medium ${on ? 'text-accent' : 'text-muted'}`}
    >
      <Icono size={22} aria-hidden />
      <span className="max-w-full truncate px-0.5">{etiqueta}</span>
    </Link>
  );
}

/** Barra inferior: Descartadas · Guardadas · (Ofertas) · Registro · Ajustes. Ofertas es el círculo central. */
export function NavMovil() {
  const path = usePathname();
  const enOfertas = activo(path, '/');
  return (
    <nav
      aria-label="Principal"
      className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-40 grid grid-cols-[1fr_1fr_4.25rem_1fr_1fr] items-center rounded-full border border-border bg-surface px-1 shadow-card md:hidden"
    >
      <Item href="/descartadas" etiqueta="Descartadas" Icono={Archive} path={path} />
      <Item href="/guardadas" etiqueta="Guardadas" Icono={Bookmark} path={path} />
      <Link
        href="/"
        aria-label="Ofertas"
        aria-current={enOfertas ? 'page' : undefined}
        className={`-mt-6 grid size-14 place-items-center justify-self-center rounded-full text-on-accent shadow-btn ${enOfertas ? 'ring-4 ring-accent-soft' : ''}`}
        style={{ backgroundImage: 'var(--grad-cta)' }}
      >
        <Briefcase size={24} aria-hidden />
      </Link>
      <Item href="/registro" etiqueta="Registro" Icono={History} path={path} />
      <Item href="/ajustes" etiqueta="Ajustes" Icono={Settings} path={path} />
    </nav>
  );
}
