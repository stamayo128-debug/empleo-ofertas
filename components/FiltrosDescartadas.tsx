'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { SlidersHorizontal, X } from 'lucide-react';
import { CATEGORIAS } from '@/lib/descartadas';
import { PORTALES, type PortalGrupo } from '@/lib/portales';
import FiltrosSheet from './FiltrosSheet';

export function hrefDescartadas(plat: PortalGrupo[], cat: string): string {
  const p = new URLSearchParams();
  plat.forEach((x) => p.append('plat', x));
  if (cat) p.set('motivo', cat);
  const s = p.toString();
  return s ? `/descartadas?${s}` : '/descartadas';
}

/** Un solo botón «Filtros» (portal y motivo) y lo aplicado como chips con su ✕. */
export default function FiltrosDescartadas({ filtros }: { filtros: { plat: PortalGrupo[]; cat: string } }) {
  const router = useRouter();
  const [cargando, iniciar] = useTransition();
  const [abierto, setAbierto] = useState(false);
  const [plat, setPlat] = useState<PortalGrupo[]>(filtros.plat);
  const [cat, setCat] = useState(filtros.cat);
  const n = filtros.plat.length + (filtros.cat ? 1 : 0);
  const aplicar = (p: PortalGrupo[], c: string) => iniciar(() => router.replace(hrefDescartadas(p, c), { scroll: false }));
  const etiquetaPortal = (v: string) => PORTALES.find((p) => p.valor === v)?.etiqueta ?? v;
  const etiquetaCat = CATEGORIAS.find((c) => c.id === filtros.cat)?.etiqueta;
  const chip = 'inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full bg-accent-soft px-4 text-[15px] font-medium text-accent';

  return (
    <div className={`flex items-center gap-2 transition-opacity ${cargando ? 'opacity-60' : ''}`} aria-busy={cargando}>
      <button type="button" className="btn shrink-0" onClick={() => { setPlat(filtros.plat); setCat(filtros.cat); setAbierto(true); }}>
        <SlidersHorizontal size={18} aria-hidden /> Filtros{n ? ` (${n})` : ''}
      </button>
      <div className="-mr-5 flex min-w-0 flex-1 gap-2 overflow-x-auto pr-5" role="group" aria-label="Filtros aplicados">
        {filtros.plat.map((p) => (
          <button key={p} type="button" className={chip} onClick={() => aplicar(filtros.plat.filter((x) => x !== p), filtros.cat)}>
            {etiquetaPortal(p)} <X size={14} aria-hidden /><span className="sr-only">(quitar filtro)</span>
          </button>
        ))}
        {etiquetaCat && (
          <button type="button" className={chip} onClick={() => aplicar(filtros.plat, '')}>
            {etiquetaCat} <X size={14} aria-hidden /><span className="sr-only">(quitar filtro)</span>
          </button>
        )}
        {n > 1 && (
          <button type="button" onClick={() => aplicar([], '')} className="min-h-11 shrink-0 px-2 text-[15px] font-medium text-muted underline underline-offset-2">Borrar todo</button>
        )}
      </div>

      <FiltrosSheet
        abierto={abierto}
        onCerrar={() => setAbierto(false)}
        onAplicar={() => { setAbierto(false); aplicar(plat, cat); }}
        onLimpiar={() => { setAbierto(false); setPlat([]); setCat(''); aplicar([], ''); }}
      >
        <fieldset>
          <legend className="label">Portal</legend>
          <ul>
            {PORTALES.map((p) => (
              <li key={p.valor}>
                <label className="flex min-h-11 items-center gap-3 text-[15px]">
                  <input type="checkbox" className="size-5 accent-[var(--accent)]" checked={plat.includes(p.valor)}
                    onChange={(e) => setPlat(e.target.checked ? [...plat, p.valor] : plat.filter((x) => x !== p.valor))} />
                  {p.etiqueta}
                </label>
              </li>
            ))}
          </ul>
        </fieldset>
        <fieldset>
          <legend className="label">Motivo</legend>
          <ul>
            {[{ id: '', etiqueta: 'Todos los motivos' }, ...CATEGORIAS].map((c) => (
              <li key={c.id || 'todos'}>
                <label className="flex min-h-11 items-center gap-3 text-[15px]">
                  <input type="radio" name="motivo" className="size-5 accent-[var(--accent)]" checked={cat === c.id} onChange={() => setCat(c.id)} />
                  {c.etiqueta}
                </label>
              </li>
            ))}
          </ul>
        </fieldset>
      </FiltrosSheet>
    </div>
  );
}
