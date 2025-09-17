-- Fix missing subcategories - Complete the migration with missing subcategories

-- Add missing Nómina y otras prestaciones subcategories (none exist)
-- Add missing Otros ingresos subcategories (none exist) 
-- Add missing Inversión subcategories (none exist)
-- Add missing Movimientos excluidos subcategories (none exist)

-- Remove duplicate/incorrect entries and add the missing ones with proper colors
DELETE FROM subcategories WHERE name = 'Supermercados y alimentación' AND category_id != (SELECT id FROM categories WHERE name = 'Alimentación');

-- Complete missing subcategories systematically
-- Nómina y otras prestaciones (currently has 2, all correct)
-- Otros ingresos (currently has 5, all correct) 
-- Inversión (currently has 1, all correct)
-- Movimientos excluidos (currently has 1, all correct)

-- Let's add the remaining missing subcategories to reach exactly 77:

-- Missing Vehículo y transporte subcategory
INSERT INTO subcategories (name, category_id, color) VALUES
('Seguro de coche y moto', (SELECT id FROM categories WHERE name = 'Vehículo y transporte'), '#A855F7')
ON CONFLICT (name, category_id) DO NOTHING;

-- Missing Educación y salud subcategories  
INSERT INTO subcategories (name, category_id, color) VALUES
('Seguro de vida', (SELECT id FROM categories WHERE name = 'Educación y salud'), '#EF4444'),
('Seguro de salud', (SELECT id FROM categories WHERE name = 'Educación y salud'), '#F97316'),
('Educación', (SELECT id FROM categories WHERE name = 'Educación y salud'), '#F59E0B')
ON CONFLICT (name, category_id) DO NOTHING;

-- Missing Hogar subcategories
INSERT INTO subcategories (name, category_id, color) VALUES
('Luz y gas', (SELECT id FROM categories WHERE name = 'Hogar'), '#EAB308'),
('Teléfono, TV e internet', (SELECT id FROM categories WHERE name = 'Hogar'), '#84CC16'),
('Hipoteca', (SELECT id FROM categories WHERE name = 'Hogar'), '#22C55E')
ON CONFLICT (name, category_id) DO NOTHING;

-- Missing Otros gastos subcategories
INSERT INTO subcategories (name, category_id, color) VALUES
('Comisiones e intereses', (SELECT id FROM categories WHERE name = 'Otros gastos'), '#64748B'),
('Gasto Bizum', (SELECT id FROM categories WHERE name = 'Otros gastos'), '#9CA3AF'),
('Cajeros', (SELECT id FROM categories WHERE name = 'Otros gastos'), '#111827'),
('Transferencias', (SELECT id FROM categories WHERE name = 'Otros gastos'), '#1F2937'),
('Otros préstamos y avales', (SELECT id FROM categories WHERE name = 'Otros gastos'), '#4B5563')
ON CONFLICT (name, category_id) DO NOTHING;

-- Missing Compras subcategories
INSERT INTO subcategories (name, category_id, color) VALUES
('Liquidación tarjeta de crédito ING', (SELECT id FROM categories WHERE name = 'Compras'), '#C026D3'),
('Tarjetas financieras y de crédito', (SELECT id FROM categories WHERE name = 'Compras'), '#EC4899')
ON CONFLICT (name, category_id) DO NOTHING;

-- Verify final count
SELECT COUNT(*) as final_subcategory_count FROM subcategories;