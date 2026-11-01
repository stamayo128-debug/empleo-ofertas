'use client';

import { useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MOTIVO_ETIQUETA } from '@/lib/constantes';

const RANGOS = [
  { id: 'hoy', etiqueta: 'Hoy' },
  { id: '7', etiqueta: '7 días' },
  { id: '30', etiqueta: '30 días' },
] as const;

type Valores = { motivo: string; plat: string; rango: string };

function href(v: Valores): string {
  const p = new URLSearchParams();
  if (v.motivo) p.set('motivo', v.motivo);
  if (v.plat) p.set('plat', v.plat);
  p.set('rango', v.rango);
  return `/descartadas?${p.toString()}`;
}

const chip = (activo: boolean) =>
  `inline-flex min-h-11 shrink-0 items-center rounded-full border px-4 text-[15px] font-medium ${
    activo ? 'border-accent bg-accent-soft text-accent' : 'border-border bg-surface text-fg'
  }`;

/** Filtros de Descartes: los atajos y los selectores se aplican al instante (sin botón "Filtrar"). */
export default function FiltrosDescartes({
  valores, plataformas, motivosConDescartes,
}: { valores: Valores; plataformas: string[]; motivosConDescartes: string[] }) {
  const router = useRouter();
  const [cargando, iniciar] = useTransition();
  const ir = (parcial: Partial<Valores>) => iniciar(() => router.replace(href({ ...valores, ...parcial }), { scroll: false }));
  const hayFiltros = !!valores.motivo || !!valores.plat || valores.rango !== '7';

  return (
    <div className={`space-y-3 transition-opacity ${cargando ? 'opacity-60' : ''}`} aria-busy={cargando}>
      <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1" role="group" aria-label="Rango de días">
        {RANGOS.map((r) => (
          <Link key={r.id} href={href({ ...valores, rango: r.id })} scroll={false} aria-current={valores.rango === r.id ? 'true' : undefined} className={chip(valores.rango === r.id)}>
            {r.etiqueta}
          </Link>
        ))}
      </div>
      <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1" role="group" aria-label="Motivo del descarte">
        <Link href={href({ ...valores, motivo: '' })} scroll={false} aria-current={!valores.motivo ? 'true' : undefined} className={chip(!valores.motivo)}>Todos los motivos</Link>
        {motivosConDescartes.map((m) => (
          <Link key={m} href={href({ ...valores, motivo: valores.motivo === m ? '' : m })} scroll={false} aria-current={valores.motivo === m ? 'true' : undefined} className={chip(valores.motivo === m)}>
            {MOTIVO_ETIQUETA[m] ?? m}
          </Link>
        ))}
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="f-plat" className="label">Plataforma</label>
          <select id="f-plat" className="input w-auto" value={valores.plat} onChange={(e) => ir({ plat: e.target.value })}>
            <option value="">Todas</option>
            {plataformas.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        {hayFiltros && <Link href="/descartadas" className="btn" scroll={false}>Limpiar filtros</Link>}
      </div>
    </div>
  );
}
