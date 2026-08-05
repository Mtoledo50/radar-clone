import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const ADMIN_ONLY_PREFIXES = ['/dashboard/admin'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAdminRoute = ADMIN_ONLY_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  );

  if (!isAdminRoute) {
    return NextResponse.next();
  }

  const token = request.cookies.get('radar_auth_token')?.value;
  const role = request.cookies.get('radar_auth_role')?.value;

  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (role !== 'ADMIN') {
    const dashboardUrl = new URL('/dashboard', request.url);
    dashboardUrl.searchParams.set('denied', '1');
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};