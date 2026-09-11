// backend/src/comunicados/cnpj-parser/metadados-arquivo.service.ts
import { Injectable } from '@nestjs/common';
import { TipoDocumentoComunicado } from '@prisma/client';
import { CnpjParserService } from './cnpj-parser.service';

export interface MetadadosArquivo {
  cnpj: string | null;
  tipoDocumento: TipoDocumentoComunicado | null;
  competencia: string | null; // 'YYYY-MM'
}

@Injectable()
export class MetadadosArquivoService {
  constructor(private readonly cnpjParser: CnpjParserService) {}

  private readonly PADROES_TIPO: Array<{ regex: RegExp; tipo: TipoDocumentoComunicado }> = [
    { regex: /\bDAS\b/i,                   tipo: TipoDocumentoComunicado.DAS },
    { regex: /\bDARF\b/i,                  tipo: TipoDocumentoComunicado.DARF },
    { regex: /\bISS\b/i,                   tipo: TipoDocumentoComunicado.ISS },
    { regex: /\bFGTS\b|\bSEFIP\b/i,        tipo: TipoDocumentoComunicado.FGTS },
    { regex: /\bIRPF\b|\bIMPOSTO[_ ]?RENDA/i, tipo: TipoDocumentoComunicado.IRPF },
    { regex: /\bBALANCETE\b|\bRAZAO\b/i,   tipo: TipoDocumentoComunicado.BALANCETE },
    { regex: /\bDRE\b/i,                   tipo: TipoDocumentoComunicado.DRE },
    { regex: /\bINFORME[_ ]?RENDIMENTO\b/i, tipo: TipoDocumentoComunicado.INFORME_RENDIMENTO },
    { regex: /\bE[_-]?SOCIAL\b/i,          tipo: TipoDocumentoComunicado.E_SOCIAL },
    { regex: /\bSPED\b/i,                  tipo: TipoDocumentoComunicado.SPED },
  ];

  private readonly MESES: Record<string, string> = {
    jan: '01', january: '01', janeiro: '01',
    feb: '02', february: '02', fevereiro: '02', fev: '02',
    mar: '03', march: '03', marco: '03', março: '03',
    apr: '04', april: '04', abril: '04',
    may: '05', maio: '05',
    jun: '06', junho: '06',
    jul: '07', julho: '07',
    aug: '08', august: '08', agosto: '08',
    sep: '09', september: '09', setembro: '09',
    oct: '10', october: '10', outubro: '10',
    nov: '11', november: '11', novembro: '11',
    dec: '12', december: '12', dezembro: '12',
  };

  extrair(nomeArquivo: string): MetadadosArquivo {
    const nome = nomeArquivo.replace(/\.[^.]+$/, ''); // remove extensão
    return {
      cnpj: this.cnpjParser.extrairPrimeiro(nome),
      tipoDocumento: this.detectarTipo(nome),
      competencia: this.detectarCompetencia(nome),
    };
  }

  private detectarTipo(nome: string): TipoDocumentoComunicado | null {
    for (const { regex, tipo } of this.PADROES_TIPO) {
      if (regex.test(nome)) return tipo;
    }
    return TipoDocumentoComunicado.GENERICO;
  }

  private detectarCompetencia(nome: string): string | null {
    // Padrão 1: Mês por extenso + ano (JAN2026, Janeiro-2026, Jan_2026)
    const mesExtenso = nome.match(
      /\b(jan(?:eiro)?|fev(?:ereiro)?|mar[çc]o|abr(?:il)?|mai(?:o)?|jun(?:ho)?|jul(?:ho)?|ago(?:sto)?|set(?:embro)?|out(?:ubro)?|nov(?:embro)?|dez(?:embro)?|january|february|march|april|may|june|july|august|september|october|november|december)[_\-\s]*(20\d{2})/i,
    );
    if (mesExtenso) {
      const mes = this.MESES[mesExtenso[1].toLowerCase().slice(0, 3)]
                ?? this.MESES[mesExtenso[1].toLowerCase()];
      if (mes) return `${mesExtenso[2]}-${mes}`;
    }

    // Padrão 2: MMYYYY (012026, 01-2026, 01/2026)
    const mmYYYY = nome.match(/(?<!\d)(\d{2})([\-\/]?)(20\d{2})(?!\d)/);
    if (mmYYYY) {
      const mm = parseInt(mmYYYY[1], 10);
      if (mm >= 1 && mm <= 12) return `${mmYYYY[3]}-${mmYYYY[1]}`;
    }

    // Padrão 3: YYYY-MM ou YYYY sozinho (IRPF anual → assume ano atual + mês 12)
    const yearMonth = nome.match(/(?<!\d)(20\d{2})[\-\/](\d{2})(?!\d)/);
    if (yearMonth) {
      const mm = parseInt(yearMonth[2], 10);
      if (mm >= 1 && mm <= 12) return `${yearMonth[1]}-${yearMonth[2]}`;
    }

    const yearOnly = nome.match(/(?<!\d)(20\d{2})(?!\d)/);
    if (yearOnly) return `${yearOnly[1]}-12`; // anual

    return null;
  }
}