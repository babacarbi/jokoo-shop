import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// GET /api/boutique/[slug] — public, pas d'authentification requise
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const adminClient = await createAdminClient()

    // 1. Récupérer le shop par slug
    const { data: shop, error: shopError } = await adminClient
      .from('shops')
      .select('id, name, slug, description, city, country, phone, email, whatsapp, website, logo_url, banner_url, status')
      .eq('slug', slug)
      .in('status', ['active', 'pending'])
      .single()

    if (shopError || !shop) {
      return NextResponse.json({ error: 'Boutique introuvable ou inactive' }, { status: 404 })
    }

    // 2. Récupérer les produits actifs de ce shop
    const { data: products, error: prodError } = await adminClient
      .from('products')
      .select('id, name, description, price, compare_price, stock, category_id, slug, status')
      .eq('shop_id', shop.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (prodError) {
      return NextResponse.json({ error: 'Erreur lors de la récupération des produits' }, { status: 500 })
    }

    // 3. Récupérer les images de chaque produit
    const productIds = (products ?? []).map((p) => p.id)
    let images: Array<{ product_id: string; url: string; position: number }> = []
    if (productIds.length > 0) {
      const { data: imgData } = await adminClient
        .from('product_images')
        .select('product_id, url, position')
        .in('product_id', productIds)
        .order('position', { ascending: true })
      images = imgData ?? []
    }

    // Attacher la première image à chaque produit
    const productsWithImages = (products ?? []).map((p) => ({
      ...p,
      img: images.find((img) => img.product_id === p.id)?.url ?? null,
    }))

    return NextResponse.json({ shop, products: productsWithImages })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur serveur'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
