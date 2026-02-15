import { createClient } from '@supabase/supabase-js';

// ⚠️ CONFIGURACIÓN: Reemplaza estas variables con las de tu proyecto en Supabase
// Puedes obtenerlas en: Project Settings -> API

// 1. URL del Proyecto (Ya configurada)
const SUPABASE_URL = 'https://fvbwyhebmfuhsigohwpp.supabase.co';

// 2. API Key
// IMPORTANTE: Usa la "Publishable Key" (o 'anon' public key).
// NO uses la 'service_role' key (esa es secreta y no debe ir en el frontend).
// Si ves "Anon Key (Legacy)", puedes usar esa o la Publishable, son funcionalmente la misma para este caso.
const SUPABASE_KEY = 'sb_publishable_VBYHxq8PnBO96FxEZe2cfA_TFz-2Yic';

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
