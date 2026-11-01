import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import EjecucionCard, { Cifra, ESTADO_EJ } from '@/components/EjecucionCard';
import EmptyState from '@/components/EmptyState';
import PortalCard, { type ResumenPortal } from '@/components/PortalCard';
import { hrefOfertas, type SP } from '@/lib/filtros';
import { diaMadrid, diasDesde, etiquetaDia, fmtDia, fmtHora } from '@/lib/format';
import { grupoPortal } from '@/lib/portales';
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
  const cola = new Map(cuadre.map((c) => [c.id, Number(c.cola_pendiente ?? 0)]));
  const scraper = new Map(cuadre.map((c) => [c.id, Number(c.resultados_scraper ?? 0)]));
  const est = ESTADO_EJ[e.estado] ?? ESTADO_EJ.en_curso;
  const dia = diaMadrid(e.iniciada_en);

  // Los enlaces filtran por «desde ese día»: las ofertas no guardan a qué búsqueda pertenecen.
  const n = diasDesde(dia);
  const diaFiltro = n <= 0 ? 'hoy' : n <= 6 ? '7' : n <= 29 ? '30' : '';
  const rango = n <= 0 ? 'hoy' : n <= 6 ? '7' : '30';

  const porPortal = new Map<string, ResumenPortal>();
  for (const b of busquedas) {
    const p = porPortal.get(b.plataforma) ?? {
      plataforma: b.plataforma, consultas: 0, resultados: 0, nuevas: 0, descartadas: 0, conocidas: 0, errores: [],
      hrefOfertas: hrefOfertas({ plat: [grupoPortal(b.plataforma)], dia: diaFiltro }),
      hrefDescartes: `/descartadas?plat=${grupoPortal(b.plataforma)}`,
    };
    p.consultas += 1;
    p.resultados += (scraper.get(b.id) ?? 0) > 0 ? scraper.get(b.id)! : b.resultados;
    p.nuevas += b.nuevas_aceptadas;
    p.descartadas += b.nuevas_descartadas;
    p.conocidas += b.ya_conocidas;
    if (b.error && !p.errores.includes(b.error)) p.errores.push(b.error);
    porPortal.set(b.plataforma, p);
  }
  const portales = [...porPortal.values()];
  const colaTotal = busquedas.reduce((t, b) => t + (cola.get(b.id) ?? 0), 0);
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

      {e.resumen && (
        <details className="card group">
          <summary className="flex min-h-14 cursor-pointer list-none items-center px-5 text-[15px] font-semibold [&::-webkit-details-marker]:hidden">
            Resumen del agente
          </summary>
          <p className="max-h-80 overflow-auto whitespace-pre-wrap border-t border-border p-5 text-sm text-muted">{e.resumen}</p>
        </details>
      )}

      <details className="card group">
        <summary className="flex min-h-14 cursor-pointer list-none items-center px-5 text-[15px] font-semibold [&::-webkit-details-marker]:hidden">
          Datos técnicos
        </summary>
        <div className="space-y-3 border-t border-border p-5 text-sm">
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
            <dt className="text-muted">Inicio</dt><dd className="num">{fmtDia(e.iniciada_en)} {fmtHora(e.iniciada_en)}</dd>
            {e.finalizada_en && (<><dt className="text-muted">Fin</dt><dd className="num">{fmtHora(e.finalizada_en)}</dd></>)}
            {e.ventana && (<><dt className="text-muted">Ventana</dt><dd>{e.ventana}</dd></>)}
            <dt className="text-muted">Resultados</dt><dd className="num">{e.total_resultados}</dd>
            <dt className="text-muted">Cola pendiente</dt><dd className="num">{colaTotal}</dd>
            {e.coste_estimado_usd !== null && (<><dt className="text-muted">Coste estimado</dt><dd className="num">{Number(e.coste_estimado_usd).toFixed(2)} USD</dd></>)}
          </dl>
          {busquedas.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-left">
                <thead className="text-muted">
                  <tr>
                    <th className="py-1 pr-3 font-medium">Consulta</th>
                    <th className="py-1 pr-3 font-medium">Portal</th>
                    <th className="py-1 pr-3 text-right font-medium">Result.</th>
                    <th className="py-1 pr-3 text-right font-medium">Nuevas</th>
                    <th className="py-1 text-right font-medium">En cola</th>
                  </tr>
                </thead>
                <tbody className="num">
                  {busquedas.map((b) => (
                    <tr key={b.id} className="border-t border-border align-top">
                      <td className="py-1.5 pr-3">{b.consulta_texto}</td>
                      <td className="py-1.5 pr-3">{b.plataforma}</td>
                      <td className="py-1.5 pr-3 text-right">{(scraper.get(b.id) ?? 0) > 0 ? scraper.get(b.id) : b.resultados}</td>
                      <td className="py-1.5 pr-3 text-right">{b.nuevas_aceptadas}</td>
                      <td className="py-1.5 text-right">{cola.get(b.id) ?? 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </details>
    </div>
  );
}
