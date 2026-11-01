import Link from 'next/link';
import { Bookmark } from 'lucide-react';
import EmptyState from '@/components/EmptyState';
import OfertaCard from '@/components/OfertaCard';
import { hrefOfertas } from '@/lib/filtros';
import { listarGuardadas } from '@/lib/queries';
import { requireSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

export default async function GuardadasPage() {
  await requireSession();
  const filas = await listarGuardadas();

  return (
    <div className="max-w-[760px] space-y-4">
      <header>
        <h1 className="text-2xl font-semibold">Guardadas</h1>
        <p className="meta num">{filas.length === 1 ? '1 oferta guardada' : `${filas.length} ofertas guardadas`}</p>
      </header>

      {filas.length === 0 ? (
        <EmptyState icono={<Bookmark size={26} />}>
          Aquí aparecen las ofertas que guardes con el marcador. Guarda las que te interesen para decidir después.
        </EmptyState>
      ) : (
        <ul className="space-y-4">
          {filas.map((o) => (
            <li key={o.id}>
              <OfertaCard o={o} href={hrefOfertas({}, { sel: o.id })} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
