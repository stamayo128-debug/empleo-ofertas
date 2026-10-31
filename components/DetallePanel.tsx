import { EVENTO_ETIQUETA, MODALIDAD_ETIQUETA, MOTIVO_USUARIO_ETIQUETA, ZONA_ETIQUETA } from '@/lib/constantes';
import { fmtCorta, fmtDia, fmtFechaHora, herramientasYAptitudes, lista, publicadaTexto, txt, urlSegura } from '@/lib/format';
import type { Evento, Fuente, Oferta } from '@/lib/types';
import { EncajeBadge, EstadoBadge } from './Badge';
import AbrirOfertaLink from './AbrirOfertaLink';
import CopiarEnlace from './CopiarEnlace';
import CopiarTexto from './CopiarTexto';
import DescartarBoton from './DescartarBoton';
import { ControlesCandidatura, ControlesRespuesta } from './DetalleControles';
import DetalleShell from './DetalleShell';
import EnviadaBoton from './EnviadaBoton';
import FuentesLista from './FuentesLista';
import NotasEditor from './NotasEditor';
import PrepararCandidatura from './PrepararCandidatura';
import Seccion from './Seccion';
import VerificarAcciones from './VerificarAcciones';

function Enlace({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="break-all text-accent underline underline-offset-2">
      {children}<span className="sr-only"> (se abre en otra pestaña)</span>
    </a>
  );
}

function Lista({ titulo, items }: { titulo?: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div>
      {titulo && <h4 className="mb-1 text-[15px] font-semibold">{titulo}</h4>}
      <ul className="list-disc space-y-1 pl-5">
        {items.map((x, i) => <li key={i} className="whitespace-pre-wrap">{x}</li>)}
      </ul>
    </div>
  );
}

