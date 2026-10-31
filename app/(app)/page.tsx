import Link from 'next/link';
import DetallePanel from '@/components/DetallePanel';
import EmptyState from '@/components/EmptyState';
import FiltroBar from '@/components/FiltroBar';
import OfertaCard from '@/components/OfertaCard';
import { SeleccionProvider } from '@/components/SeleccionLote';
import { TABS } from '@/lib/constantes';
import { filtrosActivos, hrefOfertas, parseFiltros, type SP } from '@/lib/filtros';
import { diaMadrid, fmtHora, hoyMadrid } from '@/lib/format';
import {
  contadoresTabs, eventosDeOferta, listarOfertas, marcarRevisada, obtenerOferta,
  plataformasDisponibles, ultimaEjecucion,
} from '@/lib/queries';
import { requireSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

export default async function OfertasPage({ searchParams }: { searchParams: Promise<SP> }) {
  await requireSession();
  const f = parseFiltros(await searchParams);
  const hoy = hoyMadrid();

  // Al abrir una oferta por primera vez se rellena revisada_en (antes de contar "Por revisar").
  if (f.sel) await marcarRevisada(f.sel);

  const [contadores, plataformas, lista, ejecucion, oferta, eventos] = await Promise.all([
    contadoresTabs(),
    plataformasDisponibles(),
    listarOfertas(f),
    ultimaEjecucion(),
    f.sel ? obtenerOferta(f.sel) : Promise.resolve(null),
    f.sel ? eventosDeOferta(f.sel) : Promise.resolve([]),
  ]);

  const listaUl = (
    <ul className="space-y-3">
      {lista.filas.map((o) => (
        <li key={o.id}>
          <OfertaCard
            o={o}
            href={hrefOfertas(f, { sel: o.id, lim: f.lim })}
            seleccionada={f.sel === o.id}
            tab={f.tab}
            vencida={
              (o.estado === 'Postulado' || o.estado === 'Entrevista') &&
              o.respuesta_tipo === 'Sin respuesta' &&
              !!o.proximo_seguimiento && o.proximo_seguimiento < hoy
            }
          />
        </li>
      ))}
    </ul>
  );

  const cerrarHref = hrefOfertas(f, { lim: f.lim });
  const hayDetalle = !!(f.sel && oferta);
  const ejecutadaHoy = !!ejecucion && diaMadrid(ejecucion.iniciada_en) === hoy;

  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_480px] lg:items-start lg:gap-6">
      <div className={`max-w-[760px] space-y-4 ${hayDetalle ? 'hidden lg:block' : ''}`}>
        <div role="tablist" aria-label="Vistas de ofertas" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
          {TABS.map((t) => {
            const activa = f.tab === t.id;
            return (
              <Link
                key={t.id}
                role="tab"
                aria-selected={activa}
                href={hrefOfertas({ ...f, tab: t.id })}
                className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-[10px] border px-4 text-[15px] font-medium ${activa ? 'border-accent bg-accent-soft text-accent' : 'border-border bg-surface text-fg'}`}
              >
                {t.etiqueta} <span className="num text-muted">{contadores[t.id]}</span>
              </Link>
            );
          })}
        </div>

        <FiltroBar filtros={f} plataformas={plataformas} />

        {f.tab === 'todas' && (
          <Link
            role="switch"
            aria-checked={f.descartadas}
            href={hrefOfertas({ ...f, descartadas: !f.descartadas })}
            className="inline-flex min-h-11 items-center gap-3 text-[15px]"
          >
            <span className={`relative inline-block h-6 w-11 rounded-full border ${f.descartadas ? 'border-accent bg-accent' : 'border-border bg-surface'}`} aria-hidden>
              <span className={`absolute top-0.5 size-4.5 rounded-full ${f.descartadas ? 'left-5.5 bg-on-accent' : 'left-0.5 bg-muted'}`} />
            </span>
            Incluir descartadas
          </Link>
        )}

        <div role="tabpanel" className="space-y-3">
          {lista.filas.length === 0 ? (
            <Vacio f={f} ejecutadaHoy={ejecutadaHoy} ejecucion={ejecucion} />
          ) : (
            <>
              <p className="meta num">
                {lista.total === 1 ? '1 oferta' : `${lista.total} ofertas`}
                {filtrosActivos(f) > 0 && ' con estos filtros'}
              </p>
              {f.tab === 'porenviar' ? <SeleccionProvider>{listaUl}</SeleccionProvider> : listaUl}
              {lista.filas.length < lista.total && (
                <Link href={hrefOfertas(f, { lim: f.lim + 50, sel: f.sel })} scroll={false} className="btn w-full">
                  Cargar más ({lista.filas.length} de {lista.total})
                </Link>
              )}
            </>
          )}
        </div>
      </div>

      {hayDetalle && oferta && (
        <aside aria-label="Detalle de la oferta" className="lg:sticky lg:top-28 lg:max-h-[calc(100dvh-8rem)] lg:overflow-y-auto">
          <DetallePanel o={oferta} eventos={eventos} cerrarHref={cerrarHref} />
        </aside>
      )}
    </div>
  );
}

function Vacio({
  f, ejecutadaHoy, ejecucion,
}: {
  f: ReturnType<typeof parseFiltros>;
  ejecutadaHoy: boolean;
  ejecucion: Awaited<ReturnType<typeof ultimaEjecucion>>;
}) {
  if (filtrosActivos(f) > 0) {
    return (
      <EmptyState acciones={<Link href={hrefOfertas({ tab: f.tab, descartadas: f.descartadas })} className="btn">Limpiar filtros</Link>}>
        Ninguna oferta con estos filtros.
      </EmptyState>
    );
  }
  if (f.tab === 'hoy') {
    if (ejecutadaHoy && ejecucion) {
      return (
        <EmptyState
          acciones={
            <>
              <Link href="/descartes?rango=hoy" className="btn">Ver descartes de hoy</Link>
              <Link href={hrefOfertas({ tab: 'revisar' })} className="btn">Ver por revisar</Link>
            </>
          }
        >
          Hoy no hay vacantes nuevas. La búsqueda de las {fmtHora(ejecucion.iniciada_en)} revisó {ejecucion.total_resultados}{' '}
          resultados: {ejecucion.total_ya_conocidas} ya conocidas y {ejecucion.total_descartadas} descartadas.
        </EmptyState>
      );
    }
    return (
      <EmptyState acciones={<Link href={hrefOfertas({ tab: 'todas', orden: 'deteccion' })} className="btn">Ver las más recientes</Link>}>
        La búsqueda diaria aún no se ha hecho hoy (programada a las 8:00). Mientras, puedes ver las de ayer.
      </EmptyState>
    );
  }
  if (f.tab === 'revisar') return <EmptyState>No tienes ofertas por revisar.</EmptyState>;
  if (f.tab === 'verificar') return <EmptyState>No hay ofertas por verificar. Aquí aparecen las que tienen un enlace roto o genérico, una ficha imposible de leer o una posible duplicada.</EmptyState>;
  if (f.tab === 'porenviar') return <EmptyState>No tienes ofertas pendientes de enviar.</EmptyState>;
  if (f.tab === 'enviadas') {
    return <EmptyState>Aún no has marcado ninguna solicitud como enviada. Usa «Marcar como enviada» en cada oferta.</EmptyState>;
  }
  return <EmptyState>Todavía no hay ofertas.</EmptyState>;
}
