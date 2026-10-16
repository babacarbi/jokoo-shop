-- ============================================================
-- SOLUTION FINALE — Exécuter dans Supabase SQL Editor
-- ============================================================

-- 1. Fonction RPC pour récupérer la boutique du marchand connecté
--    SECURITY DEFINER = contourne complètement le RLS
CREATE OR REPLACE FUNCTION public.get_my_shop()
RETURNS TABLE(id UUID, name TEXT, slug TEXT, status TEXT)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    s.id,
    s.name,
    s.slug,
    s.status::TEXT
  FROM public.shops s
  WHERE s.owner_id = auth.uid()
  LIMIT 1;
$$;

-- Donner accès à la fonction aux utilisateurs connectés
GRANT EXECUTE ON FUNCTION public.get_my_shop() TO authenticated;

-- 2. Vérifier si la boutique de babacar.diallo@outlook.com existe
SELECT s.*, p.email
FROM public.shops s
JOIN public.profiles p ON p.id = s.owner_id
WHERE p.email = 'babacar.diallo@outlook.com';

-- 3. Si le résultat est vide (aucune ligne), créer la boutique manuellement
-- Décommente et adapte le bloc ci-dessous si nécessaire :
/*
INSERT INTO public.shops (owner_id, name, slug, status, plan)
SELECT
  p.id,
  'Ma Boutique',
  'ma-boutique-' || floor(random() * 999999)::text,
  'pending',
  'free'
FROM public.profiles p
WHERE p.email = 'babacar.diallo@outlook.com'
ON CONFLICT DO NOTHING;
*/
