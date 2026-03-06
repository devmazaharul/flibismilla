// middleware.ts

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify, type JWTPayload } from 'jose';
import { COOKIE_NAME } from './app/api/controller/constant';

// ──────────────────────────────────────────────
// Configuration
// ──────────────────────────────────────────────

interface RouteConfig {
  path: string;
  roles?: string[];
}

// ✅ Protected PAGE routes (শুধু page/UI routes)
const PROTECTED_PAGE_ROUTES: RouteConfig[] = [
  { path: '/admin', roles: ['admin', 'editor', 'viewer'] },
  { path: '/dashboard', roles: ['admin', 'editor', 'viewer'] },
  { path: '/profile', roles: ['admin', 'editor', 'viewer'] },
];

// ✅ Protected API routes (সব API routes এখানে)
const PROTECTED_API_ROUTES: RouteConfig[] = [
  // ── Staff CRUD (admin only) ──
  { path: '/api/admin/staff/create', roles: ['admin'] },
  { path: '/api/admin/staff/list', roles: ['admin'] },

  // ── Staff [id] operations ──
  // delete, block, unblock = admin only
  // update, sessions, logout-all = সবাই নিজের টা পারবে
  // single view = সবাই
  // ⚠️ Longer paths MUST come first (sorted by length)
  { path: '/api/admin/staff/logout-all', roles: ['admin', 'editor', 'viewer'] },
  { path: '/api/admin/staff/sessions', roles: ['admin', 'editor', 'viewer'] },
  { path: '/api/admin/staff/unblock', roles: ['admin'] },
  { path: '/api/admin/staff/delete', roles: ['admin'] },
  { path: '/api/admin/staff/block', roles: ['admin'] },
  { path: '/api/admin/staff/update', roles: ['admin', 'editor', 'viewer'] },
  { path: '/api/admin/staff', roles: ['admin', 'editor', 'viewer'] },

  // ── Profile (all authenticated) ──
  { path: '/api/auth/profile/update', roles: ['admin', 'editor', 'viewer'] },
  { path: '/api/auth/profile', roles: ['admin', 'editor', 'viewer'] },

  // ── Password (all authenticated) ──
  { path: '/api/auth/change-password', roles: ['admin', 'editor', 'viewer'] },

  // ── Logout (all authenticated) ──
  { path: '/api/auth/logout', roles: ['admin', 'editor', 'viewer'] },

  // ── Session management (admin only) ──
  { path: '/api/admin/sessions', roles: ['admin'] },

  // ── Activity log (admin sees all, others see own) ──
  { path: '/api/admin/activity-log', roles: ['admin', 'editor', 'viewer'] },

  // ── Dashboard stats (admin only) ──
  { path: '/api/dashboard/stats', roles: ['admin',"editor"] },
];

// ✅ Public API routes (auth লাগবে না)
const PUBLIC_API_ROUTES: string[] = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/auth/verify',
  '/api/public',
  '/api/cron',
];

// ✅ Auth pages (logged in user access করলে → redirect)
const AUTH_ROUTES: string[] = [
  '/access',
  '/signup',
  '/forgot-password',
  '/reset-password',
];

// ✅ Login success এ কোথায় redirect হবে
const DEFAULT_REDIRECT = '/admin';

const TOKEN_EXPIRY_WARNING = 5 * 60;

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

interface AuthPayload extends JWTPayload {
  userId?: string;
  id?: string;
  role: string;
  email: string;
  sessionId?: string;
}

interface AuthResult {
  isAuthenticated: boolean;
  payload: AuthPayload | null;
  isExpiringSoon: boolean;
  error: 'TOKEN_EXPIRED' | 'INVALID_SIGNATURE' | 'INVALID_TOKEN' | null;
}

// ──────────────────────────────────────────────
// Helper Functions
// ──────────────────────────────────────────────

async function verifyToken(token: string): Promise<AuthResult> {
  const result: AuthResult = {
    isAuthenticated: false,
    payload: null,
    isExpiringSoon: false,
    error: null,
  };

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error('[Middleware] JWT_SECRET missing');
    return result;
  }

  try {
    const encodedSecret = new TextEncoder().encode(secret);
    const { payload } = await jwtVerify(token, encodedSecret);

    result.isAuthenticated = true;
    result.payload = payload as AuthPayload;

    if (payload.exp) {
      const now = Math.floor(Date.now() / 1000);
      result.isExpiringSoon = (payload.exp - now) < TOKEN_EXPIRY_WARNING;
    }
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('expired')) {
        result.error = 'TOKEN_EXPIRED';
      } else if (error.message.includes('signature')) {
        result.error = 'INVALID_SIGNATURE';
      } else {
        result.error = 'INVALID_TOKEN';
      }
    }
  }

  return result;
}

function findMatchingRoute(
  pathname: string,
  routes: RouteConfig[]
): RouteConfig | undefined {
  // ✅ Sort by path length DESC = more specific match first
  const sorted = [...routes].sort(
    (a, b) => b.path.length - a.path.length
  );
  return sorted.find((route) => pathname.startsWith(route.path));
}

function isPublicApiRoute(pathname: string): boolean {
  return PUBLIC_API_ROUTES.some((route) => pathname.startsWith(route));
}

function hasRequiredRole(
  userRole: string | undefined,
  allowedRoles?: string[]
): boolean {
  if (!allowedRoles || allowedRoles.length === 0) return true;
  if (!userRole) return false;
  return allowedRoles.includes(userRole);
}

