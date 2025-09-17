-- Create subcategories table (current categories will become subcategories)
CREATE TABLE public.subcategories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6366f1',
  category_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  modified_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on subcategories
ALTER TABLE public.subcategories ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for subcategories
CREATE POLICY "Allow all operations on subcategories" 
ON public.subcategories 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Create trigger for automatic timestamp updates on subcategories
CREATE TRIGGER update_subcategories_modified_at
BEFORE UPDATE ON public.subcategories
FOR EACH ROW
EXECUTE FUNCTION public.update_modified_at_column();

-- Backup existing categories data by renaming table temporarily
ALTER TABLE public.categories RENAME TO categories_backup;

-- Create new main categories table
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL DEFAULT '#6366f1',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  modified_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on new categories
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for new categories
CREATE POLICY "Allow all operations on categories" 
ON public.categories 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Create trigger for automatic timestamp updates on new categories
CREATE TRIGGER update_categories_modified_at
BEFORE UPDATE ON public.categories
FOR EACH ROW
EXECUTE FUNCTION public.update_modified_at_column();

-- Insert the main categories from user's specification
INSERT INTO public.categories (name, color) VALUES
('Nómina y otras prestaciones', '#8B5CF6'),
('Otros ingresos', '#10B981'),
('Inversión', '#F59E0B'),
('Movimientos excluidos', '#6B7280'),
('Ocio y viajes', '#EF4444'),
('Alimentación', '#84CC16'),
('Vehículo y transporte', '#06B6D4'),
('Educación y salud', '#EC4899'),
('Hogar', '#F97316'),
('Otros gastos', '#64748B'),
('Compras', '#3B82F6');

-- Get the "Otros gastos" category ID for default assignment
DO $$
DECLARE
  otros_gastos_id UUID;
  nomina_id UUID;
  otros_ingresos_id UUID;
  inversion_id UUID;
  movimientos_id UUID;
  ocio_id UUID;
  alimentacion_id UUID;
  vehiculo_id UUID;
  educacion_id UUID;
  hogar_id UUID;
  compras_id UUID;
