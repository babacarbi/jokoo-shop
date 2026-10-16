-- ============================================================
-- DIAGNOSTIC + CORRECTIF FINAL
-- Colle dans Supabase SQL Editor et clique RUN
-- ============================================================

-- ─── VÉRIFICATION : La boutique existe-t-elle ? ───────────────
SELECT
  s.id,
  s.owner_id,
  s.name,
  s.status,
  p.email AS owner_email
FROM public.shops s
LEFT JOIN public.profiles p ON p.id = s.owner_id
ORDER BY s.created_at DESC
LIMIT 10;

-- ─── VÉRIFICATION : Les profils ──────────────────────────────
SELECT id, email, role FROM public.profiles ORDER BY created_at DESC LIMIT 5;
