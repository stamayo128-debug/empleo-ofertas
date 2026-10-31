import { NextResponse } from 'next/server';
import { construirExcel } from '@/lib/excel';
import { haySesion } from '@/lib/session';
import { hoyMadrid } from '@/lib/format';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  if (!(await haySesion())) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  try {
    const buffer = await construirExcel();
    return new Response(buffer as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="ofertas-${hoyMadrid()}.xlsx"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (e) {
    console.error('[export]', e instanceof Error ? e.message.slice(0, 120) : 'error');
    return NextResponse.json({ error: 'No se pudo generar el Excel' }, { status: 500 });
  }
}
