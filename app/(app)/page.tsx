import Link from 'next/link';
import DetallePanel from '@/components/DetallePanel';
import EmptyState from '@/components/EmptyState';
import FiltrosOfertas from '@/components/FiltrosOfertas';
import OfertaCard from '@/components/OfertaCard';
import { filtrosActivos, hrefOfertas, parseFiltros, type SP } from '@/lib/filtros';
import { eventosDeOferta, listarOfertas, obtenerOferta } from '@/lib/queries';
import { requireSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

export default async function OfertasPage({ searchParams }: { searchParams: Promise<SP> }) {
  await requireSession();
  const f = parseFiltros(await searchParams);
  const [lista, oferta, eventos] = await Promise.all([
    listarOfertas(f),
    f.sel ? obtenerOferta(f.sel) : Promise.resolve(null),
    f.sel ? eventosDeOferta(f.sel) : Promise.resolve([]),
  ]);
  const hayDetalle = !!(f.sel && oferta);
  const filtrado = filtrosActivos(f) > 0;

  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_480px] lg:items-start lg:gap-6">
      <div className={`max-w-[760px] space-y-5 ${hayDetalle ? 'hidden lg:block' : ''}`}>
        <header>
          <h1 className="text-2xl font-semibold">Ofertas</h1>
          <p className="meta num">
            {lista.total === 1 ? '1 oferta activa' : `${lista.total} ofertas activas`}{filtrado && ' con estos filtros'}
          </p>
        </header>

        <FiltrosOfertas filtros={{ plat: f.plat, dia: f.dia }} />

        {lista.filas.length === 0 ? (
          <EmptyState acciones={filtrado ? <Link href="/" className="btn">Quitar filtros</Link> : undefined}>
            {filtrado ? 'Ninguna oferta con estos filtros.' : 'Todavía no hay ofertas activas.'}
          </EmptyState>
        ) : (
          <>
            <ul className="space-y-4">
              {lista.filas.map((o) => (
                <li key={o.id}>
                  <OfertaCard o={o} href={hrefOfertas(f, { sel: o.id, lim: f.lim })} seleccionada={f.sel === o.id} />
                </li>
              ))}
            </ul>
            {lista.filas.length < lista.total && (
              <Link href={hrefOfertas(f, { lim: f.lim + 50, sel: f.sel })} scroll={false} className="btn w-full">
                Cargar más ({lista.filas.length} de {lista.total})
              </Link>
            )}
          </>
        )}
      </div>

      {hayDetalle && oferta && (
        <aside aria-label="Detalle de la oferta" className="lg:sticky lg:top-6 lg:max-h-[calc(100dvh-3rem)] lg:overflow-y-auto">
          <DetallePanel o={oferta} eventos={eventos} cerrarHref={hrefOfertas(f, { lim: f.lim })} />
        </aside>
      )}
    </div>
  );
}
