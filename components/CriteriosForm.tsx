'use client';

import { useState, useTransition } from 'react';
import { guardarCriterios } from '@/lib/actions';
import type { Criterios } from '@/lib/types';
import ListaEditable from './ListaEditable';
import { useToast } from './Toast';

type ListaClave =
  | 'puestos_objetivo' | 'puestos_adyacentes' | 'puestos_excluidos' | 'palabras_senior' | 'palabras_ambiguas'
  | 'palabras_junior' | 'municipios_bizkaia' | 'municipios_madrid_preferentes' | 'zonas_cercanas' | 'idiomas_candidato';
type NumClave = 'anios_max_alto' | 'anios_max_aceptable' | 'antiguedad_max_dias' | 'max_detalle_por_ejecucion' | 'presupuesto_apify_mes_usd';
type BoolClave = 'aceptar_cercanas_hibrido' | 'aceptar_madrid_presencial' | 'aceptar_remoto_espana';

const CLAVES_LISTA: ListaClave[] = [
  'puestos_objetivo', 'puestos_adyacentes', 'puestos_excluidos', 'palabras_senior', 'palabras_ambiguas',
  'palabras_junior', 'municipios_bizkaia', 'municipios_madrid_preferentes', 'zonas_cercanas', 'idiomas_candidato',
];
// Municipios cercanos a Leganés que se ofrecen como sugerencia de un toque (Leganés ya cuenta siempre).
const CERCA_DE_LEGANES = ['Getafe', 'Alcorcón', 'Fuenlabrada', 'Móstoles', 'Parla', 'Pinto', 'Humanes de Madrid', 'Villaverde', 'Carabanchel'];
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



const limpiar = (l: string[]) => {
  const vistos = new Set<string>();
  return l.map((x) => x.trim()).filter((x) => {
    const k = x.toLowerCase();
    if (!x || vistos.has(k)) return false;
    vistos.add(k);
    return true;
  });
};

