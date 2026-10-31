import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Único sitio donde se usa la clave secreta. Las variables se leen dentro de la
// función (no en el nivel superior del módulo) para que el build no necesite secretos.
let cliente: SupabaseClient | null = null;

export function db(): SupabaseClient {
  if (cliente) return cliente;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error('Configuración de base de datos incompleta');
  cliente = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: (input, init) => fetch(input, { ...init, cache: 'no-store' }) },
  });
  return cliente;
}

/** Lanza un error genérico (sin detalles) si la consulta falló. */
export function ok<T>(res: { data: T | null; error: { message: string; code?: string } | null }): T {
  if (res.error) {
    console.error('[db]', res.error.code ?? '', res.error.message.slice(0, 200));
    throw new Error('Error de base de datos');
  }
  return res.data as T;
}

/** Lee TODAS las filas de una tabla/vista paginando con .range() (máx. 1000 por petición). */
export async function fetchAll<T>(
  tabla: string,
  columnas: string,
  orden: string,
  aplicar?: (q: any) => any, // eslint-disable-line @typescript-eslint/no-explicit-any
): Promise<T[]> {
  const PAGINA = 1000;
  const todas: T[] = [];
  for (let desde = 0; ; desde += PAGINA) {
    let q = db().from(tabla).select(columnas);
    if (aplicar) q = aplicar(q);
    const res = await q.order(orden, { ascending: true }).range(desde, desde + PAGINA - 1);
    const filas = ok<T[]>(res as never) ?? [];
    todas.push(...filas);
    if (filas.length < PAGINA) break;
  }
  return todas;
}
