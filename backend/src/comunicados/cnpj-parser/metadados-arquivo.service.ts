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

  // 🔧 ADR-118 — Usamos lookarounds em vez de \b porque
  // underscore (_) é word char em JS e \b falha em "DAS_123456..."
  private readonly PADROES_TIPO: Array<{
    regex: RegExp;
    tipo: TipoDocumentoComunicado;
  }> = [
    { regex: /(?<![A-Za-z0-9])DAS(?![A-Za-z0-9])/i, tipo: TipoDocumentoComunicado.DAS },
    { regex: /(?<![A-Za-z0-9])DARF(?![A-Za-z0-9])/i, tipo: TipoDocumentoComunicado.DARF },
    { regex: /(?<![A-Za-z0-9])ISS(?![A-Za-z0-9])/i, tipo: TipoDocumentoComunicado.ISS },
    { regex: /(?<![A-Za-z0-9])(FGTS|SEFIP)(?![A-Za-z0-9])/i, tipo: TipoDocumentoComunicado.FGTS },
    { regex: /(?<![A-Za-z0-9])IRPF(?![A-Za-z0-9])|IMPOSTO[_ ]?RENDA/i, tipo: TipoDocumentoComunicado.IRPF },
    { regex: /(?<![A-Za-z0-9])(BALANCETE|RAZAO)(?![A-Za-z0-9])/i, tipo: TipoDocumentoComunicado.BALANCETE },
    { regex: /(?<![A-Za-z0-9])DRE(?![A-Za-z0-9])/i, tipo: TipoDocumentoComunicado.DRE },
    { regex: /INFORME[_ ]?RENDIMENTO/i, tipo: TipoDocumentoComunicado.INFORME_RENDIMENTO },
    { regex: /E[_-]?SOCIAL/i, tipo: TipoDocumentoComunicado.E_SOCIAL },
    { regex: /(?<![A-Za-z0-9])SPED(?![A-Za-z0-9])/i, tipo: TipoDocumentoComunicado.SPED },
  ];

  private readonly MESES: Record<string, string> = {
    jan: '01', janeiro: '01', january: '01',
    fev: '02', fevereiro: '02', february: '02',
    mar: '03', março: '03', maro: '03', march: '03',
    abr: '04', abril: '04', april: '04',
    mai: '05', maio: '05', may: '05',
    jun: '06', junho: '06', june: '06',
    jul: '07', julho: '07', july: '07',
    ago: '08', agosto: '08', august: '08',
    set: '09', setembro: '09', september: '09',
    out: '10', outubro: '10', october: '10',
    nov: '11', novembro: '11', november: '11',
    dez: '12', dezembro: '12', december: '12',
  };

  extrair(nomeArquivo: string): MetadadosArquivo {
    const nome = nomeArquivo.replace(/\.[^.]+$/, ''); // remove extensão
    return {
      tipoDocumento: this.detectarTipo(nome),
      competencia: this.detectarCompetencia(nome),
      cnpj: this.cnpjParser.extrairPrimeiro(nome),
    };
  }

  private detectarTipo(nome: string): TipoDocumentoComunicado | null {
    for (const { regex, tipo } of this.PADROES_TIPO) {
      if (regex.test(nome)) return tipo;
    }
    return TipoDocumentoComunicado.GENERICO;
  }

  private detectarCompetencia(nome: string): string | null {
    // Padrão 1: mês por extenso + ano (JAN2026, Janeiro-2026, Jan_2026)
    const mesExtenso = nome.match(
      /(?:^|[^A-Za-zÀ-ú])(jan(?:eiro)?|fev(?:ereiro)?|mar[çc]o|abr(?:il)?|mai(?:o)?|jun(?:ho)?|jul(?:ho)?|ago(?:sto)?|set(?:embro)?|out(?:ubro)?|nov(?:embro)?|dez(?:embro)?|january|february|march|april|may|june|july|august|september|october|november|december)[_\-\s]*(20\d{2})/i,
    );
    if (mesExtenso) {
      const mes = this.MESES[mesExtenso[1].toLowerCase().slice(0, 3)];
      if (mes) return `${mesExtenso[2]}-${mes}`;
    }

    // Padrão 2: MMYYYY (012026, 01-2026, 01/2026)
    const mmYYYY = nome.match(/(?<!\d)(\d{2})([\-\/]?)(20\d{2})(?!\d)/);
    if (mmYYYY) {
      const mm = parseInt(mmYYYY[1], 10);
      if (mm >= 1 && mm <= 12) return `${mmYYYY[3]}-${mmYYYY[1]}`;
    }

    // Padrão 3: YYYY-MM
    const yearMonth = nome.match(/(?<!\d)(20\d{2})[\-\/](\d{2})(?!\d)/);
    if (yearMonth) {
      const mm = parseInt(yearMonth[2], 10);
      if (mm >= 1 && mm <= 12) return `${yearMonth[1]}-${yearMonth[2]}`;
    }

    // Padrão 4: YYYY sozinho (anual → mês 12)
    const yearOnly = nome.match(/(?<!\d)(20\d{2})(?!\d)/);
    if (yearOnly) return `${yearOnly[1]}-12`;

    return null;
  }
}