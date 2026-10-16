-- ============================================================
-- CORRECTIF COMPLET — À exécuter dans Supabase → SQL Editor
-- Règle : 403 Forbidden, colonnes manquantes, RLS shops
-- ============================================================

-- ─── 1. AJOUTER LES COLONNES MANQUANTES DANS SHOPS ──────────
-- (whatsapp et website utilisés dans l'onboarding mais absents du schéma)
ALTER TABLE public.shops
  ADD COLUMN IF NOT EXISTS whatsapp TEXT,
  ADD COLUMN IF NOT EXISTS website  TEXT;

-- ─── 2. SUPPRIMER TOUTES LES POLITIQUES SHOPS ──────────────
DROP POLICY IF EXISTS "shops_select_public"  ON public.shops;
DROP POLICY IF EXISTS "shops_select_own"     ON public.shops;
DROP POLICY IF EXISTS "shops_insert_own"     ON public.shops;
DROP POLICY IF EXISTS "shops_update_own"     ON public.shops;
DROP POLICY IF EXISTS "shops_delete_own"     ON public.shops;
DROP POLICY IF EXISTS "shops_merchant_own"   ON public.shops;
DROP POLICY IF EXISTS "shops_admin_all"      ON public.shops;

-- ─── 3. RECRÉER LES POLITIQUES SHOPS CORRECTEMENT ────────────
-- SELECT public : tout le monde voit les boutiques actives
CREATE POLICY "shops_select_public" ON public.shops
  FOR SELECT USING (status = 'active');

-- SELECT propre : chaque marchand voit SA boutique peu importe le statut
CREATE POLICY "shops_select_own" ON public.shops
  FOR SELECT USING (owner_id = auth.uid());

-- INSERT : un utilisateur connecté peut créer UNE boutique
CREATE POLICY "shops_insert_own" ON public.shops
  FOR INSERT WITH CHECK (owner_id = auth.uid());

-- UPDATE : le marchand modifie sa boutique
CREATE POLICY "shops_update_own" ON public.shops
  FOR UPDATE USING (owner_id = auth.uid());

-- DELETE : le marchand supprime sa boutique
CREATE POLICY "shops_delete_own" ON public.shops
  FOR DELETE USING (owner_id = auth.uid());

-- Admin : accès complet via fonction SECURITY DEFINER (sans récursion)
CREATE POLICY "shops_admin_all" ON public.shops
  FOR ALL USING (public.is_super_admin());

-- ─── 4. CORRIGER LA FONCTION is_super_admin SI ELLE N'EXISTE PAS ─
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

-- ─── 5. CORRIGER LES POLITIQUES PRODUCTS (même problème) ─────
DROP POLICY IF EXISTS "products_select_public" ON public.products;
DROP POLICY IF EXISTS "products_select_own"    ON public.products;
DROP POLICY IF EXISTS "products_insert_own"    ON public.products;
DROP POLICY IF EXISTS "products_update_own"    ON public.products;
DROP POLICY IF EXISTS "products_delete_own"    ON public.products;
DROP POLICY IF EXISTS "products_merchant_own"  ON public.products;
DROP POLICY IF EXISTS "products_admin_all"     ON public.products;

CREATE POLICY "products_select_public" ON public.products
  FOR SELECT USING (status = 'active');

CREATE POLICY "products_select_own" ON public.products
  FOR SELECT USING (
    shop_id IN (SELECT id FROM public.shops WHERE owner_id = auth.uid())
  );

CREATE POLICY "products_insert_own" ON public.products
  FOR INSERT WITH CHECK (
    shop_id IN (SELECT id FROM public.shops WHERE owner_id = auth.uid())
  );

CREATE POLICY "products_update_own" ON public.products
  FOR UPDATE USING (
    shop_id IN (SELECT id FROM public.shops WHERE owner_id = auth.uid())
  );

CREATE POLICY "products_delete_own" ON public.products
  FOR DELETE USING (
    shop_id IN (SELECT id FROM public.shops WHERE owner_id = auth.uid())
  );

CREATE POLICY "products_admin_all" ON public.products
  FOR ALL USING (public.is_super_admin());

-- ─── 6. CORRIGER PRODUCT_IMAGES ───────────────────────────────
DROP POLICY IF EXISTS "product_images_merchant_own"   ON public.product_images;
DROP POLICY IF EXISTS "product_images_select_public"  ON public.product_images;
DROP POLICY IF EXISTS "product_images_insert_own"     ON public.product_images;
DROP POLICY IF EXISTS "product_images_delete_own"     ON public.product_images;

CREATE POLICY "product_images_select_public" ON public.product_images
  FOR SELECT USING (true);

CREATE POLICY "product_images_insert_own" ON public.product_images
  FOR INSERT WITH CHECK (
    product_id IN (
      SELECT p.id FROM public.products p
      JOIN public.shops s ON s.id = p.shop_id
      WHERE s.owner_id = auth.uid()
    )
  );

CREATE POLICY "product_images_delete_own" ON public.product_images
  FOR DELETE USING (
    product_id IN (
      SELECT p.id FROM public.products p
      JOIN public.shops s ON s.id = p.shop_id
      WHERE s.owner_id = auth.uid()
    )
  );

-- ─── 7. VÉRIFICATION ──────────────────────────────────────────
SELECT 'Correctif complet appliqué avec succès ✅' AS status;
