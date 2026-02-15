-- Agregar columna para borrado lógico (Soft Delete)
-- Si la columna es NULL, el producto está activo.
-- Si tiene fecha, el producto está "borrado".
ALTER TABLE product_definitions 
ADD COLUMN deleted_at timestamp with time zone DEFAULT NULL;
