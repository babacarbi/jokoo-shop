import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { sendPushToShop } from '@/lib/push'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'

// Le client n'envoie QUE l'identité du produit + la quantité + ses coordonnées.
// Prix, nom, image, boutique sont relus côté serveur depuis la base (anti-falsification).
const OrderSchema = z.object({
  product_id:     z.string().uuid(),
  quantity:       z.coerce.number().int().min(1).max(50).default(1),
  buyer_prenom:   z.string().trim().max(80).optional(),
  buyer_nom:      z.string().trim().max(80).optional(),
  buyer_fullname: z.string().trim().min(2).max(160),
  buyer_phone:    z.string().trim().min(6).max(40),
  buyer_country:  z.string().trim().max(60).optional(),
  buyer_whatsapp: z.boolean().optional(),
})

const MAX_ORDERS_PER_PHONE_PER_HOUR = 10

export async function POST(req: NextRequest) {
  try {
    const parsed = OrderSchema.safeParse(await req.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json({ error: 'Informations de commande invalides' }, { status: 400 })
    }
    const o = parsed.data

    const supabase = await createAdminClient()

    // ── Anti-spam : limite de commandes par numéro ──────────────────────
    const since = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const { count } = await supabase
      .from('guest_orders')
      .select('id', { count: 'exact', head: true })
      .eq('buyer_phone', o.buyer_phone)
      .gte('created_at', since)
    if ((count ?? 0) >= MAX_ORDERS_PER_PHONE_PER_HOUR) {
      return NextResponse.json({ error: 'Trop de commandes en peu de temps. Réessayez plus tard.' }, { status: 429 })
    }

    // ── Produit + boutique relus depuis la base ──────────────────────────
    const { data: product } = await supabase
      .from('products')
      .select('id, name, price, stock, status, shop_id')
      .eq('id', o.product_id)
      .maybeSingle()
    if (!product || product.status !== 'active') {
      return NextResponse.json({ error: 'Produit indisponible' }, { status: 404 })
    }
    if (product.stock < o.quantity) {
      return NextResponse.json(
        { error: product.stock > 0 ? `Stock insuffisant (${product.stock} disponible${product.stock > 1 ? 's' : ''})` : 'Produit en rupture de stock' },
        { status: 409 }
      )
    }

    const { data: shop } = await supabase
      .from('shops')
      .select('id, name, status')
      .eq('id', product.shop_id)
      .maybeSingle()
    if (!shop || shop.status === 'suspended' || shop.status === 'closed') {
      return NextResponse.json({ error: 'Boutique indisponible' }, { status: 404 })
    }

    const { data: img } = await supabase
      .from('product_images')
      .select('url')
      .eq('product_id', product.id)
      .limit(1)
      .maybeSingle()

    // Token unique de suivi (permet à l'acheteur de suivre sans compte)
    const tracking_token = randomUUID()
    const parts = o.buyer_fullname.split(/\s+/)

    const { data, error } = await supabase
      .from('guest_orders')
      .insert([{
        product_id:      product.id,
        product_name:    product.name,
        product_img:     img?.url ?? null,
        price:           Number(product.price) * o.quantity,   // total calculé serveur
        buyer_prenom:    o.buyer_prenom || parts[0] || '',
        buyer_nom:       o.buyer_nom || parts.slice(1).join(' ') || '',
        buyer_fullname:  o.buyer_fullname,
        buyer_phone:     o.buyer_phone,
        buyer_country:   o.buyer_country ?? 'Sénégal',
        buyer_whatsapp:  o.buyer_whatsapp ?? false,
        quantity:        o.quantity,
        shop_name:       shop.name,
        shop_id:         shop.id,
        status:          'new',
        tracking_token,
      }])
      .select('id, tracking_token')
      .single()

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: 'Impossible d\'enregistrer la commande' }, { status: 500 })
    }

    try {
      await sendPushToShop(shop.id, {
        title: '🛒 Nouvelle commande !',
        body: `${product.name} × ${o.quantity} — ${(Number(product.price) * o.quantity).toLocaleString('fr-FR')} FCFA · ${o.buyer_fullname}`,
        url: '/merchant/orders',
        tag: `order-${data.id}`,
      })
    } catch (e) { console.error('Push error:', e) }

    return NextResponse.json({
      success: true,
      order_id: data.id,
      tracking_token: data.tracking_token,
      tracking_url: `/suivi/${data.tracking_token}`,
    }, { status: 201 })
  } catch (err) {
    console.error('API error:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
