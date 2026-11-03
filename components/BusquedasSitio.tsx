'use client';

import { useState, useTransition } from 'react';
import { ChevronDown, TriangleAlert } from 'lucide-react';
import { cambiarBusqueda, cambiarBusquedas } from '@/lib/actions';
import { resumenDias } from '@/lib/busquedas';
import type { BusquedaCatalogo, TemaBusqueda } from '@/lib/types';
import { useToast } from './Toast';

type Celda = { tema: TemaBusqueda; filas: BusquedaCatalogo[] };

/** Una búsqueda sin resultados en varias ejecuciones seguidas merece un aviso. */
const sinResultados = (f: BusquedaCatalogo) => f.activa && (f.ejecuciones_30d ?? 0) >= 3 && (f.resultados_30d ?? 0) === 0;

/**
 * Los temas de búsqueda de un sitio. Cada tema tiene un interruptor general (todos sus portales) y,
 * al desplegarlo, un interruptor por búsqueda con lo que ha dado en los últimos 30 días. Cada cambio se guarda al momento.
 */
export default function BusquedasSitio({ sitio, celdas }: { sitio: string; celdas: Celda[] }) {
  const toast = useToast();
  const [pendiente, iniciar] = useTransition();
  const [activas, setActivas] = useState<Record<number, boolean>>(() => Object.fromEntries(celdas.flatMap((c) => c.filas.map((f) => [f.id, f.activa]))));

  const fijar = (ids: number[], valor: boolean) => setActivas((a) => ({ ...a, ...Object.fromEntries(ids.map((i) => [i, valor])) }));
  const restaurar = (previo: Record<number, boolean>, ids: number[]) => setActivas((a) => ({ ...a, ...Object.fromEntries(ids.map((i) => [i, previo[i]])) }));

  function alternarTema(tema: string, filas: BusquedaCatalogo[], valor: boolean) {
    const ids = filas.map((f) => f.id);
    const previo = activas;
    fijar(ids, valor);
    iniciar(async () => {
      try {
        const r = await cambiarBusquedas(sitio, tema, valor);
        if (!r.ok) { restaurar(previo, ids); toast.mostrar(r.error); }
        else toast.mostrar(r.aviso ?? (valor ? 'Búsquedas activadas' : 'Búsquedas desactivadas'));
      } catch {
        restaurar(previo, ids);
        toast.mostrar('No se pudo guardar');
      }
    });
  }

  function alternarBusqueda(id: number, valor: boolean) {
    const previo = activas;
    fijar([id], valor);
    iniciar(async () => {
      try {
        const r = await cambiarBusqueda(id, valor);
        if (!r.ok) { restaurar(previo, [id]); toast.mostrar(r.error); }
        else toast.mostrar(valor ? 'Búsqueda activada' : 'Búsqueda archivada');
      } catch {
        restaurar(previo, [id]);
        toast.mostrar('No se pudo guardar');
      }
    });
  }

  return (
    <ul className={`space-y-3 ${pendiente ? 'opacity-70' : ''}`} aria-busy={pendiente}>
      {celdas.map(({ tema, filas }) => {
        const nActivas = filas.filter((f) => activas[f.id]).length;
        const on = nActivas > 0;
        const mixto = nActivas > 0 && nActivas < filas.length;
        const portales = filas.length ? [...new Set(filas.map((f) => f.plataforma))].join(' · ') : 'Se creará al activarla';
        const dias = filas.length ? [...new Set(filas.map((f) => resumenDias(f.dias_semana)))].join(' / ') : '';
        const avisos = filas.filter((f) => sinResultados({ ...f, activa: !!activas[f.id] })).length;
        return (
          <li key={tema.clave} className={`tile space-y-2 ${on ? '' : 'opacity-70'}`}>
            <div className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-semibold">{tema.nombre}</p>
                <p className="text-sm text-muted">{portales}</p>
                <p className="text-sm text-muted">
                  {dias}
                  {mixto && ` · ${nActivas} de ${filas.length} activas`}
                  {!on && filas.length > 0 && ' · Archivada'}
                </p>
                {avisos > 0 && (
                  <p className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-ambar">
                    <TriangleAlert size={14} aria-hidden /> {avisos === 1 ? 'Una búsqueda' : `${avisos} búsquedas`} sin resultados en 30 días
                  </p>
                )}
              </div>
              <input
                type="checkbox" role="switch" className="size-6 shrink-0 accent-[var(--accent)]" checked={on}
                aria-label={`${tema.nombre} en ${sitio}${mixto ? `, ${nActivas} de ${filas.length} activas` : ''}`}
                onChange={(e) => alternarTema(tema.clave, filas, e.target.checked)}
              />
            </div>

            {filas.length > 0 && (
              <details className="group">
                <summary className="flex min-h-11 cursor-pointer list-none items-center gap-1 text-sm font-medium text-accent [&::-webkit-details-marker]:hidden">
                  Ver búsquedas ({filas.length}) <ChevronDown size={16} aria-hidden className="transition-transform group-open:rotate-180" />
                </summary>
                <ul className="divide-y divide-border">
                  {filas.map((f) => {
                    const act = !!activas[f.id];
                    const vacia = sinResultados({ ...f, activa: act });
                    return (
                      <li key={f.id} className="flex items-center gap-3 py-2">
                        <div className="min-w-0 flex-1">
                          <p className={`text-sm font-medium ${act ? '' : 'text-muted'}`}>{f.plataforma}{!act && ' · Archivada'}</p>
                          <p className="text-sm text-muted">
                            {resumenDias(f.dias_semana)}
                            {f.ejecuciones_30d != null && f.ejecuciones_30d > 0
                              ? ` · 30 días: ${f.resultados_30d ?? 0} resultados, ${f.aceptadas_30d ?? 0} aceptadas`
                              : ' · Aún sin ejecutar'}
                          </p>
                          {vacia && <p className="text-sm font-medium text-ambar">No está dando resultados</p>}
                        </div>
                        <input
                          type="checkbox" role="switch" className="size-6 shrink-0 accent-[var(--accent)]" checked={act}
                          aria-label={`${f.plataforma} · ${tema.nombre} en ${sitio}`}
                          onChange={(e) => alternarBusqueda(f.id, e.target.checked)}
                        />
                      </li>
                    );
                  })}
                </ul>
              </details>
            )}
          </li>
        );
      })}
    </ul>
  );
}
