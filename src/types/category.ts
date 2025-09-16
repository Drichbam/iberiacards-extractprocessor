export interface Category {
  id: string;
  name: string;
  color: string;
  created_at: string;
  modified_at: string;
}

export interface CreateCategoryRequest {
  name: string;
  color: string;
}

export interface UpdateCategoryRequest {
  name: string;
  color: string;
}