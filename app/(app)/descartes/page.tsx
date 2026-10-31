import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import EmptyState from '@/components/EmptyState';
import FiltrosDescartes from '@/components/FiltrosDescartes';
import RecuperarBoton from '@/components/RecuperarBoton';
import { MOTIVO_ETIQUETA, MOTIVO_USUARIO_ETIQUETA } from '@/lib/constantes';
import type { SP } from '@/lib/filtros';
import { fmtDia, fmtHora, urlSegura } from '@/lib/format';
import { descartadasPorTi, listarDescartes, obtenerCriterios, plataformasDescartes, resumenMotivos30d, type FiltroDescartes } from '@/lib/queries';
import { enZonaPreferente } from '@/lib/ubicacion';
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

  const [lista, resumen, plataformas, tuyas, criterios] = await Promise.all([
    listarDescartes(f), resumenMotivos30d(), plataformasDescartes(), descartadasPorTi(50),
    obtenerCriterios().catch(() => null), // sin criterios solo se pierde el aviso de "posible falso descarte"
  ]);
  // Descartes por ubicación cuyo lugar está en tus municipios preferentes (o en la ciudad base): probables errores.
  const preferentes = criterios?.municipios_madrid_preferentes ?? [];
  const esFalso = (d: { motivo: string; lugar: string | null; recuperada_como: number | null }) =>
    d.motivo.startsWith('ubicacion') && !d.recuperada_como && enZonaPreferente(d.lugar, preferentes);
  const nFalsos = lista.filas.filter(esFalso).length;
  const motivosConDescartes = resumen.filter((r) => r.n_30d > 0).map((r) => r.motivo);

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

      <FiltrosDescartes valores={{ motivo, plat, rango }} plataformas={plataformas} motivosConDescartes={motivosConDescartes} />

      {nFalsos > 0 && (
        <p role="note" className="rounded-[10px] border border-ambar px-4 py-3 text-[15px]">
          <span className="font-medium text-ambar">{nFalsos === 1 ? '1 descarte' : `${nFalsos} descartes`} por ubicación</span>{' '}
          {nFalsos === 1 ? 'está' : 'están'} en tu zona (cerca de Leganés). Puede que el descarte sea un error: revísalos y recupéralos si encajan.
        </p>
      )}

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
                    {esFalso(d) && <span className="badge border-ambar text-ambar">Posible falso descarte: está en tu zona</span>}
                    {d.recuperada_como ? (
                      <Link href={`/?sel=${d.recuperada_como}`} className="text-[15px] font-medium text-accent underline-offset-2 hover:underline">
                        Recuperada: ver oferta
                      </Link>
                    ) : (
                      <RecuperarBoton id={d.id} sugerida={esFalso(d)} />
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
