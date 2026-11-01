import Link from 'next/link';
import DescartadaCard from '@/components/DescartadaCard';
import EmptyState from '@/components/EmptyState';
import FiltrosDescartadas from '@/components/FiltrosDescartadas';
import { CATEGORIAS } from '@/lib/descartadas';
import type { SP } from '@/lib/filtros';
import { listarDescartadas, obtenerCriterios } from '@/lib/queries';
import { PORTALES, type PortalGrupo } from '@/lib/portales';
import { requireSession } from '@/lib/session';
import { enZonaPreferente } from '@/lib/ubicacion';

export const dynamic = 'force-dynamic';

const uno = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] ?? '' : v ?? '');
const varios = (v: string | string[] | undefined) => (Array.isArray(v) ? v : v ? [v] : []);

export default async function DescartadasPage({ searchParams }: { searchParams: Promise<SP> }) {
  await requireSession();
  const sp = await searchParams;
  const validos = new Set<string>(PORTALES.map((p) => p.valor));
  const plat = [...new Set(varios(sp.plat).filter((p) => validos.has(p)))] as PortalGrupo[];
  const cat = CATEGORIAS.some((c) => c.id === uno(sp.motivo)) ? uno(sp.motivo) : '';
  const lim = Math.min(Math.max(parseInt(uno(sp.lim), 10) || 50, 50), 500);

  const [lista, criterios] = await Promise.all([
    listarDescartadas({ plat, cat, lim }),
    obtenerCriterios().catch(() => null), // sin criterios solo se pierde el aviso de «posible error»
  ]);
  const preferentes = criterios?.municipios_madrid_preferentes ?? [];
  const filtrado = plat.length > 0 || !!cat;

  const mas = new URLSearchParams();
  plat.forEach((p) => mas.append('plat', p));
  if (cat) mas.set('motivo', cat);
  mas.set('lim', String(lim + 50));

  return (
    <div className="max-w-[760px] space-y-5">
      <header>
        <h1 className="text-2xl font-semibold">Descartadas</h1>
        <p className="meta num">{lista.total === 1 ? '1 oferta descartada' : `${lista.total} ofertas descartadas`}{filtrado && ' con estos filtros'}</p>
      </header>

      <FiltrosDescartadas filtros={{ plat, cat }} />

      {lista.filas.length === 0 ? (
        <EmptyState acciones={filtrado ? <Link href="/descartadas" className="btn">Quitar filtros</Link> : undefined}>
          {filtrado ? 'Ninguna descartada con estos filtros.' : 'Todavía no hay ofertas descartadas.'}
        </EmptyState>
      ) : (
        <>
          <ul className="space-y-4">
            {lista.filas.map((d) => (
              <li key={d.clave}>
                <DescartadaCard
                  d={d}
                  posibleError={d.origen === 'agente' && d.categoria === 'zona' && !d.recuperadaComo && enZonaPreferente(d.lugar, preferentes)}
                />
              </li>
            ))}
          </ul>
          {lista.filas.length < lista.total && (
            <Link href={`/descartadas?${mas.toString()}`} className="btn w-full">Cargar más ({lista.filas.length} de {lista.total})</Link>
          )}
        </>
      )}
    </div>
  );
}
