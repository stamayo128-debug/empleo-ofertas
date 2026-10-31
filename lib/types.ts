export type TipoFuente = 'empresa' | 'linkedin' | 'infojobs' | 'indeed' | 'google' | 'agregador' | 'otra';

/** Una URL donde se publica la oferta (fila de ofertas_fuentes, agregada en v_ofertas_web.fuentes). */
export type Fuente = {
  plataforma: string;
  tipo: TipoFuente;
  url: string;
  primera_vez: string;
  ultima_vez: string;
};

export type Oferta = {
  id: number;
  codigo: string;
  puesto: string;
  empresa: string;
  lugar: string | null;
  zona: string;
  modalidad: string;
  plataforma: string;
  url: string;
  urls_alternativas: string[];
  fecha_publicacion: string | null;
  fecha_publicacion_estimada: boolean;
  nivel: string | null;
  solicitantes: string | null;
  salario: string | null;
  descripcion_clara: string | null;
  aptitudes: string[];
  descripcion_original: string | null;
  encaje: 'Alto' | 'Medio';
  por_que_encaja: string | null;
  pagina_empresa: string | null;
  consulta_origen: string | null;
  fecha_deteccion: string;
  ultima_vez_vista: string;
  estado_verificacion: string;
  fecha_verificacion: string | null;
  canal_contacto: string | null;
  mensaje_preparado: string | null;
  cv_adaptado: boolean;
  mensaje_revisado: boolean;
  listo: boolean;
  version_cv: string | null;
  estado: string;
  fecha_envio: string | null;
  proximo_seguimiento: string | null;
  respuesta_tipo: string;
  respuesta: string | null;
  fecha_respuesta: string | null;
  notas: string | null;
  preparar_candidatura: boolean;
  carpeta_drive_url: string | null;
  revisada_en: string | null;
  origen: string;
  es_de_hoy: boolean;
  sin_revisar: boolean;
  dias_sin_respuesta: number | null;
  dias_sin_verse: number | null;
  contacto_nombre: string | null;
  contacto_perfil: string | null;
  contacto_cargo: string | null;
  responsabilidades: string[] | null;
  requisitos_obligatorios: string[] | null;
  requisitos_deseables: string[] | null;
  experiencia_requerida: string | null;
  formacion_requerida: string | null;
  idiomas: string[] | null;
  herramientas: string[] | null;
  se_ofrece: string[] | null;
  jornada: string | null;
  tipo_contrato: string | null;
  huecos: string[] | null;
  calidad_datos: 'completa' | 'parcial' | 'solo_basicos' | null;
  fuente_detalle: string | null;
  municipio: string | null;
  experiencia_min_anios: number | null;
  enviada: boolean;
  tiene_salario: boolean;
  es_remoto: boolean;
  tramo_experiencia: 'no_indica' | 'sin_experiencia' | 'hasta_1' | 'hasta_2' | 'mas_de_2';
  orden_enviadas: number;
  // Migración 0007 (v_ofertas_web ampliada)
  url_principal: string | null;
  plataforma_principal: string;
  fuentes: Fuente[];
  n_fuentes: number;
  por_verificar: boolean;
  verificar_motivo: string | null;
  verificada_en: string | null;
  posible_duplicada_de: number | null;
  posible_duplicada_codigo: string | null;
  cv_doc_url: string | null;
  cv_doc_version: number;
  cv_doc_creado_en: string | null;
  mensaje_actualizado_en: string | null;
  descarte_usuario_motivo: string | null;
  descarte_usuario_detalle: string | null;
  descartada_en: string | null;
};

/** Fila de "Descartadas por ti" (subconjunto de v_ofertas_web). */
export type DescartadaPorTi = Pick<
  Oferta,
  'id' | 'codigo' | 'puesto' | 'empresa' | 'descarte_usuario_motivo' | 'descarte_usuario_detalle' | 'descartada_en'
>;

export type Criterios = {
  id: number;
  activo: boolean;
  perfil_candidato: string | null;
  puestos_objetivo: string[];
  puestos_adyacentes: string[];
  puestos_excluidos: string[];
  palabras_senior: string[];
  palabras_ambiguas: string[];
  palabras_junior: string[];
  anios_max_alto: number;
  anios_max_aceptable: number;
  idiomas_candidato: string[];
  municipios_bizkaia: string[];
  municipios_madrid_preferentes: string[];
  zonas_cercanas: string[];
  aceptar_cercanas_hibrido: boolean;
  aceptar_madrid_presencial: boolean;
  aceptar_remoto_espana: boolean;
  antiguedad_max_dias: number;
  max_detalle_por_ejecucion: number;
  presupuesto_apify_mes_usd: number;
  indicaciones_extra: string | null;
  updated_at: string | null;
};

export type NotaAgente = {
  id: number;
  tipo: string;
  clave: string | null;
  texto: string;
  prioridad: number;
  autor: string | null;
  actualizada_en: string;
  caduca_en: string | null;
};

export type Evento = {
  id: number;
  oferta_id: number;
  tipo: string;
  valor_anterior: string | null;
  valor_nuevo: string | null;
  detalle: string | null;
  autor: string;
  creado_en: string;
};

export type Ejecucion = {
  id: number;
  tipo: string;
  iniciada_en: string;
  finalizada_en: string | null;
  estado: string;
  ventana: string | null;
  fuentes_ok: string[];
  fuentes_error: string[];
  total_resultados: number;
  total_ya_conocidas: number;
  total_nuevas: number;
  total_descartadas: number;
  coste_estimado_usd: number | null;
  resumen: string | null;
  notas: string | null;
};

export type Busqueda = {
  id: number;
  ejecucion_id: number;
  plataforma: string;
  consulta_texto: string;
  estado: string;
  error: string | null;
  resultados: number;
  ya_conocidas: number;
  nuevas_aceptadas: number;
  nuevas_descartadas: number;
  iniciada_en: string;
};

export type CuadreBusqueda = {
  id: number;
  ejecucion_id: number;
  resultados_scraper: number | null;
  cola_pendiente: number | null;
};

export type Descarte = {
  id: number;
  plataforma: string;
  puesto: string | null;
  empresa: string | null;
  lugar: string | null;
  zona: string | null;
  url: string | null;
  fecha_publicacion: string | null;
  motivo: string;
  detalle: string;
  veces_vista: number;
  primera_vez: string;
  ultima_vez: string;
  recuperada_como: number | null;
};
