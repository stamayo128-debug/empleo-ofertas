import Link from 'next/link';
import { Check } from 'lucide-react';
import { MODALIDAD_ETIQUETA, MOTIVO_USUARIO_ETIQUETA, type TabId } from '@/lib/constantes';
import { fmtCorta, publicadaTexto, txt, urlSegura } from '@/lib/format';
import type { OfertaLista } from '@/lib/types';
import AbrirOfertaLink from './AbrirOfertaLink';
import Avatar from './Avatar';
import BotonGuardar from './BotonGuardar';
import CasillaLote from './CasillaLote';
import EnviadaBoton from './EnviadaBoton';
import { VerificadaBoton } from './VerificarAcciones';

/**
 * Tarjeta de oferta: empresa y lugar con la inicial de color, marcador de guardar, puesto, salario,
 * etiquetas (modalidad, portales) y, al pie, cuándo se publicó y «Abrir ↗».
 */
export default function OfertaCard({
  o, href, seleccionada, vencida, tab,
}: { o: OfertaLista; href: string; seleccionada: boolean; vencida: boolean; tab: TabId }) {
  const url = urlSegura(o.url_principal) ?? urlSegura(o.url);
  const modalidad = MODALIDAD_ETIQUETA[o.modalidad];
  const lugar = o.municipio ?? o.lugar;
  const resumen = txt(o.descripcion_clara);
  const salario = o.tiene_salario ? txt(o.salario) : null;
  const portales: { plataforma: string; url: string }[] = [];
  for (const f of o.fuentes ?? []) {
    const u = urlSegura(f.url);
    if (u && !portales.some((p) => p.plataforma === f.plataforma)) portales.push({ plataforma: f.plataforma, url: u });
  }
  const plataforma = o.plataforma_principal || o.plataforma;
  const recuperada = o.origen === 'recuperada';

  const estados: React.ReactNode[] = [];
  if (o.sin_revisar) estados.push(<span key="n" className="font-medium text-accent"><span aria-hidden>● </span>Nueva</span>);
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
      className={`card relative p-5 ${seleccionada ? 'ring-2 ring-accent' : vencida ? 'ring-2 ring-ambar' : recuperada ? 'ring-1 ring-ambar/50' : ''}`}
    >
      <div className="flex items-start gap-3">
        <Avatar nombre={o.empresa} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-medium">{o.empresa}</p>
          <p className="meta flex items-center gap-1.5 truncate">
            {lugar && <span className="truncate">{lugar}</span>}
            {o.encaje === 'Alto' && (
              <span className="inline-flex shrink-0 items-center gap-0.5 font-medium text-verde">
                <Check size={14} aria-hidden /> Encaje alto
              </span>
            )}
          </p>
        </div>
        <span className="relative z-10"><BotonGuardar id={o.id} guardada={!!o.guardada_en} /></span>
      </div>

      {estados.length > 0 && (
        <p className="mt-2 text-sm">{estados.map((e, i) => <span key={i}>{i > 0 && ' · '}{e}</span>)}</p>
      )}

      <h3 className="mt-3 text-[17px] font-semibold leading-snug">
        <Link
          href={href}
          scroll={false}
          aria-current={seleccionada ? 'true' : undefined}
          className="after:absolute after:inset-0 after:rounded-card after:content-['']"
        >
          {o.puesto}
        </Link>
      </h3>

      <p className="mt-1 text-[15px] font-medium">
        {salario ? (salario.length > 32 ? `${salario.slice(0, 31)}…` : salario) : <span className="font-normal text-muted">Salario no indicado</span>}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {modalidad && <span className="chip min-h-8 bg-surface-2 shadow-none">{modalidad}</span>}
        {portales.length <= 1 && plataforma && <span className="chip min-h-8 bg-surface-2 shadow-none">{plataforma}</span>}
        {portales.length > 1 && <span className="chip min-h-8 bg-surface-2 shadow-none">+{portales.length - 1} {portales.length - 1 === 1 ? 'portal' : 'portales'}</span>}
        {(o.calidad_datos ?? 'solo_basicos') === 'solo_basicos' && <span className="chip min-h-8 bg-surface-2 text-muted shadow-none">Ficha básica</span>}
      </div>

      {resumen && <p className="mt-3 line-clamp-1 text-[15px]">{resumen}</p>}

      {portales.length > 1 && (
        <div className="relative z-10 mt-3 flex flex-wrap items-center gap-2">
          <span className="meta">Abrir en:</span>
          {portales.map((p) => (
            <a key={p.plataforma} href={p.url} target="_blank" rel="noopener noreferrer"
              className="chip min-h-11 text-[15px] text-accent shadow-none ring-1 ring-border hover:underline">
              {p.plataforma}
              <span className="sr-only"> (se abre en otra pestaña)</span>
            </a>
          ))}
        </div>
      )}

      {accionesIzquierda && (
        <div className="relative z-10 mt-3 flex flex-wrap items-center gap-2">
          {tab === 'porenviar' && <CasillaLote id={o.id} puesto={o.puesto} empresa={o.empresa} />}
          {tab === 'porenviar' && <EnviadaBoton id={o.id} estado={o.estado} fechaEnvio={o.fecha_envio} />}
          {tab === 'verificar' && o.por_verificar && <VerificadaBoton id={o.id} />}
        </div>
      )}

      <div className="relative z-10 mt-4 flex items-center justify-between gap-3">
        <p className="meta num min-w-0 truncate">
          {publicadaTexto(o.fecha_publicacion, o.fecha_publicacion_estimada)}
        </p>
        {url && (
          <AbrirOfertaLink
            id={o.id} empresa={o.empresa} estado={o.estado} url={url} etiqueta="Abrir"
            className="ml-auto inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full bg-accent-soft px-5 text-[15px] font-semibold text-accent hover:underline"
          />
        )}
      </div>
    </article>
  );
}
