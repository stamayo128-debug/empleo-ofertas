'use client';

import { useState, useTransition } from 'react';
import { MapPin, Plus, X } from 'lucide-react';
import { anadirUbicacion, cambiarRemoto, cambiarUbicacion, quitarUbicacion } from '@/lib/actions';
import type { Ubicacion } from '@/lib/types';
import { useToast } from './Toast';

const RADIOS = [10, 15, 20, 25, 30, 40, 50, 100];

/** Sitios donde se busca, con su radio. Cada cambio se guarda al momento. */
export default function UbicacionesEditor({ sitios, remoto }: { sitios: Ubicacion[]; remoto: boolean }) {
  const toast = useToast();
  const [pendiente, iniciar] = useTransition();
  const [nombre, setNombre] = useState('');
  const [radio, setRadio] = useState(25);

  function ejecutar(fn: () => Promise<{ ok: true } | { ok: false; error: string }>, ok?: string, alTerminar?: () => void) {
    iniciar(async () => {
      try {
        const r = await fn();
        if (r.ok) { if (ok) toast.mostrar(ok); alTerminar?.(); } else toast.mostrar(r.error);
      } catch {
        toast.mostrar('No se pudo guardar');
      }
    });
  }

  return (
    <div className={`space-y-4 ${pendiente ? 'opacity-70' : ''}`} aria-busy={pendiente}>
      <ul className="space-y-3">
        {sitios.map((s) => {
          const opciones = RADIOS.includes(s.radio_km) ? RADIOS : [...RADIOS, s.radio_km].sort((a, b) => a - b);
          return (
            <li key={s.id} className={`tile flex items-center gap-3 ${s.activa ? '' : 'opacity-60'}`}>
              <MapPin size={20} aria-hidden className="shrink-0 text-accent" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-semibold">{s.nombre}</p>
                <label className="flex items-center gap-2 text-sm text-muted">
                  <span>Radio</span>
                  <select
                    className="input !min-h-11 !w-auto !px-3 !py-1 text-sm" value={s.radio_km} aria-label={`Radio de ${s.nombre} en kilómetros`}
                    onChange={(e) => ejecutar(() => cambiarUbicacion(s.id, { radio_km: Number(e.target.value) }))}
                  >
                    {opciones.map((r) => <option key={r} value={r}>{r} km</option>)}
                  </select>
                </label>
              </div>
              <input
                type="checkbox" role="switch" className="size-6 shrink-0 accent-[var(--accent)]" checked={s.activa} aria-label={`${s.nombre} activo`}
                onChange={(e) => ejecutar(() => cambiarUbicacion(s.id, { activa: e.target.checked }))}
              />
              <button
                type="button" className="icon-btn size-11 text-muted" aria-label={`Quitar ${s.nombre}`}
                onClick={() => ejecutar(() => quitarUbicacion(s.id), 'Sitio quitado')}
              >
                <X size={18} aria-hidden />
              </button>
            </li>
          );
        })}
      </ul>

      <form
        className="flex flex-wrap items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          ejecutar(() => anadirUbicacion(nombre, radio), 'Sitio añadido', () => setNombre(''));
        }}
      >
        <div className="min-w-0 flex-1 basis-40">
          <label htmlFor="nuevo-sitio" className="label">Añadir un sitio</label>
          <input id="nuevo-sitio" className="input" maxLength={80} placeholder="Por ejemplo: Valencia" value={nombre} onChange={(e) => setNombre(e.target.value)} />
        </div>
        <select className="input !w-auto" value={radio} aria-label="Radio en kilómetros" onChange={(e) => setRadio(Number(e.target.value))}>
          {RADIOS.map((r) => <option key={r} value={r}>{r} km</option>)}
        </select>
        <button type="submit" className="btn btn-primary" disabled={pendiente || nombre.trim().length < 2}>
          <Plus size={18} aria-hidden /> Añadir
        </button>
      </form>

      <label className="flex min-h-11 cursor-pointer items-center justify-between gap-3 text-[15px]">
        <span>Teletrabajo (toda España)</span>
        <input
          type="checkbox" role="switch" className="size-6 shrink-0 accent-[var(--accent)]" checked={remoto}
          onChange={(e) => ejecutar(() => cambiarRemoto(e.target.checked))}
        />
      </label>
    </div>
  );
}
