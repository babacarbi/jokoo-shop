import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'

async function getProduct(id: string) {
  try {
    const supabase = await createAdminClient()
    const { data } = await supabase
      .from('products')
      .select('id, name, description, price, stock, status, product_images(url)')
      .eq('id', id)
      .eq('status', 'active')
      .maybeSingle()
    return data
  } catch { return null }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const p: any = await getProduct(id)
  if (!p) return { title: 'Produit', robots: { index: false } }
  const img = p.product_images?.[0]?.url
  const price = Number(p.price).toLocaleString('fr-FR')
  const desc = (p.description || `${p.name} — ${price} FCFA. Commandez en ligne sur Jokoo, livraison en Afrique.`).slice(0, 155)
  return {
    title: `${p.name} — ${price} FCFA`,
    description: desc,
    alternates: { canonical: `/produit/${id}` },
    openGraph: { title: `${p.name} — ${price} FCFA`, description: desc, type: 'website', images: img ? [img] : undefined },
    twitter: { card: 'summary_large_image', title: p.name, description: desc, images: img ? [img] : undefined },
  }
}

export default async function ProductLayout({ children, params }: { children: React.ReactNode; params: Promise<{ id: string }> }) {
  const { id } = await params
  const p: any = await getProduct(id)
  const jsonLd = p ? {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.name,
    description: p.description || undefined,
    image: (p.product_images ?? []).map((i: any) => i.url),
    offers: {
      '@type': 'Offer',
      priceCurrency: 'XOF',
      price: Number(p.price),
      availability: p.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    },
  } : null
  return (
    <>
      {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />}
      {children}
    </>
  )
}
