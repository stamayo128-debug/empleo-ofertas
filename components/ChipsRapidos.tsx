import Link from 'next/link';
import { X } from 'lucide-react';
import { DIA_FILTRO, EXPERIENCIA_FILTRO, MODALIDAD_FILTRO, SALARIO_FILTRO, ZONAS_FILTRO } from '@/lib/constantes';
import { hrefOfertas, type Filtros } from '@/lib/filtros';

const chip = (activo: boolean) =>
  `inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border px-4 text-[15px] font-medium ${
    activo ? 'border-accent bg-accent-soft text-accent' : 'border-border bg-surface text-fg'
  }`;

/** Atajos de un toque (día y portal) y chips con los filtros activos, cada uno con su ✕. Sin JavaScript de cliente. */
export default function ChipsRapidos({ f, plataformas }: { f: Filtros; plataformas: string[] }) {
  const quitar = (parcial: Partial<Filtros>) => hrefOfertas({ ...f, ...parcial });

  const activos: { clave: string; texto: string; href: string }[] = [];
  const etiqueta = (lista: readonly { valor: string; etiqueta: string }[], v: string) => lista.find((x) => x.valor === v)?.etiqueta ?? v;
  if (f.dia) activos.push({ clave: 'dia', texto: `Detectadas: ${etiqueta(DIA_FILTRO, f.dia)}`, href: quitar({ dia: '' }) });
  f.plat.forEach((p) => activos.push({ clave: `plat-${p}`, texto: p, href: quitar({ plat: f.plat.filter((x) => x !== p) }) }));
  if (f.zona) activos.push({ clave: 'zona', texto: `Zona: ${etiqueta(ZONAS_FILTRO, f.zona)}`, href: quitar({ zona: '' }) });
  if (f.mod) activos.push({ clave: 'mod', texto: etiqueta(MODALIDAD_FILTRO, f.mod), href: quitar({ mod: '' }) });
  if (f.exp) activos.push({ clave: 'exp', texto: `Experiencia: ${etiqueta(EXPERIENCIA_FILTRO, f.exp)}`, href: quitar({ exp: '' }) });
  if (f.sal) activos.push({ clave: 'sal', texto: etiqueta(SALARIO_FILTRO, f.sal), href: quitar({ sal: '' }) });
  if (f.encaje) activos.push({ clave: 'encaje', texto: `Encaje ${f.encaje}`, href: quitar({ encaje: '' }) });
  if (f.estado) activos.push({ clave: 'estado', texto: f.estado, href: quitar({ estado: '' }) });
  if (f.origen) activos.push({ clave: 'origen', texto: 'Recuperadas', href: quitar({ origen: '' }) });

  return (
    <div className="space-y-2">
      <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1" role="group" aria-label="Atajos de filtro">
        <Link href={quitar({ dia: '' })} scroll={false} aria-current={!f.dia ? 'true' : undefined} className={chip(!f.dia)}>Cualquier día</Link>
        {DIA_FILTRO.map((d) => (
          <Link key={d.valor} href={quitar({ dia: f.dia === d.valor ? '' : d.valor })} scroll={false} aria-current={f.dia === d.valor ? 'true' : undefined} className={chip(f.dia === d.valor)}>
            {d.etiqueta}
          </Link>
        ))}
        <span aria-hidden className="mx-1 w-px shrink-0 self-stretch bg-border" />
        {plataformas.map((p) => {
          const on = f.plat.includes(p);
          return (
            <Link
              key={p}
              href={quitar({ plat: on ? f.plat.filter((x) => x !== p) : [...f.plat, p] })}
              scroll={false}
              aria-current={on ? 'true' : undefined}
              className={chip(on)}
            >
              {p}
            </Link>
          );
        })}
      </div>

      {activos.length > 0 && (
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filtros activos">
          {activos.map((a) => (
            <Link key={a.clave} href={a.href} scroll={false} className="inline-flex min-h-9 items-center gap-1 rounded-full bg-accent-soft px-3 text-sm font-medium text-accent">
              {a.texto}
              <X size={14} aria-hidden />
              <span className="sr-only">(quitar filtro)</span>
            </Link>
          ))}
          <Link href={hrefOfertas({ tab: f.tab, descartadas: f.descartadas })} scroll={false} className="inline-flex min-h-9 items-center px-2 text-sm font-medium text-muted underline underline-offset-2">
            Quitar todos
          </Link>
        </div>
      )}
    </div>
  );
}
