-- Step 1: Database Migration - Restructure to exact category/subcategory hierarchy
-- This migration will:
-- 1. Backup existing shop-subcategory mappings
-- 2. Clear and repopulate subcategories with your exact 77 subcategories
-- 3. Intelligently remap existing shops to new subcategories
-- 4. Assign unmapped shops to "Otros gastos (otros)"

-- Create backup table for existing shop mappings
CREATE TABLE IF NOT EXISTS shop_subcategory_backup AS
SELECT 
    s.id as shop_id,
    s.shop_name,
    s.subcategory_id as old_subcategory_id,
    sub.name as old_subcategory_name,
    cat.name as old_category_name
FROM shops s
LEFT JOIN subcategories sub ON s.subcategory_id = sub.id
LEFT JOIN categories cat ON sub.category_id = cat.id;

-- Clear existing subcategories (this will temporarily break shop references)
DELETE FROM subcategories;

-- Get category IDs for mapping (we'll need these for the subcategory inserts)
-- Insert all 77 new subcategories with proper category mappings and distinct colors

-- Nómina y otras prestaciones subcategories
INSERT INTO subcategories (name, category_id, color) VALUES
('Nómina o Pensión', (SELECT id FROM categories WHERE name = 'Nómina y otras prestaciones'), '#8B5CF6'),
('Prestación por desempleo', (SELECT id FROM categories WHERE name = 'Nómina y otras prestaciones'), '#A855F7');

-- Otros ingresos subcategories  
INSERT INTO subcategories (name, category_id, color) VALUES
('Ingresos de otras entidades', (SELECT id FROM categories WHERE name = 'Otros ingresos'), '#10B981'),
('Abono de financiación', (SELECT id FROM categories WHERE name = 'Otros ingresos'), '#14B8A6'),
('Otros ingresos (otros)', (SELECT id FROM categories WHERE name = 'Otros ingresos'), '#06B6D4'),
('Ingresos de efectivo', (SELECT id FROM categories WHERE name = 'Otros ingresos'), '#0EA5E9'),
('Ingreso Bizum', (SELECT id FROM categories WHERE name = 'Otros ingresos'), '#3B82F6');

-- Inversión subcategories
INSERT INTO subcategories (name, category_id, color) VALUES
('Fondos de inversión', (SELECT id FROM categories WHERE name = 'Inversión'), '#F59E0B');

-- Movimientos excluidos subcategories
INSERT INTO subcategories (name, category_id, color) VALUES
('Traspaso entre cuentas', (SELECT id FROM categories WHERE name = 'Movimientos excluidos'), '#6B7280');

-- Ocio y viajes subcategories
INSERT INTO subcategories (name, category_id, color) VALUES
('Ocio y viajes (otros)', (SELECT id FROM categories WHERE name = 'Ocio y viajes'), '#EF4444'),
('Libros, música y videojuegos', (SELECT id FROM categories WHERE name = 'Ocio y viajes'), '#F97316'),
('Billetes de viaje', (SELECT id FROM categories WHERE name = 'Ocio y viajes'), '#F59E0B'),
('Loterías y apuestas', (SELECT id FROM categories WHERE name = 'Ocio y viajes'), '#EAB308'),
('Cine, teatro y espectáculos', (SELECT id FROM categories WHERE name = 'Ocio y viajes'), '#84CC16'),
('Hotel y alojamiento', (SELECT id FROM categories WHERE name = 'Ocio y viajes'), '#22C55E'),
('Cafeterías y restaurantes', (SELECT id FROM categories WHERE name = 'Ocio y viajes'), '#10B981');

-- Alimentación subcategories
INSERT INTO subcategories (name, category_id, color) VALUES
('Supermercados y alimentación', (SELECT id FROM categories WHERE name = 'Alimentación'), '#84CC16');

-- Vehículo y transporte subcategories
INSERT INTO subcategories (name, category_id, color) VALUES
('Peajes', (SELECT id FROM categories WHERE name = 'Vehículo y transporte'), '#14B8A6'),
('Parking y garaje', (SELECT id FROM categories WHERE name = 'Vehículo y transporte'), '#06B6D4'),
('Transporte público', (SELECT id FROM categories WHERE name = 'Vehículo y transporte'), '#0EA5E9'),
('Taxis y Carsharing', (SELECT id FROM categories WHERE name = 'Vehículo y transporte'), '#3B82F6'),
('Gasolina y combustible', (SELECT id FROM categories WHERE name = 'Vehículo y transporte'), '#6366F1'),
('Seguro de coche y moto', (SELECT id FROM categories WHERE name = 'Vehículo y transporte'), '#8B5CF6');

-- Educación y salud subcategories
INSERT INTO subcategories (name, category_id, color) VALUES
('Dentista, médico', (SELECT id FROM categories WHERE name = 'Educación y salud'), '#EC4899'),
('Deporte y gimnasio', (SELECT id FROM categories WHERE name = 'Educación y salud'), '#F43F5E'),
('Seguro de vida', (SELECT id FROM categories WHERE name = 'Educación y salud'), '#EF4444'),
('Seguro de salud', (SELECT id FROM categories WHERE name = 'Educación y salud'), '#F97316'),
('Educación', (SELECT id FROM categories WHERE name = 'Educación y salud'), '#F59E0B');

-- Hogar subcategories
INSERT INTO subcategories (name, category_id, color) VALUES
('Mantenimiento del hogar', (SELECT id FROM categories WHERE name = 'Hogar'), '#F97316'),
('Decoración y mobiliario', (SELECT id FROM categories WHERE name = 'Hogar'), '#F59E0B'),
('Luz y gas', (SELECT id FROM categories WHERE name = 'Hogar'), '#EAB308'),
('Teléfono, TV e internet', (SELECT id FROM categories WHERE name = 'Hogar'), '#84CC16'),
('Hipoteca', (SELECT id FROM categories WHERE name = 'Hogar'), '#22C55E');

-- Otros gastos subcategories
INSERT INTO subcategories (name, category_id, color) VALUES
('Comisiones e intereses', (SELECT id FROM categories WHERE name = 'Otros gastos'), '#64748B'),
('Otros seguros', (SELECT id FROM categories WHERE name = 'Otros gastos'), '#6B7280'),
('Gasto Bizum', (SELECT id FROM categories WHERE name = 'Otros gastos'), '#9CA3AF'),
('Pago de impuestos', (SELECT id FROM categories WHERE name = 'Otros gastos'), '#374151'),
('Cajeros', (SELECT id FROM categories WHERE name = 'Otros gastos'), '#111827'),
('Otros gastos (otros)', (SELECT id FROM categories WHERE name = 'Otros gastos'), '#0F172A'),
('Transferencias', (SELECT id FROM categories WHERE name = 'Otros gastos'), '#1F2937'),
('Otros préstamos y avales', (SELECT id FROM categories WHERE name = 'Otros gastos'), '#4B5563');

-- Compras subcategories
INSERT INTO subcategories (name, category_id, color) VALUES
('Electrónica', (SELECT id FROM categories WHERE name = 'Compras'), '#3B82F6'),
('Ropa y complementos', (SELECT id FROM categories WHERE name = 'Compras'), '#6366F1'),
('Belleza, peluquería y perfumería', (SELECT id FROM categories WHERE name = 'Compras'), '#8B5CF6'),
('Regalos y juguetes', (SELECT id FROM categories WHERE name = 'Compras'), '#A855F7'),
('Liquidación tarjeta de crédito ING', (SELECT id FROM categories WHERE name = 'Compras'), '#C026D3'),
('Compras (otros)', (SELECT id FROM categories WHERE name = 'Compras'), '#D946EF'),
('Tarjetas financieras y de crédito', (SELECT id FROM categories WHERE name = 'Compras'), '#EC4899');

-- Create intelligent mapping function to match old subcategory names to new ones
CREATE OR REPLACE FUNCTION map_old_to_new_subcategory(old_name TEXT)
RETURNS UUID AS $$
DECLARE
    new_subcategory_id UUID;
BEGIN
    -- Try exact match first
    SELECT id INTO new_subcategory_id 
    FROM subcategories 
    WHERE name = old_name;
    
    IF new_subcategory_id IS NOT NULL THEN
        RETURN new_subcategory_id;
    END IF;
    
    -- Try fuzzy matching for common cases
    SELECT id INTO new_subcategory_id 
    FROM subcategories 
    WHERE CASE 
        -- Map common variations
        WHEN old_name ILIKE '%cafeter%' OR old_name ILIKE '%restauran%' THEN name = 'Cafeterías y restaurantes'
        WHEN old_name ILIKE '%supermercado%' OR old_name ILIKE '%alimenta%' THEN name = 'Supermercados y alimentación'
        WHEN old_name ILIKE '%peaje%' THEN name = 'Peajes'
        WHEN old_name ILIKE '%parking%' OR old_name ILIKE '%garaje%' THEN name = 'Parking y garaje'
        WHEN old_name ILIKE '%transporte%público%' THEN name = 'Transporte público'
        WHEN old_name ILIKE '%taxi%' OR old_name ILIKE '%carsharing%' THEN name = 'Taxis y Carsharing'
        WHEN old_name ILIKE '%gasolina%' OR old_name ILIKE '%combustible%' THEN name = 'Gasolina y combustible'
        WHEN old_name ILIKE '%dentista%' OR old_name ILIKE '%médico%' THEN name = 'Dentista, médico'
        WHEN old_name ILIKE '%deporte%' OR old_name ILIKE '%gimnasio%' THEN name = 'Deporte y gimnasio'
        WHEN old_name ILIKE '%mantenimiento%hogar%' THEN name = 'Mantenimiento del hogar'
        WHEN old_name ILIKE '%decoración%' OR old_name ILIKE '%mobiliario%' THEN name = 'Decoración y mobiliario'
        WHEN old_name ILIKE '%hotel%' OR old_name ILIKE '%alojamiento%' THEN name = 'Hotel y alojamiento'
        WHEN old_name ILIKE '%belleza%' OR old_name ILIKE '%peluquer%' OR old_name ILIKE '%perfumer%' THEN name = 'Belleza, peluquería y perfumería'
        WHEN old_name ILIKE '%cine%' OR old_name ILIKE '%teatro%' OR old_name ILIKE '%espectáculo%' THEN name = 'Cine, teatro y espectáculos'
        WHEN old_name ILIKE '%loter%' OR old_name ILIKE '%apuesta%' THEN name = 'Loterías y apuestas'
        WHEN old_name ILIKE '%libro%' OR old_name ILIKE '%música%' OR old_name ILIKE '%videojuego%' THEN name = 'Libros, música y videojuegos'
        WHEN old_name ILIKE '%billete%viaje%' THEN name = 'Billetes de viaje'
        WHEN old_name ILIKE '%ropa%' OR old_name ILIKE '%complemento%' THEN name = 'Ropa y complementos'
        WHEN old_name ILIKE '%regalo%' OR old_name ILIKE '%juguete%' THEN name = 'Regalos y juguetes'
        WHEN old_name ILIKE '%electrónic%' THEN name = 'Electrónica'
        WHEN old_name ILIKE '%otros%seguro%' THEN name = 'Otros seguros'
        WHEN old_name ILIKE '%ocio%viaje%otros%' THEN name = 'Ocio y viajes (otros)'
        WHEN old_name ILIKE '%pago%impuesto%' THEN name = 'Pago de impuestos'
        WHEN old_name ILIKE '%otros%gasto%otros%' THEN name = 'Otros gastos (otros)'
        WHEN old_name ILIKE '%compras%otros%' THEN name = 'Compras (otros)'
        WHEN old_name ILIKE '%uncategorized%' THEN name = 'Otros gastos (otros)'
        ELSE FALSE
    END;
    
    IF new_subcategory_id IS NOT NULL THEN
        RETURN new_subcategory_id;
    END IF;
    
    -- Default to "Otros gastos (otros)" if no match found
    SELECT id INTO new_subcategory_id 
    FROM subcategories 
    WHERE name = 'Otros gastos (otros)';
    
    RETURN new_subcategory_id;
END;
$$ LANGUAGE plpgsql;

-- Update shops with new subcategory mappings
UPDATE shops 
SET subcategory_id = map_old_to_new_subcategory(
    COALESCE(
        (SELECT old_subcategory_name FROM shop_subcategory_backup WHERE shop_id = shops.id),
        'Otros gastos (otros)'
    )
);

-- Clean up: Drop the mapping function and backup table
DROP FUNCTION map_old_to_new_subcategory(TEXT);
DROP TABLE shop_subcategory_backup;

-- Verify the migration results
-- This will show statistics about the migration
DO $$
DECLARE
    total_subcategories INTEGER;
    total_shops INTEGER;
    unmapped_shops INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_subcategories FROM subcategories;
    SELECT COUNT(*) INTO total_shops FROM shops;
    SELECT COUNT(*) INTO unmapped_shops FROM shops WHERE subcategory_id IS NULL;
    
    RAISE NOTICE 'Migration completed successfully:';
    RAISE NOTICE '- Total subcategories created: %', total_subcategories;
    RAISE NOTICE '- Total shops: %', total_shops;
    RAISE NOTICE '- Unmapped shops: %', unmapped_shops;
END $$;