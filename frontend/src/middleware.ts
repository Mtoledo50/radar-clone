import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * =================================================================
 * 🛡️ MIDDLEWARE DE PROTEÇÃO DE ROTAS (Next.js Edge)
 * =================================================================
 * Primeira linha de defesa: intercepta requisições ANTES de
 * renderizar a página. Melhora a UX redirecionando rapidamente.
 * 
 * ⚠️ NOTA: Esta NÃO é a segurança principal (cookies podem ser
 * forjados). A proteção real está no RolesGuard do backend.
 * =================================================================
 */

// Rotas que exigem perfil ADMIN
const ADMIN_ONLY_PREFIXES = ['/dashboard/admin'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Verifica se a rota atual é uma rota admin
  const isAdminRoute = ADMIN_ONLY_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  );

  // Se não for rota admin, segue o fluxo normal
  if (!isAdminRoute) {
    return NextResponse.next();
  }

  // Lê os cookies de autenticação (setados pelo authStore)
  const token = request.cookies.get('radar_auth_token')?.value;
  const role = request.cookies.get('radar_auth_role')?.value;

  // Não autenticado → redireciona para login
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Autenticado, mas não é ADMIN → página de acesso negado
  if (role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/forbidden', request.url));
  }

  // ADMIN autenticado → permite acesso
  return NextResponse.next();
}

// Aplica o middleware apenas às rotas de dashboard
export const config = {
  matcher: ['/dashboard/:path*'],
};