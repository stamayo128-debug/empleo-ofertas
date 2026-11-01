import Link from 'next/link';
import { Briefcase, ChevronRight, MapPin, UserRound } from 'lucide-react';

type Apartado = { href: string; titulo: string; resumen: string };

const ICONOS = { '/ajustes/donde': MapPin, '/ajustes/perfil': UserRound, '/ajustes/puestos': Briefcase } as const;

/** Las tarjetas del menú de Ajustes: cada una abre su apartado. */
export default function AjustesMenu({ apartados }: { apartados: Apartado[] }) {
  return (
    <ul className="space-y-3">
      {apartados.map(({ href, titulo, resumen }) => {
        const Icono = ICONOS[href as keyof typeof ICONOS] ?? ChevronRight;
        return (
          <li key={href}>
            <Link href={href} className="card flex min-h-16 items-center gap-4 px-5 py-4">
              <span className="grid size-11 shrink-0 place-items-center rounded-full bg-accent-soft text-accent">
                <Icono size={22} aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[17px] font-semibold">{titulo}</span>
                <span className="block text-sm text-muted">{resumen}</span>
              </span>
              <ChevronRight size={20} aria-hidden className="shrink-0 text-muted" />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
