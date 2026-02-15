-- Limpiar tablas existentes (Reiniciar datos)
TRUNCATE TABLE production_logs, finished_goods_stock, product_definitions, raw_materials RESTART IDENTITY CASCADE;

-- 1. Insertar Materia Prima
INSERT INTO raw_materials (color_name, current_stock_kg, alert_threshold_kg) VALUES
('Negro', 1200, 500),
('Terracota', 300, 400),
('Gris Piedra', 850, 200),
('Blanco', 50, 100);

-- 2. Insertar Definiciones de Productos (Recetas)
INSERT INTO product_definitions (name, consumption_per_unit_kg, category) VALUES
('Maceta Cubo 40cm', 1.5, 'Macetas'),
('Tanque 500L', 12.0, 'Tanques'),
('Maceta Redonda 60cm', 2.2, 'Macetas'),
('Bebedero Ganado', 8.5, 'Agro');

-- 3. Insertar Stock de Productos Terminados
-- (Usamos subqueries para obtener los IDs generados dinámicamente)
INSERT INTO finished_goods_stock (product_definition_id, color_name, quantity_units)
VALUES 
(
  (SELECT id FROM product_definitions WHERE name = 'Maceta Cubo 40cm' LIMIT 1),
  'Negro',
  45
),
(
  (SELECT id FROM product_definitions WHERE name = 'Tanque 500L' LIMIT 1),
  'Gris Piedra',
  12
);

-- 4. Insertar Logs Iniciales
INSERT INTO production_logs (transaction_type, description, amount_change) VALUES
('INCOMING_MATERIAL', 'Inventario inicial - Negro', 1200),
('INCOMING_MATERIAL', 'Inventario inicial - Terracota', 300),
('INCOMING_MATERIAL', 'Inventario inicial - Gris Piedra', 850),
('INCOMING_MATERIAL', 'Inventario inicial - Blanco', 50);
