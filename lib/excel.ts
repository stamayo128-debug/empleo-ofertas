import 'server-only';
import ExcelJS from 'exceljs';
import { fetchAll } from './db';
import { ESTADOS, EVENTO_ETIQUETA, MODALIDAD_ETIQUETA, MOTIVO_ETIQUETA, MOTIVO_USUARIO_ETIQUETA, ZONA_ETIQUETA } from './constantes';
import { hoyMadrid, lista, txt, urlSegura } from './format';
import type { Busqueda, Descarte, Ejecucion, Evento, Oferta } from './types';

type Contacto = {
  id: number; nombre: string; cargo: string | null; empresa: string | null; perfil_url: string | null;
  email: string | null; canal: string | null; notas: string | null;
};

const FMT_DIA = 'dd/mm/yyyy';
const FMT_HORA = 'dd/mm/yyyy hh:mm';

const partes = new Intl.DateTimeFormat('en-US', {
  timeZone: 'Europe/Madrid', hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit',
});

/** Fecha-sola (AAAA-MM-DD) -> Date a medianoche UTC (Excel no tiene zonas horarias). */
function dia(v?: string | null): Date | null {
  if (!v) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(v);
  return m ? new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])) : null;
}

/** Instante -> hora local de Madrid escrita como si fuera UTC. */
function instante(v?: string | null): Date | null {
  if (!v) return null;
  const d = new Date(v);
  if (isNaN(d.getTime())) return null;
  const p = Object.fromEntries(partes.formatToParts(d).map((x) => [x.type, x.value]));
  return new Date(Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute));
}

const s = (v: unknown): string => (v === null || v === undefined ? '' : String(v));
const sino = (b: boolean) => (b ? 'Sí' : 'No');

function enlace(url?: string | null): ExcelJS.CellValue {
  const u = urlSegura(url);
  return u ? { text: u, hyperlink: u } : '';
}

type Col = { cabecera: string; ancho: number; formato?: string };

function hoja(libro: ExcelJS.Workbook, nombre: string, cols: Col[], filas: ExcelJS.CellValue[][]) {
  const ws = libro.addWorksheet(nombre, { views: [{ state: 'frozen', ySplit: 1 }] });
  ws.columns = cols.map((c) => ({ header: c.cabecera, width: c.ancho, style: c.formato ? { numFmt: c.formato } : {} }));
  filas.forEach((f) => ws.addRow(f));
  const cab = ws.getRow(1);
  cab.font = { bold: true };
  cab.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE3F1EF' } };
  cab.alignment = { vertical: 'middle', wrapText: true };
  cab.height = 30;
  if (cols.length) ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: cols.length } };
  return ws;
}

/** Plataformas donde también se publica la oferta (todas menos la de la URL principal). */
function otrasFuentes(o: Oferta): string {
  const fuentes = Array.isArray(o.fuentes) ? o.fuentes : [];
  const i = fuentes.findIndex((f) => f.url === o.url_principal);
  return fuentes.filter((_, k) => k !== i).map((f) => s(f.plataforma)).filter(Boolean).join(' · ');
}

function porVerificar(o: Oferta): string {
  if (!o.por_verificar) return 'No';
  return o.verificar_motivo ? `Sí: ${o.verificar_motivo}` : 'Sí';
}

function motivoUsuario(o: Oferta): string {
  if (!o.descarte_usuario_motivo) return '';
  const m = MOTIVO_USUARIO_ETIQUETA[o.descarte_usuario_motivo] ?? o.descarte_usuario_motivo;
  return o.descarte_usuario_detalle ? `${m}: ${o.descarte_usuario_detalle}` : m;
}

