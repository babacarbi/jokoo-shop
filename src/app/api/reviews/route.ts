import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'

const DELIVERED = ['delivered_paid', 'delivered_unpaid']

/**
 * GET ?product_id=…  → note moyenne, nombre d'avis, 10 derniers avis
 * GET ?token=…       → l'avis déjà laissé pour cette commande (ou null)
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const productId = url.searchParams.get('product_id')
  const token = url.searchParams.get('token')
  const supabase = await createAdminClient()

  if (token) {
    const { data: order } = await supabase.from('guest_orders').select('id').eq('tracking_token', token).maybeSingle()
    if (!order) return NextResponse.json({ review: null })
    const { data } = await supabase.from('product_reviews').select('rating, comment').eq('order_id', order.id).maybeSingle()
    return NextResponse.json({ review: data ?? null })
  }

  if (!productId || !/^[0-9a-f-]{36}$/i.test(productId)) {
    return NextResponse.json({ error: 'product_id invalide' }, { status: 400 })
  }
  const { data } = await supabase
    .from('product_reviews')
    .select('rating, comment, buyer_name, created_at')
    .eq('product_id', productId)
    .order('created_at', { ascending: false })
    .limit(200)
  const all = data ?? []
  const count = all.length
  const avg = count ? all.reduce((s, r) => s + r.rating, 0) / count : 0
  return NextResponse.json(
    { count, avg: Math.round(avg * 10) / 10, reviews: all.slice(0, 10) },
    { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' } }
  )
}

const Schema = z.object({
  token: z.string().min(10).max(100),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(500).optional(),
})

/** POST : uniquement pour une commande livrée, un seul avis par commande. */
export async function POST(req: NextRequest) {
  const parsed = Schema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'Avis invalide' }, { status: 400 })
  const { token, rating, comment } = parsed.data

  const supabase = await createAdminClient()
  const { data: order } = await supabase
    .from('guest_orders')
    .select('id, product_id, shop_id, status, buyer_prenom, buyer_fullname')
    .eq('tracking_token', token)
    .maybeSingle()
  if (!order) return NextResponse.json({ error: 'Commande introuvable' }, { status: 404 })
  if (!DELIVERED.includes(order.status)) {
    return NextResponse.json({ error: 'Vous pourrez noter ce produit une fois la commande livrée.' }, { status: 403 })
  }

  const name = (order.buyer_prenom || order.buyer_fullname || 'Client').split(' ')[0]
  const { error } = await supabase.from('product_reviews').insert({
    order_id: order.id,
    product_id: order.product_id,
    shop_id: order.shop_id,
    rating,
    comment: comment || null,
    buyer_name: name,
  })
  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'Vous avez déjà donné votre avis.' }, { status: 409 })
    console.error('review error', error)
    return NextResponse.json({ error: 'Impossible d\'enregistrer l\'avis' }, { status: 500 })
  }
  return NextResponse.json({ success: true }, { status: 201 })
}
