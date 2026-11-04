create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  shop_id uuid not null,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz default now()
);
create index if not exists push_subscriptions_shop_idx on public.push_subscriptions(shop_id);
alter table public.push_subscriptions enable row level security;
-- Aucune policy : accès réservé au service role (API serveur)
