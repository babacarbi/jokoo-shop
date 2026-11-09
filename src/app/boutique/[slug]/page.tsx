import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Store, Phone, MapPin, Globe, ShoppingBag, Star, ArrowLeft, Share2 } from 'lucide-react'
import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'
import ShareShopCard from '@/components/ShareShopCard'

interface Product {
  id: string
  name: string
  description: string
  price: number
  compare_price: number | null
  stock: number
  img: string | null
  slug: string
}

interface Shop {
  id: string
  name: string
  slug: string
  description: string | null
  city: string | null
  country: string | null
  phone: string | null
  email: string | null
  whatsapp: boolean
  website: string | null
  logo_url: string | null
  banner_url: string | null
}

async function getShopData(slug: string): Promise<{ shop: Shop; products: Product[] } | null> {
  try {
    const adminClient = await createAdminClient()

    const { data: shop } = await adminClient
      .from('shops')
      .select('id, name, slug, description, city, country, phone, email, whatsapp, website, logo_url, banner_url, status')
      .eq('slug', slug)
      .in('status', ['active', 'pending'])
      .single()
    if (!shop) return null

    const { data: products } = await adminClient
      .from('products')
      .select('id, name, description, price, compare_price, stock, category_id, slug, status')
      .eq('shop_id', shop.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    const productIds = (products ?? []).map((p) => p.id)
    let images: Array<{ product_id: string; url: string }> = []
    if (productIds.length > 0) {
      const { data: imgData } = await adminClient
        .from('product_images')
        .select('product_id, url, position')
        .in('product_id', productIds)
        .order('position', { ascending: true })
      images = imgData ?? []
    }

    return {
      shop: shop as Shop,
      products: (products ?? []).map((p) => ({
        ...p,
        img: images.find((i) => i.product_id === p.id)?.url ?? null,
      })) as Product[],
    }
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const data = await getShopData(slug)
  if (!data) return { title: 'Boutique introuvable' }
  return {
    title: `${data.shop.name} — Boutique sur Jokoo`,
    description: data.shop.description ?? `Découvrez les produits de ${data.shop.name} sur Jokoo.`,
  }
}

function fmt(n: number) { return n.toLocaleString('fr-FR') + ' FCFA' }

function ProductCard({ product, shopName, shopPhone }: { product: Product; shopName: string; shopPhone: string | null }) {
  const discount = product.compare_price
    ? Math.round((1 - product.price / product.compare_price) * 100)
    : null

  return (
    <div style={{
      background: 'white', borderRadius: 16, overflow: 'hidden',
      boxShadow: '0 2px 12px rgba(0,0,0,0.07)', border: '1px solid #f3f4f6',
      transition: 'transform 0.2s, box-shadow 0.2s',
      display: 'flex', flexDirection: 'column'
    }}>
      <Link
        href={`/produit/${product.id}`}
        style={{ textDecoration: 'none', display: 'block', color: 'inherit', flex: 1 }}
      >
        {/* Image */}
        <div style={{ position: 'relative', aspectRatio: '1', background: '#f9fafb', overflow: 'hidden' }}>
          {product.img ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.img}
              alt={product.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShoppingBag size={40} color="#d1d5db" />
            </div>
          )}
          {discount && (
            <div style={{
              position: 'absolute', top: 8, left: 8, background: '#ef4444', color: 'white',
              fontWeight: 800, fontSize: '0.68rem', padding: '3px 7px', borderRadius: 6,
            }}>-{discount}%</div>
          )}
        </div>

        {/* Infos */}
        <div style={{ padding: '12px 14px 0' }}>
          <p style={{ fontSize: '0.82rem', fontWeight: 700, color: '#111827', marginBottom: 6, lineHeight: 1.3,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {product.name}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: '1rem', fontWeight: 900, color: '#111827' }}>{fmt(product.price)}</span>
            {product.compare_price && (
              <span style={{ fontSize: '0.75rem', color: '#9ca3af', textDecoration: 'line-through' }}>
                {fmt(product.compare_price)}
              </span>
            )}
          </div>
        </div>
      </Link>
      
      {/* Phone Link */}
      {shopPhone && (
        <div style={{ padding: '8px 14px 14px' }}>
          <a
            href={`tel:${shopPhone}`}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 8,
              padding: '6px 10px', textDecoration: 'none',
            }}
          >
            <Phone size={12} color="#f97316" />
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#f97316' }}>Appeler</span>
          </a>
        </div>
      )}
    </div>
  )
}

