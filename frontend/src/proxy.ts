import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// =================================================================
// 🌐 Proxy — Next.js 16 (antigo middleware)
// =================================================================
// ⚠️ DECISÃO DE ARQUITETURA (CTO):
// Este proxy NÃO faz validação de autenticação. Motivo técnico:
//
// 1. O access token JWT é armazenado em localStorage (via Zustand
//    persist no authStore). O servidor NÃO tem acesso ao localStorage
//    do navegador durante navegações de página — apenas o axios envia
//    o token via header Authorization nas chamadas de API.
//
// 2. Se tentássemos proteger rotas aqui lendo o header Authorization,
//    TODA navegação direta (ex: acessar /dashboard/* pela barra de
//    endereço) seria bloqueada, prendendo o usuário no login.
//    (Bug que foi identificado e corrigido na Sprint 8.)
//
// 🛡️ Como a autenticação é feita então (2 camadas):
//   - CLIENT-SIDE: o DashboardLayout verifica o token via
//     useAuthStore (Zustand) e redireciona para /login se ausente.
//   - SERVER-SIDE (API): o backend valida o JWT em TODAS as rotas
//     via JwtAuthGuard + RolesGuard (padrão enterprise do README).
//   - REFRESH TOKEN: httpOnly Cookie com 7 dias (fluxo /auth/refresh).
//
// Este proxy é um pass-through que permite futuras regras de rede
// (rate limiting, redirects de marketing, A/B testing) sem quebrar
// o fluxo de autenticação.
// =================================================================

/**
 * Função principal do Proxy (executada antes de cada requisição).
 * Next.js 16: a exportação deve se chamar `proxy` (ou default).
 *
 * @param request - Requisição recebida
 * @returns NextResponse.next() → continua o fluxo normalmente
 */
export function proxy(request: NextRequest) {
  // Pass-through: todas as requisições seguem para o roteador.
  // A proteção de rotas é feita em 2 camadas seguras:
  //   1. Client-side (DashboardLayout + Zustand)
  //   2. Server-side (JwtAuthGuard no backend)
  return NextResponse.next();
}

// =================================================================
// 🎯 Configuração do Proxy (Matcher)
// =================================================================
// Ignora rotas de API, arquivos estáticos e otimização de imagens
// para não processar requisições desnecessárias.
// =================================================================
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};