/**
 * =================================================================
 * 📄 Resolved Plan DTO — Contrato de Resposta da Sprint A2
 * =================================================================
 */
export class ResolvedServiceItemDto {
  id: string;
  name: string;
  categoryId: string;
  categoryName: string;
  isInherited: boolean; 
}

export class ResolvedPlanDto {
  id: string;
  name: string;
  multiplier: number;
  isIndependent: boolean;
  order: number;
  badge?: string;
  color?: string;
  description?: string;
  ownItems: ResolvedServiceItemDto[];
  inheritedItems: ResolvedServiceItemDto[];
  allItems: ResolvedServiceItemDto[];
}