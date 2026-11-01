import Link from 'next/link';
import { ChevronRight, LogOut, SlidersHorizontal } from 'lucide-react';
import { cerrarSesion } from '@/app/login/actions';
import ExcelBoton from '@/components/ExcelBoton';
import { requireSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

export default async function AjustesPage() {
  await requireSession();
  return (
    <div className="max-w-[560px] space-y-5">
      <h1 className="text-xl font-semibold">Ajustes</h1>
      <ul className="card divide-y divide-border overflow-hidden">
        <li>
          <Link href="/criterios" className="flex min-h-14 items-center gap-3 px-5 text-[15px] font-medium">
            <SlidersHorizontal size={20} aria-hidden className="text-accent" />
            <span className="flex-1">Criterios de búsqueda</span>
            <ChevronRight size={18} aria-hidden className="text-muted" />
          </Link>
        </li>
        <li><ExcelBoton fila /></li>
        <li>
          <form action={cerrarSesion}>
            <button type="submit" className="flex min-h-14 w-full items-center gap-3 px-5 text-left text-[15px] font-medium">
              <LogOut size={20} aria-hidden className="text-rojo" />
              Cerrar sesión
            </button>
          </form>
        </li>
      </ul>
    </div>
  );
}
