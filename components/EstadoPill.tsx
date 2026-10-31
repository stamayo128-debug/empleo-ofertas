import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import { diaMadrid, fmtDia, fmtHora, hoyMadrid } from '@/lib/format';
import { ultimaEjecucion } from '@/lib/queries';
import type { Ejecucion } from '@/lib/types';

/** Estado de la última búsqueda en dos líneas cortas. Al tocarla se abre Búsquedas (Historial). */
export default async function EstadoPill() {
  let ej: Ejecucion | null = null;
  try {
    ej = await ultimaEjecucion();
  } catch {
    return null; // es secundaria: la página mostrará su propio error
  }
  if (!ej) {
    return <Link href="/historial" className="min-w-0 truncate text-sm text-muted">Aún no hay búsquedas</Link>;
  }
  const esHoy = diaMadrid(ej.iniciada_en) === hoyMadrid();
  const fallos = ej.fuentes_error ?? [];
  const punto = fallos.length > 0 ? 'bg-ambar' : ej.estado === 'error' ? 'bg-rojo' : 'bg-verde';
  const cuando = esHoy ? `Hoy ${fmtHora(ej.iniciada_en)}` : `${fmtDia(ej.iniciada_en)} ${fmtHora(ej.iniciada_en)}`;
  const nuevas = ej.total_nuevas === 1 ? '1 nueva' : `${ej.total_nuevas} nuevas`;
  return (
    <Link href="/historial" className="flex min-w-0 flex-col leading-tight">
      <span className="text-xs text-muted">{esHoy ? 'Última búsqueda' : 'Última búsqueda (no es de hoy)'}</span>
      <span className="flex min-w-0 items-center gap-2 text-[15px] font-medium">
        <span aria-hidden className={`size-2 shrink-0 rounded-full ${punto}`} />
        <span className="num truncate">{cuando} · {nuevas}</span>
        {fallos.length > 0 && (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-surface-2 px-2 py-0.5 text-xs font-medium text-ambar">
            <AlertTriangle size={12} aria-hidden />
            {fallos.length === 1 ? '1 fallo' : `${fallos.length} fallos`}
          </span>
        )}
      </span>
    </Link>
  );
}
