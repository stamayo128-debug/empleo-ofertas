'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Bookmark, Briefcase, History, Send, Settings } from 'lucide-react';

const ESCRITORIO = [
  { href: '/', etiqueta: 'Ofertas' },
  { href: '/guardadas', etiqueta: 'Guardadas' },
  { href: '/descartes', etiqueta: 'Descartes' },
  { href: '/historial', etiqueta: 'Búsquedas' },
  { href: '/criterios', etiqueta: 'Criterios' },
  { href: '/ajustes', etiqueta: 'Ajustes' },
];

function activo(path: string, href: string) {
  if (href === '/ajustes') return path.startsWith('/ajustes') || path.startsWith('/criterios') || path.startsWith('/descartes'); // cuelgan de Ajustes en el móvil
  return href === '/' ? path === '/' : path.startsWith(href);
}

export function NavEscritorio() {
  const path = usePathname();
  return (
    <nav aria-label="Principal" className="ml-auto hidden items-center gap-1 md:flex">
      {ESCRITORIO.map(({ href, etiqueta }) => (
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

function Item({ href, etiqueta, Icono, path }: { href: string; etiqueta: string; Icono: typeof Briefcase; path: string }) {
  const on = activo(path, href);
  return (
    <Link
      href={href} aria-current={on ? 'page' : undefined}
      className={`flex min-h-14 flex-col items-center justify-center gap-0.5 text-[13px] font-medium ${on ? 'text-accent' : 'text-muted'}`}
    >
      <Icono size={22} aria-hidden />
      {etiqueta}
    </Link>
  );
}

/** Barra inferior flotante: Ofertas · Guardadas · [Por enviar] · Búsquedas · Ajustes. */
export function NavMovil({ porEnviar }: { porEnviar: number }) {
  const path = usePathname();
  const tab = useSearchParams().get('tab');
  const enPorEnviar = path === '/' && tab === 'porenviar';
  return (
    <nav
      aria-label="Principal"
      className="glass fixed inset-x-4 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-40 grid grid-cols-5 items-center rounded-full border border-border/60 px-2 shadow-card md:hidden"
    >
      <Item href="/" etiqueta="Ofertas" Icono={Briefcase} path={enPorEnviar ? '/otra' : path} />
      <Item href="/guardadas" etiqueta="Guardadas" Icono={Bookmark} path={path} />
      <Link
        href="/?tab=porenviar"
        aria-label={`Por enviar, ${porEnviar} pendientes`}
        aria-current={enPorEnviar ? 'page' : undefined}
        className={`relative -mt-7 grid size-14 place-items-center justify-self-center rounded-full text-on-accent shadow-btn ${enPorEnviar ? 'ring-4 ring-accent-soft' : ''}`}
        style={{ backgroundImage: 'var(--grad-cta)' }}
      >
        <Send size={22} aria-hidden />
        {porEnviar > 0 && (
          <span className="num absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full bg-save px-1 text-[11px] font-bold leading-5 text-on-save">
            {porEnviar > 99 ? '99+' : porEnviar}
          </span>
        )}
      </Link>
      <Item href="/historial" etiqueta="Búsquedas" Icono={History} path={path} />
      <Item href="/ajustes" etiqueta="Ajustes" Icono={Settings} path={path} />
    </nav>
  );
}

