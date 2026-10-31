import Link from 'next/link';
import { Suspense } from 'react';
import { Briefcase } from 'lucide-react';
import { RecordatorioEnvio } from '@/components/AbrirOfertaLink';
import EstadoPill from '@/components/EstadoPill';
import { NavEscritorio, NavMovil } from '@/components/NavLinks';
import { ToastProvider } from '@/components/Toast';
import { contarPorEnviar } from '@/lib/queries';
import { requireSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await requireSession();
  // El contador del botón central es secundario: si falla, la barra sale sin número.
  const porEnviar = await contarPorEnviar().catch(() => 0);
  return (
    <ToastProvider>
      <header className="glass sticky top-0 z-30 border-b border-border/60">
        <div className="mx-auto flex h-[60px] max-w-[1240px] items-center gap-3 px-5">
          <Link href="/" aria-label="Ofertas" className="grid size-11 shrink-0 place-items-center rounded-full text-on-accent shadow-btn" style={{ backgroundImage: 'var(--grad-cta)' }}>
            <Briefcase size={20} aria-hidden />
          </Link>
          <EstadoPill />
          <NavEscritorio />
        </div>
      </header>
      <main className="mx-auto max-w-[1240px] px-5 pb-[calc(7.5rem+env(safe-area-inset-bottom))] pt-6 md:pb-10">{children}</main>
      <Suspense fallback={null}>
        <NavMovil porEnviar={porEnviar} />
      </Suspense>
      <RecordatorioEnvio />
    </ToastProvider>
  );
}
