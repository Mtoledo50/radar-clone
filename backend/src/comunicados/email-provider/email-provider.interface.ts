// ============================================================================
// SPRINT F13 — Interface EmailProvider (ADR-113)
//
// Abstrai o envio de email para permitir múltiplos providers (log, smtp,
// sendgrid) sem modificar o código de negócio. Cada provider implementa
// o método enviar() e retorna um resultado padronizado.
// ============================================================================

export interface EnviarEmailInput {
  para: string;                 // email destinatário
  assunto: string;
  corpoHtml: string;
  anexos?: Array<{
    nome: string;
    caminho: string;            // caminho absoluto no disco
  }>;
  /** IDs para correlação em logs/webhooks futuros */
  metadata?: {
    envioId: string;
    companyId: string;
  };
}

export interface EnviarEmailOutput {
  sucesso: boolean;
  providerMessageId?: string;   // ID retornado pelo provider (para debugging)
  erro?: string;                // mensagem de erro, se sucesso=false
}

export interface EmailProvider {
  /**
   * Envia um email. NUNCA deve lançar exceções — erros são reportados
   * via EnviarEmailOutput.sucesso=false + campo erro.
   */
  enviar(input: EnviarEmailInput): Promise<EnviarEmailOutput>;
  
  /**
   * Nome do provider (para logs e métricas)
   */
  readonly nome: string;
}