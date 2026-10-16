-- ═══════════════════════════════════════════════════════════════════════════
-- Jokoo — Migration "production hardening"
-- À exécuter UNE FOIS dans Supabase > SQL Editor (idempotent : peut être relancée).
-- Remplace /migration et /api/admin/migrate-order-status (supprimés).
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. guest_orders : statuts, suivi, colonnes ─────────────────────────────
DO $$
DECLARE c RECORD;
BEGIN
  FOR c IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'public.guest_orders'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%status%'
  LOOP
    EXECUTE format('ALTER TABLE public.guest_orders DROP CONSTRAINT %I', c.conname);
  END LOOP;
END $$;

UPDATE public.guest_orders SET status = 'delivered_paid' WHERE status = 'delivered';
UPDATE public.guest_orders SET status = 'processing'     WHERE status = 'called';

ALTER TABLE public.guest_orders
  ADD CONSTRAINT guest_orders_status_check
  CHECK (status IN ('new','processing','out_for_delivery','delivered_paid','delivered_unpaid','cancelled'));

ALTER TABLE public.guest_orders ADD COLUMN IF NOT EXISTS tracking_token UUID UNIQUE DEFAULT gen_random_uuid();
ALTER TABLE public.guest_orders ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;
UPDATE public.guest_orders SET tracking_token = gen_random_uuid() WHERE tracking_token IS NULL;

-- ── 2. guest_orders.shop_id : rattachement fiable à la boutique ────────────
ALTER TABLE public.guest_orders
  ADD COLUMN IF NOT EXISTS shop_id UUID REFERENCES public.shops(id) ON DELETE SET NULL;

-- Rattrapage des anciennes commandes : d'abord via le produit, puis via le nom
UPDATE public.guest_orders g
   SET shop_id = p.shop_id
  FROM public.products p
 WHERE g.shop_id IS NULL AND p.id::text = g.product_id::text;

UPDATE public.guest_orders g
   SET shop_id = s.id
  FROM public.shops s
 WHERE g.shop_id IS NULL AND lower(s.name) = lower(g.shop_name);

CREATE INDEX IF NOT EXISTS guest_orders_shop_id_idx   ON public.guest_orders (shop_id);
CREATE INDEX IF NOT EXISTS guest_orders_phone_ts_idx  ON public.guest_orders (buyer_phone, created_at DESC);

-- ── 3. RLS guest_orders : accès UNIQUEMENT via le serveur (service_role) ───
-- Supprime les politiques qui laissaient tout compte connecté lire/modifier
-- toutes les commandes depuis le navigateur.
ALTER TABLE public.guest_orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anyone_can_insert_guest_order"          ON public.guest_orders;
DROP POLICY IF EXISTS "authenticated_can_read_guest_orders"    ON public.guest_orders;
DROP POLICY IF EXISTS "authenticated_can_update_guest_orders"  ON public.guest_orders;
-- (aucune politique = anon/authenticated refusés ; service_role contourne la RLS)

-- ── 4. OTP persistant (remplace le Map en mémoire, compatible serverless) ──
CREATE TABLE IF NOT EXISTS public.otp_codes (
  phone       TEXT PRIMARY KEY,
  code_hash   TEXT        NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  attempts    INTEGER     NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.otp_codes ENABLE ROW LEVEL SECURITY;   -- aucune politique : serveur uniquement

-- ── 5. Rôles : app_metadata (non modifiable par l'utilisateur) ─────────────
-- Avant : le rôle était dans user_metadata, modifiable depuis le navigateur.
-- Merchants/customers existants → copiés automatiquement.
UPDATE auth.users
   SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb)
       || jsonb_build_object('role', raw_user_meta_data->>'role')
 WHERE raw_app_meta_data->>'role' IS NULL
   AND raw_user_meta_data->>'role' IN ('merchant', 'customer');

-- ⚠ Les super_admin ne sont JAMAIS copiés automatiquement (des rôles ont pu être falsifiés).
-- 1) Vérifiez qui prétend être admin :
--    SELECT id, email, raw_user_meta_data->>'role' AS claimed_role FROM auth.users
--    WHERE raw_user_meta_data->>'role' = 'super_admin';
-- 2) Promouvez UNIQUEMENT votre compte admin (remplacez l'email) :
--    UPDATE auth.users
--       SET raw_app_meta_data = COALESCE(raw_app_meta_data,'{}'::jsonb) || '{"role":"super_admin"}'::jsonb
--     WHERE email = 'VOTRE_EMAIL_ADMIN';
-- 3) Rétrogradez les faux admins :
--    UPDATE auth.users SET raw_user_meta_data = raw_user_meta_data - 'role'
--     WHERE raw_user_meta_data->>'role' = 'super_admin' AND email <> 'VOTRE_EMAIL_ADMIN';
