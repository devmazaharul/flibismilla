import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { COOKIE_NAME } from './app/api/controller/constant';

// configaration parameters
const PROTECTED_ROUTES = ['/admin']; // protected routes list
const AUTH_ROUTES = ['/access', '/signup']; // authentication routes list


export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  
  // get token from cookies
  const token = req.cookies.get(COOKIE_NAME)?.value;
  
  // setup secret key for JWT verification
  const secret = new TextEncoder().encode(process.env.JWT_SECRET);

  let isAuthenticated = false;

  // validate token if it exists
  if (token) {
    try {
      await jwtVerify(token, secret);
      isAuthenticated = true;
    } catch (error) {
      // if token is invalid or expired
      isAuthenticated = false;
    }
  }

  // if not authenticated and trying to access protected route
  const isProtectedRoute = PROTECTED_ROUTES.some((route) => 
    pathname.startsWith(route)
  );

  if (isProtectedRoute) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/access', req.url);
      loginUrl.searchParams.set('redirect', pathname); 
      return NextResponse.redirect(loginUrl);
    }
  }

  const isAuthRoute = AUTH_ROUTES.some((route) => 
    pathname.startsWith(route)
  );

  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL('/admin', req.url));
  }

  const response = NextResponse.next();
  
// for clickjacking attacks
  response.headers.set('X-Frame-Options', 'DENY');
  // content type options
  response.headers.set('X-Content-Type-Options', 'nosniff');
  // old school XSS protection
  response.headers.set('X-XSS-Protection', '1; mode=block');
  // referrer policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};