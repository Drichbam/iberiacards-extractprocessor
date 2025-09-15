export interface Shop {
  id: string;
  shop_name: string;
  category: string;
  created_at: string;
  modified_at: string;
}

export interface CreateShopRequest {
  shop_name: string;
  category: string;
}

export interface UpdateShopRequest {
  shop_name: string;
  category: string;
}

export const SHOP_CATEGORIES = [
  "Groceries",
  "Restaurants",
  "Gas Stations",
  "Shopping",
  "Entertainment",
  "Healthcare",
  "Transportation",
  "Bills & Utilities",
  "Other"
] as const;

export type ShopCategory = typeof SHOP_CATEGORIES[number];