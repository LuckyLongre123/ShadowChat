import { NextRequest, NextResponse } from 'next/server';

// ✅ Edge Runtime: ONLY use req.cookies, NEVER localStorage
export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ✅ Read token ONLY from cookies (Edge-compatible)
  // We'll keep a lightweight "auth-flag" cookie just for middleware routing.
  // The real JWT stays in localStorage for API calls.
  const hasSession = req.cookies.get('auth-session-flag')?.value === 'true';

  const isPrivateRoute =
    pathname.startsWith('/chat') || pathname.startsWith('/settings');

  const isAuthRoute = pathname === '/';

  // Redirect logged-in users away from login page
  if (isAuthRoute && hasSession) {
    return NextResponse.redirect(new URL('/chat', req.url));
  }

  // Redirect logged-out users away from private routes
  if (isPrivateRoute && !hasSession) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/chat/:path*', '/settings/:path*'],
};
