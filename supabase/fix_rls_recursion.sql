-- ============================================================
-- CORRECTIF: Infinite Recursion RLS (Erreur 500)
-- À exécuter dans Supabase → SQL Editor
-- ============================================================

-- 1. Créer une fonction SECURITY DEFINER pour vérifier le rôle admin sans déclencher le RLS
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin'
  );
$$;

-- 2. Supprimer les anciennes politiques qui causaient la boucle infinie
DROP POLICY IF EXISTS "profiles_admin_all" ON public.profiles;
DROP POLICY IF EXISTS "shops_admin_all" ON public.shops;
DROP POLICY IF EXISTS "products_admin_all" ON public.products;
DROP POLICY IF EXISTS "orders_admin_all" ON public.orders;
DROP POLICY IF EXISTS "categories_admin_all" ON public.categories;

-- 3. Recréer les politiques en utilisant la nouvelle fonction
CREATE POLICY "profiles_admin_all" ON public.profiles
  FOR ALL USING (public.is_super_admin());

CREATE POLICY "shops_admin_all" ON public.shops
  FOR ALL USING (public.is_super_admin());

CREATE POLICY "products_admin_all" ON public.products
  FOR ALL USING (public.is_super_admin());

CREATE POLICY "orders_admin_all" ON public.orders
  FOR ALL USING (public.is_super_admin());

CREATE POLICY "categories_admin_all" ON public.categories
  FOR ALL USING (public.is_super_admin());

-- 4. Vérification
SELECT 'Correctif RLS appliqué avec succès ✅' AS status;
