import CriteriosForm from '@/components/CriteriosForm';
import EmptyState from '@/components/EmptyState';
import NotasAgenteLista from '@/components/NotasAgenteLista';
import { fmtFechaHora } from '@/lib/format';
import { notasAgente, obtenerCriterios } from '@/lib/queries';
import { requireSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

export default async function CriteriosPage() {
  await requireSession();
  const [criterios, notas] = await Promise.all([obtenerCriterios(), notasAgente()]);

  return (
    <div className="max-w-[760px] space-y-5">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold">Criterios de búsqueda</h1>
        <p className="text-[15px]">
          La búsqueda diaria de las 8:00 lee estos criterios. Los cambios se aplican desde la próxima ejecución.
        </p>
        {criterios?.updated_at && (
          <p className="meta num">Última modificación: {fmtFechaHora(criterios.updated_at)}</p>
        )}
      </header>

      {criterios ? (
        <CriteriosForm criterios={criterios} />
      ) : (
        <EmptyState>No hay criterios de búsqueda activos.</EmptyState>
      )}

      <NotasAgenteLista notas={notas} />
    </div>
  );
}
