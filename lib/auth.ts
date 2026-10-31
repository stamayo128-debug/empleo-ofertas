import 'server-only';
import { createHash, scryptSync, timingSafeEqual } from 'node:crypto';
import { headers } from 'next/headers';
import { db, ok } from './db';

const MAX_FALLOS_IP = 5;
const VENTANA_IP_MIN = 15;
const MAX_FALLOS_GLOBAL = 30;
const VENTANA_GLOBAL_MIN = 60;

export function verificarPassword(pwd: string): boolean {
  const ref = process.env.APP_PASSWORD_HASH;
  if (!ref) return false;
  const [alg, n, r, p, saltHex, hashHex] = ref.split(':');
  if (alg !== 'scrypt' || !saltHex || !hashHex) return false;
  const N = Number(n), R = Number(r), P = Number(p);
  if (![N, R, P].every((x) => Number.isInteger(x) && x > 0) || N > 1 << 20 || R > 32 || P > 16) return false;
  const esperado = Buffer.from(hashHex, 'hex');
  if (esperado.length === 0) return false;
  try {
    const calc = scryptSync(pwd, Buffer.from(saltHex, 'hex'), esperado.length, {
      N, r: R, p: P, maxmem: Math.min(128 * N * R * 2 + (1 << 20), 512 * 1024 * 1024),
    });
    return calc.length === esperado.length && timingSafeEqual(calc, esperado);
  } catch {
    return false;
  }
}

/** sha256(ip + SESSION_SECRET): nunca se guarda la IP en claro. */
export async function hashIp(): Promise<string> {
  const h = await headers();
  const ip = (h.get('x-forwarded-for') ?? '').split(',')[0].trim() || h.get('x-real-ip') || 'desconocida';
  return createHash('sha256').update(ip + (process.env.SESSION_SECRET ?? '')).digest('hex');
}

export type Bloqueo = { bloqueado: false } | { bloqueado: true; minutos: number; global: boolean };

function minutosRestantes(ultimoFallo: string, ventanaMin: number): number {
  const fin = new Date(ultimoFallo).getTime() + ventanaMin * 60000;
  return Math.max(1, Math.ceil((fin - Date.now()) / 60000));
}

/** Lanza si la base no responde: el llamador debe fallar cerrado. */
export async function comprobarBloqueo(ipHash: string): Promise<Bloqueo> {
  const ahora = Date.now();
  const desdeIp = new Date(ahora - VENTANA_IP_MIN * 60000).toISOString();
  const desdeGlobal = new Date(ahora - VENTANA_GLOBAL_MIN * 60000).toISOString();

  const [ip, global] = await Promise.all([
    db().from('login_intentos').select('creado_en').eq('ip_hash', ipHash).eq('exito', false)
      .gte('creado_en', desdeIp).order('creado_en', { ascending: false }).limit(MAX_FALLOS_IP),
    db().from('login_intentos').select('creado_en').eq('exito', false)
      .gte('creado_en', desdeGlobal).order('creado_en', { ascending: false }).limit(MAX_FALLOS_GLOBAL),
  ]);
  const filasIp = ok<{ creado_en: string }[]>(ip as never);
  const filasGlobal = ok<{ creado_en: string }[]>(global as never);

  if (filasGlobal.length >= MAX_FALLOS_GLOBAL) {
    return { bloqueado: true, global: true, minutos: minutosRestantes(filasGlobal[0].creado_en, VENTANA_GLOBAL_MIN) };
  }
  if (filasIp.length >= MAX_FALLOS_IP) {
    return { bloqueado: true, global: false, minutos: minutosRestantes(filasIp[0].creado_en, VENTANA_IP_MIN) };
  }
  return { bloqueado: false };
}

export async function registrarIntento(ipHash: string, exito: boolean): Promise<void> {
  try {
    await db().from('login_intentos').insert({ ip_hash: ipHash, exito });
  } catch {
    /* el registro es secundario; el bloqueo ya falla cerrado si la base no responde */
  }
}
