export const ESTADOS = ['Pendiente', 'Mensaje preparado', 'Postulado', 'Entrevista', 'Rechazado', 'Descartada'] as const;
export type Estado = (typeof ESTADOS)[number];

export const RESPUESTAS = ['Sin respuesta', 'Respondida', 'Entrevista', 'Rechazo', 'Oferta recibida'] as const;
export type RespuestaTipo = (typeof RESPUESTAS)[number];

export const ENCAJES = ['Alto', 'Medio'] as const;
export type Encaje = (typeof ENCAJES)[number];

export const ZONAS_FILTRO = [
  { valor: 'bizkaia', etiqueta: 'Bizkaia' },
  { valor: 'madrid', etiqueta: 'Madrid' },
  { valor: 'remoto_espana', etiqueta: 'Remoto' },
  { valor: 'otra', etiqueta: 'Otra' },
] as const;

export const ZONA_ETIQUETA: Record<string, string> = {
  bizkaia: 'Bizkaia',
  madrid: 'Madrid',
  remoto_espana: 'Remoto (España)',
  euskadi_otra: 'Resto de Euskadi',
  otra: 'Otra',
};

export const MODALIDAD_FILTRO = [
  { valor: 'remoto', etiqueta: 'Remoto' },
  { valor: 'hibrido', etiqueta: 'Híbrido' },
  { valor: 'presencial', etiqueta: 'Presencial' },
  { valor: 'sin_especificar', etiqueta: 'No lo indica' },
] as const;

export const EXPERIENCIA_FILTRO = [
  { valor: 'max1', etiqueta: 'Hasta 1 año' },
  { valor: 'max2', etiqueta: 'Hasta 2 años' },
  { valor: 'mas2', etiqueta: 'Más de 2 años' },
  { valor: 'no_indica', etiqueta: 'No lo indica' },
] as const;

export const DIA_FILTRO = [
  { valor: 'hoy', etiqueta: 'Hoy' },
  { valor: '7', etiqueta: '7 días' },
  { valor: '30', etiqueta: '30 días' },
] as const;

export const SALARIO_FILTRO = [
  { valor: 'si', etiqueta: 'Con salario' },
  { valor: 'no', etiqueta: 'Sin salario' },
] as const;

export const MODALIDAD_ETIQUETA: Record<string, string> = {
  presencial: 'Presencial',
  hibrido: 'Híbrido',
  remoto: 'Remoto',
  sin_especificar: '',
};

export const MOTIVO_ETIQUETA: Record<string, string> = {
  nivel_senior: 'Senior',
  experiencia_excesiva: 'Experiencia excesiva',
  area_vision_artificial: 'Visión artificial',
  area_mlops_devops: 'MLOps / DevOps',
  area_automatizacion_industrial: 'Industrial',
  area_no_relacionada: 'Área no relacionada',
  ubicacion_fuera: 'Ubicación',
  ubicacion_cercana_sin_remoto: 'Cerca, sin remoto',
  requiere_convenio: 'Requiere convenio',
  idioma: 'Idioma',
  antigua: 'Antigua',
  cerrada: 'Cerrada',
  duplicada: 'Duplicada',
  sin_datos_minimos: 'Sin datos mínimos',
  no_es_oferta: 'No es una oferta',
  otro: 'Otro',
};

// Motivos de descarte manual (lista cerrada; el valor viaja a la RPC descartar_ofertas).
export const MOTIVOS_DESCARTE_USUARIO = [
  { valor: 'no_me_interesa', etiqueta: 'No me interesa' },
  { valor: 'nivel_alto', etiqueta: 'Nivel demasiado alto' },
  { valor: 'experiencia', etiqueta: 'Piden demasiada experiencia' },
  { valor: 'ubicacion', etiqueta: 'Ubicación' },
  { valor: 'sector_o_empresa', etiqueta: 'Sector o empresa' },
  { valor: 'condiciones', etiqueta: 'Condiciones (salario, contrato)' },
  { valor: 'cerrada', etiqueta: 'Ya está cerrada' },
  { valor: 'duplicada', etiqueta: 'Duplicada' },
  { valor: 'otro', etiqueta: 'Otro' },
] as const;
export type MotivoDescarteUsuario = (typeof MOTIVOS_DESCARTE_USUARIO)[number]['valor'];
export const MOTIVO_USUARIO_ETIQUETA: Record<string, string> = Object.fromEntries(
  MOTIVOS_DESCARTE_USUARIO.map((m) => [m.valor, m.etiqueta]),
);

// Etiqueta del tipo de fuente en "Dónde se publica".
export const TIPO_FUENTE_ETIQUETA: Record<string, string> = {
  empresa: 'Web de la empresa',
  linkedin: 'LinkedIn',
  infojobs: 'InfoJobs',
  indeed: 'Indeed',
  google: 'Google',
  agregador: 'Agregador',
  otra: 'Otra web',
};

export const EVENTO_ETIQUETA: Record<string, string> = {
  creada: 'Creada',
  importada: 'Importada',
  recuperada: 'Recuperada',
  estado: 'Estado',
  respuesta: 'Respuesta',
  verificacion: 'Verificación',
  candidatura_preparada: 'Candidatura preparada',
};

export const TABS = [
  { id: 'hoy', etiqueta: 'Hoy' },
  { id: 'revisar', etiqueta: 'Por revisar' },
  { id: 'verificar', etiqueta: 'Por verificar' },
  { id: 'porenviar', etiqueta: 'Por enviar' },
  { id: 'enviadas', etiqueta: 'Enviadas' },
  { id: 'todas', etiqueta: 'Todas' },
] as const;
export type TabId = (typeof TABS)[number]['id'];

export const ORDENES = [
  { id: 'relevancia', etiqueta: 'Relevancia' },
  { id: 'deteccion', etiqueta: 'Detectadas recientes' },
  { id: 'publicacion', etiqueta: 'Fecha de publicación' },
] as const;
export type OrdenId = (typeof ORDENES)[number]['id'];

// Clase CSS (color + texto) por estado. Siempre se acompaña de la etiqueta.
export const ESTADO_CLASE: Record<string, string> = {
  Pendiente: 'text-muted border-border',
  'Mensaje preparado': 'text-azul border-azul',
  Postulado: 'text-ambar border-ambar',
  Entrevista: 'text-verde border-verde',
  Rechazado: 'text-rojo border-rojo',
  Descartada: 'text-muted border-border opacity-70',
};
