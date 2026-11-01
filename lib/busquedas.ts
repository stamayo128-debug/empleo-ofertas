/** Ayudas para mostrar el catálogo de búsquedas. */
const NOMBRES_DIA = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

/** «todos los días», «L X V» o «M J S». */
export function resumenDias(dias: number[]): string {
  const orden = [...new Set(dias)].filter((d) => d >= 1 && d <= 7).sort((a, b) => a - b);
  if (orden.length === 7) return 'todos los días';
  return orden.map((d) => NOMBRES_DIA[d - 1]).join(' ') || 'ningún día';
}

/** Nombre del sitio para mostrar. */
export function nombreSitio(sitio: string): string {
  if (sitio === 'remoto') return 'Teletrabajo (toda España)';
  if (sitio === 'varios') return 'Varios sitios';
  return sitio;
}
