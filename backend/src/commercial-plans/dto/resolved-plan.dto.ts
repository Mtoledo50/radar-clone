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
  badge: string | null;
  color: string | null;
  description: string | null;
  ownItems: ResolvedServiceItemDto[];
  inheritedItems: ResolvedServiceItemDto[];
  allItems: ResolvedServiceItemDto[];
}