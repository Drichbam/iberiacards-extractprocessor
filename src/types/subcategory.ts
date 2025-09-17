export interface Subcategory {
  id: string;
  name: string;
  color: string;
  category_id: string;
  created_at: string;
  modified_at: string;
}

export interface CreateSubcategoryRequest {
  name: string;
  color: string;
  category_id: string;
}

export interface UpdateSubcategoryRequest {
  name: string;
  color: string;
  category_id: string;
}