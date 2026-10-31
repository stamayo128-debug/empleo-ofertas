'use client';

import { useState, useTransition } from 'react';
import { guardarCriterios } from '@/lib/actions';
import type { Criterios } from '@/lib/types';
import { useToast } from './Toast';

type ListaClave =
  | 'puestos_objetivo' | 'puestos_adyacentes' | 'puestos_excluidos' | 'palabras_senior' | 'palabras_ambiguas'
  | 'palabras_junior' | 'municipios_bizkaia' | 'municipios_madrid_preferentes' | 'zonas_cercanas' | 'idiomas_candidato';
type NumClave = 'anios_max_alto' | 'anios_max_aceptable' | 'antiguedad_max_dias' | 'max_detalle_por_ejecucion' | 'presupuesto_apify_mes_usd';
type BoolClave = 'aceptar_cercanas_hibrido' | 'aceptar_madrid_presencial' | 'aceptar_remoto_espana';

const LISTAS: { k: ListaClave; t: string; ayuda?: string }[] = [
  { k: 'puestos_objetivo', t: 'Puestos que busco (encaje Alto)' },
  { k: 'puestos_adyacentes', t: 'Puestos aceptables (encaje Medio)' },
  { k: 'puestos_excluidos', t: 'Puestos que no quiero' },
  { k: 'palabras_senior', t: 'Palabras del título que descartan (seniority)' },
  { k: 'palabras_ambiguas', t: 'Palabras dudosas (se lee el anuncio antes de decidir)' },
  { k: 'palabras_junior', t: 'Palabras que indican junior' },
  { k: 'municipios_bizkaia', t: 'Municipios de Bizkaia' },
  { k: 'municipios_madrid_preferentes', t: 'Madrid: municipios preferentes (cerca de Leganés)' },
  { k: 'zonas_cercanas', t: 'Zonas cercanas (Álava, Gipuzkoa…)' },
  { k: 'idiomas_candidato', t: 'Idiomas que tengo (indica el nivel)', ayuda: 'Por ejemplo: Inglés B2' },
];
const NUMEROS: { k: NumClave; t: string; step: string; min: number; max: number }[] = [
  { k: 'anios_max_alto', t: 'Años máximos para encaje Alto', step: '0.5', min: 0, max: 30 },
  { k: 'anios_max_aceptable', t: 'Años máximos aceptables', step: '0.5', min: 0, max: 30 },
  { k: 'antiguedad_max_dias', t: 'Antigüedad máxima de la oferta (días)', step: '1', min: 1, max: 365 },
  { k: 'max_detalle_por_ejecucion', t: 'Máximo de ofertas leídas en detalle por día', step: '1', min: 0, max: 200 },
  { k: 'presupuesto_apify_mes_usd', t: 'Presupuesto mensual de Apify (USD)', step: '0.01', min: 0, max: 1000 },
];
const INTERRUPTORES: { k: BoolClave; t: string }[] = [
  { k: 'aceptar_cercanas_hibrido', t: 'Aceptar híbrido en zonas cercanas' },
  { k: 'aceptar_madrid_presencial', t: 'Aceptar Madrid presencial' },
  { k: 'aceptar_remoto_espana', t: 'Aceptar remoto desde España' },
];

const aTexto = (l: string[] | null) => (l ?? []).join('\n');
const aLista = (t: string) => t.split('\n').map((x) => x.trim()).filter(Boolean);

