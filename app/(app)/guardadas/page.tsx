import Link from 'next/link';
import { Bookmark } from 'lucide-react';
import EmptyState from '@/components/EmptyState';
import OfertaCard from '@/components/OfertaCard';
import { hrefOfertas } from '@/lib/filtros';
import { listarGuardadas } from '@/lib/queries';
import { requireSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

const seg = (activo: boolean) =>
  `flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full px-4 text-[15px] font-medium ${activo ? 'bg-surface shadow-btn text-fg' : 'text-muted'}`;

export default async function GuardadasPage() {
  await requireSession();
  const filas = await listarGuardadas();

  return (
    <div className="max-w-[760px] space-y-4">
      <h1 className="text-xl font-semibold">Guardadas</h1>
      <div className="seg" role="group" aria-label="Guardadas o enviadas">
        <span aria-current="page" className={seg(true)}>Guardadas <span className="num text-muted">{filas.length}</span></span>
        <Link href={hrefOfertas({ tab: 'enviadas' })} className={seg(false)}>Enviadas</Link>
      </div>

      {filas.length === 0 ? (
        <EmptyState icono={<Bookmark size={26} />}>
          Aquí aparecen las ofertas que guardes con el marcador. Guarda las que te interesen para decidir después.
        </EmptyState>
      ) : (
        <ul className="space-y-4">
          {filas.map((o) => (
            <li key={o.id}>
              <OfertaCard o={o} href={hrefOfertas({ tab: 'todas', descartadas: o.estado === 'Descartada' }, { sel: o.id })} seleccionada={false} vencida={false} tab="todas" />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
