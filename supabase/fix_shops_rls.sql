-- ============================================================
-- CORRECTIF RLS SHOPS — "permission denied for table shops"
-- Exécuter EN ENTIER dans Supabase → SQL Editor
-- ============================================================

-- 1. S'assurer que le RLS est bien activé sur shops
ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;

-- 2. Supprimer TOUTES les politiques existantes sur shops (évite les doublons)
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies WHERE tablename = 'shops' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.shops', pol.policyname);
  END LOOP;
END $$;

-- 3. Créer la fonction is_super_admin si elle n'existe pas
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

-- 4. Recréer les politiques RLS proprement

-- Tout le monde peut voir les boutiques actives
CREATE POLICY "shops_select_public" ON public.shops
  FOR SELECT USING (status = 'active');

-- Un marchand peut voir SA propre boutique (même pending/suspended)
CREATE POLICY "shops_select_own" ON public.shops
  FOR SELECT USING (owner_id = auth.uid());

-- Un utilisateur connecté peut créer une boutique (owner_id doit être son uid)
CREATE POLICY "shops_insert_own" ON public.shops
  FOR INSERT WITH CHECK (owner_id = auth.uid());

-- Un marchand peut modifier SA boutique
CREATE POLICY "shops_update_own" ON public.shops
  FOR UPDATE USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- Un marchand peut supprimer SA boutique
CREATE POLICY "shops_delete_own" ON public.shops
  FOR DELETE USING (owner_id = auth.uid());

-- L'admin a accès à tout
CREATE POLICY "shops_admin_all" ON public.shops
  FOR ALL USING (public.is_super_admin());

-- 5. Ajouter les colonnes manquantes si besoin
ALTER TABLE public.shops
  ADD COLUMN IF NOT EXISTS whatsapp TEXT,
  ADD COLUMN IF NOT EXISTS website  TEXT,
  ADD COLUMN IF NOT EXISTS address  TEXT,
  ADD COLUMN IF NOT EXISTS phone    TEXT,
  ADD COLUMN IF NOT EXISTS email    TEXT;

-- 6. Vérification — liste les politiques actives
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'shops' AND schemaname = 'public'
ORDER BY policyname;

SELECT '✅ RLS shops corrigé avec succès !' AS status;
