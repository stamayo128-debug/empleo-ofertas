/** El perfil se guarda como un solo texto con apartados (así lo lee el agente). Aquí se separa y se vuelve a juntar. */
export const MAX_PERFIL = 3000;

export const SECCIONES_PERFIL = [
  { clave: 'quien', titulo: 'QUIÉN SOY', nombre: 'Quién soy', ayuda: 'Formación, a qué te dedicas, idiomas y dónde vives.' },
  { clave: 'experiencia', titulo: 'EXPERIENCIA', nombre: 'Experiencia', ayuda: 'Dónde has trabajado y los proyectos que has hecho tú.' },
  { clave: 'se', titulo: 'SÉ HACER', nombre: 'Lo que sé hacer', ayuda: 'Herramientas y habilidades que sí dominas.' },
  { clave: 'no', titulo: 'NO TENGO', nombre: 'Lo que no tengo', ayuda: 'Lo que no sabes o no tienes, para que no te lo atribuya.' },
  { clave: 'busco', titulo: 'QUÉ BUSCO', nombre: 'Qué busco', ayuda: 'El tipo de trabajo que quieres, el nivel y cómo juzgar una oferta.' },
] as const;

export type ClaveSeccion = (typeof SECCIONES_PERFIL)[number]['clave'];
export type Secciones = Record<ClaveSeccion, string>;

const vacio = (): Secciones => ({ quien: '', experiencia: '', se: '', no: '', busco: '' });

/** Separa el texto guardado por sus títulos. Lo que no tenga título va a «Quién soy», para no perder nada. */
export function separarPerfil(texto: string | null): Secciones {
  const s = vacio();
  if (!texto) return s;
  let actual: ClaveSeccion = 'quien';
  const bloques: Record<ClaveSeccion, string[]> = { quien: [], experiencia: [], se: [], no: [], busco: [] };
  for (const linea of texto.replace(/\r\n/g, '\n').split('\n')) {
    const sec = SECCIONES_PERFIL.find((x) => linea.trim().toUpperCase() === x.titulo);
    if (sec) { actual = sec.clave; continue; }
    bloques[actual].push(linea);
  }
  for (const sec of SECCIONES_PERFIL) s[sec.clave] = bloques[sec.clave].join('\n').trim();
  return s;
}

/** Junta los apartados en un solo texto con sus títulos; los vacíos no se escriben. */
export function juntarPerfil(s: Secciones): string {
  return SECCIONES_PERFIL
    .filter((x) => s[x.clave].trim() !== '')
    .map((x) => `${x.titulo}\n${s[x.clave].trim()}`)
    .join('\n\n');
}
