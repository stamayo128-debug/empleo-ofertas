import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import UbicacionesEditor from '@/components/UbicacionesEditor';
import { listarUbicaciones, obtenerCriterios } from '@/lib/queries';
import { requireSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

export default async function DondePage() {
  await requireSession();
  const [sitios, criterios] = await Promise.all([listarUbicaciones(), obtenerCriterios().catch(() => null)]);

  return (
    <div className="max-w-[560px] space-y-5">
      <Link href="/ajustes" className="inline-flex min-h-11 items-center gap-2 text-[15px] font-medium text-accent">
        <ArrowLeft size={18} aria-hidden /> Ajustes
      </Link>
      <header>
        <h1 className="text-2xl font-semibold">Dónde busco</h1>
        <p className="meta">El agente usa estos sitios para decidir qué ofertas valen: dentro del radio entran, un poco fuera quedan como duda y lejos se descartan. Las búsquedas que lanza todavía apuntan a Bizkaia y Madrid, así que si añades un sitio nuevo, hay que añadir también su búsqueda.</p>
      </header>
      <section className="card p-5" aria-label="Sitios donde busco">
        <UbicacionesEditor sitios={sitios} remoto={!!criterios?.aceptar_remoto_espana} />
      </section>
    </div>
  );
}
