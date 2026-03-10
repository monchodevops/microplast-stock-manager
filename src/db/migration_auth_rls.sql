-- =============================================================================
-- MIGRACIÓN: Autenticación con Supabase Auth + RLS
-- Aplicar manualmente desde: Supabase Dashboard → SQL Editor
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Tabla profiles (uno a uno con auth.users)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id        uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username  text NOT NULL,
  role      text NOT NULL DEFAULT 'operator'
              CHECK (role IN ('admin', 'operator')),
  created_at timestamptz DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 2. Función: poblar profiles al registrar un nuevo usuario
--    - Primer usuario → role = 'admin'
--    - Resto           → role = 'operator'
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  assigned_role text;
BEGIN
  IF (SELECT COUNT(*) FROM public.profiles) = 0 THEN
    assigned_role := 'admin';
  ELSE
    assigned_role := 'operator';
  END IF;

  INSERT INTO public.profiles (id, username, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    assigned_role
  );

  RETURN NEW;
END;
$$;

-- Trigger que ejecuta la función después de cada INSERT en auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- -----------------------------------------------------------------------------
-- 3. Habilitar RLS en todas las tablas operativas
-- -----------------------------------------------------------------------------
ALTER TABLE public.raw_materials          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_definitions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finished_goods_stock   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_logs        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles               ENABLE ROW LEVEL SECURITY;

-- Si existen las tablas de despacho / remitos creadas en migraciones posteriores,
-- agrégarlas aquí aplicando el mismo patrón:
-- ALTER TABLE public.dispatch_orders  ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.remitos          ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- 4a. Políticas para tablas operativas generales
--     (cualquier usuario autenticado puede leer y escribir)
-- -----------------------------------------------------------------------------

-- raw_materials
DROP POLICY IF EXISTS "Authenticated read raw_materials" ON public.raw_materials;
CREATE POLICY "Authenticated read raw_materials"
  ON public.raw_materials FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated write raw_materials" ON public.raw_materials;
CREATE POLICY "Authenticated write raw_materials"
  ON public.raw_materials FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- finished_goods_stock
DROP POLICY IF EXISTS "Authenticated read finished_goods_stock" ON public.finished_goods_stock;
CREATE POLICY "Authenticated read finished_goods_stock"
  ON public.finished_goods_stock FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated write finished_goods_stock" ON public.finished_goods_stock;
CREATE POLICY "Authenticated write finished_goods_stock"
  ON public.finished_goods_stock FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- production_logs
DROP POLICY IF EXISTS "Authenticated read production_logs" ON public.production_logs;
CREATE POLICY "Authenticated read production_logs"
  ON public.production_logs FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated write production_logs" ON public.production_logs;
CREATE POLICY "Authenticated write production_logs"
  ON public.production_logs FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- -----------------------------------------------------------------------------
-- 4b. Políticas para product_definitions (recetas)
--     - Todos los autenticados pueden leer
--     - Solo admins pueden escribir / modificar
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated read product_definitions" ON public.product_definitions;
CREATE POLICY "Authenticated read product_definitions"
  ON public.product_definitions FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admin write product_definitions" ON public.product_definitions;
CREATE POLICY "Admin write product_definitions"
  ON public.product_definitions FOR ALL
  USING (
    auth.role() = 'authenticated'
    AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  )
  WITH CHECK (
    auth.role() = 'authenticated'
    AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- -----------------------------------------------------------------------------
-- 4c. Políticas para profiles
--     - Cada usuario solo ve y edita su propio perfil
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "User read own profile" ON public.profiles;
CREATE POLICY "User read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "User update own profile" ON public.profiles;
CREATE POLICY "User update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
