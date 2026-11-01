import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import EjecucionCard, { Cifra, ESTADO_EJ } from '@/components/EjecucionCard';
import EmptyState from '@/components/EmptyState';
import PortalCard, { type ResumenPortal } from '@/components/PortalCard';
import { hrefOfertas, type SP } from '@/lib/filtros';
import { diaMadrid, diasDesde, etiquetaDia, fmtHora } from '@/lib/format';
import { grupoPortal, PORTALES } from '@/lib/portales';
import { busquedasDe, cuadreDe, listarEjecuciones, obtenerEjecucion } from '@/lib/queries';
import { requireSession } from '@/lib/session';
import type { Ejecucion } from '@/lib/types';

export const dynamic = 'force-dynamic';

const uno = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] ?? '' : v ?? '');

export default async function HistorialPage({ searchParams }: { searchParams: Promise<SP> }) {
  await requireSession();
  const sp = await searchParams;
  const ej = parseInt(uno(sp.ej), 10);
  if (Number.isInteger(ej) && ej > 0) return <DetalleBusqueda id={ej} />;

  const lim = Math.min(Math.max(parseInt(uno(sp.lim), 10) || 30, 30), 300);
  const { filas, total } = await listarEjecuciones(lim);

  // Agrupadas por día de Madrid, la más reciente primero (ya vienen ordenadas).
  const dias: { dia: string; items: Ejecucion[] }[] = [];
  for (const e of filas) {
    const dia = diaMadrid(e.iniciada_en);
    const ultimo = dias[dias.length - 1];
    if (ultimo && ultimo.dia === dia) ultimo.items.push(e);
    else dias.push({ dia, items: [e] });
  }

  return (
    <div className="max-w-[760px] space-y-5">
      <h1 className="text-xl font-semibold">Registro</h1>
      {filas.length === 0 ? (
        <EmptyState>Todavía no hay búsquedas en el registro.</EmptyState>
      ) : (
        <>
          {dias.map(({ dia, items }) => (
            <section key={dia} aria-label={etiquetaDia(dia)} className="space-y-3">
              <h2 className="text-[15px] font-semibold text-muted">{etiquetaDia(dia)}</h2>
              <ul className="space-y-3">
                {items.map((e) => <li key={e.id}><EjecucionCard e={e} /></li>)}
              </ul>
            </section>
          ))}
          {filas.length < total && (
            <Link href={`/registro?lim=${lim + 30}`} className="btn w-full">
              Cargar más ({filas.length} de {total})
            </Link>
          )}
        </>
      )}
    </div>
  );
}

async function DetalleBusqueda({ id }: { id: number }) {
  const e = await obtenerEjecucion(id);
  if (!e) {
    return (
      <div className="max-w-[760px] space-y-4">
        <EmptyState acciones={<Link href="/registro" className="btn">Volver al Registro</Link>}>No se encontró esa búsqueda.</EmptyState>
      </div>
    );
  }
  const [busquedas, cuadre] = await Promise.all([busquedasDe([id]), cuadreDe([id])]);
  const scraper = new Map(cuadre.map((c) => [c.id, Number(c.resultados_scraper ?? 0)]));
  const est = ESTADO_EJ[e.estado] ?? ESTADO_EJ.en_curso;
  const dia = diaMadrid(e.iniciada_en);

  // Los enlaces filtran por «desde ese día»: las ofertas no guardan a qué búsqueda pertenecen.
  const n = diasDesde(dia);
  const diaFiltro = n <= 0 ? 'hoy' : n <= 6 ? '7' : n <= 29 ? '30' : '';

  const porPortal = new Map<string, ResumenPortal>();
  for (const b of busquedas) {
    const g = grupoPortal(b.plataforma);
    const p = porPortal.get(g) ?? {
      plataforma: PORTALES.find((x) => x.valor === g)?.etiqueta ?? g, consultas: 0, resultados: 0, nuevas: 0, descartadas: 0, conocidas: 0, errores: [],
      hrefOfertas: hrefOfertas({ plat: [g], dia: diaFiltro }),
      hrefDescartes: `/descartadas?plat=${g}`,
    };
    p.consultas += 1;
    p.resultados += (scraper.get(b.id) ?? 0) > 0 ? scraper.get(b.id)! : b.resultados;
    p.nuevas += b.nuevas_aceptadas;
    p.descartadas += b.nuevas_descartadas;
    p.conocidas += b.ya_conocidas;
    if (b.error && !p.errores.includes(b.error)) p.errores.push(b.error);
    porPortal.set(g, p);
  }
  const portales = PORTALES.map((x) => porPortal.get(x.valor)).filter((x): x is ResumenPortal => !!x);
  const fallos = e.fuentes_error ?? [];

  return (
    <div className="max-w-[760px] space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/registro" className="icon-btn" aria-label="Volver al Registro"><ArrowLeft size={20} aria-hidden /></Link>
        <div>
          <h1 className="text-xl font-semibold">{etiquetaDia(dia)} · <span className="num">{fmtHora(e.iniciada_en)}</span></h1>
          <p className="meta flex items-center gap-2">
            <span aria-hidden className={`size-2.5 rounded-full ${est.punto}`} />
            {e.tipo === 'diaria' ? 'Diaria' : e.tipo} · {est.texto}
          </p>
        </div>
      </div>

      <div className="card p-5">
        <div className="flex divide-x divide-border">
          <Cifra valor={e.total_nuevas} etiqueta="nuevas" />
          <Cifra valor={e.total_descartadas} etiqueta="descartadas" />
          <Cifra valor={e.total_ya_conocidas} etiqueta="ya conocidas" />
        </div>
        {fallos.length > 0 && (
          <p role="note" className="mt-3 rounded-tile bg-surface-2 px-3 py-2 text-sm font-medium text-ambar">
            {fallos.length === 1 ? `${fallos[0]} falló en esta búsqueda.` : `Fallaron ${fallos.join(', ')}.`}
          </p>
        )}
      </div>

      <h2 className="text-[15px] font-semibold text-muted">Por portal</h2>
      {portales.length === 0 ? (
        <EmptyState>Esta búsqueda no registró consultas.</EmptyState>
      ) : (
        <ul className="space-y-3">
          {portales.map((p) => <li key={p.plataforma}><PortalCard p={p} /></li>)}
        </ul>
      )}
    </div>
  );
}