const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`;

export default function DetallePanel({ o, eventos, cerrarHref }: { o: Oferta; eventos: Evento[]; cerrarHref: string }) {
  const url = urlSegura(o.url_principal) ?? urlSegura(o.url);
  const cvUrl = urlSegura(o.cv_doc_url);
  const drive = urlSegura(o.carpeta_drive_url);
  const perfil = urlSegura(o.contacto_perfil);
  const paginaEmpresa = urlSegura(o.pagina_empresa);
  const alternativas = (o.urls_alternativas ?? []).map(urlSegura).filter((x): x is string => !!x);
  const modalidad = MODALIDAD_ETIQUETA[o.modalidad];
  const lugar = [o.lugar, modalidad].filter(Boolean).join(' · ');
  const mensaje = txt(o.mensaje_preparado);
  const herr = herramientasYAptitudes(o.herramientas, o.aptitudes);
  const resp = lista(o.responsabilidades);
  const oblig = lista(o.requisitos_obligatorios);
  const desea = lista(o.requisitos_deseables);
  const ofrece = lista(o.se_ofrece);
  const huecos = lista(o.huecos);
  const idiomas = lista(o.idiomas);
  const encaje = txt(o.por_que_encaja);
  const descripcion = txt(o.descripcion_clara);
  const calidad = o.calidad_datos ?? 'solo_basicos';

  // Fuentes: si la vista aún no las trae (o no hay ninguna), se usa la URL propia de la oferta.
  let fuentes: Fuente[] = Array.isArray(o.fuentes) ? o.fuentes : [];
  if (fuentes.length === 0 && urlSegura(o.url)) {
    fuentes = [{ plataforma: o.plataforma, tipo: 'otra', url: o.url, primera_vez: o.fecha_deteccion, ultima_vez: o.ultima_vez_vista }];
  }

  const vistazo: [string, string][] = [
    ['Experiencia', txt(o.experiencia_requerida)],
    ['Formación', txt(o.formacion_requerida)],
    ['Idiomas', idiomas.join(' · ') || null],
    ['Jornada', txt(o.jornada)],
    ['Contrato', txt(o.tipo_contrato)],
    ['Salario', txt(o.salario)],
    ['Nivel', txt(o.nivel)],
    ['Solicitantes', txt(o.solicitantes)],
  ].filter((x): x is [string, string] => x[1] !== null);

  const motivoUsuario = o.descarte_usuario_motivo
    ? MOTIVO_USUARIO_ETIQUETA[o.descarte_usuario_motivo] ?? o.descarte_usuario_motivo
    : null;
  const nReq = oblig.length + desea.length;

  return (
    <DetalleShell titulo={o.puesto} cerrarHref={cerrarHref}>
      <header className="-mt-2 space-y-2">
        <p className="text-[16px]">{o.empresa}</p>
        {lugar && <p className="meta">{lugar}</p>}
        <div className="flex flex-wrap items-center gap-2">
          <EncajeBadge encaje={o.encaje} />
          <EstadoBadge estado={o.estado} />
          <span className="meta num">{o.codigo}</span>
          <span className="meta">· {publicadaTexto(o.fecha_publicacion, o.fecha_publicacion_estimada)}</span>
        </div>
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <EnviadaBoton id={o.id} estado={o.estado} fechaEnvio={o.fecha_envio} />
          {url && <AbrirOfertaLink id={o.id} empresa={o.empresa} estado={o.estado} url={url} className="btn btn-primary" />}
          {mensaje && <CopiarTexto texto={mensaje} etiqueta="Copiar mensaje" etiquetaHecho="Mensaje copiado" />}
          {cvUrl && (
            <a href={cvUrl} target="_blank" rel="noopener noreferrer" className="btn">
              Abrir CV v{o.cv_doc_version}
              <span className="sr-only"> (se abre en otra pestaña)</span>
            </a>
          )}
          {url && <CopiarEnlace url={url} />}
          {o.estado !== 'Descartada' && <DescartarBoton key={`d-${o.id}`} ids={[o.id]} />}
        </div>
      </header>

      {o.por_verificar && (
        <div role="note" className="space-y-3 rounded-tile border border-ambar px-3 py-3">
          <p className="text-[15px]"><span className="font-semibold text-ambar">Por verificar:</span> {o.verificar_motivo ?? 'necesita una comprobación'}</p>
          <VerificarAcciones
            key={`v-${o.id}`} id={o.id} codigo={o.codigo}
            posibleId={o.posible_duplicada_de} posibleCodigo={o.posible_duplicada_codigo}
          />
        </div>
      )}

      {o.estado === 'Descartada' && (
        <p role="note" className="rounded-tile border border-border px-3 py-2 text-[15px]">
          <span className="font-semibold">Descartada</span>
          {o.descarte_usuario_motivo
            ? <> por ti{o.descartada_en ? ` el ${fmtCorta(o.descartada_en)}` : ''}: {motivoUsuario}.</>
            : <> por la búsqueda automática{o.descartada_en ? ` el ${fmtCorta(o.descartada_en)}` : ''}.</>}
          {txt(o.descarte_usuario_detalle) && <span className="text-muted"> Nota: {o.descarte_usuario_detalle}</span>}
          <span className="block meta">Para reactivarla, cambia el estado en «Candidatura».</span>
        </p>
      )}

      {calidad === 'solo_basicos' ? (
        <p role="note" className="rounded-tile border border-border bg-accent-soft px-3 py-2 text-sm text-muted">
          Aún no hemos leído el anuncio: solo tenemos título, empresa y lugar del listado. Ábrelo para ver los detalles.
        </p>
      ) : calidad === 'parcial' ? (
        <p role="note" className="rounded-tile border border-border bg-accent-soft px-3 py-2 text-sm text-muted">
          Ficha parcial: el anuncio no daba todos los datos.
        </p>
      ) : null}

      <Seccion id="encaje" titulo="Encaje" abierta>
        {encaje && (
          <div className="border-l-4 border-accent pl-4">
            <h4 className="mb-1 text-[15px] font-semibold">Por qué encaja</h4>
            <p className="whitespace-pre-wrap">{encaje}</p>
          </div>
        )}
        {huecos.length > 0 && (
          <div className="border-l-4 border-ambar pl-4">
            <h4 className="mb-1 text-[15px] font-semibold">Qué te falta</h4>
            <ul className="list-disc space-y-1 pl-5">
              {huecos.map((x, i) => <li key={i} className="whitespace-pre-wrap">{x}</li>)}
            </ul>
          </div>
        )}
      </Seccion>

      <Seccion id="vistazo" titulo="De un vistazo" abierta>
        {vistazo.length > 0 && (
          <dl className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
            {vistazo.map(([k, v]) => (
              <div key={k} className="min-w-0 rounded-tile border border-border p-3">
                <dt className="text-xs font-medium uppercase tracking-wide text-muted">{k}</dt>
                <dd className="mt-0.5 break-words text-[15px]">{v}</dd>
              </div>
            ))}
          </dl>
        )}
      </Seccion>

      <Seccion id="desc" titulo="Este puesto va de…" abierta>
        {descripcion && <p className="whitespace-pre-wrap">{descripcion}</p>}
      </Seccion>

      <Seccion id="resp-pto" titulo="Qué harás" resumen={resp.length ? plural(resp.length, 'tarea', 'tareas') : undefined}>
        {resp.length > 0 && <Lista items={resp} />}
      </Seccion>

      <Seccion id="req" titulo="Requisitos" resumen={nReq ? plural(nReq, 'requisito', 'requisitos') : undefined}>
        {oblig.length > 0 && <Lista titulo={desea.length ? 'Qué piden' : undefined} items={oblig} />}
        {desea.length > 0 && <Lista titulo="Se valora" items={desea} />}
      </Seccion>

      <Seccion id="herr" titulo="Herramientas e idiomas">
        {herr.length > 0 && (
          <div>
            <h4 className="mb-2 text-[15px] font-semibold">Herramientas</h4>
            <ul className="flex flex-wrap gap-2">
              {herr.map((a) => (
                <li key={a} className="rounded-full border border-border bg-accent-soft px-3 py-1 text-sm">{a}</li>
              ))}
            </ul>
          </div>
        )}
        {idiomas.length > 0 && (
          <div>
            <h4 className="mb-2 text-[15px] font-semibold">Idiomas</h4>
            <ul className="flex flex-wrap gap-2">
              {idiomas.map((a) => (
                <li key={a} className="rounded-full border border-border px-3 py-1 text-sm">{a}</li>
              ))}
            </ul>
          </div>
        )}
      </Seccion>

      <Seccion id="ofrece" titulo="Qué ofrecen">
        {ofrece.length > 0 && <Lista items={ofrece} />}
      </Seccion>

      <Seccion id="fuentes" titulo="Dónde se publica" resumen={fuentes.length ? `(${fuentes.length})` : undefined}>
        {fuentes.length > 0 && <FuentesLista fuentes={fuentes} urlPrincipal={o.url_principal} />}
      </Seccion>

      <Seccion id="cand" titulo="Candidatura">
        <ControlesCandidatura
          key={o.id}
          id={o.id}
          estado={o.estado}
          cvAdaptado={o.cv_adaptado}
          mensajeRevisado={o.mensaje_revisado}
          tieneMensaje={!!mensaje}
          versionCv={o.version_cv ?? ''}
          fechaEnvio={o.fecha_envio}
          proximoSeguimiento={o.proximo_seguimiento}
        />
        <PrepararCandidatura
          key={`p-${o.id}`} id={o.id} marcada={o.preparar_candidatura} driveUrl={drive}
          cvDocUrl={cvUrl} cvVersion={o.cv_doc_version}
        />
        {mensaje && (
          <div className="rounded-tile border border-border p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h4 className="text-[15px] font-semibold">Mensaje preparado</h4>
              <CopiarTexto texto={mensaje} etiqueta="Copiar mensaje" etiquetaHecho="Mensaje copiado" />
            </div>
            {o.mensaje_actualizado_en && <p className="meta mt-1">Actualizado el {fmtDia(o.mensaje_actualizado_en)}</p>}
            <p className="mt-2 whitespace-pre-wrap text-[15px]">{mensaje}</p>
          </div>
        )}
      </Seccion>

      <Seccion id="respuesta" titulo="Respuesta">
        <ControlesRespuesta key={`r-${o.id}`} id={o.id} respuestaTipo={o.respuesta_tipo} respuesta={o.respuesta ?? ''} />
      </Seccion>

      {(o.contacto_nombre || perfil) && (
        <Seccion id="contacto" titulo="Contacto publicado">
          <p>{o.contacto_nombre}{o.contacto_cargo ? ` · ${o.contacto_cargo}` : ''}</p>
          {perfil && <p><Enlace href={perfil}>Perfil</Enlace></p>}
        </Seccion>
      )}

      <Seccion id="notas" titulo="Notas">
        <NotasEditor key={`n-${o.id}`} id={o.id} inicial={o.notas ?? ''} />
      </Seccion>

      <Seccion id="hist" titulo="Historial">
        {eventos.length === 0 ? (
          <p className="meta">Sin movimientos todavía.</p>
        ) : (
          <ol className="space-y-2 border-l border-border pl-4">
            {eventos.map((e) => (
              <li key={e.id} className="text-sm">
                <span className="num text-muted">{fmtFechaHora(e.creado_en)}</span>{' '}
                <span className="font-medium">{EVENTO_ETIQUETA[e.tipo] ?? e.tipo}</span>
                {(e.valor_anterior || e.valor_nuevo) && (
                  <span> · {e.valor_anterior ? `${e.valor_anterior} → ` : ''}{e.valor_nuevo}</span>
                )}
                {e.detalle && <span className="text-muted"> · {e.detalle}</span>}
                <span className="text-muted"> ({e.autor})</span>
              </li>
            ))}
          </ol>
        )}
      </Seccion>

      <Seccion id="tecnicos" titulo="Datos técnicos">
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
          <dt className="text-muted">Plataforma de origen</dt><dd>{o.plataforma}</dd>
          <dt className="text-muted">Zona</dt><dd>{ZONA_ETIQUETA[o.zona] ?? o.zona}</dd>
          <dt className="text-muted">Consulta de origen</dt><dd>{o.consulta_origen || '—'}</dd>
          <dt className="text-muted">Detectada</dt><dd className="num">{fmtFechaHora(o.fecha_deteccion)}</dd>
          <dt className="text-muted">Última vez vista</dt><dd className="num">{fmtFechaHora(o.ultima_vez_vista)}</dd>
          {(o.dias_sin_verse ?? 0) > 14 && (
            <><dt className="text-muted">No vista desde</dt><dd className="num">{fmtCorta(o.ultima_vez_vista)}</dd></>
          )}
          <dt className="text-muted">Verificación</dt>
          <dd>{o.estado_verificacion}{o.fecha_verificacion ? ` (${fmtDia(o.fecha_verificacion)})` : ''}</dd>
          {o.verificada_en && (<><dt className="text-muted">Verificada a mano</dt><dd className="num">{fmtDia(o.verificada_en)}</dd></>)}
          <dt className="text-muted">Origen</dt><dd>{o.origen}</dd>
          <dt className="text-muted">Calidad de datos</dt><dd>{calidad}</dd>
          {txt(o.fuente_detalle) && (<><dt className="text-muted">Fuente del detalle</dt><dd>{o.fuente_detalle}</dd></>)}
          {o.cv_doc_creado_en && (<><dt className="text-muted">CV adaptado creado</dt><dd className="num">{fmtDia(o.cv_doc_creado_en)}</dd></>)}
          {paginaEmpresa && (<><dt className="text-muted">Página empresa</dt><dd><Enlace href={paginaEmpresa}>{paginaEmpresa}</Enlace></dd></>)}
          {alternativas.length > 0 && (
            <>
              <dt className="text-muted">URLs alternativas (antiguas)</dt>
              <dd className="space-y-1">{alternativas.map((u) => <div key={u}><Enlace href={u}>{u}</Enlace></div>)}</dd>
            </>
          )}
        </dl>
        {o.descripcion_original?.trim() && (
          <>
            <h4 className="text-sm font-semibold">Texto original</h4>
            <p className="max-h-72 overflow-auto whitespace-pre-wrap text-sm text-muted">{o.descripcion_original}</p>
          </>
        )}
      </Seccion>
    </DetalleShell>
  );
}
