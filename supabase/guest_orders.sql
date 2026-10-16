-- ============================================================
-- TABLE guest_orders v2 — Commandes clients sans compte
-- À exécuter dans Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS public.guest_orders (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id      TEXT NOT NULL,
  product_name    TEXT NOT NULL,
  product_img     TEXT,
  price           INTEGER NOT NULL,
  quantity        INTEGER DEFAULT 1,
  buyer_prenom    TEXT NOT NULL,
  buyer_nom       TEXT NOT NULL,
  buyer_fullname  TEXT,
  buyer_phone     TEXT NOT NULL,
  buyer_country   TEXT DEFAULT 'Sénégal',
  buyer_whatsapp  BOOLEAN DEFAULT false,
  shop_name       TEXT NOT NULL,
  status          TEXT DEFAULT 'new' CHECK (status IN ('new', 'called', 'delivered', 'cancelled')),
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- Si la table existe déjà, ajouter les nouvelles colonnes :
ALTER TABLE public.guest_orders ADD COLUMN IF NOT EXISTS buyer_fullname TEXT;
ALTER TABLE public.guest_orders ADD COLUMN IF NOT EXISTS buyer_country  TEXT DEFAULT 'Sénégal';
ALTER TABLE public.guest_orders ADD COLUMN IF NOT EXISTS buyer_whatsapp BOOLEAN DEFAULT false;
ALTER TABLE public.guest_orders ADD COLUMN IF NOT EXISTS quantity       INTEGER DEFAULT 1;

-- Activer RLS
ALTER TABLE public.guest_orders ENABLE ROW LEVEL SECURITY;

-- Politique INSERT (tout le monde)
DROP POLICY IF EXISTS "anyone_can_insert_guest_order" ON public.guest_orders;
CREATE POLICY "anyone_can_insert_guest_order"
  ON public.guest_orders FOR INSERT WITH CHECK (true);

-- Politique SELECT (marchands connectés seulement)
DROP POLICY IF EXISTS "authenticated_can_read_guest_orders" ON public.guest_orders;
CREATE POLICY "authenticated_can_read_guest_orders"
  ON public.guest_orders FOR SELECT USING (auth.role() = 'authenticated');

-- Politique UPDATE (marchands connectés)
DROP POLICY IF EXISTS "authenticated_can_update_guest_orders" ON public.guest_orders;
CREATE POLICY "authenticated_can_update_guest_orders"
  ON public.guest_orders FOR UPDATE USING (auth.role() = 'authenticated');

-- Index performance
CREATE INDEX IF NOT EXISTS guest_orders_created_at_idx ON public.guest_orders (created_at DESC);
CREATE INDEX IF NOT EXISTS guest_orders_shop_name_idx  ON public.guest_orders (shop_name);
CREATE INDEX IF NOT EXISTS guest_orders_status_idx     ON public.guest_orders (status);
