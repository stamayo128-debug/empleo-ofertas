import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import EmptyState from '@/components/EmptyState';
import PerfilForm from '@/components/PerfilForm';
import { separarPerfil } from '@/lib/perfil';
import { obtenerCriterios } from '@/lib/queries';
import { requireSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

export default async function PerfilPage() {
  await requireSession();
  const criterios = await obtenerCriterios();

  return (
    <div className="max-w-[560px] space-y-5">
      <Link href="/ajustes" className="inline-flex min-h-11 items-center gap-2 text-[15px] font-medium text-accent">
        <ArrowLeft size={18} aria-hidden /> Ajustes
      </Link>
      <header>
        <h1 className="text-2xl font-semibold">Mi perfil</h1>
        <p className="meta">Es lo que lee el agente cada día para saber quién eres y decidir si una oferta te encaja. Es un resumen: escribe qué haces y qué buscas, no una lista de palabras.</p>
      </header>
      {criterios ? (
        <PerfilForm inicial={separarPerfil(criterios.perfil_candidato)} />
      ) : (
        <EmptyState>No hay criterios de búsqueda activos.</EmptyState>
      )}
    </div>
  );
}
