// ============================================================================
// SPRINT F13 — EmailTemplateService (ADR-115)
//
// Renderiza templates Handlebars com variáveis padronizadas:
//   {{cliente.nome}}        {{cliente.cnpj}}
//   {{documento.tipo}}      {{documento.competencia}}
//   {{documento.nome}}      {{documento.tamanhoBytes}}
//   {{link.download}}       {{link.expiraEm}}
//   {{empresa.nome}}        {{empresa.id}}
//   {{setor.nome}}
// ============================================================================
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Handlebars from 'handlebars';

export interface TemplateContext {
  cliente: {
    nome: string;
    cnpj: string;
    id: string;
  };
  documento: {
    tipo: string;
    competencia: string;
    nome: string;
    tamanhoBytes: number;
  };
  link: {
    download: string;
    expiraEm: string;
  };
  empresa: {
    nome: string;
    id: string;
  };
  setor: {
    nome: string;
  };
}

@Injectable()
export class EmailTemplateService {
  private readonly logger = new Logger(EmailTemplateService.name);
  private readonly publicBaseUrl: string;

  constructor(private readonly config: ConfigService) {
    this.publicBaseUrl =
      this.config.get<string>('PUBLIC_BASE_URL') ?? 'http://localhost:3001';
  }

  /**
   * Renderiza o template HTML com o contexto fornecido.
   * Usa Handlebars.compile em memória (cache por string — seguro pois
   * templates vêm do banco, não de input do usuário).
   */
  renderizar(templateHtml: string, ctx: TemplateContext): string {
    try {
      const compiled = Handlebars.compile(templateHtml);
      return compiled(ctx);
    } catch (err: any) {
      this.logger.error(`Erro ao renderizar template: ${err.message}`);
      // Fallback: retorna template cru (útil para debug)
      return templateHtml;
    }
  }

  /**
   * Injeta o pixel de tracking (1x1 transparente) no final do HTML.
   * O pixel dispara GET /track/open/{envioId} quando o cliente abre o email.
   * ADR-114: abertura é best-effort (muitos clientes bloqueiam imagens).
   */
  injetarPixelTracking(html: string, envioId: string): string {
    const pixelUrl = `${this.publicBaseUrl}/track/open/${envioId}`;
    const pixel = `<img src="${pixelUrl}" width="1" height="1" style="display:none" alt="" />`;

    // Injeta antes do </body> se existir, senão no final
    if (html.includes('</body>')) {
      return html.replace('</body>', `${pixel}</body>`);
    }
    return html + pixel;
  }

  /**
   * Monta a URL pública de download do documento (com token).
   * ADR-114: link proxy, token UUID como autenticação, expira em DOC_LINK_TTL_DAYS.
   */
  montarUrlDownload(envioId: string, token: string): string {
    return `${this.publicBaseUrl}/track/download/${envioId}/${token}`;
  }
}