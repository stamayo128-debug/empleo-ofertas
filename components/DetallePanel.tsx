import { Children } from 'react';
import { ArrowUpRight, Briefcase, CalendarDays, MapPin } from 'lucide-react';
import { MODALIDAD_ETIQUETA, MOTIVO_USUARIO_ETIQUETA } from '@/lib/constantes';
import { fmtCorta, haceDias, herramientasYAptitudes, lista, txt, urlSegura } from '@/lib/format';
import { nombrePortal } from '@/lib/portales';
import type { Fuente, Oferta } from '@/lib/types';
import Avatar from './Avatar';
import BotonGuardar from './BotonGuardar';
import DescartarBoton from './DescartarBoton';
import DetalleShell from './DetalleShell';
import EnviadaBoton from './EnviadaBoton';
import LeerMas from './LeerMas';

/** Bloque con título; si no tiene contenido no se dibuja (nada de «No indica» repetido). */
function Bloque({ titulo, children }: { titulo: string; children?: React.ReactNode }) {
  if (Children.toArray(children).length === 0) return null;
  return (
    <section className="space-y-3">
      <h3 className="text-[17px] font-semibold">{titulo}</h3>
      {children}
    </section>
  );
}

function Lista({ items }: { items: string[] }) {
  return (
    <ul className="list-disc space-y-1.5 pl-5 text-[15px] marker:text-muted">
      {items.map((x, i) => <li key={i} className="whitespace-pre-wrap">{x}</li>)}
    </ul>
  );
}

function Fila({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-4">
      <dt className="meta shrink-0 sm:w-28">{etiqueta}</dt>
      <dd className="text-[15px]">{children}</dd>
    </div>
  );
}

