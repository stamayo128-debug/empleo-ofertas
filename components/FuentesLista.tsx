import { ExternalLink } from 'lucide-react';
import { TIPO_FUENTE_ETIQUETA } from '@/lib/constantes';
import { fmtCorta, urlSegura } from '@/lib/format';
import type { Fuente } from '@/lib/types';

function Fila({ f, principal }: { f: Fuente; principal: boolean }) {
  const url = urlSegura(f.url);
  return (
    <li className="flex min-h-11 flex-wrap items-center justify-between gap-x-3 gap-y-1">
      <div className="min-w-0">
        <p className="text-[15px] font-medium">
          {f.plataforma}
          {principal && <span className="ml-2 badge border-accent text-accent">Principal</span>}
        </p>
        <p className="meta">
          {TIPO_FUENTE_ETIQUETA[f.tipo] ?? TIPO_FUENTE_ETIQUETA.otra}
          {fmtCorta(f.primera_vez) && <> · vista por primera vez el <span className="num">{fmtCorta(f.primera_vez)}</span></>}
        </p>
      </div>
      {url && (
        <a href={url} target="_blank" rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center gap-1 px-1 text-[15px] font-medium text-accent underline-offset-2 hover:underline">
          Abrir <ExternalLink size={16} aria-hidden />
          <span className="sr-only">en {f.plataforma} (se abre en otra pestaña)</span>
        </a>
      )}
    </li>
  );
}

/** Otras webs donde se publica la misma oferta. Los agregadores van agrupados al final. */
export default function FuentesLista({ fuentes, urlPrincipal }: { fuentes: Fuente[]; urlPrincipal: string | null }) {
  const directas = fuentes.filter((f) => f.tipo !== 'agregador');
  const agregadores = fuentes.filter((f) => f.tipo === 'agregador');
  return (
    <div className="space-y-2">
      <ul className="divide-y divide-border">
        {directas.map((f) => <Fila key={f.url} f={f} principal={f.url === urlPrincipal} />)}
      </ul>
      {agregadores.length > 0 && (
        <details>
          <summary className="min-h-11 cursor-pointer py-2 text-[15px] text-muted">
            {directas.length > 0 ? 'y en ' : 'En '}{agregadores.length} {agregadores.length === 1 ? 'agregador' : 'agregadores'}
          </summary>
          <ul className="divide-y divide-border">
            {agregadores.map((f) => <Fila key={f.url} f={f} principal={f.url === urlPrincipal} />)}
          </ul>
        </details>
      )}
    </div>
  );
}
