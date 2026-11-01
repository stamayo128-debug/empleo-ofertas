import Link from 'next/link';
import { ChevronRight, LogOut, SlidersHorizontal } from 'lucide-react';
import { cerrarSesion } from '@/app/login/actions';
import EmptyState from '@/components/EmptyState';
import ExcelBoton from '@/components/ExcelBoton';
import PuestosForm from '@/components/PuestosForm';
import UbicacionesEditor from '@/components/UbicacionesEditor';
import { listarUbicaciones, obtenerCriterios } from '@/lib/queries';
import { requireSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

export default async function AjustesPage() {
  await requireSession();
  const [sitios, criterios] = await Promise.all([listarUbicaciones(), obtenerCriterios()]);

  return (
    <div className="max-w-[560px] space-y-5">
      <h1 className="text-2xl font-semibold">Ajustes</h1>

      <section className="card space-y-4 p-5" aria-labelledby="a-donde">
        <div>
          <h2 id="a-donde" className="text-[17px] font-semibold">Dónde busco</h2>
          <p className="meta">Es tu referencia de dónde se busca. De momento el agente sigue con sus consultas actuales (Madrid y Bizkaia): añadir un sitio aquí no hace que busque allí por sí solo.</p>
        </div>
        <UbicacionesEditor sitios={sitios} remoto={!!criterios?.aceptar_remoto_espana} />
      </section>

      <section className="card space-y-4 p-5" aria-labelledby="a-puestos">
        <div>
          <h2 id="a-puestos" className="text-[17px] font-semibold">Qué puestos busco</h2>
          <p className="meta">Cada puesto es una fila: escribe encima para cambiarlo.</p>
        </div>
        {criterios ? (
          <PuestosForm objetivo={criterios.puestos_objetivo ?? []} adyacentes={criterios.puestos_adyacentes ?? []} />
        ) : (
          <EmptyState>No hay criterios de búsqueda activos.</EmptyState>
        )}
      </section>

      <ul className="card divide-y divide-border overflow-hidden">
        <li><ExcelBoton fila /></li>
        <li>
          <form action={cerrarSesion}>
            <button type="submit" className="flex min-h-14 w-full items-center gap-3 px-5 text-left text-[15px] font-medium">
              <LogOut size={20} aria-hidden className="text-rojo" />
              Cerrar sesión
            </button>
          </form>
        </li>
      </ul>

      <Link href="/criterios" className="flex min-h-11 items-center justify-center gap-2 text-[15px] font-medium text-muted">
        <SlidersHorizontal size={16} aria-hidden /> Ajustes avanzados del agente <ChevronRight size={16} aria-hidden />
      </Link>
    </div>
  );
}
