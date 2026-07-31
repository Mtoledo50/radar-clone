import axios, { AxiosError } from 'axios';
import { useAuthStore } from '@/store/authStore';

/**
 * Instância do Axios configurada para a API do backend
 * 
 * POR QUE USAR UMA INSTÂNCIA?
 * - Define baseURL uma única vez (não precisa repetir em cada chamada)
 * - Permite interceptors globais (adiciona token automaticamente)
 * - Tratamento centralizado de erros (ex: 401 → logout)
 */
const api = axios.create({
  // URL base da API (backend NestJS)
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  
  // Headers padrão
  headers: {
    'Content-Type': 'application/json',
  },
  
  // Timeout de 30 segundos (evita requisições travadas)
  timeout: 30000,
});

/**
 * INTERCEPTOR DE REQUISIÇÃO
 * 
 * ANTES de cada requisição ser enviada:
 * 1. Pega o token atual do Zustand
 * 2. Se existir token, adiciona no header Authorization
 * 3. Retorna a config modificada para o axios enviar
 * 
 * POR QUE FAZER ISSO AQUI?
 * - Não precisamos lembrar de passar o token em cada chamada
 * - api.get('/employees') já vai com o token automaticamente
 * - Se o token mudar (ex: refresh), as próximas requisições usam o novo
 */
api.interceptors.request.use(
  (config) => {
    const { token } = useAuthStore.getState();
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * INTERCEPTOR DE RESPOSTA
 * 
 * DEPOIS de cada resposta do servidor:
 * - Se sucesso (2xx): retorna normalmente
 * - Se erro 401 (Unauthorized): token inválido/expirado → faz logout
 * - Outros erros: apenas repassa para o código tratar
 * 
 * POR QUE LOGOUT NO 401?
 * - Se o backend rejeita o token, significa que a sessão acabou
 * - Manter o usuário "logado" no frontend seria inconsistente
 * - Redirecionar para /login força um novo login
 */
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Se o erro é 401 (Unauthorized)
    if (error.response?.status === 401) {
      console.warn('Token expirado ou inválido - fazendo logout');
      
      // Limpa o store (remove user e token do localStorage)
      useAuthStore.getState().logout();
      
      // Redireciona para login (apenas no browser)
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;