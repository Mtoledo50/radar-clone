// backend/src/comunicados/cnpj-parser/cnpj-parser.service.ts
import { Injectable } from '@nestjs/common';

@Injectable()
export class CnpjParserService {
  /**
   * Extrai TODOS os candidatos de CNPJ do nome do arquivo (com/sem pontuação).
   * Retorna array vazio se nenhum for detectado.
   * ADR-118: aceita com ou sem pontuação.
   */
  extrairTodos(nomeArquivo: string): string[] {
    if (!nomeArquivo) return [];
    const regex = /\b(\d{2}[.\-\/]?\d{3}[.\-\/]?\d{3}[.\-\/]?\d{4}[.\-\/]?\d{2})\b/g;
    const matches = nomeArquivo.matchAll(regex);
    return Array.from(matches)
      .map((m) => m[1].replace(/\D/g, ''))
      .filter((c) => this.validarChecksum(c));
  }

  /**
   * Retorna o PRIMEIRO CNPJ válido (apenas dígitos) ou null.
   */
  extrairPrimeiro(nomeArquivo: string): string | null {
    return this.extrairTodos(nomeArquivo)[0] ?? null;
  }

  /**
   * Formata um CNPJ (14 dígitos) para exibição: XX.XXX.XXX/XXXX-XX
   */
  formatar(cnpj: string): string {
    const c = cnpj.replace(/\D/g, '');
    if (c.length !== 14) return cnpj;
    return c.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  }

  /**
   * Validação de dígito verificador (Módulo 11).
   * Rejeita sequências repetidas (00.000.000/0000-00, 11.111.111/1111-11, etc).
   */
  validarChecksum(bruto: string): boolean {
    const c = bruto.replace(/\D/g, '');
    if (c.length !== 14) return false;
    if (/^(\d)\1{13}$/.test(c)) return false;

    const digito = (base: string, pesos: number[]): number => {
      const soma = base.split('').reduce(
        (acc, d, i) => acc + parseInt(d, 10) * pesos[i], 0);
      const resto = soma % 11;
      return resto < 2 ? 0 : 11 - resto;
    };

    const P1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const P2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const base = c.slice(0, 12);
    const d1 = digito(base, P1);
    const d2 = digito(base + d1, P2);
    return `${d1}${d2}` === c.slice(12);
  }

  /**
   * Calcula score de confiança (0..1) baseado em quantos CNPJs válidos
   * foram encontrados e se foram encontrados no início/meio do nome.
   */
  calcularConfianca(nomeArquivo: string, clienteEncontrado: boolean): number {
    const encontrados = this.extrairTodos(nomeArquivo);
    if (encontrados.length === 0) return 0;
    if (!clienteEncontrado) return 0.3; // CNPJ válido, mas sem cliente
    return 1.0; // CNPJ válido + cliente encontrado
  }
}