function setSecurityHeaders(response: NextResponse): void {
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains; preload'
  );
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  );
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ')
  );
}

function clearAuthCookie(response: NextResponse): void {
  response.cookies.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}

function createRedirect(
  url: string,
  req: NextRequest,
  params?: Record<string, string>
): NextResponse {
  const redirectUrl = new URL(url, req.url);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      redirectUrl.searchParams.set(key, value);
    });
  }
  const response = NextResponse.redirect(redirectUrl);
  setSecurityHeaders(response);
  return response;
}

function createApiError(
  message: string,
  statusCode: number = 401
): NextResponse {
  const response = NextResponse.json(
    { success: false, message },
    { status: statusCode }
  );
  setSecurityHeaders(response);
  return response;
}

// ──────────────────────────────────────────────
// Main Middleware
// ──────────────────────────────────────────────

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isApiRoute = pathname.startsWith('/api');

  // ─── Static files skip ───
  if (pathname.startsWith('/_next') || pathname.includes('.')) {
    return NextResponse.next();
  }

  // ─── Public API routes ───
  if (isApiRoute && isPublicApiRoute(pathname)) {
    const response = NextResponse.next();
    setSecurityHeaders(response);
    return response;
  }

  // ─── Token Verification ───
  const token = req.cookies.get(COOKIE_NAME)?.value;
  const auth: AuthResult = token
    ? await verifyToken(token)
    : {
        isAuthenticated: false,
        payload: null,
        isExpiringSoon: false,
        error: null,
      };

  // ═══════════════════════════════════════════
  // 🛡️ API ROUTE PROTECTION
  // ═══════════════════════════════════════════
  if (isApiRoute) {
    const matchedApiRoute = findMatchingRoute(
      pathname,
      PROTECTED_API_ROUTES
    );

    if (matchedApiRoute) {
      // ❌ Not authenticated
      if (!auth.isAuthenticated || !auth.payload) {
        const errorMsg =
          auth.error === 'TOKEN_EXPIRED'
            ? 'Session expired - Please login again'
            : 'Unauthorized - Please login';

        const response = createApiError(errorMsg, 401);
        if (token) clearAuthCookie(response);
        return response;
      }

      // ❌ Role check
      if (!hasRequiredRole(auth.payload.role, matchedApiRoute.roles)) {
        console.warn(
          `[Middleware] API 403: ${auth.payload.email} (${auth.payload.role}) → ${pathname}`
        );
        return createApiError(
          'Forbidden - You do not have permission',
          403
        );
      }

      // ✅ Pass auth info via headers
      const adminId = auth.payload.id || auth.payload.userId || '';

      const response = NextResponse.next({
        request: {
          headers: new Headers({
            ...Object.fromEntries(req.headers),
            'x-admin-id': adminId,
            'x-admin-role': auth.payload.role || '',
            'x-admin-email': auth.payload.email || '',
            'x-session-id': auth.payload.sessionId || '',
          }),
        },
      });

      setSecurityHeaders(response);
      if (auth.isExpiringSoon) {
        response.headers.set('x-token-expiring-soon', 'true');
      }
      return response;
    }

    // API route not in protected list → allow
    const response = NextResponse.next();
    setSecurityHeaders(response);
    return response;
  }

  // ═══════════════════════════════════════════
  // 🛡️ PAGE ROUTE PROTECTION
  // ═══════════════════════════════════════════
  const matchedPageRoute = findMatchingRoute(
    pathname,
    PROTECTED_PAGE_ROUTES
  );

  if (matchedPageRoute) {
    // ❌ Not authenticated → redirect to login
    if (!auth.isAuthenticated) {
      const response = createRedirect('/access', req, {
        redirect: pathname,
        ...(auth.error === 'TOKEN_EXPIRED' && {
          reason: 'session_expired',
        }),
      });
      if (token) clearAuthCookie(response);
      return response;
    }

    // ❌ Role not allowed → unauthorized page
    if (!hasRequiredRole(auth.payload?.role, matchedPageRoute.roles)) {
      console.warn(
        `[Middleware] Page 403: ${auth.payload?.email} (${auth.payload?.role}) → ${pathname}`
      );
      return createRedirect('/unauthorized', req);
    }
  }

  // ═══════════════════════════════════════════
  // 🔄 AUTH ROUTE (logged in user → redirect out)
  // ═══════════════════════════════════════════
  const isAuthRoute = AUTH_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  if (isAuthRoute && auth.isAuthenticated) {
    const redirectTo =
      req.nextUrl.searchParams.get('redirect') || DEFAULT_REDIRECT;
    return createRedirect(redirectTo, req);
  }

  // ═══════════════════════════════════════════
  // ✅ ALLOW REQUEST
  // ═══════════════════════════════════════════
  const response = NextResponse.next();
  setSecurityHeaders(response);

  if (auth.isAuthenticated && auth.payload) {
    response.headers.set(
      'x-user-id',
      auth.payload.id || auth.payload.userId || ''
    );
    response.headers.set('x-user-role', auth.payload.role || '');
    response.headers.set('x-user-email', auth.payload.email || '');
    if (auth.payload.sessionId) {
      response.headers.set('x-session-id', auth.payload.sessionId);
    }
  }

  if (auth.isExpiringSoon) {
    response.headers.set('x-token-expiring-soon', 'true');
  }

  return response;
}

// ──────────────────────────────────────────────
// Matcher
// ──────────────────────────────────────────────

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|public|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf|eot)$).*)',
  ],
};