'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { SlidersHorizontal, X } from 'lucide-react';
import { AFINIDAD_MINIMA, DIAS, ORDENES, hrefOfertas, type Filtros } from '@/lib/filtros';
import { PORTALES, type PortalGrupo } from '@/lib/portales';
import FiltrosSheet from './FiltrosSheet';

/** Un solo botón «Filtros» (portal y fecha) y los filtros aplicados como chips con su ✕. */
export default function FiltrosOfertas({ filtros }: { filtros: Pick<Filtros, 'plat' | 'dia' | 'afmin' | 'orden'> }) {
  const router = useRouter();
  const [cargando, iniciar] = useTransition();
  const [abierto, setAbierto] = useState(false);
  const [plat, setPlat] = useState<PortalGrupo[]>(filtros.plat);
  const [dia, setDia] = useState(filtros.dia);
  const [afmin, setAfmin] = useState(filtros.afmin);
  const [orden, setOrden] = useState(filtros.orden);
  const n = filtros.plat.length + (filtros.dia ? 1 : 0) + (filtros.afmin ? 1 : 0) + (filtros.orden ? 1 : 0);

  const aplicar = (p: PortalGrupo[], d: string, a: number = afmin, o: string = orden) => iniciar(() => router.replace(hrefOfertas({ plat: p, dia: d, afmin: a, orden: o }), { scroll: false }));
  const etiquetaOrden = ORDENES.find((o) => o.valor === filtros.orden && o.valor !== '')?.etiqueta;
  const etiquetaPortal = (v: string) => PORTALES.find((p) => p.valor === v)?.etiqueta ?? v;
  const etiquetaDia = DIAS.find((d) => d.valor === filtros.dia)?.etiqueta;

  return (
    <div className={`flex items-center gap-2 transition-opacity ${cargando ? 'opacity-60' : ''}`} aria-busy={cargando}>
      <button
        type="button" className="btn shrink-0"
        onClick={() => { setPlat(filtros.plat); setDia(filtros.dia); setAfmin(filtros.afmin); setOrden(filtros.orden); setAbierto(true); }}
      >
        <SlidersHorizontal size={18} aria-hidden /> Filtros{n ? ` (${n})` : ''}
      </button>

      <div className="-mr-5 flex min-w-0 flex-1 gap-2 overflow-x-auto pr-5" role="group" aria-label="Filtros aplicados">
        {filtros.plat.map((p) => (
          <button
            key={p} type="button" onClick={() => aplicar(filtros.plat.filter((x) => x !== p), filtros.dia, filtros.afmin, filtros.orden)}
            className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full bg-accent-soft px-4 text-[15px] font-medium text-accent"
          >
            {etiquetaPortal(p)} <X size={14} aria-hidden /><span className="sr-only">(quitar filtro)</span>
          </button>
        ))}
        {etiquetaDia && (
          <button
            type="button" onClick={() => aplicar(filtros.plat, '', filtros.afmin, filtros.orden)}
            className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full bg-accent-soft px-4 text-[15px] font-medium text-accent"
          >
            {etiquetaDia} <X size={14} aria-hidden /><span className="sr-only">(quitar filtro)</span>
          </button>
        )}
        {filtros.afmin > 0 && (
          <button
            type="button" onClick={() => aplicar(filtros.plat, filtros.dia, 0, filtros.orden)}
            className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full bg-accent-soft px-4 text-[15px] font-medium text-accent"
          >
            Afinidad {filtros.afmin} % o más <X size={14} aria-hidden /><span className="sr-only">(quitar filtro)</span>
          </button>
        )}
        {etiquetaOrden && (
          <button
            type="button" onClick={() => aplicar(filtros.plat, filtros.dia, filtros.afmin, '')}
            className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full bg-accent-soft px-4 text-[15px] font-medium text-accent"
          >
            {etiquetaOrden} <X size={14} aria-hidden /><span className="sr-only">(volver al orden por fecha)</span>
          </button>
        )}
        {n > 1 && (
          <button type="button" onClick={() => aplicar([], '', 0, '')} className="min-h-11 shrink-0 px-2 text-[15px] font-medium text-muted underline underline-offset-2">
            Borrar todo
          </button>
        )}
      </div>

      <FiltrosSheet
        abierto={abierto}
        onCerrar={() => setAbierto(false)}
        onAplicar={() => { setAbierto(false); aplicar(plat, dia, afmin, orden); }}
        onLimpiar={() => { setAbierto(false); setPlat([]); setDia(''); setAfmin(0); setOrden(''); aplicar([], '', 0, ''); }}
      >
        <fieldset>
          <legend className="label">Portal</legend>
          <ul>
            {PORTALES.map((p) => (
              <li key={p.valor}>
                <label className="flex min-h-11 items-center gap-3 text-[15px]">
                  <input
                    type="checkbox" className="size-5 accent-[var(--accent)]" checked={plat.includes(p.valor)}
                    onChange={(e) => setPlat(e.target.checked ? [...plat, p.valor] : plat.filter((x) => x !== p.valor))}
                  />
                  {p.etiqueta}
                </label>
              </li>
            ))}
          </ul>
        </fieldset>
        <fieldset>
          <legend className="label">Afinidad con tu perfil</legend>
          <ul>
            {[{ valor: 0, etiqueta: 'Cualquiera' }, ...AFINIDAD_MINIMA.map((v) => ({ valor: v as number, etiqueta: `${v} % o más` }))].map((a) => (
              <li key={a.valor}>
                <label className="flex min-h-11 items-center gap-3 text-[15px]">
                  <input type="radio" name="afmin" className="size-5 accent-[var(--accent)]" checked={afmin === a.valor} onChange={() => setAfmin(a.valor)} />
                  {a.etiqueta}
                </label>
              </li>
            ))}
          </ul>
        </fieldset>
        <fieldset>
          <legend className="label">Ordenar por</legend>
          <ul>
            {ORDENES.map((o) => (
              <li key={o.valor || 'recientes'}>
                <label className="flex min-h-11 items-center gap-3 text-[15px]">
                  <input type="radio" name="orden" className="size-5 accent-[var(--accent)]" checked={orden === o.valor} onChange={() => setOrden(o.valor)} />
                  {o.etiqueta}
                </label>
              </li>
            ))}
          </ul>
        </fieldset>
        <fieldset>
          <legend className="label">Fecha</legend>
          <ul>
            {[{ valor: '', etiqueta: 'Cualquier día' }, ...DIAS].map((d) => (
              <li key={d.valor || 'todos'}>
                <label className="flex min-h-11 items-center gap-3 text-[15px]">
                  <input type="radio" name="dia" className="size-5 accent-[var(--accent)]" checked={dia === d.valor} onChange={() => setDia(d.valor)} />
                  {d.etiqueta}
                </label>
              </li>
            ))}
          </ul>
        </fieldset>
      </FiltrosSheet>
    </div>
  );
}
