-- Avis clients : un avis par commande livrée (preuve d'achat), écriture uniquement via l'API serveur.
create table if not exists public.product_reviews (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null unique,
  product_id  uuid not null,
  shop_id     uuid,
  rating      smallint not null check (rating between 1 and 5),
  comment     text check (char_length(comment) <= 500),
  buyer_name  text,
  created_at  timestamptz not null default now()
);

create index if not exists idx_reviews_product on public.product_reviews(product_id, created_at desc);
create index if not exists idx_reviews_shop on public.product_reviews(shop_id);

alter table public.product_reviews enable row level security;
-- Aucune policy : seul le serveur (service_role) lit/écrit.

grant usage on schema public to service_role;
grant all on table public.product_reviews to service_role;
