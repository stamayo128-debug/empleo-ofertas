import { ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { CATEGORIAS, type Descartada } from '@/lib/descartadas';
import { haceDias, txt, urlSegura } from '@/lib/format';
import { nombrePortal } from '@/lib/portales';
import RecuperarBoton from './RecuperarBoton';
import RecuperarOferta from './RecuperarOferta';

/** Una descartada: de dónde viene, qué es, por qué se descartó (en claro) y cómo recuperarla. */
export default function DescartadaCard({ d, posibleError = false }: { d: Descartada; posibleError?: boolean }) {
  const url = urlSegura(d.url);
  const categoria = CATEGORIAS.find((c) => c.id === d.categoria)?.etiqueta ?? 'Otros';
  const razon = txt(d.razon);
  return (
    <article className="card space-y-3 p-4">
      <p className="meta num">
        {nombrePortal(d.portal)} · {haceDias(d.fecha)}{d.origen === 'tu' && ' · Descartada por ti'}
      </p>
      <div>
        <h3 className="text-[17px] font-semibold leading-snug">{d.puesto}</h3>
        <p className="meta">{[d.empresa, d.lugar].filter(Boolean).join(' · ')}</p>
      </div>
      <div className="space-y-1">
        <p className="inline-flex items-center gap-2 text-[15px] font-medium"><span aria-hidden className="size-2 rounded-full bg-ambar" />{categoria}</p>
        {razon && <p className="line-clamp-3 text-[15px] text-muted">{razon}</p>}
        {posibleError && <p className="text-sm font-medium text-ambar">Posible error: está en tu zona.</p>}
      </div>
      <div className="flex items-center justify-between gap-3">
        {d.origen === 'tu' ? (
          <RecuperarOferta id={d.id} />
        ) : d.recuperadaComo ? (
          <Link href={`/?sel=${d.recuperadaComo}`} className="inline-flex min-h-11 items-center text-[15px] font-medium text-accent underline-offset-2 hover:underline">↺ Recuperada: ver oferta</Link>
        ) : (
          <RecuperarBoton id={d.id} sugerida={posibleError} />
        )}
        {url && (
          <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-accent-soft px-4 text-[15px] font-semibold text-accent">
            {nombrePortal(d.portal)} <ArrowUpRight size={16} aria-hidden /><span className="sr-only"> (se abre en otra pestaña)</span>
          </a>
        )}
      </div>
    </article>
  );
}
