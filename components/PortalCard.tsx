import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import { Cifra } from './EjecucionCard';

export type ResumenPortal = {
  plataforma: string;
  consultas: number;
  resultados: number;
  nuevas: number;
  descartadas: number;
  conocidas: number;
  errores: string[];
  hrefOfertas: string;
  hrefDescartes: string;
};

/** Lo que dio un portal (LinkedIn, InfoJobs…) en una búsqueda, con enlaces para ver sus ofertas y descartes. */
export default function PortalCard({ p }: { p: ResumenPortal }) {
  return (
    <section className="card p-5" aria-label={p.plataforma}>
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-[17px] font-semibold">{p.plataforma}</h3>
        <span className="meta num">{p.resultados} resultados · {p.consultas === 1 ? '1 consulta' : `${p.consultas} consultas`}</span>
      </div>
      <div className="mt-4 flex divide-x divide-border">
        <Cifra valor={p.nuevas} etiqueta="nuevas" />
        <Cifra valor={p.descartadas} etiqueta="descartadas" />
        <Cifra valor={p.conocidas} etiqueta="ya conocidas" />
      </div>
      {p.errores.length > 0 && (
        <p role="note" className="mt-3 flex items-start gap-2 rounded-tile bg-surface-2 px-3 py-2 text-sm text-ambar">
          <AlertTriangle size={16} aria-hidden className="mt-0.5 shrink-0" />
          <span className="line-clamp-3 break-words">{p.errores[0]}</span>
        </p>
      )}
      <div className="mt-4 flex flex-wrap gap-3">
        <Link href={p.hrefOfertas} className="btn btn-primary">Ver ofertas de {p.plataforma}</Link>
        <Link href={p.hrefDescartes} className="btn">Ver descartes</Link>
      </div>
    </section>
  );
}
