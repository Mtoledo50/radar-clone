/**
 * =================================================================
 * 📄 Resolved Plan DTO — Contrato de Resposta da Sprint A2
 * =================================================================
 * Define a estrutura que o endpoint /resolved devolve ao Frontend.
 * Diferente do DTO padrão, este já traz os itens "desnormalizados"
 * (com nome e categoria) e separa o que é próprio do que é herdado.
 * =================================================================
 */

/**
 * Representa um item de serviço já enriquecido com dados da categoria.
 */
export class ResolvedServiceItemDto {
  id: string;
  name: string;
  categoryId: string;
  categoryName: string;
  
  /** 🔥 NOVO: Flag para a UI destacar visualmente itens herdados */
  isInherited: boolean; 
}

/**
 * Representa um plano comercial com a herança já calculada.
 */
export class ResolvedPlanDto {
  id: string;
  name: string;
  multiplier: number;
  isIndependent: boolean;
  order: number; // Posição na vitrine (0 = mais barato)
  
  badge?: string;
  color?: string;
  description?: string;

  /** Itens marcados manualmente neste plano */
  ownItems: ResolvedServiceItemDto[];
  
  /** Itens que vieram de planos menores (herança) */
  inheritedItems: ResolvedServiceItemDto[];
  
  /** Lista completa (próprios + herdados) sem duplicatas */
  allItems: ResolvedServiceItemDto[];
}