export default function CriteriosForm({ criterios }: { criterios: Criterios }) {
  const toast = useToast();
  const [pendiente, iniciar] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [listas, setListas] = useState<Record<ListaClave, string>>(
    () => Object.fromEntries(LISTAS.map(({ k }) => [k, aTexto(criterios[k])])) as Record<ListaClave, string>,
  );
  const [nums, setNums] = useState<Record<NumClave, string>>(
    () => Object.fromEntries(NUMEROS.map(({ k }) => [k, String(criterios[k] ?? '')])) as Record<NumClave, string>,
  );
  const [bools, setBools] = useState<Record<BoolClave, boolean>>(
    () => Object.fromEntries(INTERRUPTORES.map(({ k }) => [k, !!criterios[k]])) as Record<BoolClave, boolean>,
  );
  const [perfil, setPerfil] = useState(criterios.perfil_candidato ?? '');
  const [extra, setExtra] = useState(criterios.indicaciones_extra ?? '');

  function guardar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const n = Object.fromEntries(NUMEROS.map(({ k }) => [k, nums[k].trim() === '' ? NaN : Number(nums[k])])) as Record<NumClave, number>;
    if (Object.values(n).some((x) => !Number.isFinite(x))) { setError('Revisa los números: hay campos vacíos o no válidos.'); return; }
    if (n.anios_max_alto > n.anios_max_aceptable) { setError('Los años para encaje Alto no pueden superar los años aceptables.'); return; }
    const datos = {
      perfil_candidato: perfil,
      indicaciones_extra: extra,
      ...Object.fromEntries(LISTAS.map(({ k }) => [k, aLista(listas[k])])),
      ...n,
      ...bools,
    };
    iniciar(async () => {
      let r: Awaited<ReturnType<typeof guardarCriterios>>;
      try {
        r = await guardarCriterios(datos);
      } catch {
        r = { ok: false, error: 'No se pudo guardar' };
      }
      if (r.ok) toast.mostrar('Criterios guardados');
      else { setError(r.error); toast.mostrar(r.error); }
    });
  }

  return (
    <form onSubmit={guardar} className="space-y-5">
      <section className="card space-y-4 p-4" aria-labelledby="c-perfil">
        <h2 id="c-perfil" className="text-base font-semibold">Perfil e indicaciones</h2>
        <div>
          <label htmlFor="perfil" className="label">Mi perfil (lo usa el agente para valorar el encaje)</label>
          <textarea id="perfil" className="input min-h-40 py-2" maxLength={3000} value={perfil} onChange={(e) => setPerfil(e.target.value)} />
        </div>
        <div>
          <label htmlFor="extra" className="label">Indicaciones extra para el agente</label>
          <textarea id="extra" className="input min-h-28 py-2" maxLength={2000} value={extra} onChange={(e) => setExtra(e.target.value)} />
        </div>
      </section>

      <section className="card space-y-4 p-4" aria-labelledby="c-listas">
        <h2 id="c-listas" className="text-base font-semibold">Listas <span className="meta font-normal">(una entrada por línea)</span></h2>
        {LISTAS.map(({ k, t, ayuda }) => (
          <div key={k}>
            <label htmlFor={`l-${k}`} className="label">{t}</label>
            <textarea
              id={`l-${k}`} className="input min-h-28 py-2" rows={5} spellCheck={false}
              value={listas[k]} onChange={(e) => setListas({ ...listas, [k]: e.target.value })}
              aria-describedby={ayuda ? `l-${k}-ayuda` : undefined}
            />
            {ayuda && <p id={`l-${k}-ayuda`} className="meta mt-1">{ayuda}</p>}
          </div>
        ))}
      </section>

      <section className="card space-y-4 p-4" aria-labelledby="c-num">
        <h2 id="c-num" className="text-base font-semibold">Límites</h2>
        {NUMEROS.map(({ k, t, step, min, max }) => (
          <div key={k}>
            <label htmlFor={`n-${k}`} className="label">{t}</label>
            <input
              id={`n-${k}`} type="number" inputMode="decimal" className="input num max-w-48" step={step} min={min} max={max}
              value={nums[k]} onChange={(e) => setNums({ ...nums, [k]: e.target.value })}
            />
          </div>
        ))}
      </section>

      <section className="card p-4" aria-labelledby="c-sw">
        <h2 id="c-sw" className="mb-2 text-base font-semibold">Qué aceptar</h2>
        <ul>
          {INTERRUPTORES.map(({ k, t }) => (
            <li key={k}>
              <label className="flex min-h-11 cursor-pointer items-center justify-between gap-3 text-[15px]">
                <span>{t}</span>
                <input
                  type="checkbox" role="switch" className="size-6 shrink-0 accent-[var(--accent)]"
                  checked={bools[k]} onChange={(e) => setBools({ ...bools, [k]: e.target.checked })}
                />
              </label>
            </li>
          ))}
        </ul>
      </section>

      <div className="sticky bottom-[calc(6.5rem+env(safe-area-inset-bottom))] z-20 space-y-2 md:static">
        {error && <p role="alert" className="rounded-tile border border-rojo bg-surface px-3 py-2 text-sm text-rojo">{error}</p>}
        <button type="submit" className="btn btn-primary w-full md:w-auto" disabled={pendiente}>
          {pendiente ? 'Guardando…' : 'Guardar criterios'}
        </button>
      </div>
    </form>
  );
}
