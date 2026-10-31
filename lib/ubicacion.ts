/** Ciudad desde la que se busca trabajo. Siempre cuenta como zona preferente. */
export const CIUDAD_BASE = 'Leganés';

/** Minúsculas y sin tildes, para comparar "Leganés" con "leganes" o "LEGANÉS, Madrid". */
export function normaliza(s: string | null | undefined): string {
  return (s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
}

/** ¿El lugar de la oferta coincide con alguno de los municipios preferentes (o con la ciudad base)? */
export function enZonaPreferente(lugar: string | null | undefined, municipios: string[] | null | undefined): boolean {
  const l = normaliza(lugar);
  if (!l) return false;
  const lista = [CIUDAD_BASE, ...(municipios ?? [])].map(normaliza).filter((m) => m.length >= 3);
  return lista.some((m) => l.includes(m));
}
