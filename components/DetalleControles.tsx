'use client';

import { useOptimistic } from 'react';
import { RESPUESTAS } from '@/lib/constantes';
import { fmtDia } from '@/lib/format';
import EstadoSelect from './EstadoSelect';
import { useGuardar } from './useGuardar';

type PropsCandidatura = {
  id: number;
  estado: string;
  cvAdaptado: boolean;
  mensajeRevisado: boolean;
  tieneMensaje: boolean;
  versionCv: string;
  fechaEnvio: string | null;
  proximoSeguimiento: string | null;
};

type PropsRespuesta = { id: number; respuestaTipo: string; respuesta: string };

/** Estado, comprobaciones previas al envío, versión de CV y fecha de envío. */
export function ControlesCandidatura(p: PropsCandidatura) {
  const { guardar } = useGuardar(p.id);
  const [cv, setCv] = useOptimistic(p.cvAdaptado);
  const [rev, setRev] = useOptimistic(p.mensajeRevisado);
  const listo = cv && rev && p.tieneMensaje;

  return (
    <div className="space-y-3">
      <EstadoSelect id={p.id} estado={p.estado} fechaEnvio={p.fechaEnvio} />

      <fieldset className="space-y-1">
        <legend className="sr-only">Comprobación antes de enviar</legend>
        <label className="flex min-h-11 items-center gap-3">
          <input
            type="checkbox" className="size-5 accent-[var(--accent)]" checked={cv}
            onChange={(e) => guardar({ cv_adaptado: e.target.checked }, { optimista: () => setCv(e.target.checked) })}
          />
          CV adaptado
        </label>
        <label className="flex min-h-11 items-center gap-3">
          <input
            type="checkbox" className="size-5 accent-[var(--accent)]" checked={rev}
            onChange={(e) => guardar({ mensaje_revisado: e.target.checked }, { optimista: () => setRev(e.target.checked) })}
          />
          Mensaje revisado
        </label>
        <p className={listo ? 'font-medium text-verde' : 'meta'}>
          {listo ? 'Listo ✓' : p.tieneMensaje ? 'Aún no está listo' : 'Aún no está listo: falta el mensaje preparado'}
        </p>
      </fieldset>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="version-cv" className="label">Versión de CV</label>
          <input
            id="version-cv" className="input" defaultValue={p.versionCv} maxLength={100}
            onBlur={(e) => { if (e.target.value !== p.versionCv) guardar({ version_cv: e.target.value }); }}
          />
        </div>
        <div>
          <label htmlFor="fecha-envio" className="label">Fecha de envío</label>
          <input
            id="fecha-envio" type="date" className="input num" defaultValue={p.fechaEnvio ?? ''}
            key={p.fechaEnvio ?? 'sin-fecha'}
            onChange={(e) => guardar({ fecha_envio: e.target.value || null })}
          />
        </div>
      </div>
      {p.proximoSeguimiento && <p className="meta">Próximo seguimiento: <span className="num">{fmtDia(p.proximoSeguimiento)}</span></p>}
    </div>
  );
}

/** Tipo y texto de la respuesta de la empresa. */
export function ControlesRespuesta(p: PropsRespuesta) {
  const { guardar } = useGuardar(p.id);
  const [tipo, setTipo] = useOptimistic(p.respuestaTipo);

  return (
    <div className="space-y-3">
      <div>
        <label htmlFor="resp-tipo" className="label">Tipo</label>
        <select
          id="resp-tipo" className="input w-auto min-w-44" value={tipo}
          onChange={(e) => guardar({ respuesta_tipo: e.target.value }, { optimista: () => setTipo(e.target.value) })}
        >
          {RESPUESTAS.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="resp-texto" className="label">Texto de la respuesta</label>
        <textarea
          id="resp-texto" rows={3} maxLength={4000} className="input py-2" defaultValue={p.respuesta}
          onBlur={(e) => { if (e.target.value !== p.respuesta) guardar({ respuesta: e.target.value }); }}
        />
      </div>
    </div>
  );
}
