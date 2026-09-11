// ============================================================================
// SPRINT F13 — LogEmailProvider (ADR-113)
//
// Provider de desenvolvimento: NÃO envia email de verdade. Apenas loga no
// console todos os dados do email (destinatário, assunto, corpo, anexos).
// Útil para desenvolvimento local e testes automatizados sem poluir caixas
// de entrada reais.
// ============================================================================
import { Injectable, Logger } from '@nestjs/common';
import {
  EmailProvider,
  EnviarEmailInput,
  EnviarEmailOutput,
} from './email-provider.interface';

@Injectable()
export class LogEmailProvider implements EmailProvider {
  private readonly logger = new Logger(LogEmailProvider.name);
  readonly nome = 'LOG';

  async enviar(input: EnviarEmailInput): Promise<EnviarEmailOutput> {
    const separator = '═'.repeat(60);
    this.logger.log(`\n${separator}`);
    this.logger.log(`📧 EMAIL (MODO LOG — não enviado de verdade)`);
    this.logger.log(`${separator}`);
    this.logger.log(`  Para:      ${input.para}`);
    this.logger.log(`  Assunto:   ${input.assunto}`);
    this.logger.log(`  EnvioId:   ${input.metadata?.envioId ?? 'N/A'}`);
    this.logger.log(`  Anexos:    ${input.anexos?.length ?? 0}`);
    if (input.anexos?.length) {
      for (const a of input.anexos) {
        this.logger.log(`    📎 ${a.nome} (${a.caminho})`);
      }
    }
    this.logger.log(`\n--- CORPO DO EMAIL (HTML) ---`);
    this.logger.log(input.corpoHtml);
    this.logger.log(`--- FIM DO CORPO ---\n${separator}\n`);

    // Simula um messageId para o provider
    const fakeMessageId = `LOG-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 10)}`;

    return {
      sucesso: true,
      providerMessageId: fakeMessageId,
    };
  }
}