export async function construirExcel(): Promise<ArrayBuffer> {
  const [ofertas, descartes, busquedas, ejecuciones, eventos, contactos] = await Promise.all([
    fetchAll<Oferta>('v_ofertas_web', '*', 'id'),
    fetchAll<Descarte & { duplicada_de: number | null }>('descartes', '*', 'id'),
    fetchAll<Busqueda>('busquedas', '*', 'id'),
    fetchAll<Ejecucion>('ejecuciones', '*', 'id'),
    fetchAll<Evento>('eventos_oferta', '*', 'id'),
    fetchAll<Contacto>('contactos', '*', 'id'),
  ]);
  // Hay que leer contacto_id de ofertas para "ofertas vinculadas".
  const vinculos = await fetchAll<{ id: number; contacto_id: number | null }>('ofertas', 'id,contacto_id', 'id');

  const porId = new Map(ofertas.map((o) => [o.id, o]));
  const codigo = (id: number | null) => (id ? porId.get(id)?.codigo ?? '' : '');
  const hoy = hoyMadrid();

  const libro = new ExcelJS.Workbook();
  libro.creator = 'Ofertas';
  libro.created = new Date();

  // ---- Resumen ----
  const cuenta = (f: (o: Oferta) => string) => {
    const m = new Map<string, number>();
    ofertas.forEach((o) => m.set(f(o), (m.get(f(o)) ?? 0) + 1));
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  };
  const ult = [...ejecuciones].filter((e) => e.tipo !== 'prueba').sort((a, b) => b.iniciada_en.localeCompare(a.iniciada_en))[0];
  const vencidos = ofertas.filter((o) =>
    (o.estado === 'Postulado' || o.estado === 'Entrevista') && o.respuesta_tipo === 'Sin respuesta'
    && o.proximo_seguimiento && o.proximo_seguimiento < hoy).length;
  const resumen: ExcelJS.CellValue[][] = [
    ['Fecha de exportación', dia(hoy), ''],
    ['Total de ofertas', ofertas.length, ''],
    ['Seguimientos vencidos', vencidos, ''],
    ['', '', ''],
    ['Última ejecución', ult ? instante(ult.iniciada_en) : '', ult ? `${ult.estado} · ${ult.total_nuevas} nuevas · ${ult.total_descartadas} descartadas` : ''],
    ['', '', ''],
    ['POR ESTADO', '', ''],
    ...ESTADOS.map((e): ExcelJS.CellValue[] => ['Estado', e, ofertas.filter((o) => o.estado === e).length]),
    ['', '', ''],
    ['POR ENCAJE', '', ''],
    ...cuenta((o) => o.encaje).map(([k, n]): ExcelJS.CellValue[] => ['Encaje', k, n]),
    ['', '', ''],
    ['POR PLATAFORMA', '', ''],
    ...cuenta((o) => o.plataforma).map(([k, n]): ExcelJS.CellValue[] => ['Plataforma', k, n]),
  ];
  const wsRes = hoja(libro, 'Resumen', [
    { cabecera: 'Concepto', ancho: 28 }, { cabecera: 'Valor', ancho: 34 }, { cabecera: 'Detalle / Nº', ancho: 44 },
  ], resumen);
  wsRes.getCell('B2').numFmt = FMT_DIA;
  wsRes.getCell('B6').numFmt = FMT_HORA;
  wsRes.autoFilter = undefined;

  // ---- Ofertas ----
  const cols: Col[] = [
    { cabecera: 'ID', ancho: 10 }, { cabecera: 'Encaje', ancho: 9 }, { cabecera: 'Puesto', ancho: 38 },
    { cabecera: 'Empresa', ancho: 28 }, { cabecera: 'Lugar / modalidad', ancho: 28 },
    { cabecera: 'Fecha publicación', ancho: 14, formato: FMT_DIA }, { cabecera: '≈ estimada', ancho: 10 },
    { cabecera: 'Nivel', ancho: 14 }, { cabecera: 'Solicitantes', ancho: 14 }, { cabecera: 'Por qué encaja', ancho: 50 },
    { cabecera: 'Descripción (Este puesto va de…)', ancho: 60 },
    { cabecera: 'Experiencia', ancho: 28 }, { cabecera: 'Formación', ancho: 28 }, { cabecera: 'Idiomas', ancho: 24 },
    { cabecera: 'Herramientas', ancho: 36 }, { cabecera: 'Responsabilidades', ancho: 60 },
    { cabecera: 'Requisitos obligatorios', ancho: 60 }, { cabecera: 'Se valora', ancho: 50 },
    { cabecera: 'Qué ofrecen', ancho: 50 }, { cabecera: 'Jornada', ancho: 16 }, { cabecera: 'Contrato', ancho: 18 },
    { cabecera: 'Qué te falta', ancho: 50 }, { cabecera: 'Calidad de datos', ancho: 14 },
    { cabecera: 'Aptitudes', ancho: 40 },
    { cabecera: 'Enlace oferta', ancho: 40 }, { cabecera: 'Contacto publicado', ancho: 24 },
    { cabecera: 'Perfil del contacto', ancho: 36 }, { cabecera: 'Página empresa', ancho: 30 },
    { cabecera: 'Fuente', ancho: 16 }, { cabecera: 'Consulta de origen', ancho: 30 },
    { cabecera: 'Fecha detección', ancho: 17, formato: FMT_HORA }, { cabecera: '¿Abierta?', ancho: 14 },
    { cabecera: 'Fecha verificación', ancho: 14, formato: FMT_DIA }, { cabecera: 'Canal de contacto', ancho: 16 },
    { cabecera: 'Mensaje preparado', ancho: 50 }, { cabecera: 'CV adaptado', ancho: 11 },
    { cabecera: 'Mensaje revisado', ancho: 11 }, { cabecera: '¿Listo?', ancho: 9 }, { cabecera: 'Versión de CV', ancho: 14 },
    { cabecera: 'Estado', ancho: 18 }, { cabecera: 'Fecha envío', ancho: 13, formato: FMT_DIA },
    { cabecera: 'Próximo seguimiento', ancho: 13, formato: FMT_DIA }, { cabecera: 'Respuesta', ancho: 40 },
    { cabecera: 'Notas', ancho: 50 }, { cabecera: 'Zona', ancho: 16 }, { cabecera: 'Modalidad', ancho: 13 },
    { cabecera: 'Última vez vista', ancho: 17, formato: FMT_HORA }, { cabecera: 'Carpeta Drive', ancho: 36 },
    { cabecera: 'Origen', ancho: 12 },
    { cabecera: 'Otras fuentes', ancho: 30 }, { cabecera: 'Por verificar', ancho: 40 },
    { cabecera: 'Motivo descarte (tú)', ancho: 40 }, { cabecera: 'CV adaptado (Drive)', ancho: 36 },
    { cabecera: 'Guardada', ancho: 11 },
  ];
  const filasOf = ofertas.map((o): ExcelJS.CellValue[] => {
    const lugar = [s(o.lugar), MODALIDAD_ETIQUETA[o.modalidad] ?? ''].filter(Boolean).join(' · ');
    const resp = [o.respuesta_tipo, s(o.respuesta)].filter(Boolean).join(': ');
    return [
      s(o.codigo), s(o.encaje), s(o.puesto), s(o.empresa), lugar,
      dia(o.fecha_publicacion), o.fecha_publicacion_estimada ? '≈' : '',
      s(o.nivel), s(o.solicitantes), s(o.por_que_encaja), s(o.descripcion_clara),
      s(txt(o.experiencia_requerida)), s(txt(o.formacion_requerida)), lista(o.idiomas).join(' · '),
      lista(o.herramientas).join(' · '), lista(o.responsabilidades).join('\n'),
      lista(o.requisitos_obligatorios).join('\n'), lista(o.requisitos_deseables).join('\n'),
      lista(o.se_ofrece).join('\n'), s(txt(o.jornada)), s(txt(o.tipo_contrato)),
      lista(o.huecos).join('\n'), s(o.calidad_datos ?? 'solo_basicos'),
      (o.aptitudes ?? []).join(' · '), enlace(o.url), s(o.contacto_nombre),
      enlace(o.contacto_perfil), enlace(o.pagina_empresa), s(o.plataforma), s(o.consulta_origen),
      instante(o.fecha_deteccion), s(o.estado_verificacion), dia(o.fecha_verificacion), s(o.canal_contacto),
      s(o.mensaje_preparado), sino(o.cv_adaptado), sino(o.mensaje_revisado), sino(o.listo), s(o.version_cv),
      s(o.estado), dia(o.fecha_envio), dia(o.proximo_seguimiento), resp, s(o.notas),
      s(ZONA_ETIQUETA[o.zona] ?? o.zona), s(MODALIDAD_ETIQUETA[o.modalidad] || 'Sin especificar'),
      instante(o.ultima_vez_vista), enlace(o.carpeta_drive_url), s(o.origen),
      otrasFuentes(o), porVerificar(o), motivoUsuario(o), enlace(o.cv_doc_url), sino(!!o.guardada_en),
    ];
  });
  const wsOf = hoja(libro, 'Ofertas', cols, filasOf);
  const largas = ['Responsabilidades', 'Requisitos obligatorios', 'Se valora', 'Qué ofrecen', 'Qué te falta', 'Herramientas', 'Descripción (Este puesto va de…)'];
  largas.forEach((n) => {
    const c = cols.findIndex((x) => x.cabecera === n) + 1;
    for (let r = 2; r <= filasOf.length + 1; r++) wsOf.getCell(r, c).alignment = { wrapText: true, vertical: 'top' };
  });
  const colEstado = cols.findIndex((c) => c.cabecera === 'Estado') + 1;
  for (let r = 2; r <= filasOf.length + 1; r++) {
    wsOf.getCell(r, colEstado).dataValidation = {
      type: 'list', allowBlank: false, formulae: [`"${ESTADOS.join(',')}"`],
    };
  }

  // ---- Descartes ----
  hoja(libro, 'Descartes', [
    { cabecera: 'Fecha', ancho: 17, formato: FMT_HORA }, { cabecera: 'Plataforma', ancho: 14 },
    { cabecera: 'Puesto', ancho: 38 }, { cabecera: 'Empresa', ancho: 26 }, { cabecera: 'Lugar', ancho: 24 },
    { cabecera: 'Motivo', ancho: 22 }, { cabecera: 'Detalle', ancho: 50 }, { cabecera: 'Veces visto', ancho: 10 },
    { cabecera: 'Última vez', ancho: 17, formato: FMT_HORA }, { cabecera: 'Enlace', ancho: 40 },
    { cabecera: 'Duplicada de', ancho: 12 }, { cabecera: 'Recuperada como', ancho: 14 },
  ], descartes.map((d) => [
    instante(d.primera_vez), s(d.plataforma), s(d.puesto), s(d.empresa), s(d.lugar),
    s(MOTIVO_ETIQUETA[d.motivo] ?? d.motivo), s(d.detalle), d.veces_vista, instante(d.ultima_vez),
    enlace(d.url), codigo(d.duplicada_de), codigo(d.recuperada_como),
  ]));

  // ---- Búsquedas ----
  hoja(libro, 'Búsquedas', [
    { cabecera: 'Fecha', ancho: 17, formato: FMT_HORA }, { cabecera: 'Ejecución', ancho: 10 },
    { cabecera: 'Plataforma', ancho: 14 }, { cabecera: 'Consulta', ancho: 44 }, { cabecera: 'Estado', ancho: 10 },
    { cabecera: 'Resultados', ancho: 11 }, { cabecera: 'Ya conocidas', ancho: 12 },
    { cabecera: 'Nuevas aceptadas', ancho: 12 }, { cabecera: 'Nuevas descartadas', ancho: 12 }, { cabecera: 'Error', ancho: 50 },
  ], busquedas.map((b) => [
    instante(b.iniciada_en), b.ejecucion_id, s(b.plataforma), s(b.consulta_texto), s(b.estado),
    b.resultados, b.ya_conocidas, b.nuevas_aceptadas, b.nuevas_descartadas, s(b.error),
  ]));

  // ---- Ejecuciones ----
  hoja(libro, 'Ejecuciones', [
    { cabecera: 'Inicio', ancho: 17, formato: FMT_HORA }, { cabecera: 'Fin', ancho: 17, formato: FMT_HORA },
    { cabecera: 'Tipo', ancho: 12 }, { cabecera: 'Estado', ancho: 10 }, { cabecera: 'Ventana', ancho: 9 },
    { cabecera: 'Resultados', ancho: 11 }, { cabecera: 'Ya conocidas', ancho: 12 }, { cabecera: 'Nuevas', ancho: 9 },
    { cabecera: 'Descartadas', ancho: 12 }, { cabecera: 'Fuentes con error', ancho: 24 },
    { cabecera: 'Coste (USD)', ancho: 11, formato: '0.0000' }, { cabecera: 'Resumen', ancho: 60 },
  ], ejecuciones.map((e) => [
    instante(e.iniciada_en), instante(e.finalizada_en), s(e.tipo), s(e.estado), s(e.ventana),
    e.total_resultados, e.total_ya_conocidas, e.total_nuevas, e.total_descartadas,
    (e.fuentes_error ?? []).join(', '), e.coste_estimado_usd === null ? '' : Number(e.coste_estimado_usd), s(e.resumen),
  ]));

  // ---- Historial ----
  hoja(libro, 'Historial', [
    { cabecera: 'Fecha', ancho: 17, formato: FMT_HORA }, { cabecera: 'Código', ancho: 10 }, { cabecera: 'Puesto', ancho: 38 },
    { cabecera: 'Tipo de evento', ancho: 20 }, { cabecera: 'De', ancho: 18 }, { cabecera: 'A', ancho: 18 },
    { cabecera: 'Detalle', ancho: 44 }, { cabecera: 'Autor', ancho: 10 },
  ], eventos.map((ev) => [
    instante(ev.creado_en), codigo(ev.oferta_id), s(porId.get(ev.oferta_id)?.puesto),
    s(EVENTO_ETIQUETA[ev.tipo] ?? ev.tipo), s(ev.valor_anterior), s(ev.valor_nuevo), s(ev.detalle), s(ev.autor),
  ]));

  // ---- Contactos ----
  const vinc = new Map<number, string[]>();
  vinculos.forEach((v) => {
    if (v.contacto_id) vinc.set(v.contacto_id, [...(vinc.get(v.contacto_id) ?? []), codigo(v.id)]);
  });
  hoja(libro, 'Contactos', [
    { cabecera: 'Nombre', ancho: 26 }, { cabecera: 'Cargo', ancho: 26 }, { cabecera: 'Empresa', ancho: 26 },
    { cabecera: 'Perfil', ancho: 40 }, { cabecera: 'Email', ancho: 28 }, { cabecera: 'Canal', ancho: 14 },
    { cabecera: 'Ofertas vinculadas', ancho: 26 }, { cabecera: 'Notas', ancho: 44 },
  ], contactos.map((c) => [
    s(c.nombre), s(c.cargo), s(c.empresa), enlace(c.perfil_url), s(c.email), s(c.canal),
    (vinc.get(c.id) ?? []).join(', '), s(c.notas),
  ]));

  return (await libro.xlsx.writeBuffer()) as ArrayBuffer;
}
