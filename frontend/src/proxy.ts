import { NextRequest, NextResponse } from 'next/server';

export async function proxy(req: NextRequest) {
  const token =
    req.cookies.get('accessToken')?.value ||
    localStorage.getItem('accessToken');
  const { pathname } = req.nextUrl;

  if (pathname === '/' && token) {
    return NextResponse.redirect(new URL('/chat', req.url));
  }

  const isPrivateRoute =
    pathname.startsWith('/chat') || pathname.startsWith('/settings');

  // 2. Private routes protection
  if (isPrivateRoute) {
    if (!token) {
      return NextResponse.redirect(new URL('/', req.url));
    }
  }

  return NextResponse.next();
}

// Optimized matching boundaries
export const config = {
  matcher: ['/', '/chat/:path*', '/settings/:path*'],
};
