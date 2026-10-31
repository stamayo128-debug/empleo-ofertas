import { NextResponse, type NextRequest } from 'next/server';
import { COOKIE_SESION, sesionValida } from '@/lib/jwt';

// Primera capa de defensa. La segunda es requireSession()/haySesion() en cada
// página, Server Action y Route Handler (no hay que fiarse solo del middleware).
export async function middleware(req: NextRequest) {
  if (await sesionValida(req.cookies.get(COOKIE_SESION)?.value)) return NextResponse.next();
  if (req.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  return NextResponse.redirect(new URL('/login', req.url));
}

export const config = {
  matcher: ['/((?!login|_next/|favicon\\.ico|robots\\.txt|api/keepalive).*)'],
};
