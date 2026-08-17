// =================================================================
// INÍCIO: frontend/src/lib/api.ts
// =================================================================
// Instância Axios global do Radar Conta Certa.
// - Base URL vem de NEXT_PUBLIC_API_URL (ou localhost:3001)
// - Interceptor de request: injeta Bearer token automaticamente
// - Interceptor de response: trata 401 (logout/redireciona)
//
// Uso: import api from '@/lib/api';
//      api.get('/digital-employee').then(...)
// =================================================================
import axios from 'axios';

// Base URL: prioriza env, cai em localhost:3001
const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== 'undefined' && window.location.hostname === 'localhost'
    ? 'http://localhost:3001'
    : 'http://localhost:3001');

const api = axios.create({
  baseURL: API_URL,
  timeout: 30_000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// -----------------------------------------------------------------
// 🔑 Interceptor de REQUEST — injeta JWT em todas as chamadas
// -----------------------------------------------------------------
api.interceptors.request.use((config) => {
  // Tenta múltiplas fontes de token (compatível com várias convenções)
  let token: string | null = null;

  if (typeof window !== 'undefined') {
    token =
      localStorage.getItem('token') ||
      localStorage.getItem('auth_token') ||
      localStorage.getItem('accessToken') ||
      sessionStorage.getItem('token') ||
      sessionStorage.getItem('auth_token');
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// -----------------------------------------------------------------
// 🚪 Interceptor de RESPONSE — trata 401 globalmente
// -----------------------------------------------------------------
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // 401 = token expirado ou inválido → limpa e redireciona pro login
    if (error?.response?.status === 401 && typeof window !== 'undefined') {
      const currentPath = window.location.pathname;
      if (currentPath !== '/login' && currentPath !== '/') {
        localStorage.removeItem('token');
        localStorage.removeItem('auth_token');
        localStorage.removeItem('accessToken');
        // Só redireciona se não estivermos já na tela de login
        window.location.href = `/login?from=${encodeURIComponent(currentPath)}`;
      }
    }
    return Promise.reject(error);
  },
);

export default api;
// =================================================================
// FIM: frontend/src/lib/api.ts
// =================================================================