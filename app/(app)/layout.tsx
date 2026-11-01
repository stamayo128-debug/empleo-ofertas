import Link from 'next/link';
import { Briefcase } from 'lucide-react';
import { NavEscritorio, NavMovil } from '@/components/NavLinks';
import { ToastProvider } from '@/components/Toast';
import { requireSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await requireSession();
  return (
    <ToastProvider>
      {/* En móvil no hay cabecera común: cada pantalla lleva su título. La barra superior es solo de escritorio. */}
      <header className="hidden border-b border-border bg-surface md:block">
        <div className="mx-auto flex h-[60px] max-w-[1240px] items-center gap-3 px-5">
          <Link href="/" aria-label="Ofertas" className="grid size-11 shrink-0 place-items-center rounded-full text-on-accent shadow-btn" style={{ backgroundImage: 'var(--grad-cta)' }}>
            <Briefcase size={20} aria-hidden />
          </Link>
          <NavEscritorio />
        </div>
      </header>
      <main className="mx-auto max-w-[1240px] px-5 pb-[calc(7.5rem+env(safe-area-inset-bottom))] pt-6 md:pb-10">{children}</main>
      <NavMovil />
    </ToastProvider>
  );
}
