'use server';

import { redirect } from 'next/navigation';
import { comprobarBloqueo, hashIp, registrarIntento, verificarPassword } from '@/lib/auth';
import { borrarSesion, crearSesion, requireSession } from '@/lib/session';

export type EstadoLogin = { error: string | null };

const RETARDO_FALLO_MS = 400;
const dormir = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function iniciarSesion(_prev: EstadoLogin, datos: FormData): Promise<EstadoLogin> {
  const pwd = datos.get('password');
  if (typeof pwd !== 'string' || pwd.length === 0 || pwd.length > 200) {
    await dormir(RETARDO_FALLO_MS);
    return { error: 'Contraseña incorrecta.' };
  }

  let correcto = false;
  try {
    const ipHash = await hashIp();
    const bloqueo = await comprobarBloqueo(ipHash);
    if (bloqueo.bloqueado) {
      return {
        error: bloqueo.global
          ? `Acceso bloqueado temporalmente. Prueba en ${bloqueo.minutos} min.`
          : `Demasiados intentos. Prueba en ${bloqueo.minutos} min.`,
      };
    }
    correcto = verificarPassword(pwd);
    await registrarIntento(ipHash, correcto);
    if (!correcto) {
      await dormir(RETARDO_FALLO_MS);
      return { error: 'Contraseña incorrecta.' };
    }
    await crearSesion();
  } catch (e) {
    // Falla cerrado y sin detalles: ni stack trace ni datos de configuración.
    console.error('[login]', e instanceof Error ? e.message.slice(0, 120) : 'error');
    return { error: 'No se puede comprobar el acceso ahora mismo. Inténtalo de nuevo en unos minutos.' };
  }
  redirect('/');
}

export async function cerrarSesion(): Promise<void> {
  await requireSession();
  await borrarSesion();
  redirect('/login');
}
