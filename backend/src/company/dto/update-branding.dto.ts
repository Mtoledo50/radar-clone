// =================================================================
// INÍCIO: backend/src/company/dto/update-branding.dto.ts
// =================================================================
/**
 * =================================================================
 * UpdateBrandingDto — Sprint A5 (White-label da Proposta Pública)
 * =================================================================
 * Contrato de entrada do endpoint PATCH /company/branding.
 *
 * 🎨 Campos:
 * - primaryColor:     cor primária (headers, botões CTA, badges)
 * - secondaryColor:   cor de destaque (acentos, ícones, links)
 * - proposalFooterText: texto livre do rodapé da proposta pública
 *
 * 🛡️ Segurança:
 * - Regex de hex (#RGB ou #RRGGBB) impede injeção de CSS malicioso.
 * - MaxLength 300 no rodapé evita abuso de armazenamento.
 * - Todos os campos são OPCIONAIS: null = "usar padrão Conta Certa"
 *   (fallback teal #0d9488 / laranja #f97316 — ADR-043).
 *
 * ADRs aplicados:
 * - ADR-011: zero dependências opcionais em DTOs (tudo tipado).
 * - ADR-043: fallback Conta Certa quando o tenant não personaliza.
 * =================================================================
 */
import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';

/**
 * Regex de validação de cor hexadecimal.
 * Aceita: #RGB (ex.: #f00) e #RRGGBB (ex.: #ff0000), maiúsc./minúsc.
 * Rejeita: sem '#', caracteres inválidos ou comprimento errado.
 */
const HEX_COLOR_REGEX = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;

export class UpdateBrandingDto {
  /**
   * Cor primária do escritório.
   * Exemplos válidos: "#dc2626", "#0d9488", "#f00".
   * Null/ausente = mantém padrão Conta Certa (teal).
   */
  @IsOptional()
  @IsString()
  @Matches(HEX_COLOR_REGEX, {
    message: 'primaryColor deve ser uma cor hex válida (ex.: #0d9488 ou #f00)',
  })
  primaryColor?: string | null;

  /**
   * Cor de destaque do escritório.
   * Exemplos válidos: "#facc15", "#f97316", "#fa0".
   * Null/ausente = mantém padrão Conta Certa (laranja).
   */
  @IsOptional()
  @IsString()
  @Matches(HEX_COLOR_REGEX, {
    message: 'secondaryColor deve ser uma cor hex válida (ex.: #f97316 ou #fa0)',
  })
  secondaryColor?: string | null;

  /**
   * Texto do rodapé da proposta pública (opcional).
   * Ex.: "Contato: (11) 9999-9999 • contato@escritorio.com.br"
   */
  @IsOptional()
  @IsString()
  @MaxLength(300, {
    message: 'proposalFooterText deve ter no máximo 300 caracteres',
  })
  proposalFooterText?: string | null;
}
// =================================================================
// FIM: backend/src/company/dto/update-branding.dto.ts
// =================================================================