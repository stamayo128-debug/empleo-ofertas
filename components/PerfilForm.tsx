'use client';

import { useState, useTransition } from 'react';
import { ChevronDown } from 'lucide-react';
import { guardarPerfil } from '@/lib/actions';
import { juntarPerfil, MAX_PERFIL, SECCIONES_PERFIL, type ClaveSeccion, type Secciones } from '@/lib/perfil';
import { useToast } from './Toast';

/** Tu perfil, una tarjeta por apartado. Se abre la que quieras y se guarda todo con un botón. */
export default function PerfilForm({ inicial }: { inicial: Secciones }) {
  const toast = useToast();
  const [pendiente, iniciar] = useTransition();
  const [s, setS] = useState<Secciones>(inicial);
  const [error, setError] = useState<string | null>(null);
  const total = juntarPerfil(s).length;
  const pasado = total > MAX_PERFIL;
  const cambio = (clave: ClaveSeccion, v: string) => { setS((a) => ({ ...a, [clave]: v })); setError(null); };

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (pasado) return;
        setError(null);
        iniciar(async () => {
          let r: Awaited<ReturnType<typeof guardarPerfil>>;
          try {
            r = await guardarPerfil(s);
          } catch {
            r = { ok: false, error: 'No se pudo guardar' };
          }
          if (r.ok) toast.mostrar('Perfil guardado'); else { setError(r.error); toast.mostrar(r.error); }
        });
      }}
    >
      {SECCIONES_PERFIL.map((sec) => (
        <details key={sec.clave} className="card group" open={inicial[sec.clave].trim() === ''}>
          <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 px-5 py-3 [&::-webkit-details-marker]:hidden">
            <span className="min-w-0 flex-1">
              <span className="block text-[17px] font-semibold">{sec.nombre}</span>
              <span className="block truncate text-sm text-muted">{s[sec.clave].trim() === '' ? 'Aún sin rellenar' : s[sec.clave].trim().replace(/\s+/g, ' ')}</span>
            </span>
            <ChevronDown size={20} aria-hidden className="shrink-0 text-muted transition-transform group-open:rotate-180" />
          </summary>
          <div className="space-y-2 px-5 pb-5">
            <label htmlFor={`perfil-${sec.clave}`} className="label">{sec.ayuda}</label>
            <textarea
              id={`perfil-${sec.clave}`} className="input min-h-36 leading-relaxed" rows={7}
              value={s[sec.clave]} onChange={(e) => cambio(sec.clave, e.target.value)}
            />
          </div>
        </details>
      ))}

      <p className={`meta num ${pasado ? '!text-rojo' : ''}`} aria-live="polite">
        {total} de {MAX_PERFIL} caracteres{pasado ? ': te pasas, recorta algo para poder guardar.' : '.'}
      </p>
      {error && <p role="alert" className="rounded-tile border border-rojo px-3 py-2 text-sm text-rojo">{error}</p>}
      <button type="submit" className="btn btn-primary w-full" disabled={pendiente || pasado}>{pendiente ? 'Guardando…' : 'Guardar perfil'}</button>
    </form>
  );
}
