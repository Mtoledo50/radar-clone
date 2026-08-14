/**
 * =================================================================
 * 📄 Proposal Versions Response DTO — Sprint A3
 * =================================================================
 * Define a estrutura que o endpoint GET /proposals/client/:clientId/versions
 * devolve ao Frontend. Agrupa todas as versões de uma proposta para um cliente.
 * =================================================================
 */

/**
 * Representa uma única versão de proposta.
 */
export class ProposalVersionDto {
  id: string;
  proposalNumber: string;
  slug: string;
  clientName: string;
  clientCnpj?: string;
  
  version: number;           // 🆕 Número da versão (1, 2, 3...)
  isCurrent: boolean;        // 🆕 true = versão ativa
  
  status: string;            // DRAFT, SENT, VIEWED, CLOSED_WON, CLOSED_LOST
  basePrice: number;
  closedPrice?: number;
  
  sentAt?: Date;
  closedAt?: Date;
  
  views: number;
  whatsappClicks: number;
  
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Resposta agrupada por cliente.
 */
export class ProposalVersionsResponseDto {
  clientId: string;          // ID do cliente (extraído da primeira proposta)
  clientName: string;        // Nome do cliente
  
  /** Total de versões criadas para este cliente */
  totalVersions: number;
  
  /** Versão atualmente ativa (isCurrent = true) */
  currentVersion?: ProposalVersionDto;
  
  /** Todas as versões ordenadas por version DESC (mais recente primeiro) */
  allVersions: ProposalVersionDto[];
}