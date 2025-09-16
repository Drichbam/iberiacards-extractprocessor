-- Create categories table
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL DEFAULT '#6366f1',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  modified_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on categories table
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations on categories
CREATE POLICY "Allow all operations on categories"
ON public.categories
FOR ALL
USING (true)
WITH CHECK (true);

-- Create trigger for automatic modified_at updates
CREATE TRIGGER update_categories_modified_at
    BEFORE UPDATE ON public.categories
    FOR EACH ROW
    EXECUTE FUNCTION public.update_modified_at_column();

-- Insert existing hardcoded categories
INSERT INTO public.categories (name, color) VALUES
  ('Cafeterías y restaurantes', '#ef4444'),
  ('Compras (otros)', '#f97316'),
  ('Supermercados y alimentación', '#22c55e'),
  ('Deporte y gimnasio', '#3b82f6'),
  ('Peajes', '#8b5cf6'),
  ('Parking y garaje', '#06b6d4'),
  ('Transporte público', '#10b981'),
  ('Hotel y alojamiento', '#f59e0b'),
  ('Belleza, peluquería y perfumería', '#ec4899'),
  ('Cine, teatro y espectáculos', '#8b5cf6'),
  ('Dentista, médico', '#ef4444'),
  ('Loterías y apuestas', '#f97316'),
  ('Libros, música y videojuegos', '#3b82f6'),
  ('Billetes de viaje', '#06b6d4'),
  ('Ropa y complementos', '#ec4899'),
  ('Regalos y juguetes', '#f59e0b'),
  ('Electrónica', '#6b7280'),
  ('Otros seguros', '#10b981'),
  ('Ocio y viajes (otros)', '#8b5cf6'),
  ('Mantenimiento del hogar', '#84cc16'),
  ('Decoración y mobiliario', '#f97316'),
  ('Gasolina y combustible', '#ef4444'),
  ('Pago de impuestos', '#6b7280'),
  ('Taxis y Carsharing', '#06b6d4'),
  ('Otros gastos (otros)', '#9ca3af');

-- Add "Uncategorized" category for fallback
INSERT INTO public.categories (name, color) VALUES ('Uncategorized', '#9ca3af');

-- Add category_id column to shops table
ALTER TABLE public.shops ADD COLUMN category_id UUID REFERENCES public.categories(id);

-- Update existing shops to reference categories by name
UPDATE public.shops 
SET category_id = (
  SELECT c.id 
  FROM public.categories c 
  WHERE c.name = public.shops.category
);

-- Remove the old category column
ALTER TABLE public.shops DROP COLUMN category;