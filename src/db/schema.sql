-- Habilitar extensión para UUIDs
create extension if not exists "uuid-ossp";

-- 1. Materia Prima (Raw Materials)
create table raw_materials (
  id uuid primary key default uuid_generate_v4(),
  color_name text unique not null,
  current_stock_kg float default 0,
  alert_threshold_kg float default 100,
  last_updated timestamp with time zone default now()
);

-- 2. Definición de Productos (Recetas)
create table product_definitions (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  consumption_per_unit_kg float not null,
  category text
);

-- 3. Stock de Productos Terminados
create table finished_goods_stock (
  id uuid primary key default uuid_generate_v4(),
  product_definition_id uuid references product_definitions(id),
  color_name text not null, -- Debe coincidir conceptualmente con raw_materials.color_name
  quantity_units integer default 0,
  
  -- Evitar duplicados: Un registro por producto+color
  unique(product_definition_id, color_name)
);

-- 4. Historial de Producción (Logs)
-- Crear Enum para tipos de transacción
create type transaction_type as enum ('INCOMING_MATERIAL', 'PRODUCTION_RUN');

create table production_logs (
  id uuid primary key default uuid_generate_v4(),
  transaction_type transaction_type not null,
  description text,
  amount_change float not null, -- Positivo para entradas, Negativo para consumos
  created_at timestamp with time zone default now()
);

-- Índices recomendados para performance
create index idx_logs_created_at on production_logs(created_at desc);
create index idx_finished_goods_product on finished_goods_stock(product_definition_id);