export default async function BoutiquePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const data = await getShopData(slug)
  if (!data) notFound()

  const { shop, products } = data
  const h = await headers()
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? ''
  const proto = h.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https')
  const appUrl = host ? `${proto}://${host}` : ''
  const shopUrl = `${appUrl}/boutique/${slug}`

  // Note réelle de la boutique (avis de commandes livrées)
  let avgRating = 0, reviewCount = 0
  try {
    const sb = await createAdminClient()
    const { data: rvs } = await sb.from('product_reviews').select('rating').eq('shop_id', shop.id).limit(1000)
    reviewCount = rvs?.length ?? 0
    avgRating = reviewCount ? rvs!.reduce((s, r) => s + r.rating, 0) / reviewCount : 0
  } catch {}

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6', fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* HEADER */}
      <div style={{ background: 'white', borderBottom: '1px solid #e5e7eb', position: 'sticky', top: 0, zIndex: 40 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none', color: '#6b7280', fontSize: '0.82rem', flexShrink: 0 }}>
            <ArrowLeft size={16} />
            <span style={{ fontWeight: 600 }}>Accueil</span>
          </Link>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(135deg, #2D6BE4, #16a34a)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Store size={16} color="white" />
            </div>
            <span style={{ fontWeight: 800, fontSize: '0.92rem', color: '#111827' }}>{shop.name}</span>
          </div>
          {/* Partager */}
          <a
            href={`https://wa.me/?text=${encodeURIComponent(`Découvrez ma boutique sur Jokoo : ${shopUrl}`)}`}
            target="_blank" rel="noopener noreferrer"
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#25d366', color: 'white', borderRadius: 8, padding: '6px 12px', textDecoration: 'none', fontSize: '0.78rem', fontWeight: 700 }}>
            <Share2 size={14} />
            Partager
          </a>
        </div>
      </div>

      {/* HERO BOUTIQUE */}
      <div style={{
        background: shop.banner_url
          ? `linear-gradient(rgba(0,0,0,0.55), rgba(0,0,0,0.55)), url(${shop.banner_url}) center/cover`
          : 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 40%, #2D6BE4 70%, #16a34a 100%)',
        padding: '48px 20px 36px',
        textAlign: 'center',
        color: 'white',
      }}>
        {/* Logo */}
        <div style={{
          width: 80, height: 80, borderRadius: 24,
          background: shop.logo_url ? `url(${shop.logo_url}) center/cover` : 'rgba(255,255,255,0.15)',
          backdropFilter: 'blur(8px)',
          border: '3px solid rgba(255,255,255,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 16px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
        }}>
          {!shop.logo_url && <Store size={36} color="white" />}
        </div>

        <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: 'clamp(1.4rem, 4vw, 2rem)', marginBottom: 8 }}>
          {shop.name}
        </h1>
        {shop.description && (
          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.9rem', maxWidth: 480, margin: '0 auto 16px', lineHeight: 1.55 }}>
            {shop.description}
          </p>
        )}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
          {shop.city && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.15)', borderRadius: 100, padding: '5px 12px', fontSize: '0.78rem', backdropFilter: 'blur(4px)' }}>
              <MapPin size={12} /> {shop.city}{shop.country ? `, ${shop.country}` : ''}
            </span>
          )}
          {shop.phone && (
            <a href={`tel:${shop.phone}`} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.15)', borderRadius: 100, padding: '5px 12px', fontSize: '0.78rem', textDecoration: 'none', color: 'white', backdropFilter: 'blur(4px)' }}>
              <Phone size={12} /> {shop.phone}
            </a>
          )}
          {shop.website && (
            <a href={shop.website} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.15)', borderRadius: 100, padding: '5px 12px', fontSize: '0.78rem', textDecoration: 'none', color: 'white', backdropFilter: 'blur(4px)' }}>
              <Globe size={12} /> Site web
            </a>
          )}
        </div>
      </div>

      {/* LIEN DE PARTAGE (visible sans scroller) */}
      <div style={{ marginTop: -4, paddingBottom: 4 }}>
        <ShareShopCard url={shopUrl} shopName={shop.name} />
      </div>

      {/* STATS RAPIDES */}
      <div style={{ background: 'white', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '12px 20px', display: 'flex', gap: 24, justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: 900, fontSize: '1.1rem', color: '#111827' }}>{products.length}</div>
            <div style={{ fontSize: '0.7rem', color: '#9ca3af' }}>Produits</div>
          </div>
          <div style={{ width: 1, background: '#e5e7eb' }} />
          <div style={{ textAlign: 'center', display: 'flex', alignItems: 'center', gap: 4 }}>
            {reviewCount > 0 ? (
              <>
                <Star size={14} fill="#f59e0b" color="#f59e0b" />
                <div style={{ fontWeight: 900, fontSize: '1.1rem', color: '#111827' }}>{avgRating.toFixed(1)}</div>
                <div style={{ fontSize: '0.7rem', color: '#9ca3af' }}>/ 5 · {reviewCount} avis</div>
              </>
            ) : (
              <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Pas encore d&apos;avis</div>
            )}
          </div>
        </div>
      </div>

      {/* GRILLE PRODUITS */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px' }}>
        {products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9ca3af' }}>
            <ShoppingBag size={48} color="#e5e7eb" style={{ marginBottom: 16 }} />
            <p style={{ fontSize: '1rem', fontWeight: 600 }}>Aucun produit disponible pour le moment</p>
            <p style={{ fontSize: '0.85rem', marginTop: 4 }}>Revenez bientôt !</p>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.1rem', color: '#111827' }}>
                Tous les produits
              </h2>
              <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>{products.length} article{products.length > 1 ? 's' : ''}</span>
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
              gap: 14,
            }}>
              {products.map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  shopName={shop.name}
                  shopPhone={shop.phone}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* FOOTER PARTAGE */}
      <div style={{ paddingTop: 12, paddingBottom: 100 }}>
        <ShareShopCard url={shopUrl} shopName={shop.name} />
      </div>
    </div>
  )
}
