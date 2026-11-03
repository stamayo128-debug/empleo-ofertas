import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import BusquedasSitio, { type PortalDelSitio } from '@/components/BusquedasSitio';
import EmptyState from '@/components/EmptyState';
import { nombreSitio } from '@/lib/busquedas';
import { listarCatalogoBusquedas, listarUbicaciones } from '@/lib/queries';
import { requireSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

/** Lista «A, B y C». */
const unir = (l: string[]) => (l.length <= 1 ? l.join('') : `${l.slice(0, -1).join(', ')} y ${l[l.length - 1]}`);

/** Orden de las tarjetas de portal dentro de un sitio; los que no estén aquí van al final. */
const ORDEN_PORTALES = ['LinkedIn', 'Indeed', 'InfoJobs', 'Tecnoempleo', 'Welcome to the Jungle', 'Google Jobs', 'Remoto', 'Otra'];

export default async function BusquedasPage() {
  await requireSession();
  const [{ temas, filas, archivadas }, sitios] = await Promise.all([listarCatalogoBusquedas(), listarUbicaciones()]);
  const nombresTema = Object.fromEntries(temas.map((t) => [t.clave, t.nombre]));

  // Orden: tus sitios, luego teletrabajo y varios, y cualquier otro sitio que tenga búsquedas.
  const deLaLista = sitios.filter((s) => s.activa).map((s) => s.nombre);
  const extra = [...new Set(filas.map((f) => f.sitio))].filter((s) => !deLaLista.includes(s) && s !== 'remoto' && s !== 'varios');
  const orden = [...deLaLista, ...extra, 'remoto', 'varios'];

  // Temas que de verdad se usan: tienen alguna búsqueda activa en algún sitio. Solo esos se ofrecen en un sitio que aún no los tiene.
  const temasUsados = new Set(filas.filter((f) => f.activa).map((f) => f.tema));
  const portalesActivos = [...new Set(filas.filter((f) => f.activa).map((f) => f.plataforma))];

  const secciones = orden.map((sitio) => {
    const delSitio = filas.filter((f) => f.sitio === sitio);
    const fisico = sitio !== 'remoto' && sitio !== 'varios';
    const nombres = [...new Set(delSitio.map((f) => f.plataforma))]
      .sort((a, b) => (ORDEN_PORTALES.indexOf(a) + 1 || 99) - (ORDEN_PORTALES.indexOf(b) + 1 || 99) || a.localeCompare(b));
    const portales: PortalDelSitio[] = nombres.map((plataforma) => ({
      plataforma,
      filas: delSitio.filter((f) => f.plataforma === plataforma).sort((a, b) => Number(b.activa) - Number(a.activa) || a.id - b.id),
    }));
    const conTema = new Set(delSitio.map((f) => f.tema));
    const disponibles = fisico ? temas.filter((t) => temasUsados.has(t.clave) && t.clave !== 'empresas' && !conTema.has(t.clave)) : [];
    return { sitio, portales, disponibles };
  }).filter((s) => s.portales.length > 0 || s.disponibles.length > 0 || deLaLista.includes(s.sitio));

  return (
    <div className="max-w-[560px] space-y-5">
      <Link href="/ajustes" className="inline-flex min-h-11 items-center gap-2 text-[15px] font-medium text-accent">
        <ArrowLeft size={18} aria-hidden /> Ajustes
      </Link>
      <header>
        <h1 className="text-2xl font-semibold">Mis búsquedas</h1>
        <p className="meta">
          Las búsquedas que el agente lanza cada día{portalesActivos.length > 0 && ` en ${unir(portalesActivos)}`}. Cada sitio tiene una tarjeta por portal con sus búsquedas: apaga un portal entero o una búsqueda concreta, y mira lo que ha dado en los últimos 30 días. Si un sitio no tiene todavía un tema, puedes añadirlo al final de su sección.
        </p>
      </header>

      {secciones.length === 0 ? (
        <EmptyState>Todavía no hay búsquedas en el catálogo.</EmptyState>
      ) : (
        secciones.map(({ sitio, portales, disponibles }) => (
          <section key={sitio} className="card space-y-4 p-5" aria-labelledby={`b-${sitio}`}>
            <h2 id={`b-${sitio}`} className="text-[17px] font-semibold">{nombreSitio(sitio)}</h2>
            {portales.length > 0 || disponibles.length > 0 ? (
              // La clave cambia cuando cambian las búsquedas, para que los interruptores se pongan al día.
              <BusquedasSitio
                key={`${sitio}-${portales.flatMap((p) => p.filas.map((f) => `${f.id}${f.activa ? 1 : 0}`)).join('.')}-${disponibles.length}`}
                sitio={sitio} portales={portales} disponibles={disponibles} nombresTema={nombresTema}
              />
            ) : (
              <p className="meta">Aún no hay búsquedas para este sitio.</p>
            )}
          </section>
        ))
      )}

      {archivadas.length > 0 && (
        <details className="card group">
          <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-5 text-[15px] font-medium [&::-webkit-details-marker]:hidden">
            <span>Búsquedas antiguas archivadas ({archivadas.length})</span>
          </summary>
          <ul className="space-y-2 px-5 pb-5">
            {archivadas.map((b) => (
              <li key={b.id} className="text-sm text-muted">
                <span className="font-medium text-fg">{b.plataforma}</span> · {b.descripcion}
              </li>
            ))}
            <li className="pt-1 text-sm text-muted">Son de solo lectura: no se lanzan y no se pueden reactivar desde aquí.</li>
          </ul>
        </details>
      )}
    </div>
  );
}
