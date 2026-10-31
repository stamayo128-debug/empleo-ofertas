import 'server-only';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { COOKIE_SESION, DURACION_SESION_S, firmarSesion, sesionValida } from './jwt';

export async function crearSesion(): Promise<void> {
  const jwt = await firmarSesion();
  (await cookies()).set(COOKIE_SESION, jwt, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: DURACION_SESION_S,
  });
}

export async function borrarSesion(): Promise<void> {
  (await cookies()).set(COOKIE_SESION, '', {
    httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 0,
  });
}

/** Para Route Handlers: true/false, sin redirigir. */
export async function haySesion(): Promise<boolean> {
  return sesionValida((await cookies()).get(COOKIE_SESION)?.value);
}

/** Para páginas, layouts y Server Actions: redirige a /login si no hay sesión válida. */
export async function requireSession(): Promise<void> {
  if (!(await haySesion())) redirect('/login');
}
