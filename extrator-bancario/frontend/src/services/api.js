/**
 * Serviço de API - Extrator Bancário
 * 
 * Responsável por toda a comunicação entre o Frontend (React) 
 * e o Backend (FastAPI/Python).
 * 
 * Endpoints:
 * - POST /api/parse-extrato  → Envia PDF e recebe lançamentos extraídos
 * - POST /api/classificar    → Classifica lançamentos com histórico
 * - POST /api/gerar-csv      → Gera CSV no formato Aurora
 * - GET  /api/download/:file → Download do CSV gerado
 */

import axios from 'axios';

// URL base da API (backend FastAPI)
const API_BASE_URL = 'http://localhost:8000';

// Instância do Axios com configurações padrão
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000, // 2 minutos (aumentado para PDFs grandes)
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para log de requisições (útil para debug)
api.interceptors.request.use((config) => {
  console.log(` ${config.method?.toUpperCase()} ${config.url}`);
  return config;
});

/**
 * Envia um arquivo PDF para extração de lançamentos bancários.
 * 
 * @param {File} file - Arquivo PDF do extrato bancário
 * @returns {Promise<Object>} Dados do extrato extraídos
 */
export async function parseExtrato(file) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post('/api/parse-extrato', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    timeout: 120000, // 2 minutos específicos para upload
  });

  return response.data;
}

/**
 * Classifica os lançamentos extraídos comparando com histórico contábil.
 * 
 * @param {Object} extratoData - Dados do extrato parseado
 * @returns {Promise<Object>} Extrato classificado (com D/C e status)
 */
export async function classificarLancamentos(extratoData) {
  const response = await api.post('/api/classificar', extratoData, {
    timeout: 60000, // 60 segundos para classificação
  });

  return response.data;
}

/**
 * Gera CSV no formato Aurora para importação no sistema contábil.
 * 
 * @param {Object} extratoData - Dados do extrato classificado
 * @returns {Promise<Object>} Informações do arquivo CSV gerado
 */
export async function gerarCSV(extratoData) {
  const response = await api.post('/api/gerar-csv', extratoData, {
    timeout: 60000,
  });

  return response.data;
}

/**
 * Retorna a URL completa para download do CSV gerado.
 * 
 * @param {string} filename - Nome do arquivo CSV
 * @returns {string} URL de download
 */
export function getDownloadURL(filename) {
  return `${API_BASE_URL}/api/download/${filename}`;
}

export default api;