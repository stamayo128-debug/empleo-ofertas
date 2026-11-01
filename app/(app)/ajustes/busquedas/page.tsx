import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import BusquedasSitio from '@/components/BusquedasSitio';
import EmptyState from '@/components/EmptyState';
import { nombreSitio } from '@/lib/busquedas';
import { listarCatalogoBusquedas, listarUbicaciones } from '@/lib/queries';
import { requireSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

export default async function BusquedasPage() {
  await requireSession();
  const [{ temas, filas }, sitios] = await Promise.all([listarCatalogoBusquedas(), listarUbicaciones()]);

  // Orden: tus sitios, luego teletrabajo y varios, y cualquier otro sitio que tenga búsquedas.
  const deLaLista = sitios.filter((s) => s.activa).map((s) => s.nombre);
  const extra = [...new Set(filas.map((f) => f.sitio))].filter((s) => !deLaLista.includes(s) && s !== 'remoto' && s !== 'varios');
  const orden = [...deLaLista, ...extra, 'remoto', 'varios'];

  const secciones = orden.map((sitio) => {
    const delSitio = filas.filter((f) => f.sitio === sitio);
    // En un sitio con presencia física se ofrecen todos los temas (los que aún no existen se crean al activarlos).
    const fisico = sitio !== 'remoto' && sitio !== 'varios';
    const celdas = temas
      .map((tema) => ({ tema, filas: delSitio.filter((f) => f.tema === tema.clave) }))
      .filter((c) => c.filas.length > 0 || (fisico && c.tema.clave !== 'empresas'));
    return { sitio, celdas };
  }).filter((s) => s.celdas.length > 0 || deLaLista.includes(s.sitio));

  return (
    <div className="max-w-[560px] space-y-5">
      <Link href="/ajustes" className="inline-flex min-h-11 items-center gap-2 text-[15px] font-medium text-accent">
        <ArrowLeft size={18} aria-hidden /> Ajustes
      </Link>
      <header>
        <h1 className="text-2xl font-semibold">Mis búsquedas</h1>
        <p className="meta">Estas son las búsquedas que el agente lanza cada día en LinkedIn, Indeed, InfoJobs, Google Jobs y webs de empresas. Por cada sitio, activa o desactiva cada tema: si el sitio aún no tiene ese tema, se crea al activarlo. Cada interruptor afecta a todos los portales de ese tema.</p>
      </header>

      {secciones.length === 0 ? (
        <EmptyState>Todavía no hay búsquedas en el catálogo.</EmptyState>
      ) : (
        secciones.map(({ sitio, celdas }) => (
          <section key={sitio} className="card space-y-4 p-5" aria-labelledby={`b-${sitio}`}>
            <h2 id={`b-${sitio}`} className="text-[17px] font-semibold">{nombreSitio(sitio)}</h2>
            {celdas.length > 0 ? (
              <BusquedasSitio sitio={sitio} celdas={celdas} />
            ) : (
              <p className="meta">Aún no hay búsquedas para este sitio. Pídeme que las prepare y aparecerán aquí.</p>
            )}
          </section>
        ))
      )}
    </div>
  );
}
