'use client'

import { useState, useRef, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Star, ArrowLeft, ShoppingCart, Minus, Plus, Check, Store, Phone, Loader2, Heart } from 'lucide-react'
import { isFavorite, toggleFavorite } from '@/lib/favorites'
import { useCart } from '@/lib/cart-context'
import { createClient } from '@/lib/supabase/client'
import { getShopData } from '@/app/actions'

const BLUE = '#2D6BE4'
const ORANGE = '#f97316'
const GREEN = '#16a34a'

function fmt(n: number) { return n.toLocaleString('fr-FR') + ' FCFA' }

function Stars({ r }: { r: number }) {
  return (
    <span style={{ display: 'inline-flex', gap: 2 }}>
      {[1,2,3,4,5].map(i => (
        <Star key={i} size={14}
          fill={i <= Math.round(r) ? '#f59e0b' : 'none'}
          color={i <= Math.round(r) ? '#f59e0b' : '#d1d5db'} />
      ))}
    </span>
  )
}

export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { addItem, updateQty: cartUpdateQty, items, totalItems } = useCart()
  const supabase = createClient()

  const [p, setP] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [added, setAdded] = useState(false)
  const [fav, setFav] = useState(false)
  const [rv, setRv] = useState<{ count: number; avg: number; reviews: { rating: number; comment: string | null; buyer_name: string | null; created_at: string }[] }>({ count: 0, avg: 0, reviews: [] })

  useEffect(() => {
    fetch(`/api/reviews?product_id=${encodeURIComponent(id)}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d && typeof d.count === 'number') setRv(d) })
      .catch(() => {})
  }, [id])
  const btnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    async function loadProduct() {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          product_images ( url )
        `)
        .eq('id', id)
        .single()

      if (data) {
        const shopData = await getShopData(data.shop_id)
        setP({
          id: data.id,
          name: data.name,
          price: data.price,
          oldPrice: data.compare_price,
          desc: data.description || 'Aucune description disponible.',
          shop: shopData?.name || 'Boutique',
          merchantPhone: shopData?.phone || null,
          img: data.product_images?.[0]?.url || null,
          stock: data.stock || 0
        })
      }
      setLoading(false)
    }
    loadProduct()
  }, [id])

  useEffect(() => { if (p) setFav(isFavorite(p.id)) }, [p])

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Loader2 className="animate-spin" size={32} color={ORANGE} />
      </div>
    )
  }

  if (!p) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: 16 }}>
        <h2>Produit introuvable</h2>
        <button onClick={() => router.back()} style={{ padding: '10px 20px', background: ORANGE, color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer' }}>Retour</button>
      </div>
    )
  }

  const discount = p.oldPrice ? Math.round((1 - p.price / p.oldPrice) * 100) : null
  const cartItem = items.find(i => i.id === p.id)
  const inCart = (cartItem?.quantity ?? 0) > 0
  const qty = cartItem?.quantity ?? 0

  // Écriture localStorage directe (bypass React context si nécessaire)
  function writeToLocalStorage(productId: string) {
    try {
      const raw = localStorage.getItem('ma_cart')
      const cart: Array<{id:string;name:string;price:number;img:string;shop:string;merchantPhone:string;quantity:number}> = raw ? JSON.parse(raw) : []
      const idx = cart.findIndex(i => i.id === productId)
      if (idx >= 0) {
        cart[idx].quantity += 1
      } else {
        cart.push({ id: p!.id, name: p!.name, price: p!.price, img: p!.img, shop: p!.shop, merchantPhone: p!.merchantPhone, quantity: 1 })
      }
      localStorage.setItem('ma_cart', JSON.stringify(cart))
    } catch {}
  }

  function handleAdd() {
    if (btnRef.current) {
      btnRef.current.style.background = GREEN
      btnRef.current.textContent = '\u2713 Ajout\u00e9 au panier !'
    }
    writeToLocalStorage(p!.id)
    try { addItem({ id: p!.id, name: p!.name, price: p!.price, img: p!.img, shop: p!.shop, merchantPhone: p!.merchantPhone }, 1) } catch {}
    setAdded(true)
  }

  function handleMinus() {
    cartUpdateQty(p!.id, qty - 1)
    if (qty <= 1) setAdded(false)
  }
  function handlePlus() { cartUpdateQty(p!.id, qty + 1) }

  return (
    <div style={{ background: '#f3f4f6', minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif', paddingBottom: 'calc(var(--bottom-nav-height, 60px) + var(--safe-bottom, 0px) + 24px)' }}>

      {/* NAVBAR */}
      <div style={{ background: 'white', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid #e5e7eb' }}>
        <button type="button" onClick={() => router.back()}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px', display: 'flex', alignItems: 'center', minHeight: 'auto' }}>
          <ArrowLeft size={20} color="#374151" />
        </button>
        <div style={{ flex: 1, background: '#f3f4f6', borderRadius: 20, padding: '8px 14px', fontSize: '0.82rem', color: '#9ca3af' }}>
          Recherche sur Jokoo
        </div>
        <Link href="/panier" style={{ position: 'relative', padding: 8, display: 'flex', textDecoration: 'none' }}>
          <ShoppingCart size={22} color="#111827" />
          {totalItems > 0 && (
            <span style={{ position: 'absolute', top: 3, right: 3, background: ORANGE, color: 'white', borderRadius: '50%', width: 15, height: 15, fontSize: '0.58rem', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'auto' }}>
              {totalItems > 9 ? '9+' : totalItems}
            </span>
          )}
        </Link>
      </div>

      {/* IMAGE */}
      <div style={{ background: 'white', minHeight: 260, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, position: 'relative' }}>
        {p.img ? (
          <img src={p.img} alt={p.name} style={{ maxHeight: 260, maxWidth: '100%', objectFit: 'contain' }} />
        ) : (
          <div style={{ padding: 40, background: '#f9fafb', borderRadius: 12 }}>
            <ShoppingCart size={48} color="#d1d5db" />
          </div>
        )}
        {discount && (
          <div style={{ position: 'absolute', top: 10, left: 10, background: '#ef4444', color: 'white', fontWeight: 800, fontSize: '0.72rem', padding: '4px 8px', borderRadius: 6 }}>-{discount}%</div>
        )}
        <button type="button" aria-label={fav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          onClick={() => setFav(toggleFavorite({ id: p.id, name: p.name, price: p.price, img: p.img, shop: p.shop }))}
          style={{ position: 'absolute', top: 10, right: 10, width: 42, height: 42, borderRadius: '50%', background: 'white', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,.12)', minHeight: 'auto' }}>
          <Heart size={20} color={fav ? '#ef4444' : '#6b7280'} fill={fav ? '#ef4444' : 'none'} />
        </button>
      </div>

      {/* PRIX + NOM */}
      <div style={{ background: 'white', margin: '6px 0', padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <div style={{ background: BLUE, color: 'white', fontSize: '0.66rem', fontWeight: 700, padding: '2px 8px', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 3 }}>
            <Store size={9} /> Boutique Officielle
          </div>
        </div>
        <h1 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#111827', marginBottom: 8, lineHeight: 1.4 }}>{p.name}</h1>
        <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: 10 }}>
          Vendeur : <span style={{ color: BLUE, fontWeight: 600 }}>{p.shop}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
          <span style={{ fontSize: '1.45rem', fontWeight: 900, color: '#111827' }}>{fmt(p.price)}</span>
          {p.oldPrice && <span style={{ fontSize: '0.88rem', color: '#9ca3af', textDecoration: 'line-through' }}>{fmt(p.oldPrice)}</span>}
          {discount && <span style={{ background: '#fef2f2', color: '#ef4444', fontWeight: 800, fontSize: '0.72rem', padding: '2px 6px', borderRadius: 4 }}>-{discount}%</span>}
        </div>
        <div style={{ fontSize: '0.75rem', color: GREEN, fontWeight: 600, marginBottom: 8 }}>✓ En stock ({p.stock} {p.stock > 1 ? 'disponibles' : 'disponible'})</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {rv.count > 0 ? (
            <>
              <Stars r={rv.avg} />
              <span style={{ fontSize: '0.78rem', color: '#374151', fontWeight: 700 }}>{rv.avg.toFixed(1)}</span>
              <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>({rv.count} avis)</span>
            </>
          ) : (
            <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Pas encore d&apos;avis</span>
          )}
        </div>
      </div>

      {/* AVIS CLIENTS (commandes livrées uniquement) */}
      {rv.count > 0 && (
        <div style={{ background: 'white', margin: '6px 0', padding: '14px 16px' }}>
          <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#111827', marginBottom: 10 }}>Avis clients ({rv.count})</div>
          {rv.reviews.map((r, i) => (
            <div key={i} style={{ padding: '10px 0', borderTop: i ? '1px solid #f3f4f6' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                <Stars r={r.rating} />
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#374151' }}>{r.buyer_name || 'Client'}</span>
                <span style={{ fontSize: '0.68rem', color: '#9ca3af' }}>· Achat vérifié · {new Date(r.created_at).toLocaleDateString('fr-FR')}</span>
              </div>
              {r.comment && <p style={{ margin: 0, fontSize: '0.82rem', color: '#374151', lineHeight: 1.5 }}>{r.comment}</p>}
            </div>
          ))}
        </div>
      )}

      {/* ZONE D'ACTION */}
      <div style={{ background: 'white', margin: '6px 0', padding: '16px' }}>
        {!inCart && !added ? (
          <button
            id="btn-ajouter"
            ref={btnRef}
            type="button"
            onClick={handleAdd}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              width: '100%', padding: '18px 0', background: ORANGE, color: 'white',
              border: 'none', borderRadius: 14, fontSize: '1.05rem', fontWeight: 900,
              cursor: 'pointer', touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent', userSelect: 'none',
              boxShadow: '0 6px 20px rgba(249,115,22,0.45)',
              position: 'relative', zIndex: 1,
            }}
          >
            <ShoppingCart size={22} />
            Ajouter au panier
          </button>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
              <button type="button" onClick={handleMinus}
                style={{ width: 48, height: 48, background: qty <= 1 ? '#fef2f2' : ORANGE, color: qty <= 1 ? '#ef4444' : 'white', border: 'none', borderRadius: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', touchAction: 'manipulation', minHeight: 'auto' }}>
                <Minus size={20} />
              </button>
              <span style={{ fontSize: '1.5rem', fontWeight: 900, minWidth: 40, textAlign: 'center' }}>{qty}</span>
              <button type="button" onClick={handlePlus}
                style={{ width: 48, height: 48, background: ORANGE, color: 'white', border: 'none', borderRadius: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', touchAction: 'manipulation', minHeight: 'auto' }}>
                <Plus size={20} />
              </button>
            </div>
            <Link href="/panier" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: GREEN, color: 'white', borderRadius: 14, padding: '15px', fontWeight: 800, fontSize: '0.95rem', textDecoration: 'none' }}>
              <Check size={18} /> Voir le panier · {fmt(p.price * qty)}
            </Link>
          </div>
        )}
      </div>

      {/* APPELER LE VENDEUR */}
      {p.merchantPhone && (
        <div style={{ background: 'white', margin: '6px 0', padding: '14px 16px' }}>
          <a href={`tel:${p.merchantPhone}`}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '14px', background: '#fff7ed', border: '2px solid #fed7aa', borderRadius: 12, textDecoration: 'none' }}>
            <Phone size={20} color={ORANGE} />
            <div>
              <div style={{ fontSize: '0.82rem', fontWeight: 800, color: ORANGE }}>Appeler le vendeur</div>
              <div style={{ fontSize: '0.72rem', color: '#9ca3af' }}>{p.merchantPhone}</div>
            </div>
          </a>
        </div>
      )}

      {/* DESCRIPTION */}
      <div style={{ background: 'white', margin: '6px 0', padding: '14px 16px' }}>
        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#374151', marginBottom: 8 }}>Description</div>
        <p style={{ fontSize: '0.82rem', color: '#6b7280', lineHeight: 1.65, margin: 0 }}>{p.desc}</p>
      </div>

      {/* NAVIGATION BAS */}
      <div style={{ margin: '6px 0', padding: '12px 16px', background: 'white', display: 'flex', gap: 10 }}>
        <Link href="/" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 12, background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 10, textDecoration: 'none', gap: 4 }}>
          <span style={{ fontSize: '1.2rem' }}>🏠</span>
          <span style={{ fontSize: '0.65rem', color: '#374151', fontWeight: 600 }}>Accueil</span>
        </Link>
        <Link href="/panier" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 12, background: inCart ? '#f0fdf4' : '#f9fafb', border: `1px solid ${inCart ? '#bbf7d0' : '#e5e7eb'}`, borderRadius: 10, textDecoration: 'none', gap: 4, position: 'relative' }}>
          <span style={{ fontSize: '1.2rem' }}>🛒</span>
          <span style={{ fontSize: '0.65rem', color: inCart ? GREEN : '#374151', fontWeight: 600 }}>Panier{totalItems > 0 ? ` (${totalItems})` : ''}</span>
        </Link>
      </div>

      <div style={{ height: 24 }} />
    </div>
  )
}
