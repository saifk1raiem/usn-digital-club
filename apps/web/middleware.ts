import { NextRequest, NextResponse } from 'next/server';
export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  if (pathname === '/' || (!pathname.startsWith('/ar') && !pathname.startsWith('/fr'))) return NextResponse.redirect(new URL(`/ar${pathname === '/' ? '' : pathname}`, request.url));
}
export const config = { matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'] };
