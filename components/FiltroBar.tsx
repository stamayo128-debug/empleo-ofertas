'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, Search, SlidersHorizontal } from 'lucide-react';
import { ENCAJES, ESTADOS, EXPERIENCIA_FILTRO, MODALIDAD_FILTRO, ORDENES, SALARIO_FILTRO, ZONAS_FILTRO } from '@/lib/constantes';
import { hrefOfertas, type Filtros } from '@/lib/filtros';
import FiltrosSheet from './FiltrosSheet';

type Valores = Pick<Filtros, 'plat' | 'estado' | 'encaje' | 'zona' | 'mod' | 'sal' | 'exp' | 'orden'>;

function Campos({
  v, plataformas, onCambio, idp, plegable,
}: { v: Valores; plataformas: string[]; onCambio: (p: Partial<Valores>) => void; idp: string; plegable: boolean }) {
  const etiqueta = plegable ? 'sr-only' : 'label';
  const plat = (
    <ul className="space-y-1">
      {plataformas.length === 0 && <li className="meta">Sin plataformas</li>}
      {plataformas.map((p) => (
        <li key={p}>
          <label className="flex min-h-11 items-center gap-3 whitespace-nowrap">
            <input
              type="checkbox" className="size-5 accent-[var(--accent)]" checked={v.plat.includes(p)}
              onChange={(e) => onCambio({ plat: e.target.checked ? [...v.plat, p] : v.plat.filter((x) => x !== p) })}
            />
            {p}
          </label>
        </li>
      ))}
    </ul>
  );
  const zona = (
    <div key="zona">
      <label htmlFor={`${idp}-zona`} className={etiqueta}>Zona</label>
      <select id={`${idp}-zona`} className="input w-auto" value={v.zona} onChange={(e) => onCambio({ zona: e.target.value })}>
        <option value="">Zona: todas</option>
        {ZONAS_FILTRO.map((z) => <option key={z.valor} value={z.valor}>{z.etiqueta}</option>)}
      </select>
    </div>
  );
  const modalidad = (
    <div key="mod">
      <label htmlFor={`${idp}-mod`} className={etiqueta}>Modalidad</label>
      <select id={`${idp}-mod`} className="input w-auto" value={v.mod} onChange={(e) => onCambio({ mod: e.target.value })}>
        <option value="">Modalidad: todas</option>
        {MODALIDAD_FILTRO.map((m) => <option key={m.valor} value={m.valor}>{m.etiqueta}</option>)}
      </select>
    </div>
  );
  const experiencia = (
    <div key="exp">
      <label htmlFor={`${idp}-exp`} className={etiqueta}>Experiencia</label>
      <select id={`${idp}-exp`} className="input w-auto" value={v.exp} onChange={(e) => onCambio({ exp: e.target.value })}>
        <option value="">Experiencia: cualquiera</option>
        {EXPERIENCIA_FILTRO.map((m) => <option key={m.valor} value={m.valor}>{m.etiqueta}</option>)}
      </select>
    </div>
  );
  const salario = (
    <div key="sal">
      <label htmlFor={`${idp}-sal`} className={etiqueta}>Salario</label>
      <select id={`${idp}-sal`} className="input w-auto" value={v.sal} onChange={(e) => onCambio({ sal: e.target.value })}>
        <option value="">Salario: indiferente</option>
        {SALARIO_FILTRO.map((m) => <option key={m.valor} value={m.valor}>{m.etiqueta}</option>)}
      </select>
    </div>
  );
  const estado = (
    <div key="estado">
      <label htmlFor={`${idp}-estado`} className="label">Estado</label>
      <select id={`${idp}-estado`} className="input w-auto" value={v.estado} onChange={(e) => onCambio({ estado: e.target.value })}>
        <option value="">Estado: todos</option>
        {ESTADOS.map((e) => <option key={e} value={e}>{e}</option>)}
      </select>
    </div>
  );
  const encaje = (
    <div key="encaje">
      <label htmlFor={`${idp}-encaje`} className="label">Encaje</label>
      <select id={`${idp}-encaje`} className="input w-auto" value={v.encaje} onChange={(e) => onCambio({ encaje: e.target.value })}>
        <option value="">Encaje: todos</option>
        {ENCAJES.map((e) => <option key={e} value={e}>{e}</option>)}
      </select>
    </div>
  );
  const orden = (
    <div key="orden">
      <label htmlFor={`${idp}-orden`} className={etiqueta}>Orden</label>
      <select id={`${idp}-orden`} className="input w-auto" value={v.orden} onChange={(e) => onCambio({ orden: e.target.value as Valores['orden'] })}>
        {ORDENES.map((o) => <option key={o.id} value={o.id}>Ordenar: {o.etiqueta}</option>)}
      </select>
    </div>
  );

  if (!plegable) {
    // Hoja de filtros (móvil): todo en este orden.
    return (
      <>
        {zona}{modalidad}{experiencia}{salario}
        <fieldset>
          <legend className="label">Plataforma</legend>
          {plat}
        </fieldset>
        {estado}{encaje}{orden}
      </>
    );
  }
  const extra = v.plat.length + (v.estado ? 1 : 0) + (v.encaje ? 1 : 0);
  return (
    <>
      {zona}{modalidad}{experiencia}{salario}
      <details className="relative">
        <summary className="btn cursor-pointer list-none">
          Más filtros{extra ? ` (${extra})` : ''} <ChevronDown size={16} aria-hidden />
        </summary>
        <div className="card absolute left-0 top-12 z-30 max-h-96 min-w-64 space-y-3 overflow-auto p-3">
          <fieldset>
            <legend className="label">Plataforma</legend>
            {plat}
          </fieldset>
          {estado}
          {encaje}
        </div>
      </details>
      {orden}
    </>
  );
}

