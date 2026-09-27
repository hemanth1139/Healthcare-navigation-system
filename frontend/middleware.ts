import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Public routes that unauthenticated users can freely access
const PUBLIC_PATHS = [
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/privacy',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Allow Next.js static files, images, APIs, and public assets
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // 2. Allow explicitly public paths
  const isPublic = PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(path + '/'));

  // 3. For protected dashboard paths, pass through to layout hydration
  // (JWT access & refresh tokens are managed by client AuthContext in localStorage & in-memory)
  const response = NextResponse.next();
  response.headers.set('x-current-path', pathname);
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
