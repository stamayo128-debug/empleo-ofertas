// Utilidades de sesión compatibles con el runtime Edge (las usa middleware.ts).
// No importa nada de Node ni de next/headers.
import { SignJWT, jwtVerify } from 'jose';

export const COOKIE_SESION = 'sesion';
export const DURACION_SESION_S = 30 * 24 * 60 * 60;

function clave(): Uint8Array | null {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) return null;
  return new TextEncoder().encode(s);
}

function version(): number {
  const n = Number(process.env.SESSION_VERSION ?? 1);
  return Number.isFinite(n) ? n : 1;
}

export async function firmarSesion(): Promise<string> {
  const k = clave();
  if (!k) throw new Error('SESSION_SECRET no configurado');
  return new SignJWT({ v: version() })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject('owner')
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(k);
}

export async function sesionValida(token?: string | null): Promise<boolean> {
  if (!token) return false;
  const k = clave();
  if (!k) return false;
  try {
    const { payload } = await jwtVerify(token, k, { algorithms: ['HS256'] });
    return payload.sub === 'owner' && payload.v === version();
  } catch {
    return false;
  }
}
