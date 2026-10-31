import Link from 'next/link';
import { LogOut } from 'lucide-react';
import { cerrarSesion } from '@/app/login/actions';
import { RecordatorioEnvio } from '@/components/AbrirOfertaLink';
import ExcelBoton from '@/components/ExcelBoton';
import { NavEscritorio, NavMovil } from '@/components/NavLinks';
import { ToastProvider } from '@/components/Toast';
import { diaMadrid, fmtDia, fmtHora, hoyMadrid } from '@/lib/format';
import { ultimaEjecucion } from '@/lib/queries';
import { requireSession } from '@/lib/session';
import type { Ejecucion } from '@/lib/types';

export const dynamic = 'force-dynamic';

const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`;

async function LineaEstado() {
  let ej: Ejecucion | null = null;
  try {
    ej = await ultimaEjecucion();
  } catch {
    return null; // la línea de estado es secundaria; la página mostrará su propio error
  }
  if (!ej) return <span className="text-muted">Aún no hay búsquedas registradas.</span>;
  const esHoy = diaMadrid(ej.iniciada_en) === hoyMadrid();
  const cuando = esHoy ? `Búsqueda de hoy ${fmtHora(ej.iniciada_en)}` : `Última búsqueda ${fmtDia(ej.iniciada_en)} ${fmtHora(ej.iniciada_en)}`;
  const fallos = ej.fuentes_error ?? [];
  return (
    <>
      <span className="text-muted num">
        {cuando} · {plural(ej.total_nuevas, 'nueva', 'nuevas')} · {plural(ej.total_descartadas, 'descartada', 'descartadas')}
      </span>
      {fallos.length > 0 && (
        <span className="font-medium text-ambar">
          {' · '}{fallos.join(', ')} {fallos.length === 1 ? 'falló' : 'fallaron'} {esHoy ? 'hoy' : 'en esa búsqueda'}
        </span>
      )}
    </>
  );
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await requireSession();
  return (
    <ToastProvider>
      <header className="sticky top-0 z-30 border-b border-border bg-surface">
        <div className="mx-auto flex max-w-[1240px] items-center gap-3 px-4 py-2">
          <Link href="/" className="mr-2 text-lg font-semibold">Ofertas</Link>
          <NavEscritorio />
          <div className="ml-auto flex items-center gap-2">
            <ExcelBoton />
            <form action={cerrarSesion}>
              <button type="submit" className="btn" aria-label="Cerrar sesión">
                <LogOut size={18} aria-hidden />
                <span className="hidden md:inline">Cerrar sesión</span>
              </button>
            </form>
          </div>
        </div>
        <div className="border-t border-border bg-bg">
          <p className="mx-auto max-w-[1240px] px-4 py-1.5 text-sm">
            <Link href="/historial" className="hover:underline"><LineaEstado /></Link>
          </p>
        </div>
      </header>
      <main className="mx-auto max-w-[1240px] px-4 pb-24 pt-5 md:pb-10">{children}</main>
      <NavMovil />
      <RecordatorioEnvio />
    </ToastProvider>
  );
}
