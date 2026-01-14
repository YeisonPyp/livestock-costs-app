export interface Category {
  id: number;
  code: string;
  name: string;
  description: string;
  parent: number | null;
  level: number;
  is_movement: boolean;
}

export interface CategoryTree extends Category {
  subcategories: CategoryTree[];
}
