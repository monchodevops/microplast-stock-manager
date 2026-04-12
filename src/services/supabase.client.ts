import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env['VITE_SUPABASE_URL'] as string;
const SUPABASE_KEY = import.meta.env['VITE_SUPABASE_KEY'] as string;

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Interfaces de Base de Datos para TypeScript (Mapeo directo a tablas)
export interface DbRawMaterial {
  id: string;
  color_name: string;
  current_stock_kg: number;
  alert_threshold_kg: number;
  last_updated: string;
}

export interface DbProductDefinition {
  id: string;
  name: string;
  consumption_per_unit_kg: number;
  category: string;
}

export interface DbFinishedGood {
  id: string;
  product_definition_id: string;
  color_name: string;
  quantity_units: number;
}
