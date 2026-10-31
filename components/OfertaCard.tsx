import Link from 'next/link';
import { MODALIDAD_ETIQUETA, MOTIVO_USUARIO_ETIQUETA, type TabId } from '@/lib/constantes';
import { fmtCorta, publicadaTexto, txt, urlSegura } from '@/lib/format';
import type { OfertaLista } from '@/lib/types';
import { EncajeBadge } from './Badge';
import AbrirOfertaLink from './AbrirOfertaLink';
import CasillaLote from './CasillaLote';
import EnviadaBoton from './EnviadaBoton';
import { VerificadaBoton } from './VerificarAcciones';

/** Tarjeta compacta: línea de estado, puesto, empresa·lugar, resumen, meta y acciones. */
export default function OfertaCard({
  o, href, seleccionada, vencida, tab,
}: { o: OfertaLista; href: string; seleccionada: boolean; vencida: boolean; tab: TabId }) {
  const url = urlSegura(o.url_principal) ?? urlSegura(o.url);
  const modalidad = MODALIDAD_ETIQUETA[o.modalidad];
  const lugar = [o.empresa, o.municipio ?? o.lugar, modalidad].filter(Boolean).join(' · ');
  const resumen = txt(o.descripcion_clara);
  const salario = o.tiene_salario ? txt(o.salario) : null;
  const portales: { plataforma: string; url: string }[] = [];
  for (const f of o.fuentes ?? []) {
    const u = urlSegura(f.url);
    if (u && !portales.some((p) => p.plataforma === f.plataforma)) portales.push({ plataforma: f.plataforma, url: u });
  }
  const plataforma = o.plataforma_principal || o.plataforma;
  const meta = [
    publicadaTexto(o.fecha_publicacion, o.fecha_publicacion_estimada),
    portales.length > 1 ? `En ${portales.length} portales` : plataforma,
    salario ? (salario.length > 24 ? `${salario.slice(0, 23)}…` : salario) : null,
    (o.calidad_datos ?? 'solo_basicos') === 'solo_basicos' ? 'Ficha básica' : null,
  ].filter(Boolean).join(' · ');

  const estados: React.ReactNode[] = [];
  if (o.sin_revisar) estados.push(<span key="n" className="font-medium text-accent"><span aria-hidden>● </span>Nueva</span>);
  const recuperada = o.origen === 'recuperada';
  if (recuperada) estados.push(<span key="r" className="font-medium text-ambar"><span aria-hidden>↺ </span>Recuperada</span>);
  if (vencida) estados.push(<span key="v" className="font-medium text-ambar">Seguimiento vencido el {fmtCorta(o.proximo_seguimiento)}</span>);
  if (o.por_verificar) estados.push(<span key="p" className="font-medium text-ambar">Por verificar</span>);
  if (o.estado === 'Descartada') {
    const motivo = o.descarte_usuario_motivo ? MOTIVO_USUARIO_ETIQUETA[o.descarte_usuario_motivo] ?? o.descarte_usuario_motivo : null;
    estados.push(<span key="d" className="font-medium text-muted">Descartada{motivo ? `: ${motivo}` : ''}</span>);
  }

  const accionesIzquierda = tab === 'porenviar' || (tab === 'verificar' && o.por_verificar);

  return (
    <article
      className={`card relative p-4 ${seleccionada ? 'ring-2 ring-accent' : vencida ? 'ring-2 ring-ambar' : recuperada ? 'ring-1 ring-ambar/50' : ''}`}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="min-h-5 min-w-0 flex-1 text-sm">
          {estados.map((e, i) => <span key={i}>{i > 0 && ' · '}{e}</span>)}
        </p>
        <EncajeBadge encaje={o.encaje} />
      </div>

      <h3 className="mt-1 text-[17px] font-semibold leading-snug">
        <Link
          href={href}
          scroll={false}
          aria-current={seleccionada ? 'true' : undefined}
          className="after:absolute after:inset-0 after:content-['']"
        >
          {o.puesto}
        </Link>
      </h3>
      <p className="meta mt-0.5 truncate">{lugar}</p>
      {resumen && <p className="mt-1 line-clamp-1 text-[15px]">{resumen}</p>}
      <p className="meta num mt-0.5 truncate">{meta}</p>

      {portales.length > 1 && (
        <div className="relative z-10 mt-2 flex flex-wrap items-center gap-2">
          <span className="meta">Abrir en:</span>
          {portales.map((p) => (
            <a key={p.plataforma} href={p.url} target="_blank" rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center rounded-md border border-border px-3 text-[15px] font-medium text-accent hover:underline">
              {p.plataforma}
              <span className="sr-only"> (se abre en otra pestaña)</span>
            </a>
          ))}
        </div>
      )}

      {(accionesIzquierda || url) && (
        <div className="relative z-10 mt-2 flex flex-wrap items-center justify-between gap-x-3">
          <div className="flex flex-wrap items-center gap-2">
            {tab === 'porenviar' && <CasillaLote id={o.id} puesto={o.puesto} empresa={o.empresa} />}
            {tab === 'porenviar' && <EnviadaBoton id={o.id} estado={o.estado} fechaEnvio={o.fecha_envio} />}
            {tab === 'verificar' && o.por_verificar && <VerificadaBoton id={o.id} />}
          </div>
          {url && (
            <AbrirOfertaLink
              id={o.id} empresa={o.empresa} estado={o.estado} url={url}
              className="ml-auto inline-flex min-h-11 items-center gap-1 px-1 text-[15px] font-medium text-accent underline-offset-2 hover:underline"
            />
          )}
        </div>
      )}
    </article>
  );
}
