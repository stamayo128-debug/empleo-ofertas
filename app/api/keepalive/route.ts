import { timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function autorizado(cabecera: string | null): boolean {
  const secreto = process.env.CRON_SECRET;
  if (!secreto || secreto.length < 16 || !cabecera) return false;
  const esperado = Buffer.from(`Bearer ${secreto}`);
  const recibido = Buffer.from(cabecera);
  return recibido.length === esperado.length && timingSafeEqual(recibido, esperado);
}

// Esta ruta no pasa por el middleware (la llama el cron de Vercel); se autentica sola.
export async function GET(req: Request) {
  if (!autorizado(req.headers.get('authorization'))) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  try {
    const ping = await db().from('ofertas').select('id').limit(1);
    if (ping.error) throw new Error('ping');
    const limite = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const limpieza = await db().from('login_intentos').delete().lt('creado_en', limite);
    if (limpieza.error) throw new Error('limpieza');
    return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ ok: false, error: 'Error de base de datos' }, { status: 500 });
  }
}