export default function DetallePanel({ o, cerrarHref }: { o: Oferta; cerrarHref: string }) {
  const url = urlSegura(o.url_principal) ?? urlSegura(o.url);
  const portal = nombrePortal(o.plataforma_principal || o.plataforma);
  const modalidad = MODALIDAD_ETIQUETA[o.modalidad];
  const jornada = txt(o.jornada);
  const contrato = txt(o.tipo_contrato);
  const salario = o.tiene_salario ? txt(o.salario) : null;
  const ubicacion = o.municipio ?? o.lugar;
  const experiencia = txt(o.experiencia_requerida)
    ?? (o.experiencia_min_anios != null ? `Desde ${o.experiencia_min_anios} ${o.experiencia_min_anios === 1 ? 'año' : 'años'}` : null);
  const descripcion = txt(o.descripcion_clara);
  const oblig = lista(o.requisitos_obligatorios);
  const desea = lista(o.requisitos_deseables);
  const formacion = txt(o.formacion_requerida);
  const idiomas = lista(o.idiomas);
  const herr = herramientasYAptitudes(o.herramientas, o.aptitudes);
  const resp = lista(o.responsabilidades);
  const ofrece = lista(o.se_ofrece);
  const encaje = txt(o.por_que_encaja);
  const huecos = lista(o.huecos).slice(0, 3);
  const publicada = haceDias(o.fecha_publicacion ?? o.fecha_deteccion);

  // Portales donde está publicada: uno por portal, con su enlace. Si la vista no trae fuentes, se usa la URL propia.
  let fuentes: Fuente[] = Array.isArray(o.fuentes) ? o.fuentes : [];
  if (fuentes.length === 0 && urlSegura(o.url)) {
    fuentes = [{ plataforma: o.plataforma, tipo: 'otra', url: o.url, primera_vez: o.fecha_deteccion, ultima_vez: o.ultima_vez_vista }];
  }
  const portales: { nombre: string; url: string }[] = [];
  for (const f of fuentes) {
    const u = urlSegura(f.url);
    const nombre = nombrePortal(f.plataforma);
    if (u && !portales.some((p) => p.nombre === nombre)) portales.push({ nombre, url: u });
  }

  const tira: { k: string; v: string; Icono: typeof Briefcase }[] = [];
  if (experiencia) tira.push({ k: 'Experiencia', v: experiencia, Icono: Briefcase });
  if (ubicacion) tira.push({ k: 'Ubicación', v: ubicacion, Icono: MapPin });
  if (publicada) tira.push({ k: 'Publicada', v: publicada, Icono: CalendarDays });

  const motivoUsuario = o.descarte_usuario_motivo ? MOTIVO_USUARIO_ETIQUETA[o.descarte_usuario_motivo] ?? o.descarte_usuario_motivo : null;

  const barra = url ? (
    <a href={url} target="_blank" rel="noopener noreferrer" className="btn btn-primary w-full text-[16px]">
      Abrir en {portal} <ArrowUpRight size={18} aria-hidden />
      <span className="sr-only"> (se abre en otra pestaña)</span>
    </a>
  ) : (
    <p className="meta text-center">Esta oferta no tiene enlace para abrir.</p>
  );

  return (
    <DetalleShell
      titulo={o.puesto}
      empresa={o.empresa}
      cerrarHref={cerrarHref}
      guardar={<BotonGuardar key={`g-${o.id}`} id={o.id} guardada={!!o.guardada_en} />}
      barra={barra}
    >
      <div className="space-y-7">
        <header className="space-y-3 text-center">
          <div className="flex justify-center"><Avatar nombre={o.empresa} grande /></div>
          <h2 aria-hidden className="text-[22px] font-semibold leading-snug">{o.puesto}</h2>
          {(salario || ubicacion) && (
            <p className="text-[16px] text-muted">{[ubicacion, salario].filter(Boolean).join(' · ')}</p>
          )}
          {[modalidad, jornada, contrato].some(Boolean) && (
            <div className="flex flex-wrap items-center justify-center gap-2">
              {[modalidad, jornada, contrato].filter(Boolean).map((e) => <span key={e} className="chip min-h-8 bg-surface-2 shadow-none">{e}</span>)}
            </div>
          )}
          {o.estado !== 'Descartada' && (
            <div className="flex justify-center pt-1"><EnviadaBoton id={o.id} estado={o.estado} fechaEnvio={o.fecha_envio} /></div>
          )}
        </header>

        {o.estado === 'Descartada' && (
          <p role="note" className="rounded-tile bg-surface-2 px-4 py-3 text-[15px]">
            <span className="font-semibold">Descartada</span>{o.descarte_usuario_motivo ? ` por ti: ${motivoUsuario}` : ''}
            {o.descartada_en ? ` el ${fmtCorta(o.descartada_en)}` : ''}.
            {txt(o.descarte_usuario_detalle) && <span className="text-muted"> {o.descarte_usuario_detalle}</span>}
          </p>
        )}

        {o.calidad_datos === 'solo_basicos' && (
          <p role="note" className="rounded-tile bg-accent-soft px-4 py-3 text-sm text-muted">
            No pudimos leer el anuncio completo. Ábrelo en {portal} para ver los detalles.
          </p>
        )}

        {tira.length > 0 && (
          <dl className="tile flex divide-x divide-border !p-3 text-center">
            {tira.map(({ k, v, Icono }) => (
              <div key={k} className="min-w-0 flex-1 px-2">
                <Icono size={18} aria-hidden className="mx-auto text-muted" />
                <dd className="mt-1 break-words text-[15px] font-semibold">{v}</dd>
                <dt className="meta">{k}</dt>
              </div>
            ))}
          </dl>
        )}

        <Bloque titulo="En resumen">{descripcion && <LeerMas texto={descripcion} />}</Bloque>

        <Bloque titulo="Qué piden">
          {oblig.length > 0 && <div><h4 className="mb-1.5 text-[15px] font-semibold">Imprescindible</h4><Lista items={oblig} /></div>}
          {desea.length > 0 && <div><h4 className="mb-1.5 text-[15px] font-semibold">Se valora</h4><Lista items={desea} /></div>}
          {(formacion || idiomas.length > 0) && (
            <dl className="space-y-2">
              {formacion && <Fila etiqueta="Formación">{formacion}</Fila>}
              {idiomas.length > 0 && <Fila etiqueta="Idiomas">{idiomas.join(' · ')}</Fila>}
            </dl>
          )}
          {herr.length > 0 && (
            <div>
              <h4 className="mb-2 text-[15px] font-semibold">Herramientas</h4>
              <ul className="flex flex-wrap gap-2">{herr.map((h) => <li key={h} className="chip min-h-8 bg-surface-2 shadow-none">{h}</li>)}</ul>
            </div>
          )}
        </Bloque>

        <Bloque titulo="Qué harás">{resp.length > 0 && <Lista items={resp} />}</Bloque>
        <Bloque titulo="Qué ofrecen">{ofrece.length > 0 && <Lista items={ofrece} />}</Bloque>

        <Bloque titulo="Encaje contigo">
          {encaje && <LeerMas texto={encaje} />}
          {huecos.length > 0 && <div><h4 className="mb-1.5 text-[15px] font-semibold">Qué te falta</h4><Lista items={huecos} /></div>}
        </Bloque>

        {portales.length > 1 && (
          <Bloque titulo="Dónde está publicada">
            <div className="flex flex-wrap gap-2">
              {portales.map((p) => (
                <a key={p.nombre} href={p.url} target="_blank" rel="noopener noreferrer" className="btn">
                  {p.nombre} <ArrowUpRight size={16} aria-hidden />
                  <span className="sr-only"> (se abre en otra pestaña)</span>
                </a>
              ))}
            </div>
          </Bloque>
        )}

        {o.estado !== 'Descartada' && (
          <div className="flex justify-center border-t border-border pt-5">
            <DescartarBoton key={`d-${o.id}`} ids={[o.id]} etiqueta="Descartar esta oferta" />
          </div>
        )}
      </div>
    </DetalleShell>
  );
}
