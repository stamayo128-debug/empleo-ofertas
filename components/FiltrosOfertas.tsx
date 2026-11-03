'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { SlidersHorizontal, X } from 'lucide-react';
import { AFINIDADES, DIAS, ORDENES, hrefOfertas, type Filtros } from '@/lib/filtros';
import { PORTALES, type PortalGrupo } from '@/lib/portales';
import FiltrosSheet from './FiltrosSheet';

/** Un solo botón «Filtros» (portal y fecha) y los filtros aplicados como chips con su ✕. */
export default function FiltrosOfertas({ filtros }: { filtros: Pick<Filtros, 'plat' | 'dia' | 'af' | 'orden'> }) {
  const router = useRouter();
  const [cargando, iniciar] = useTransition();
  const [abierto, setAbierto] = useState(false);
  const [plat, setPlat] = useState<PortalGrupo[]>(filtros.plat);
  const [dia, setDia] = useState(filtros.dia);
  const [af, setAf] = useState<string[]>(filtros.af);
  const [orden, setOrden] = useState(filtros.orden);
  const n = filtros.plat.length + (filtros.dia ? 1 : 0) + filtros.af.length + (filtros.orden ? 1 : 0);

  const aplicar = (p: PortalGrupo[], d: string, a: string[] = af, o: string = orden) => iniciar(() => router.replace(hrefOfertas({ plat: p, dia: d, af: a, orden: o }), { scroll: false }));
  const etiquetaAf = (v: string) => AFINIDADES.find((a) => a.valor === v)?.etiqueta ?? v;
  const etiquetaOrden = ORDENES.find((o) => o.valor === filtros.orden && o.valor !== '')?.etiqueta;
  const etiquetaPortal = (v: string) => PORTALES.find((p) => p.valor === v)?.etiqueta ?? v;
  const etiquetaDia = DIAS.find((d) => d.valor === filtros.dia)?.etiqueta;

  return (
    <div className={`flex items-center gap-2 transition-opacity ${cargando ? 'opacity-60' : ''}`} aria-busy={cargando}>
      <button
        type="button" className="btn shrink-0"
        onClick={() => { setPlat(filtros.plat); setDia(filtros.dia); setAf(filtros.af); setOrden(filtros.orden); setAbierto(true); }}
      >
        <SlidersHorizontal size={18} aria-hidden /> Filtros{n ? ` (${n})` : ''}
      </button>

      <div className="-mr-5 flex min-w-0 flex-1 gap-2 overflow-x-auto pr-5" role="group" aria-label="Filtros aplicados">
        {filtros.plat.map((p) => (
          <button
            key={p} type="button" onClick={() => aplicar(filtros.plat.filter((x) => x !== p), filtros.dia, filtros.af, filtros.orden)}
            className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full bg-accent-soft px-4 text-[15px] font-medium text-accent"
          >
            {etiquetaPortal(p)} <X size={14} aria-hidden /><span className="sr-only">(quitar filtro)</span>
          </button>
        ))}
        {etiquetaDia && (
          <button
            type="button" onClick={() => aplicar(filtros.plat, '', filtros.af, filtros.orden)}
            className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full bg-accent-soft px-4 text-[15px] font-medium text-accent"
          >
            {etiquetaDia} <X size={14} aria-hidden /><span className="sr-only">(quitar filtro)</span>
          </button>
        )}
        {filtros.af.map((a) => (
          <button
            key={a} type="button" onClick={() => aplicar(filtros.plat, filtros.dia, filtros.af.filter((x) => x !== a), filtros.orden)}
            className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full bg-accent-soft px-4 text-[15px] font-medium text-accent"
          >
            {etiquetaAf(a)} <X size={14} aria-hidden /><span className="sr-only">(quitar filtro)</span>
          </button>
        ))}
        {etiquetaOrden && (
          <button
            type="button" onClick={() => aplicar(filtros.plat, filtros.dia, filtros.af, '')}
            className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full bg-accent-soft px-4 text-[15px] font-medium text-accent"
          >
            {etiquetaOrden} <X size={14} aria-hidden /><span className="sr-only">(volver al orden por fecha)</span>
          </button>
        )}
        {n > 1 && (
          <button type="button" onClick={() => aplicar([], '', [], '')} className="min-h-11 shrink-0 px-2 text-[15px] font-medium text-muted underline underline-offset-2">
            Borrar todo
          </button>
        )}
      </div>

      <FiltrosSheet
        abierto={abierto}
        onCerrar={() => setAbierto(false)}
        onAplicar={() => { setAbierto(false); aplicar(plat, dia, af, orden); }}
        onLimpiar={() => { setAbierto(false); setPlat([]); setDia(''); setAf([]); setOrden(''); aplicar([], '', [], ''); }}
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
            {AFINIDADES.map((a) => (
              <li key={a.valor}>
                <label className="flex min-h-11 items-center gap-3 text-[15px]">
                  <input
                    type="checkbox" className="size-5 accent-[var(--accent)]" checked={af.includes(a.valor)}
                    onChange={(e) => setAf(e.target.checked ? [...af, a.valor] : af.filter((x) => x !== a.valor))}
                  />
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
