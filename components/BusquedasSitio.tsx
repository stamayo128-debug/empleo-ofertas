'use client';

import { useState, useTransition } from 'react';
import { cambiarBusquedas } from '@/lib/actions';
import { resumenDias } from '@/lib/busquedas';
import type { BusquedaCatalogo, TemaBusqueda } from '@/lib/types';
import { useToast } from './Toast';

type Celda = { tema: TemaBusqueda; filas: BusquedaCatalogo[] };

/** Los temas de búsqueda de un sitio, cada uno con su interruptor. Cada cambio se guarda al momento. */
export default function BusquedasSitio({ sitio, celdas }: { sitio: string; celdas: Celda[] }) {
  const toast = useToast();
  const [pendiente, iniciar] = useTransition();
  const [activas, setActivas] = useState<Record<string, boolean>>(() => Object.fromEntries(celdas.map((c) => [c.tema.clave, c.filas.some((f) => f.activa)])));

  function alternar(tema: string, valor: boolean) {
    const antes = activas[tema];
    setActivas((a) => ({ ...a, [tema]: valor }));
    iniciar(async () => {
      try {
        const r = await cambiarBusquedas(sitio, tema, valor);
        if (!r.ok) { setActivas((a) => ({ ...a, [tema]: antes })); toast.mostrar(r.error); }
        else toast.mostrar(valor ? 'Búsqueda activada' : 'Búsqueda desactivada');
      } catch {
        setActivas((a) => ({ ...a, [tema]: antes }));
        toast.mostrar('No se pudo guardar');
      }
    });
  }

  return (
    <ul className={`space-y-3 ${pendiente ? 'opacity-70' : ''}`} aria-busy={pendiente}>
      {celdas.map(({ tema, filas }) => {
        const on = activas[tema.clave];
        const portales = [...new Set(filas.map((f) => f.plataforma))].join(' · ');
        const dias = [...new Set(filas.map((f) => resumenDias(f.dias_semana)))].join(' / ');
        return (
          <li key={tema.clave} className={`tile flex items-center gap-3 ${on ? '' : 'opacity-60'}`}>
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-semibold">{tema.nombre}</p>
              <p className="text-sm text-muted">{portales}</p>
              <p className="text-sm text-muted">{dias}</p>
            </div>
            <input
              type="checkbox" role="switch" className="size-6 shrink-0 accent-[var(--accent)]" checked={on}
              aria-label={`${tema.nombre} en ${sitio}`}
              onChange={(e) => alternar(tema.clave, e.target.checked)}
            />
          </li>
        );
      })}
    </ul>
  );
}
