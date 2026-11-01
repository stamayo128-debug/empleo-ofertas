import Link from 'next/link';
import { ArrowUpRight, ChevronRight } from 'lucide-react';
import { MODALIDAD_ETIQUETA } from '@/lib/constantes';
import { haceDias, txt, urlSegura } from '@/lib/format';
import { grupoPortal, nombrePortal } from '@/lib/portales';
import type { OfertaLista } from '@/lib/types';
import Avatar from './Avatar';
import BotonGuardar from './BotonGuardar';

const EXPERIENCIA: Record<string, string> = {
  sin_experiencia: 'Sin experiencia', hasta_1: 'Hasta 1 año', hasta_2: 'Hasta 2 años', mas_de_2: 'Más de 2 años',
};

/**
 * Tarjeta de oferta: empresa y lugar, marcador de guardar, puesto, salario (si lo hay), dos etiquetas,
 * cuándo salió y el botón del portal, que abre la oferta original. Toda la tarjeta lleva al detalle.
 */
export default function OfertaCard({ o, href, seleccionada = false }: { o: OfertaLista; href: string; seleccionada?: boolean }) {
  const url = urlSegura(o.url_principal) ?? urlSegura(o.url);
  const lugar = o.municipio ?? o.lugar;
  const salario = o.tiene_salario ? txt(o.salario) : null;
  const etiquetas = [MODALIDAD_ETIQUETA[o.modalidad], EXPERIENCIA[o.tramo_experiencia]].filter(Boolean).slice(0, 2);
  const otros = new Set((o.fuentes ?? []).map((f) => grupoPortal(f.plataforma) === 'otros' ? f.plataforma : grupoPortal(f.plataforma)));
  const extra = Math.max(0, otros.size - 1);

  return (
    <article className={`card relative p-4 ${seleccionada ? 'ring-2 ring-accent' : ''}`}>
      <div className="flex items-start gap-3">
        <Avatar nombre={o.empresa} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-medium">{o.empresa}</p>
          {lugar && <p className="meta truncate">{lugar}</p>}
        </div>
        <span className="relative z-10"><BotonGuardar id={o.id} guardada={!!o.guardada_en} /></span>
      </div>

      <h3 className="mt-3 text-[17px] font-semibold leading-snug">
        <Link href={href} scroll={false} aria-current={seleccionada ? 'true' : undefined} className="after:absolute after:inset-0 after:rounded-card after:content-['']">
          {o.puesto}
        </Link>
      </h3>
      {salario && <p className="mt-1 text-[15px] font-medium">{salario.length > 32 ? `${salario.slice(0, 31)}…` : salario}</p>}

      {etiquetas.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {etiquetas.map((e) => <span key={e} className="chip min-h-8 bg-surface-2 shadow-none">{e}</span>)}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="meta min-w-0">
          <span className="num block">{haceDias(o.fecha_publicacion ?? o.fecha_deteccion)}</span>
          <span aria-hidden className="inline-flex items-center font-medium text-accent">Ver detalle <ChevronRight size={14} /></span>
        </p>
        {url && (
          <a
            href={url} target="_blank" rel="noopener noreferrer"
            className="relative z-10 inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full bg-accent-soft px-4 text-[15px] font-semibold text-accent"
          >
            {nombrePortal(o.plataforma_principal || o.plataforma)}
            {extra > 0 && <span className="num rounded-full bg-surface px-1.5 text-xs">+{extra}</span>}
            <ArrowUpRight size={16} aria-hidden />
            <span className="sr-only"> (abre la oferta en otra pestaña)</span>
          </a>
        )}
      </div>
    </article>
  );
}
