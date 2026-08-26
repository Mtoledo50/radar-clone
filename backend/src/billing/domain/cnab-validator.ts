/**
 * =================================================================
 * CNAB Validator — Validações de campo (domínio puro)
 * =================================================================
 * Valida tamanhos, formatos e dígitos de campos CNAB.
 *
 * ADR-084: Validações síncronas, sem dependências externas.
 * =================================================================
 */

import { CnabValidationResult } from './cnab-types';

/**
 * Valida um campo de texto (tamanho fixo ou variável)
 * @param value Valor a validar
 * @param fieldName Nome do campo (para mensagem de erro)
 * @param minLength Tamanho mínimo
 * @param maxLength Tamanho máximo
 */
export function validateTextField(
  value: string,
  fieldName: string,
  minLength: number,
  maxLength: number,
): CnabValidationResult {
  const errors: string[] = [];

  if (!value || value.trim().length === 0) {
    errors.push(`${fieldName} não pode ser vazio`);
  } else if (value.length < minLength) {
    errors.push(`${fieldName} deve ter pelo menos ${minLength} caracteres`);
  } else if (value.length > maxLength) {
    errors.push(`${fieldName} não pode ter mais de ${maxLength} caracteres`);
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Valida um campo numérico (apenas dígitos)
 * @param value Valor a validar
 * @param fieldName Nome do campo
 * @param length Tamanho exato esperado
 */
export function validateNumericField(
  value: string,
  fieldName: string,
  length: number,
): CnabValidationResult {
  const errors: string[] = [];

  if (!value || value.trim().length === 0) {
    errors.push(`${fieldName} não pode ser vazio`);
  } else if (!/^\d+$/.test(value)) {
    errors.push(`${fieldName} deve conter apenas dígitos`);
  } else if (value.length !== length) {
    errors.push(`${fieldName} deve ter exatamente ${length} dígitos`);
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Valida CPF (11 dígitos + dígito verificador)
 */
export function validateCPF(cpf: string): CnabValidationResult {
  const errors: string[] = [];
  const cleanCPF = cpf.replace(/\D/g, '');

  if (cleanCPF.length !== 11) {
    errors.push('CPF deve ter 11 dígitos');
  } else if (/^(\d)\1+$/.test(cleanCPF)) {
    errors.push('CPF inválido (todos os dígitos iguais)');
  } else {
    // Validação do dígito verificador
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
    }
    let remainder = 11 - (sum % 11);
    const digit1 = remainder === 10 || remainder === 11 ? 0 : remainder;

    if (parseInt(cleanCPF.charAt(9)) !== digit1) {
      errors.push('CPF inválido (dígito verificador incorreto)');
    } else {
      sum = 0;
      for (let i = 0; i < 10; i++) {
        sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
      }
      remainder = 11 - (sum % 11);
      const digit2 = remainder === 10 || remainder === 11 ? 0 : remainder;

      if (parseInt(cleanCPF.charAt(10)) !== digit2) {
        errors.push('CPF inválido (dígito verificador incorreto)');
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Valida CNPJ (14 dígitos + dígito verificador)
 */
export function validateCNPJ(cnpj: string): CnabValidationResult {
  const errors: string[] = [];
  const cleanCNPJ = cnpj.replace(/\D/g, '');

  if (cleanCNPJ.length !== 14) {
    errors.push('CNPJ deve ter 14 dígitos');
  } else if (/^(\d)\1+$/.test(cleanCNPJ)) {
    errors.push('CNPJ inválido (todos os dígitos iguais)');
  } else {
    // Validação do dígito verificador
    let sum = 0;
    const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    for (let i = 0; i < 12; i++) {
      sum += parseInt(cleanCNPJ.charAt(i)) * weights1[i];
    }
    let remainder = sum % 11;
    const digit1 = remainder < 2 ? 0 : 11 - remainder;

    if (parseInt(cleanCNPJ.charAt(12)) !== digit1) {
      errors.push('CNPJ inválido (dígito verificador incorreto)');
    } else {
      sum = 0;
      const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
      for (let i = 0; i < 13; i++) {
        sum += parseInt(cleanCNPJ.charAt(i)) * weights2[i];
      }
      remainder = sum % 11;
      const digit2 = remainder < 2 ? 0 : 11 - remainder;

      if (parseInt(cleanCNPJ.charAt(13)) !== digit2) {
        errors.push('CNPJ inválido (dígito verificador incorreto)');
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Valida CEP (8 dígitos)
 */
export function validateCEP(cep: string): CnabValidationResult {
  const cleanCEP = cep.replace(/\D/g, '');
  return validateNumericField(cleanCEP, 'CEP', 8);
}

/**
 * Valida UF (2 letras maiúsculas)
 */
export function validateUF(uf: string): CnabValidationResult {
  const errors: string[] = [];

  if (!uf || uf.length !== 2) {
    errors.push('UF deve ter exatamente 2 letras');
  } else if (!/^[A-Z]{2}$/.test(uf.toUpperCase())) {
    errors.push('UF deve conter apenas letras maiúsculas');
  } else {
    const validUFs = [
      'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
      'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
      'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
    ];
    if (!validUFs.includes(uf.toUpperCase())) {
      errors.push('UF inválida');
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Formata valor monetário para CNAB (sem ponto decimal, preenchido com zeros à esquerda)
 * @param value Valor em reais (ex: 123.45)
 * @param length Tamanho total do campo (ex: 13 para CNAB 240)
 */
export function formatMonetaryValue(value: number, length: number): string {
  const cents = Math.round(value * 100); // Converte para centavos
  return String(cents).padStart(length, '0');
}

/**
 * Formata data para CNAB (DDMMAA ou DDMMAAAA)
 * @param date Data a formatar
 * @param format Formato: 'DDMMAA' (6 dígitos) ou 'DDMMAAAA' (8 dígitos)
 */
export function formatDate(date: Date, format: 'DDMMAA' | 'DDMMAAAA'): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = format === 'DDMMAA'
    ? String(date.getFullYear()).slice(-2)
    : String(date.getFullYear());

  return `${day}${month}${year}`;

}