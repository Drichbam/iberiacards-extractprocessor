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
  "Cafeterías y restaurantes",
  "Compras (otros)",
  "Supermercados y alimentación",
  "Deporte y gimnasio",
  "Peajes",
  "Parking y garaje",
  "Transporte público",
  "Hotel y alojamiento",
  "Belleza, peluquería y perfumería",
  "Cine, teatro y espectáculos",
  "Dentista, médico",
  "Loterías y apuestas",
  "Libros, música y videojuegos",
  "Billetes de viaje",
  "Ropa y complementos",
  "Regalos y juguetes",
  "Electrónica",
  "Otros seguros",
  "Ocio y viajes (otros)",
  "Mantenimiento del hogar",
  "Decoración y mobiliario",
  "Gasolina y combustible",
  "Pago de impuestos",
  "Taxis y Carsharing",
  "Otros gastos (otros)"
] as const;

export type ShopCategory = typeof SHOP_CATEGORIES[number];