import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import EmptyState from '@/components/EmptyState';
import PuestosForm from '@/components/PuestosForm';
import { obtenerCriterios } from '@/lib/queries';
import { requireSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

export default async function PuestosPage() {
  await requireSession();
  const criterios = await obtenerCriterios();

  return (
    <div className="max-w-[560px] space-y-5">
      <Link href="/ajustes" className="inline-flex min-h-11 items-center gap-2 text-[15px] font-medium text-accent">
        <ArrowLeft size={18} aria-hidden /> Ajustes
      </Link>
      <header>
        <h1 className="text-2xl font-semibold">Qué puestos busco</h1>
        <p className="meta">Son ejemplos de puestos posibles, no una lista cerrada: el agente mira de qué va el trabajo, no solo cómo se llama. Cada puesto es una fila; escribe encima para cambiarlo.</p>
      </header>
      {criterios ? (
        <section className="card p-5" aria-label="Puestos">
          <PuestosForm objetivo={criterios.puestos_objetivo ?? []} adyacentes={criterios.puestos_adyacentes ?? []} />
        </section>
      ) : (
        <EmptyState>No hay criterios de búsqueda activos.</EmptyState>
      )}
    </div>
  );
}
