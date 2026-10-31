import Link from 'next/link';
import EmptyState from '@/components/EmptyState';
import type { SP } from '@/lib/filtros';
import { fmtDia, fmtHora } from '@/lib/format';
import { busquedasDe, cuadreDe, listarEjecuciones } from '@/lib/queries';
import { requireSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

const ESTADO_EJ: Record<string, { texto: string; clase: string }> = {
  ok: { texto: 'Correcta', clase: 'text-verde border-verde' },
  parcial: { texto: 'Parcial', clase: 'text-ambar border-ambar' },
  error: { texto: 'Con error', clase: 'text-rojo border-rojo' },
  en_curso: { texto: 'En curso', clase: 'text-muted border-border' },
};

export default async function HistorialPage({ searchParams }: { searchParams: Promise<SP> }) {
  await requireSession();
  const sp = await searchParams;
  const raw = Array.isArray(sp.lim) ? sp.lim[0] : sp.lim;
  const lim = Math.min(Math.max(parseInt(raw ?? '', 10) || 30, 30), 300);

  const { filas, total } = await listarEjecuciones(lim);
  const ids = filas.map((e) => e.id);
  const [busquedas, cuadre] = await Promise.all([busquedasDe(ids), cuadreDe(ids)]);
  const colaPorBusqueda = new Map(cuadre.map((c) => [c.id, Number(c.cola_pendiente ?? 0)]));
  const scraperPorBusqueda = new Map(cuadre.map((c) => [c.id, Number(c.resultados_scraper ?? 0)]));

  return (
    <div className="max-w-[900px] space-y-4">
      <h1 className="text-xl font-semibold">Historial</h1>
      {filas.length === 0 ? (
        <EmptyState>Todavía no hay ejecuciones registradas.</EmptyState>
      ) : (
        <>
          <ul className="space-y-2">
            {filas.map((e) => {
              const est = ESTADO_EJ[e.estado] ?? ESTADO_EJ.en_curso;
              const sus = busquedas.filter((b) => b.ejecucion_id === e.id);
              return (
                <li key={e.id} className="card">
                  <details>
                    <summary className="flex min-h-11 cursor-pointer flex-wrap items-center gap-x-3 gap-y-1 p-4 text-[15px]">
                      <span className="num font-medium">{fmtDia(e.iniciada_en)} {fmtHora(e.iniciada_en)}</span>
                      <span className={`badge ${est.clase}`}>{est.texto}</span>
                      {e.tipo === 'prueba' && <span className="badge border-border text-muted">prueba</span>}
                      {e.tipo !== 'prueba' && e.tipo !== 'diaria' && <span className="text-muted">{e.tipo}</span>}
                      {e.ventana && <span className="text-muted">ventana {e.ventana}</span>}
                      <span className="num text-muted">
                        {e.total_resultados} resultados · {e.total_ya_conocidas} conocidas · {e.total_nuevas} nuevas · {e.total_descartadas} descartadas
                      </span>
                      {e.coste_estimado_usd !== null && (
                        <span className="num text-muted">{Number(e.coste_estimado_usd).toFixed(2)} USD</span>
                      )}
                      {(e.fuentes_error ?? []).length > 0 && (
                        <span className="font-medium text-ambar">Error: {e.fuentes_error.join(', ')}</span>
                      )}
                    </summary>
                    <div className="space-y-3 border-t border-border p-4">
                      {e.resumen && <p className="whitespace-pre-wrap text-[15px]">{e.resumen}</p>}
                      {sus.length === 0 ? (
                        <p className="meta">Sin búsquedas registradas.</p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full min-w-[640px] text-left text-sm">
                            <thead className="text-muted">
                              <tr>
                                <th className="py-1 pr-3 font-medium">Consulta</th>
                                <th className="py-1 pr-3 font-medium">Plataforma</th>
                                <th className="py-1 pr-3 text-right font-medium">Resultados</th>
                                <th className="py-1 pr-3 text-right font-medium">Nuevas</th>
                                <th className="py-1 pr-3 text-right font-medium">Descartadas</th>
                                <th className="py-1 pr-3 text-right font-medium">En cola</th>
                                <th className="py-1 font-medium">Error</th>
                              </tr>
                            </thead>
                            <tbody className="num">
                              {sus.map((b) => (
                                <tr key={b.id} className="border-t border-border align-top">
                                  <td className="py-1.5 pr-3">{b.consulta_texto}</td>
                                  <td className="py-1.5 pr-3">{b.plataforma}</td>
                                  <td className="py-1.5 pr-3 text-right">{(scraperPorBusqueda.get(b.id) ?? 0) > 0 ? scraperPorBusqueda.get(b.id) : b.resultados}</td>
                                  <td className="py-1.5 pr-3 text-right">{b.nuevas_aceptadas}</td>
                                  <td className="py-1.5 pr-3 text-right">{b.nuevas_descartadas}</td>
                                  <td className="py-1.5 pr-3 text-right">{colaPorBusqueda.get(b.id) ?? 0}</td>
                                  <td className="py-1.5 text-rojo">{b.error ?? ''}</td>
                                </tr>
                              ))}
                              <tr className="border-t border-border font-medium">
                                <td className="py-1.5 pr-3" colSpan={5}>Cola pendiente total</td>
                                <td className="py-1.5 pr-3 text-right">
                                  {sus.reduce((n, b) => n + (colaPorBusqueda.get(b.id) ?? 0), 0)}
                                </td>
                                <td />
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </details>
                </li>
              );
            })}
          </ul>
          {filas.length < total && (
            <Link href={`/historial?lim=${lim + 30}`} className="btn w-full">
              Cargar más ({filas.length} de {total})
            </Link>
          )}
        </>
      )}
    </div>
  );
}
