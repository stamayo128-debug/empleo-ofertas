'use client';

import { useState, useTransition } from 'react';
import { Plus, TriangleAlert } from 'lucide-react';
import { cambiarBusqueda, cambiarBusquedas, cambiarBusquedasPortal } from '@/lib/actions';
import { resumenDias } from '@/lib/busquedas';
import type { BusquedaCatalogo, TemaBusqueda } from '@/lib/types';
import { useToast } from './Toast';

export type PortalDelSitio = { plataforma: string; filas: BusquedaCatalogo[] };

/** Una búsqueda sin resultados en varias ejecuciones seguidas merece un aviso. */
const sinResultados = (f: BusquedaCatalogo, activa: boolean) => activa && (f.ejecuciones_30d ?? 0) >= 3 && (f.resultados_30d ?? 0) === 0;

/**
 * Un sitio: una tarjeta por portal con sus búsquedas (cada una con su interruptor y lo que ha dado en 30 días),
 * y debajo los temas que este sitio aún no tiene, para añadirlos. Cada cambio se guarda al momento.
 */
export default function BusquedasSitio({
  sitio, portales, disponibles, nombresTema,
}: { sitio: string; portales: PortalDelSitio[]; disponibles: TemaBusqueda[]; nombresTema: Record<string, string> }) {
  const toast = useToast();
  const [pendiente, iniciar] = useTransition();
  const [activas, setActivas] = useState<Record<number, boolean>>(() => Object.fromEntries(portales.flatMap((p) => p.filas.map((f) => [f.id, f.activa]))));

  const fijar = (ids: number[], valor: boolean) => setActivas((a) => ({ ...a, ...Object.fromEntries(ids.map((i) => [i, valor])) }));
  const restaurar = (previo: Record<number, boolean>, ids: number[]) => setActivas((a) => ({ ...a, ...Object.fromEntries(ids.map((i) => [i, previo[i]])) }));

  function guardar(ids: number[], valor: boolean, accion: () => Promise<{ ok: true; aviso?: string } | { ok: false; error: string }>, ok: string) {
    const previo = activas;
    fijar(ids, valor);
    iniciar(async () => {
      try {
        const r = await accion();
        if (!r.ok) { restaurar(previo, ids); toast.mostrar(r.error); }
        else toast.mostrar(('aviso' in r && r.aviso) || ok);
      } catch {
        restaurar(previo, ids);
        toast.mostrar('No se pudo guardar');
      }
    });
  }

  return (
    <div className={`space-y-3 ${pendiente ? 'opacity-70' : ''}`} aria-busy={pendiente}>
      {portales.length > 0 && (
        <ul className="space-y-3">
          {portales.map(({ plataforma, filas }) => {
            const ids = filas.map((f) => f.id);
            const nActivas = filas.filter((f) => activas[f.id]).length;
            const on = nActivas > 0;
            return (
              <li key={plataforma} className={`tile space-y-2 ${on ? '' : 'opacity-70'}`}>
                <div className="flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-[15px] font-semibold">{plataforma}</h3>
                    <p className="text-sm text-muted">
                      {nActivas === filas.length ? (filas.length === 1 ? '1 búsqueda activa' : `${filas.length} búsquedas activas`) : on ? `${nActivas} de ${filas.length} activas` : 'Archivada'}
                    </p>
                  </div>
                  <input
                    type="checkbox" role="switch" className="size-6 shrink-0 accent-[var(--accent)]" checked={on}
                    aria-label={`Todas las búsquedas de ${plataforma} en ${sitio}`}
                    onChange={(e) => guardar(ids, e.target.checked, () => cambiarBusquedasPortal(sitio, plataforma, e.target.checked), e.target.checked ? 'Búsquedas activadas' : 'Búsquedas archivadas')}
                  />
                </div>
                <ul className="divide-y divide-border">
                  {filas.map((f) => {
                    const act = !!activas[f.id];
                    return (
                      <li key={f.id} className="flex items-center gap-3 py-2">
                        <div className="min-w-0 flex-1">
                          <p className={`text-sm font-medium ${act ? '' : 'text-muted'}`}>{nombresTema[f.tema] ?? f.tema}{!act && ' · Archivada'}</p>
                          <p className="text-sm text-muted">
                            {resumenDias(f.dias_semana)}
                            {f.ejecuciones_30d != null && f.ejecuciones_30d > 0
                              ? ` · 30 días: ${f.resultados_30d ?? 0} resultados, ${f.aceptadas_30d ?? 0} aceptadas`
                              : ' · Aún sin ejecutar'}
                          </p>
                          {sinResultados(f, act) && (
                            <p className="inline-flex items-center gap-1 text-sm font-medium text-ambar"><TriangleAlert size={14} aria-hidden /> No está dando resultados</p>
                          )}
                        </div>
                        <input
                          type="checkbox" role="switch" className="size-6 shrink-0 accent-[var(--accent)]" checked={act}
                          aria-label={`${nombresTema[f.tema] ?? f.tema} en ${plataforma}, ${sitio}`}
                          onChange={(e) => guardar([f.id], e.target.checked, () => cambiarBusqueda(f.id, e.target.checked), e.target.checked ? 'Búsqueda activada' : 'Búsqueda archivada')}
                        />
                      </li>
                    );
                  })}
                </ul>
              </li>
            );
          })}
        </ul>
      )}

      {disponibles.length > 0 && (
        <div className="space-y-2">
          <h3 className="flex items-center gap-1.5 text-[15px] font-semibold"><Plus size={16} aria-hidden /> Añadir búsquedas a este sitio</h3>
          <p className="meta">Estos temas aún no se buscan aquí. Al activarlos se crean las búsquedas de todos sus portales.</p>
          <ul className="space-y-2">
            {disponibles.map((t) => (
              <li key={t.clave} className="tile flex items-center gap-3 opacity-80">
                <p className="min-w-0 flex-1 text-[15px] font-medium">{t.nombre}</p>
                <input
                  type="checkbox" role="switch" className="size-6 shrink-0 accent-[var(--accent)]" checked={false}
                  aria-label={`Añadir ${t.nombre} en ${sitio}`}
                  onChange={() => guardar([], true, () => cambiarBusquedas(sitio, t.clave, true), 'Búsquedas creadas')}
                />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