export default function FiltroBar({ filtros, plataformas }: { filtros: Filtros; plataformas: string[] }) {
  const router = useRouter();
  const [q, setQ] = useState(filtros.q);
  const [abierto, setAbierto] = useState(false);
  const [borrador, setBorrador] = useState<Valores>(filtros);
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { setQ(filtros.q); }, [filtros.q]);
  useEffect(() => () => { if (temporizador.current) clearTimeout(temporizador.current); }, []);

  function ir(parcial: Partial<Filtros>) {
    router.replace(hrefOfertas({ ...filtros, ...parcial }), { scroll: false });
  }
  function buscar(texto: string) {
    setQ(texto);
    if (temporizador.current) clearTimeout(temporizador.current);
    temporizador.current = setTimeout(() => ir({ q: texto.trim() }), 400);
  }
  const activosMovil = filtros.plat.length + (filtros.estado ? 1 : 0) + (filtros.encaje ? 1 : 0) + (filtros.zona ? 1 : 0) +
    (filtros.mod ? 1 : 0) + (filtros.sal ? 1 : 0) + (filtros.exp ? 1 : 0);

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <label htmlFor="busqueda" className="sr-only">Buscar por puesto, empresa o lugar</label>
          <Search size={18} aria-hidden className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            id="busqueda" type="search" value={q} maxLength={80} placeholder="Buscar puesto, empresa o lugar"
            className="input pl-10" onChange={(e) => buscar(e.target.value)}
          />
        </div>
        <button
          type="button" className="btn md:hidden"
          onClick={() => { setBorrador(filtros); setAbierto(true); }}
        >
          <SlidersHorizontal size={18} aria-hidden /> Filtros{activosMovil ? ` (${activosMovil})` : ''}
        </button>
      </div>

      <div className="hidden flex-wrap items-center gap-2 md:flex">
        <Campos v={filtros} plataformas={plataformas} onCambio={(p) => ir(p)} idp="d" plegable />
      </div>

      <FiltrosSheet
        abierto={abierto}
        onCerrar={() => setAbierto(false)}
        onAplicar={() => { setAbierto(false); ir(borrador); }}
        onLimpiar={() => { setAbierto(false); ir({ plat: [], estado: '', encaje: '', zona: '', mod: '', sal: '', exp: '', orden: 'relevancia', q: '' }); }}
      >
        <Campos v={borrador} plataformas={plataformas} onCambio={(p) => setBorrador({ ...borrador, ...p })} idp="m" plegable={false} />
      </FiltrosSheet>
    </div>
  );
}
