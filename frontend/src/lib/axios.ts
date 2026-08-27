import axios from 'axios';
import { reportError } from './sentry'; // 🆕 Sprint 33

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar o token JWT automaticamente
api.interceptors.request.use(
  (config) => {
    // Tenta pegar o token do localStorage (Zustand persiste aqui)
    if (typeof window !== 'undefined') {
      try {
        const authState = JSON.parse(localStorage.getItem('auth-storage') || '{}');
        const token = authState?.state?.token;
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (e) {
        // localStorage não disponível ou JSON inválido
      }
    }
    return config;
  },
  (error) => {
    reportError(error); // 🆕 Sprint 33: captura falhas na montagem da requisição
    return Promise.reject(error);
  },
);

// Interceptor para tratar erros de resposta da API (ex: 401, 500)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    reportError(error); // 🆕 Sprint 33: todo erro de API vai p/ Sentry (se ativo)
    
    if (error.response?.status === 401) {
      // Token expirado ou inválido → redireciona para login
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth-storage');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

export default api;