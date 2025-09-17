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

-- Insert the 8 main categories from user's specification
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

-- Create mapping for existing categories to new structure
DO $$
DECLARE
  category_mapping RECORD;
  main_category_id UUID;
  subcategory_data RECORD;
BEGIN
  -- Define the mapping from subcategory names to main categories
  FOR category_mapping IN 
    SELECT unnest(ARRAY[
      'Nómina o Pensión', 'Nómina y otras prestaciones',
      'Prestación por desempleo', 'Nómina y otras prestaciones',
      'Ingresos de otras entidades', 'Otros ingresos',
      'Abono de financiación', 'Otros ingresos',
      'Otros ingresos (otros)', 'Otros ingresos',
      'Ingresos de efectivo', 'Otros ingresos',
      'Ingreso Bizum', 'Otros ingresos',
      'Fondos de inversión', 'Inversión',
      'Traspaso entre cuentas', 'Movimientos excluidos',
      'Ocio y viajes (otros)', 'Ocio y viajes',
      'Libros, música y videojuegos', 'Ocio y viajes',
      'Billetes de viaje', 'Ocio y viajes',
      'Loterías y apuestas', 'Ocio y viajes',
      'Cine, teatro y espectáculos', 'Ocio y viajes',
      'Hotel y alojamiento', 'Ocio y viajes',
      'Cafeterías y restaurantes', 'Ocio y viajes',
      'Supermercados y alimentación', 'Alimentación',
      'Peajes', 'Vehículo y transporte',
      'Parking y garaje', 'Vehículo y transporte',
      'Transporte público', 'Vehículo y transporte',
      'Taxis y Carsharing', 'Vehículo y transporte',
      'Gasolina y combustible', 'Vehículo y transporte',
      'Seguro de coche y moto', 'Vehículo y transporte',
      'Dentista, médico', 'Educación y salud',
      'Deporte y gimnasio', 'Educación y salud',
      'Seguro de vida', 'Educación y salud',
      'Seguro de salud', 'Educación y salud',
      'Educación', 'Educación y salud',
      'Mantenimiento del hogar', 'Hogar',
      'Decoración y mobiliario', 'Hogar',
      'Luz y gas', 'Hogar',
      'Teléfono, TV e internet', 'Hogar',
      'Hipoteca', 'Hogar',
      'Comisiones e intereses', 'Otros gastos',
      'Otros seguros', 'Otros gastos',
      'Gasto Bizum', 'Otros gastos',
      'Pago de impuestos', 'Otros gastos',
      'Cajeros', 'Otros gastos',
      'Otros gastos (otros)', 'Otros gastos',
      'Transferencias', 'Otros gastos',
      'Otros préstamos y avales', 'Otros gastos',
      'Electrónica', 'Compras',
      'Ropa y complementos', 'Compras',
      'Belleza, peluquería y perfumería', 'Compras',
      'Regalos y juguetes', 'Compras',
      'Liquidación tarjeta de crédito ING', 'Compras',
      'Compras (otros)', 'Compras',
      'Tarjetas financieras y de crédito', 'Compras'
    ]) AS subcategory_name, 
    unnest(ARRAY[
      'Nómina y otras prestaciones', 'Nómina y otras prestaciones',
      'Otros ingresos', 'Otros ingresos',
      'Otros ingresos', 'Otros ingresos',
      'Otros ingresos', 'Otros ingresos',
      'Inversión', 'Movimientos excluidos',
      'Ocio y viajes', 'Ocio y viajes',
      'Ocio y viajes', 'Ocio y viajes',
      'Ocio y viajes', 'Ocio y viajes',
      'Ocio y viajes', 'Alimentación',
      'Vehículo y transporte', 'Vehículo y transporte',
      'Vehículo y transporte', 'Vehículo y transporte',
      'Vehículo y transporte', 'Vehículo y transporte',
      'Educación y salud', 'Educación y salud',
      'Educación y salud', 'Educación y salud',
      'Educación y salud', 'Hogar',
      'Hogar', 'Hogar',
      'Hogar', 'Hogar',
      'Otros gastos', 'Otros gastos',
      'Otros gastos', 'Otros gastos',
      'Otros gastos', 'Otros gastos',
      'Otros gastos', 'Otros gastos',
      'Compras', 'Compras',
      'Compras', 'Compras',
      'Compras', 'Compras',
      'Compras'
    ]) AS main_category_name
  LOOP
    -- Get the main category ID
    SELECT id INTO main_category_id 
    FROM public.categories 
    WHERE name = category_mapping.main_category_name;
    
    -- Check if this subcategory exists in backup and migrate it
    FOR subcategory_data IN 
      SELECT * FROM public.categories_backup 
      WHERE name = category_mapping.subcategory_name
    LOOP
      INSERT INTO public.subcategories (id, name, color, category_id, created_at, modified_at)
      VALUES (
        subcategory_data.id, 
        subcategory_data.name, 
        subcategory_data.color, 
        main_category_id, 
        subcategory_data.created_at, 
        subcategory_data.modified_at
      );
    END LOOP;
  END LOOP;
  
  -- Handle any remaining categories that don't match the mapping (assign to "Otros gastos")
  SELECT id INTO main_category_id FROM public.categories WHERE name = 'Otros gastos';
  
  INSERT INTO public.subcategories (id, name, color, category_id, created_at, modified_at)
  SELECT 
    cb.id, 
    cb.name, 
    cb.color, 
    main_category_id, 
    cb.created_at, 
    cb.modified_at
  FROM public.categories_backup cb
  WHERE cb.name NOT IN (
    SELECT unnest(ARRAY[
      'Nómina o Pensión', 'Prestación por desempleo', 'Ingresos de otras entidades',
      'Abono de financiación', 'Otros ingresos (otros)', 'Ingresos de efectivo',
      'Ingreso Bizum', 'Fondos de inversión', 'Traspaso entre cuentas',
      'Ocio y viajes (otros)', 'Libros, música y videojuegos', 'Billetes de viaje',
      'Loterías y apuestas', 'Cine, teatro y espectáculos', 'Hotel y alojamiento',
      'Cafeterías y restaurantes', 'Supermercados y alimentación', 'Peajes',
      'Parking y garaje', 'Transporte público', 'Taxis y Carsharing',
      'Gasolina y combustible', 'Seguro de coche y moto', 'Dentista, médico',
      'Deporte y gimnasio', 'Seguro de vida', 'Seguro de salud', 'Educación',
      'Mantenimiento del hogar', 'Decoración y mobiliario', 'Luz y gas',
      'Teléfono, TV e internet', 'Hipoteca', 'Comisiones e intereses',
      'Otros seguros', 'Gasto Bizum', 'Pago de impuestos', 'Cajeros',
      'Otros gastos (otros)', 'Transferencias', 'Otros préstamos y avales',
      'Electrónica', 'Ropa y complementos', 'Belleza, peluquería y perfumería',
      'Regalos y juguetes', 'Liquidación tarjeta de crédito ING', 'Compras (otros)',
      'Tarjetas financieras y de crédito'
    ])
  );
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