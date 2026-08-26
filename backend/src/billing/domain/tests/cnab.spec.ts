/**
 * =================================================================
 * Testes do domínio CNAB (Fase 2 — FD-5)
 * Rodar: npm run test -- --testPathPattern=cnab
 * =================================================================
 */

import { buildCnab240Remessa } from '../cnab240-builder';
import { parseCnab240 } from '../cnab240-parser';
import { buildCnab400Remessa } from '../cnab400-builder';
import { parseCnab400 } from '../cnab400-parser';
import {
  formatMonetaryValue,
  formatDate,
  validateCPF,
  validateCNPJ,
} from '../cnab-validator';
import { CnabBoleto, CnabConfig } from '../cnab-types';

// ── Fixtures ─────────────────────────────────────────────────────
const config: CnabConfig = {
  banco: 'bb',
  formato: '240',
  cedenteNome: 'CONTA CERTA SOLUCOES',
  cedenteDocumento: '12345678000195',
  cedenteAgencia: '0001',
  cedenteConta: '123456',
  cedenteCarteira: '17',
};

const boleto: CnabBoleto = {
  nossoNumero: '00000000000000000001',
  numeroDocumento: 'FAT-2026-001',
  vencimento: new Date(2026, 8, 10), // 10/09/2026
  valor: 1234.56,
  sacadoNome: 'GRUPO ESCOTEIRO DO MAR',
  sacadoDocumento: '04200503964',
  sacadoEndereco: 'RUA A, 1',
  sacadoCidade: 'ALVORADA',
  sacadoUF: 'RS',
  sacadoCEP: '91000000',
};

// Monta uma linha de 400 colocando valores nas posições (1-based) que o PARSER lê
function line400(parts: Record<number, string>): string {
  const chars = Array(400).fill(' ');
  for (const [pos, val] of Object.entries(parts)) {
    const p = parseInt(pos, 10) - 1;
    for (let i = 0; i < val.length; i++) chars[p + i] = val[i];
  }
  return chars.join('');
}

// ── Valida