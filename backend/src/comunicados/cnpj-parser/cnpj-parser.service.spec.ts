// backend/src/comunicados/cnpj-parser/cnpj-parser.service.spec.ts
import { Test } from '@nestjs/testing';
import { CnpjParserService } from './cnpj-parser.service';

describe('CnpjParserService', () => {
  let service: CnpjParserService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [CnpjParserService],
    }).compile();
    service = module.get(CnpjParserService);
  });

  describe('validarChecksum', () => {
    it('valida CNPJ correto sem pontuação', () => {
      expect(service.validarChecksum('11222333000181')).toBe(true);
    });

    it('valida CNPJ correto com pontuação', () => {
      expect(service.validarChecksum('11.222.333/0001-81')).toBe(true);
    });

    it('rejeita CNPJ com DV incorreto', () => {
      expect(service.validarChecksum('11222333000182')).toBe(false);
    });

    it('rejeita sequências repetidas (14 zeros, 14 uns...)', () => {
      expect(service.validarChecksum('00000000000000')).toBe(false);
      expect(service.validarChecksum('11111111111111')).toBe(false);
      expect(service.validarChecksum('99999999999999')).toBe(false);
    });

    it('rejeita strings que não são CNPJ', () => {
      expect(service.validarChecksum('123')).toBe(false);
      expect(service.validarChecksum('')).toBe(false);
    });
  });

  describe('extrairPrimeiro', () => {
    it('extrai CNPJ no padrão DAS_CNPJ_COMP.pdf', () => {
      expect(service.extrairPrimeiro('DAS_11222333000181_JAN2026.pdf'))
        .toBe('11222333000181');
    });

    it('extrai CNPJ com pontuação', () => {
      expect(service.extrairPrimeiro('11.222.333-0001-81-DARF-012026.pdf'))
        .toBe('11222333000181');
    });

    it('extrai CNPJ no meio do nome', () => {
      expect(service.extrairPrimeiro('informe_rendimento_11222333000181_2026.pdf'))
        .toBe('11222333000181');
    });

    it('retorna null quando não há CNPJ válido', () => {
      expect(service.extrairPrimeiro('relatorio_gerencial.pdf')).toBe(null);
    });

    it('ignora CNPJ inválido e pega o válido seguinte', () => {
      // Primeiro é repetido (inválido), segundo é válido
      const nome = '00000000000000_DAS_11222333000181.pdf';
      expect(service.extrairPrimeiro(nome)).toBe('11222333000181');
    });
  });

  describe('formatar', () => {
    it('formata 14 dígitos para XX.XXX.XXX/XXXX-XX', () => {
      expect(service.formatar('11222333000181')).toBe('11.222.333/0001-81');
    });

    it('retorna input se não for 14 dígitos', () => {
      expect(service.formatar('123')).toBe('123');
    });
  });

  describe('calcularConfianca', () => {
    it('1.0 quando CNPJ válido + cliente encontrado', () => {
      expect(service.calcularConfianca('DAS_11222333000181.pdf', true)).toBe(1.0);
    });

    it('0.3 quando CNPJ válido mas sem cliente', () => {
      expect(service.calcularConfianca('DAS_11222333000181.pdf', false)).toBe(0.3);
    });

    it('0.0 quando nenhum CNPJ detectado', () => {
      expect(service.calcularConfianca('relatorio.pdf', false)).toBe(0);
    });
  });
});