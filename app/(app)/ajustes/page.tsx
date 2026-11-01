import Link from 'next/link';
import { ChevronRight, LogOut, SlidersHorizontal } from 'lucide-react';
import { cerrarSesion } from '@/app/login/actions';
import AjustesMenu from '@/components/AjustesMenu';
import ExcelBoton from '@/components/ExcelBoton';
import { listarUbicaciones, obtenerCriterios } from '@/lib/queries';
import { requireSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

/** Menú de Ajustes: cada apartado es una tarjeta que abre su propia pantalla. */
export default async function AjustesPage() {
  await requireSession();
  const [sitios, criterios] = await Promise.all([
    listarUbicaciones().catch(() => []),
    obtenerCriterios().catch(() => null),
  ]);

  const activos = sitios.filter((s) => s.activa);
  const resumenSitios = [...activos.map((s) => `${s.nombre} ${s.radio_km} km`), ...(criterios?.aceptar_remoto_espana ? ['teletrabajo'] : [])].join(' · ');
  const puestos = (criterios?.puestos_objetivo.length ?? 0) + (criterios?.puestos_adyacentes.length ?? 0);
  const resumenPerfil = criterios?.perfil_candidato?.trim() ? `${criterios.perfil_candidato.length} de 3000 caracteres` : 'Aún sin rellenar';

  const apartados = [
    { href: '/ajustes/donde', titulo: 'Dónde busco', resumen: resumenSitios || 'Sin sitios' },
    { href: '/ajustes/perfil', titulo: 'Mi perfil', resumen: resumenPerfil },
    { href: '/ajustes/puestos', titulo: 'Qué puestos busco', resumen: puestos === 1 ? '1 puesto de ejemplo' : `${puestos} puestos de ejemplo` },
  ];

  return (
    <div className="max-w-[560px] space-y-5">
      <h1 className="text-2xl font-semibold">Ajustes</h1>

      <AjustesMenu apartados={apartados} />

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
