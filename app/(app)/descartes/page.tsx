import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import EmptyState from '@/components/EmptyState';
import RecuperarBoton from '@/components/RecuperarBoton';
import { MOTIVO_ETIQUETA, MOTIVO_USUARIO_ETIQUETA } from '@/lib/constantes';
import type { SP } from '@/lib/filtros';
import { fmtDia, fmtHora, urlSegura } from '@/lib/format';
import { descartadasPorTi, listarDescartes, plataformasDescartes, resumenMotivos30d, type FiltroDescartes } from '@/lib/queries';
import { requireSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

const uno = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] ?? '' : v ?? '');
const RANGOS = [
  { id: 'hoy', etiqueta: 'Hoy' },
  { id: '7', etiqueta: '7 días' },
  { id: '30', etiqueta: '30 días' },
] as const;

export default async function DescartesPage({ searchParams }: { searchParams: Promise<SP> }) {
  await requireSession();
  const sp = await searchParams;
  const motivo = uno(sp.motivo) in MOTIVO_ETIQUETA ? uno(sp.motivo) : '';
  const rango = (RANGOS.find((r) => r.id === uno(sp.rango))?.id ?? '7') as FiltroDescartes['rango'];
  const plat = uno(sp.plat).slice(0, 60);
  const lim = Math.min(Math.max(parseInt(uno(sp.lim), 10) || 100, 100), 1000);
  const f: FiltroDescartes = { motivo, plat, rango, lim };

  const [lista, resumen, plataformas, tuyas] = await Promise.all([
    listarDescartes(f), resumenMotivos30d(), plataformasDescartes(), descartadasPorTi(50),
  ]);

  const mas = new URLSearchParams();
  if (motivo) mas.set('motivo', motivo);
  if (plat) mas.set('plat', plat);
  mas.set('rango', rango);
  mas.set('lim', String(lim + 100));

  return (
    <div className="max-w-[900px] space-y-4">
      <h1 className="text-xl font-semibold">Descartes</h1>
      {resumen.length > 0 && (
        <p className="meta">
          <span className="font-medium text-fg">Últimos 30 días:</span>{' '}
          {resumen.map((r) => `${MOTIVO_ETIQUETA[r.motivo] ?? r.motivo} ${r.n_30d}`).join(' · ')}
        </p>
      )}

      {tuyas.filas.length > 0 && (
        <details className="card">
          <summary className="flex min-h-11 cursor-pointer items-center px-4 py-2 text-[15px] font-semibold">
            Descartadas por ti ({tuyas.total})
          </summary>
          <ul className="divide-y divide-border border-t border-border">
            {tuyas.filas.map((d) => (
              <li key={d.id} className="px-4 py-3">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                  {d.descartada_en && <span className="num text-muted">{fmtDia(d.descartada_en)} {fmtHora(d.descartada_en)}</span>}
                  <span className="badge border-border text-fg">
                    {MOTIVO_USUARIO_ETIQUETA[d.descarte_usuario_motivo ?? ''] ?? d.descarte_usuario_motivo}
                  </span>
                  <span className="text-muted">por ti</span>
                </div>
                <p className="mt-1 font-medium">{d.puesto} · {d.empresa}</p>
                {d.descarte_usuario_detalle && <p className="meta">Nota: {d.descarte_usuario_detalle}</p>}
                <Link
                  href={`/?tab=todas&descartadas=1&sel=${d.id}`}
                  className="inline-flex min-h-11 items-center text-[15px] font-medium text-accent underline-offset-2 hover:underline"
                >
                  Ver {d.codigo}
                </Link>
              </li>
            ))}
          </ul>
          {tuyas.filas.length < tuyas.total && (
            <p className="meta border-t border-border px-4 py-2">Se muestran las {tuyas.filas.length} más recientes de {tuyas.total}.</p>
          )}
        </details>
      )}

      <form method="get" className="flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="f-motivo" className="label">Motivo</label>
          <select id="f-motivo" name="motivo" defaultValue={motivo} className="input w-auto">
            <option value="">Todos</option>
            {Object.entries(MOTIVO_ETIQUETA).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="f-plat" className="label">Plataforma</label>
          <select id="f-plat" name="plat" defaultValue={plat} className="input w-auto">
            <option value="">Todas</option>
            {plataformas.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="f-rango" className="label">Rango</label>
          <select id="f-rango" name="rango" defaultValue={rango} className="input w-auto">
            {RANGOS.map((r) => <option key={r.id} value={r.id}>{r.etiqueta}</option>)}
          </select>
        </div>
        <button type="submit" className="btn btn-primary">Filtrar</button>
        <Link href="/descartes" className="btn">Limpiar</Link>
      </form>

      {lista.filas.length === 0 ? (
        <EmptyState>No hay descartes con estos filtros.</EmptyState>
      ) : (
        <>
          <p className="meta num">{lista.total === 1 ? '1 descarte' : `${lista.total} descartes`}</p>
          <ul className="space-y-2">
            {lista.filas.map((d) => {
              const url = urlSegura(d.url);
              const titulo = [d.puesto || 'Sin título', d.empresa, d.lugar].filter(Boolean).join(' · ');
              return (
                <li key={d.id} className="card p-4">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                    <span className="num text-muted">{fmtDia(d.primera_vez)} {fmtHora(d.primera_vez)}</span>
                    <span className="badge border-border text-fg">{MOTIVO_ETIQUETA[d.motivo] ?? d.motivo}</span>
                    <span className="text-muted">{d.plataforma}</span>
                    {d.veces_vista > 1 && <span className="text-muted">visto {d.veces_vista} veces</span>}
                  </div>
                  <p className="mt-1 font-medium">{titulo}</p>
                  <p className="meta">{d.detalle}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    {d.recuperada_como ? (
                      <Link href={`/?sel=${d.recuperada_como}`} className="text-[15px] font-medium text-accent underline-offset-2 hover:underline">
                        Recuperada: ver oferta
                      </Link>
                    ) : (
                      <RecuperarBoton id={d.id} />
                    )}
                    {url && (
                      <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-1 px-1 text-[15px] font-medium text-accent hover:underline">
                        Abrir <ExternalLink size={16} aria-hidden />
                        <span className="sr-only">(se abre en otra pestaña)</span>
                      </a>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
          {lista.filas.length < lista.total && (
            <Link href={`/descartes?${mas.toString()}`} className="btn w-full">
              Cargar más ({lista.filas.length} de {lista.total})
            </Link>
          )}
        </>
      )}
    </div>
  );
}
