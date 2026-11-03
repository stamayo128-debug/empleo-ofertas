import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import BusquedasSitio from '@/components/BusquedasSitio';
import EmptyState from '@/components/EmptyState';
import { nombreSitio } from '@/lib/busquedas';
import { listarCatalogoBusquedas, listarUbicaciones } from '@/lib/queries';
import { requireSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

/** Lista «A, B y C». */
const unir = (l: string[]) => (l.length <= 1 ? l.join('') : `${l.slice(0, -1).join(', ')} y ${l[l.length - 1]}`);

export default async function BusquedasPage() {
  await requireSession();
  const [{ temas, filas, archivadas }, sitios] = await Promise.all([listarCatalogoBusquedas(), listarUbicaciones()]);

  // Orden: tus sitios, luego teletrabajo y varios, y cualquier otro sitio que tenga búsquedas.
  const deLaLista = sitios.filter((s) => s.activa).map((s) => s.nombre);
  const extra = [...new Set(filas.map((f) => f.sitio))].filter((s) => !deLaLista.includes(s) && s !== 'remoto' && s !== 'varios');
  const orden = [...deLaLista, ...extra, 'remoto', 'varios'];

  // Temas que de verdad se usan: tienen alguna búsqueda activa en algún sitio. Solo esos se ofrecen en un sitio sin búsquedas.
  const temasUsados = new Set(filas.filter((f) => f.activa).map((f) => f.tema));
  const portalesActivos = [...new Set(filas.filter((f) => f.activa).map((f) => f.plataforma))];

  const secciones = orden.map((sitio) => {
    const delSitio = filas.filter((f) => f.sitio === sitio);
    const fisico = sitio !== 'remoto' && sitio !== 'varios';
    const celdas = temas
      .map((tema) => ({ tema, filas: delSitio.filter((f) => f.tema === tema.clave) }))
      .filter((c) => c.filas.length > 0 || (fisico && temasUsados.has(c.tema.clave) && c.tema.clave !== 'empresas'));
    return { sitio, celdas };
  }).filter((s) => s.celdas.length > 0 || deLaLista.includes(s.sitio));

  return (
    <div className="max-w-[560px] space-y-5">
      <Link href="/ajustes" className="inline-flex min-h-11 items-center gap-2 text-[15px] font-medium text-accent">
        <ArrowLeft size={18} aria-hidden /> Ajustes
      </Link>
      <header>
        <h1 className="text-2xl font-semibold">Mis búsquedas</h1>
        <p className="meta">
          Estas son las búsquedas que el agente lanza cada día{portalesActivos.length > 0 && ` en ${unir(portalesActivos)}`}. Por cada sitio, activa o desactiva cada tema: si el sitio aún no tiene ese tema, se crea al activarlo. El interruptor de cada tema afecta a todos sus portales; al desplegarlo, puedes controlar cada portal por separado y ver lo que ha dado en los últimos 30 días.
        </p>
      </header>

      {secciones.length === 0 ? (
        <EmptyState>Todavía no hay búsquedas en el catálogo.</EmptyState>
      ) : (
        secciones.map(({ sitio, celdas }) => (
          <section key={sitio} className="card space-y-4 p-5" aria-labelledby={`b-${sitio}`}>
            <h2 id={`b-${sitio}`} className="text-[17px] font-semibold">{nombreSitio(sitio)}</h2>
            {celdas.length > 0 ? (
              // La clave cambia cuando cambian las búsquedas, para que los interruptores se pongan al día.
              <BusquedasSitio key={`${sitio}-${celdas.flatMap((c) => c.filas.map((f) => `${f.id}${f.activa ? 1 : 0}`)).join('.')}`} sitio={sitio} celdas={celdas} />
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