function Interruptor({ texto, ayuda, activo, onChange }: { texto: string; ayuda?: string; activo: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center justify-between gap-3 text-[15px]">
      <span>
        {texto}
        {ayuda && <span className="meta block">{ayuda}</span>}
      </span>
      <input type="checkbox" role="switch" className="size-6 shrink-0 accent-[var(--accent)]" checked={activo} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}

export default function CriteriosForm({ criterios }: { criterios: Criterios }) {
  const toast = useToast();
  const [pendiente, iniciar] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [listas, setListas] = useState<Record<ListaClave, string[]>>(
    () => Object.fromEntries(CLAVES_LISTA.map((k) => [k, [...(criterios[k] ?? [])]])) as Record<ListaClave, string[]>,
  );
  const [nums, setNums] = useState<Record<NumClave, string>>(
    () => Object.fromEntries(NUMEROS.map(({ k }) => [k, String(criterios[k] ?? '')])) as Record<NumClave, string>,
  );
  const [bools, setBools] = useState<Record<BoolClave, boolean>>(
    () => Object.fromEntries(INTERRUPTORES.map(({ k }) => [k, !!criterios[k]])) as Record<BoolClave, boolean>,
  );
  const [perfil, setPerfil] = useState(criterios.perfil_candidato ?? '');
  const [extra, setExtra] = useState(criterios.indicaciones_extra ?? '');
  const lista = (k: ListaClave) => (v: string[]) => setListas({ ...listas, [k]: v });
  const interruptor = (k: BoolClave) => (v: boolean) => setBools({ ...bools, [k]: v });

  function guardar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const n = Object.fromEntries(NUMEROS.map(({ k }) => [k, nums[k].trim() === '' ? NaN : Number(nums[k])])) as Record<NumClave, number>;
    if (Object.values(n).some((x) => !Number.isFinite(x))) { setError('Revisa los números de «Ajustes avanzados»: hay campos vacíos o no válidos.'); return; }
    if (n.anios_max_alto > n.anios_max_aceptable) { setError('Los años para encaje Alto no pueden superar los años aceptables (en «Ajustes avanzados»).'); return; }
    const datos = {
      perfil_candidato: perfil,
      indicaciones_extra: extra,
      ...Object.fromEntries(CLAVES_LISTA.map((k) => [k, limpiar(listas[k])])),
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
      <section className="card space-y-5 p-5" aria-labelledby="c-puestos">
        <div>
          <h2 id="c-puestos" className="text-[17px] font-semibold">Qué puestos busco</h2>
          <p className="meta">Cada puesto es una fila: escribe encima para cambiarlo.</p>
        </div>
        <div className="space-y-2">
          <h3 className="text-[15px] font-semibold">Los que más me interesan</h3>
          <ListaEditable nombre="Puesto que busco" items={listas.puestos_objetivo} onChange={lista('puestos_objetivo')} anadir="Añadir puesto" vacio="Aún no hay ninguno." />
        </div>
        <div className="space-y-2">
          <h3 className="text-[15px] font-semibold">También me valen</h3>
          <ListaEditable nombre="Puesto aceptable" items={listas.puestos_adyacentes} onChange={lista('puestos_adyacentes')} anadir="Añadir puesto" vacio="Aún no hay ninguno." />
        </div>
      </section>

      <section className="card space-y-5 p-5" aria-labelledby="c-donde">
        <div>
          <h2 id="c-donde" className="text-[17px] font-semibold">Dónde busco</h2>
          <p className="meta">El agente alterna Madrid y Bizkaia. Aquí defines qué cuenta como «cerca» en cada zona.</p>
        </div>

        <div className="space-y-3 rounded-tile bg-surface-2 p-4">
          <h3 className="text-[15px] font-semibold">Leganés y alrededores</h3>
          <p className="meta">Leganés cuenta siempre. Añade los municipios que te valen como «cerca». En Descartes te avisamos si algo descartado por ubicación cae aquí.</p>
          <ListaEditable nombre="Municipio cercano" items={listas.municipios_madrid_preferentes} onChange={lista('municipios_madrid_preferentes')} anadir="Añadir municipio" sugerencias={CERCA_DE_LEGANES} />
          <Interruptor texto="Aceptar Madrid presencial" activo={bools.aceptar_madrid_presencial} onChange={interruptor('aceptar_madrid_presencial')} />
        </div>

        <div className="space-y-3 rounded-tile bg-surface-2 p-4">
          <h3 className="text-[15px] font-semibold">Bilbao y Bizkaia</h3>
          <ListaEditable nombre="Municipio de Bizkaia" items={listas.municipios_bizkaia} onChange={lista('municipios_bizkaia')} anadir="Añadir municipio" vacio="Aún no hay ninguno." />
          <h4 className="pt-1 text-sm font-semibold text-muted">Zonas cercanas (Álava, Gipuzkoa…)</h4>
          <ListaEditable nombre="Zona cercana" items={listas.zonas_cercanas} onChange={lista('zonas_cercanas')} anadir="Añadir zona" />
          <Interruptor texto="Aceptar híbrido en zonas cercanas" activo={bools.aceptar_cercanas_hibrido} onChange={interruptor('aceptar_cercanas_hibrido')} />
        </div>

        <Interruptor texto="Aceptar remoto desde España" activo={bools.aceptar_remoto_espana} onChange={interruptor('aceptar_remoto_espana')} />
      </section>

      <details className="card group" aria-label="Ajustes avanzados">
        <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between px-5 text-[15px] font-semibold [&::-webkit-details-marker]:hidden">
          Ajustes avanzados
          <span className="meta font-normal">descartes automáticos, perfil, límites</span>
        </summary>
        <div className="space-y-6 border-t border-border p-5">
          <div className="space-y-4">
            <div>
              <h3 className="text-[15px] font-semibold">Lo que descarta automáticamente</h3>
              <p className="meta">Solo hace falta si el agente trae ofertas que no quieres. Una lista vacía significa que no descarta por ese motivo.</p>
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-muted">Puestos que no quiero</h4>
              <ListaEditable nombre="Puesto que no quiero" items={listas.puestos_excluidos} onChange={lista('puestos_excluidos')} anadir="Añadir" />
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-muted">Palabras del título que descartan (seniority)</h4>
              <ListaEditable nombre="Palabra que descarta" items={listas.palabras_senior} onChange={lista('palabras_senior')} anadir="Añadir" />
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-muted">Palabras dudosas (se lee el anuncio antes de decidir)</h4>
              <ListaEditable nombre="Palabra dudosa" items={listas.palabras_ambiguas} onChange={lista('palabras_ambiguas')} anadir="Añadir" />
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-muted">Palabras que indican junior</h4>
              <ListaEditable nombre="Palabra junior" items={listas.palabras_junior} onChange={lista('palabras_junior')} anadir="Añadir" />
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-[15px] font-semibold">Idiomas que tengo</h3>
            <p className="meta">Indica el nivel, por ejemplo: Inglés B2.</p>
            <ListaEditable nombre="Idioma" items={listas.idiomas_candidato} onChange={lista('idiomas_candidato')} anadir="Añadir idioma" />
          </div>

          <div className="space-y-4">
            <h3 className="text-[15px] font-semibold">Perfil e indicaciones</h3>
            <div>
              <label htmlFor="perfil" className="label">Mi perfil (lo usa el agente para valorar el encaje)</label>
              <textarea id="perfil" className="input min-h-40 py-2" maxLength={3000} value={perfil} onChange={(e) => setPerfil(e.target.value)} />
            </div>
            <div>
              <label htmlFor="extra" className="label">Indicaciones extra para el agente</label>
              <textarea id="extra" className="input min-h-28 py-2" maxLength={2000} value={extra} onChange={(e) => setExtra(e.target.value)} />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-[15px] font-semibold">Límites</h3>
            {NUMEROS.map(({ k, t, step, min, max }) => (
              <div key={k}>
                <label htmlFor={`n-${k}`} className="label">{t}</label>
                <input
                  id={`n-${k}`} type="number" inputMode="decimal" className="input num max-w-48" step={step} min={min} max={max}
                  value={nums[k]} onChange={(e) => setNums({ ...nums, [k]: e.target.value })}
                />
              </div>
            ))}
          </div>
        </div>
      </details>

      <div className="sticky bottom-[calc(6.5rem+env(safe-area-inset-bottom))] z-20 space-y-2 md:static">
        {error && <p role="alert" className="rounded-tile border border-rojo bg-surface px-3 py-2 text-sm text-rojo">{error}</p>}
        <button type="submit" className="btn btn-primary w-full md:w-auto" disabled={pendiente}>
          {pendiente ? 'Guardando…' : 'Guardar criterios'}
        </button>
      </div>
    </form>
  );
}
