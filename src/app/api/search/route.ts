import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

const PAGE_SIZE = 20

/**
 * Recherche publique de produits : texte, catégorie, prix min/max, tri, pagination.
 * Colonnes minimales + 1 seule image par produit (egress réduit), réponse mise en cache 60 s.
 */
export async function GET(req: NextRequest) {
  const sp = new URL(req.url).searchParams
  const q = (sp.get('q') ?? '').trim().slice(0, 60).replace(/[%,()]/g, ' ')
  const cat = sp.get('cat')
  const min = Number(sp.get('min')); const max = Number(sp.get('max'))
  const sort = sp.get('sort') ?? 'new'
  const page = Math.max(0, parseInt(sp.get('page') ?? '0') || 0)

  const supabase = await createAdminClient()
  let query = supabase.from('products')
    .select('id, name, price, compare_price, shop_id, product_images(url)', { count: 'exact' })
    .eq('status', 'active')

  if (q) query = query.or(`name.ilike.%${q}%,description.ilike.%${q}%`)
  if (cat && /^[0-9a-f-]{36}$/i.test(cat)) query = query.eq('category_id', cat)
  if (min > 0) query = query.gte('price', min)
  if (max > 0) query = query.lte('price', max)

  if (sort === 'price_asc') query = query.order('price', { ascending: true })
  else if (sort === 'price_desc') query = query.order('price', { ascending: false })
  else query = query.order('created_at', { ascending: false })

  const { data, count, error } = await query.range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1)
  if (error) return NextResponse.json({ error: 'Recherche indisponible' }, { status: 500 })

  const shopIds = Array.from(new Set((data ?? []).map(p => p.shop_id)))
  const { data: shops } = shopIds.length
    ? await supabase.from('shops').select('id, name').in('id', shopIds)
    : { data: [] as { id: string; name: string }[] }

  const products = (data ?? []).map((p: any) => ({
    id: p.id, name: p.name, price: p.price, oldPrice: p.compare_price,
    shop: shops?.find(s => s.id === p.shop_id)?.name ?? 'Boutique',
    img: p.product_images?.[0]?.url ?? null,
  }))

  return NextResponse.json(
    { products, total: count ?? 0, hasMore: (page + 1) * PAGE_SIZE < (count ?? 0) },
    { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' } }
  )
}