BEGIN
  -- Get all category IDs
  SELECT id INTO nomina_id FROM public.categories WHERE name = 'Nómina y otras prestaciones';
  SELECT id INTO otros_ingresos_id FROM public.categories WHERE name = 'Otros ingresos';
  SELECT id INTO inversion_id FROM public.categories WHERE name = 'Inversión';
  SELECT id INTO movimientos_id FROM public.categories WHERE name = 'Movimientos excluidos';
  SELECT id INTO ocio_id FROM public.categories WHERE name = 'Ocio y viajes';
  SELECT id INTO alimentacion_id FROM public.categories WHERE name = 'Alimentación';
  SELECT id INTO vehiculo_id FROM public.categories WHERE name = 'Vehículo y transporte';
  SELECT id INTO educacion_id FROM public.categories WHERE name = 'Educación y salud';
  SELECT id INTO hogar_id FROM public.categories WHERE name = 'Hogar';
  SELECT id INTO otros_gastos_id FROM public.categories WHERE name = 'Otros gastos';
  SELECT id INTO compras_id FROM public.categories WHERE name = 'Compras';

  -- Migrate specific subcategories to their proper main categories
  -- Nómina y otras prestaciones
  INSERT INTO public.subcategories (id, name, color, category_id, created_at, modified_at)
  SELECT id, name, color, nomina_id, created_at, modified_at
  FROM public.categories_backup 
  WHERE name IN ('Nómina o Pensión', 'Prestación por desempleo');

  -- Otros ingresos
  INSERT INTO public.subcategories (id, name, color, category_id, created_at, modified_at)
  SELECT id, name, color, otros_ingresos_id, created_at, modified_at
  FROM public.categories_backup 
  WHERE name IN ('Ingresos de otras entidades', 'Abono de financiación', 'Otros ingresos (otros)', 'Ingresos de efectivo', 'Ingreso Bizum');

  -- Inversión
  INSERT INTO public.subcategories (id, name, color, category_id, created_at, modified_at)
  SELECT id, name, color, inversion_id, created_at, modified_at
  FROM public.categories_backup 
  WHERE name = 'Fondos de inversión';

  -- Movimientos excluidos
  INSERT INTO public.subcategories (id, name, color, category_id, created_at, modified_at)
  SELECT id, name, color, movimientos_id, created_at, modified_at
  FROM public.categories_backup 
  WHERE name = 'Traspaso entre cuentas';

  -- Ocio y viajes
  INSERT INTO public.subcategories (id, name, color, category_id, created_at, modified_at)
  SELECT id, name, color, ocio_id, created_at, modified_at
  FROM public.categories_backup 
  WHERE name IN ('Ocio y viajes (otros)', 'Libros, música y videojuegos', 'Billetes de viaje', 'Loterías y apuestas', 'Cine, teatro y espectáculos', 'Hotel y alojamiento', 'Cafeterías y restaurantes');

  -- Alimentación
  INSERT INTO public.subcategories (id, name, color, category_id, created_at, modified_at)
  SELECT id, name, color, alimentacion_id, created_at, modified_at
  FROM public.categories_backup 
  WHERE name = 'Supermercados y alimentación';

  -- Vehículo y transporte
  INSERT INTO public.subcategories (id, name, color, category_id, created_at, modified_at)
  SELECT id, name, color, vehiculo_id, created_at, modified_at
  FROM public.categories_backup 
  WHERE name IN ('Peajes', 'Parking y garaje', 'Transporte público', 'Taxis y Carsharing', 'Gasolina y combustible', 'Seguro de coche y moto');

  -- Educación y salud
  INSERT INTO public.subcategories (id, name, color, category_id, created_at, modified_at)
  SELECT id, name, color, educacion_id, created_at, modified_at
  FROM public.categories_backup 
  WHERE name IN ('Dentista, médico', 'Deporte y gimnasio', 'Seguro de vida', 'Seguro de salud', 'Educación');

  -- Hogar
  INSERT INTO public.subcategories (id, name, color, category_id, created_at, modified_at)
  SELECT id, name, color, hogar_id, created_at, modified_at
  FROM public.categories_backup 
  WHERE name IN ('Mantenimiento del hogar', 'Decoración y mobiliario', 'Luz y gas', 'Teléfono, TV e internet', 'Hipoteca');

  -- Compras
  INSERT INTO public.subcategories (id, name, color, category_id, created_at, modified_at)
  SELECT id, name, color, compras_id, created_at, modified_at
  FROM public.categories_backup 
  WHERE name IN ('Electrónica', 'Ropa y complementos', 'Belleza, peluquería y perfumería', 'Regalos y juguetes', 'Liquidación tarjeta de crédito ING', 'Compras (otros)', 'Tarjetas financieras y de crédito');

  -- Otros gastos (everything else)
  INSERT INTO public.subcategories (id, name, color, category_id, created_at, modified_at)
  SELECT id, name, color, otros_gastos_id, created_at, modified_at
  FROM public.categories_backup 
  WHERE name IN ('Comisiones e intereses', 'Otros seguros', 'Gasto Bizum', 'Pago de impuestos', 'Cajeros', 'Otros gastos (otros)', 'Transferencias', 'Otros préstamos y avales');

  -- Handle any remaining unmapped categories (assign to "Otros gastos")
  INSERT INTO public.subcategories (id, name, color, category_id, created_at, modified_at)
  SELECT cb.id, cb.name, cb.color, otros_gastos_id, cb.created_at, cb.modified_at
  FROM public.categories_backup cb
  WHERE cb.id NOT IN (SELECT id FROM public.subcategories);
END $$;

-- Add foreign key constraint for subcategories to categories
ALTER TABLE public.subcategories 
ADD CONSTRAINT fk_subcategories_category_id 
FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE CASCADE;

-- Update shops table to reference subcategories instead of categories
ALTER TABLE public.shops RENAME COLUMN category_id TO subcategory_id;

-- Add foreign key constraint for shops to subcategories
ALTER TABLE public.shops 
ADD CONSTRAINT fk_shops_subcategory_id 
FOREIGN KEY (subcategory_id) REFERENCES public.subcategories(id) ON DELETE SET NULL;

-- Drop the backup table
DROP TABLE public.categories_backup;