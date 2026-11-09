'use server'

import { createAdminClient } from '@/lib/supabase/admin'

// ── Statuts disponibles pour une commande ──────────────────────────────────────
// 'new'               → Commande reçue (dès que le marchand ouvre la commande)
// 'processing'        → En préparation
// 'out_for_delivery'  → En cours de livraison
// 'delivered_paid'    → Livré · Payé
// 'delivered_unpaid'  → Livré · Non payé
// 'cancelled'         → Annulée
export type GuestOrderStatus =
  | 'new'
  | 'processing'
  | 'out_for_delivery'
  | 'delivered_paid'
  | 'delivered_unpaid'
  | 'cancelled'

const VALID_STATUSES: GuestOrderStatus[] = [
  'new', 'processing', 'out_for_delivery', 'delivered_paid', 'delivered_unpaid', 'cancelled',
]

export async function getShopData(shopId: string) {
  const supabase = await createAdminClient()
  const { data } = await supabase.from('shops').select('name, phone').eq('id', shopId).single()
  return data
}

export async function getShopsData(shopIds: string[]) {
  const supabase = await createAdminClient()
  const { data } = await supabase.from('shops').select('id, name, phone').in('id', shopIds)
  return data || []
}

export async function getMyShopAction() {
  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const adminSupabase = await createAdminClient()
  const { data } = await adminSupabase.from('shops').select('*').eq('owner_id', user.id).limit(1).single()
  return data
}

export async function updateGuestOrderStatusAction(orderId: string, newStatus: GuestOrderStatus) {
  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non autorisé')

  if (!VALID_STATUSES.includes(newStatus)) throw new Error('Statut invalide')

  const adminSupabase = await createAdminClient()

  const { data: order } = await adminSupabase.from('guest_orders').select('*').eq('id', orderId).single()
  if (!order) throw new Error('Commande introuvable')

  // ── Contrôle d'appartenance : seul le propriétaire de la boutique (ou un super_admin) peut modifier ──
  if (user.app_metadata?.role !== 'super_admin') {
    const { data: shop } = await adminSupabase.from('shops').select('id, name').eq('owner_id', user.id).limit(1).maybeSingle()
    const owns = !!shop && (order.shop_id
      ? order.shop_id === shop.id
      : (order.shop_name ?? '').toLowerCase() === (shop.name ?? '').toLowerCase())
    if (!owns) throw new Error('Non autorisé')
  }

  const wasDelivered = order.status === 'delivered_paid' || order.status === 'delivered_unpaid'
  const isDelivered  = newStatus  === 'delivered_paid'  || newStatus  === 'delivered_unpaid'
  const quantity = order.quantity || 1

  if (!wasDelivered && isDelivered) {
    // Décrémenter le stock à la livraison
    const { data: prod } = await adminSupabase.from('products').select('stock').eq('id', order.product_id).single()
    if (prod) {
      await adminSupabase.from('products').update({ stock: Math.max(0, prod.stock - quantity) }).eq('id', order.product_id)
    }
  } else if (wasDelivered && !isDelivered) {
    // Remettre le stock si on revient en arrière
    const { data: prod } = await adminSupabase.from('products').select('stock').eq('id', order.product_id).single()
    if (prod) {
      await adminSupabase.from('products').update({ stock: prod.stock + quantity }).eq('id', order.product_id)
    }
  }

  // Horodater le premier passage à 'new' (commande lue par le marchand)
  const updatePayload: Record<string, unknown> = { status: newStatus }
  if (newStatus === 'new' && !order.read_at) {
    updatePayload.read_at = new Date().toISOString()
  }

  const { error } = await adminSupabase.from('guest_orders').update(updatePayload).eq('id', orderId)
  if (error) {
    // Erreur 23514 = violation de contrainte CHECK (anciens statuts en BDD)
    if (error.code === '23514') {
      throw new Error(
        `La base de données n'accepte pas encore le statut "${newStatus}". ` +
        `Veuillez exécuter la migration SQL dans Supabase (fichier supabase/production_hardening.sql).`
      )
    }
    throw error
  }

  return { success: true }

}

export async function getMyOrdersAction() {
  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const adminSupabase = await createAdminClient()

  // Trouver la boutique du marchand
  const { data: shop } = await adminSupabase.from('shops').select('id, name').eq('owner_id', user.id).limit(1).maybeSingle()
  if (!shop) return []

  // Commandes par shop_id (fiable) + anciennes commandes sans shop_id (nom exact), en parallèle
  const [{ data: byId }, { data: legacy }] = await Promise.all([
    adminSupabase.from('guest_orders').select('*').eq('shop_id', shop.id)
      .order('created_at', { ascending: false }).limit(200),
    shop.name
      ? adminSupabase.from('guest_orders').select('*').is('shop_id', null).eq('shop_name', shop.name)
          .order('created_at', { ascending: false }).limit(50)
      : Promise.resolve({ data: [] as any[] }),
  ])

  return [...(byId ?? []), ...(legacy ?? [])]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
}

/**
 * Version ultra-légère pour la détection de nouvelles commandes (polling) :
 * uniquement les commandes au statut 'new', 4 colonnes, 20 lignes max.
 */
export async function getNewOrdersLiteAction() {
  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []
  const adminSupabase = await createAdminClient()
  const { data: shop } = await adminSupabase.from('shops').select('id').eq('owner_id', user.id).limit(1).maybeSingle()
  if (!shop) return []
  const { data } = await adminSupabase.from('guest_orders')
    .select('id, product_name, quantity, price')
    .eq('shop_id', shop.id).eq('status', 'new')
    .order('created_at', { ascending: false }).limit(20)
  return data ?? []
}

/**
 * Produits du marchand en UN aller-retour serveur (boutique + purge des
 * brouillons périmés + liste), colonnes minimales.
 */
export async function getMyProductsAction(draftTtlDays = 10) {
  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { noUser: true as const, products: [] as any[] }
  const admin = await createAdminClient()
  const { data: shop } = await admin.from('shops').select('id').eq('owner_id', user.id).limit(1).maybeSingle()
  if (!shop) return { noShop: true as const, products: [] as any[] }

  const limit = new Date(Date.now() - draftTtlDays * 86400000).toISOString()
  await admin.from('products').delete().eq('shop_id', shop.id).eq('status', 'draft').lt('updated_at', limit)

  const { data } = await admin.from('products')
    .select('id, name, price, compare_price, stock, status, sku, created_at, updated_at, product_images(url)')
    .eq('shop_id', shop.id)
    .order('created_at', { ascending: false })
    .limit(300)
  // une seule miniature par produit
  const products = (data ?? []).map((p: any) => ({ ...p, product_images: (p.product_images ?? []).slice(0, 1) }))
  return { products }
}

/**
 * Action publique — récupère une commande par son token de suivi.
 * Accessible sans authentification (l'acheteur sans compte peut suivre sa commande).
 */
export async function getOrderByTrackingToken(token: string) {
  if (!token || token.length < 10) return null
  const adminSupabase = await createAdminClient()
  const { data } = await adminSupabase
    .from('guest_orders')
    .select('id, product_name, product_img, price, quantity, shop_name, buyer_fullname, buyer_prenom, status, created_at, read_at')
    .eq('tracking_token', token)
    .single()
  return data ?? null
}
