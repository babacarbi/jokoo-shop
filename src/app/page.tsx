'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import Link from 'next/link'
import { Search, ShoppingCart, User, Star, Heart, ArrowRight, Store, Tag, Shield, Truck, Zap, Menu } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { getShopsData } from '@/app/actions'

const BLUE = '#2D6BE4'

const CATEGORIES = [
  { label: 'Téléphones & Tablettes', slug: 'telephonie',    img: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=120&h=120&fit=crop&crop=center' },
  { label: 'TV & High Tech',         slug: 'tv-hifi',        img: 'https://images.unsplash.com/photo-1593784991095-a205069470b6?w=120&h=120&fit=crop&crop=center' },
  { label: 'Électroménager',         slug: 'electromenager', img: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=120&h=120&fit=crop&crop=center' },
  { label: 'Cosmétique',             slug: 'cosmetique',     img: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=120&h=120&fit=crop&crop=center' },
  { label: 'Mode',                   slug: 'mode',           img: 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=120&h=120&fit=crop&crop=center' },
  { label: 'Alimentation',           slug: 'alimentation',   img: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=120&h=120&fit=crop&crop=center' },
  { label: 'Informatique',           slug: 'informatique',   img: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=120&h=120&fit=crop&crop=center' },
  { label: 'C. Alimentaire',         slug: 'complement',     img: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=120&h=120&fit=crop&crop=center' },
  { label: 'Scolaire',               slug: 'scolaire',       img: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=120&h=120&fit=crop&crop=center' },
  { label: 'Désinfection',           slug: 'desinfection',   img: 'https://images.unsplash.com/photo-1584483766114-2cea6facdf57?w=120&h=120&fit=crop&crop=center' },
  { label: 'Maison & Déco',          slug: 'maison',         img: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=120&h=120&fit=crop&crop=center' },
  { label: 'Bébé & Enfant',          slug: 'bebe',           img: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?w=120&h=120&fit=crop&crop=center' },
  { label: 'Sport & Loisirs',        slug: 'sport',          img: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=120&h=120&fit=crop&crop=center' },
]

const PRODUCTS = [
  { id: 1,  name: 'Samsung Galaxy A55 5G – 128Go',      shop: 'Tech Dakar',          price: 289000, oldPrice: 350000, rating: 4.5, reviews: 234, img: 'https://images.unsplash.com/photo-1610945264803-c22b62d2a7b3?w=300&h=300&fit=crop&crop=center' },
  { id: 2,  name: 'Smart TV LED 43 Pouces Android',     shop: 'Électro Abidjan',     price: 189000, oldPrice: 240000, rating: 4.3, reviews: 156, img: '/photos/tv%20smart.jpeg' },
  { id: 3,  name: 'iPhone 14 Pro Max 256Go',            shop: 'iStore Dakar',        price: 620000, oldPrice: null,   rating: 4.8, reviews: 89,  img: '/photos/iphone_14_pro_max_gold_full_cover_ae0c.webp' },
  { id: 4,  name: 'Créatine Monohydrate 500',           shop: 'SportNutrition Dakar',price: 18000,  oldPrice: 24000,  rating: 4.6, reviews: 312, img: '/photos/Creatine%20Monohydrate%20.jpeg' },
  { id: 5,  name: 'Air Fryer 5L Numérique',             shop: 'Casa Plus',           price: 95000,  oldPrice: 120000, rating: 4.4, reviews: 78,  img: '/photos/air%20flyer%205%20l.jpeg' },
  { id: 6,  name: 'Balea Crème Main',                   shop: 'Beauté & Soins',      price: 2000,   oldPrice: 2500,   rating: 4.9, reviews: 521, img: '/photos/balea%20creme%20main%20.jpg' },
  { id: 7,  name: 'Casque Bluetooth JBL Tune 520',      shop: 'Tech Dakar',          price: 55000,  oldPrice: 75000,  rating: 4.2, reviews: 189, img: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=300&fit=crop&crop=center' },
  { id: 8,  name: 'Boubou Brodé Sénégalais Grand Bleu', shop: 'Mode Africaine',      price: 75000,  oldPrice: null,   rating: 4.7, reviews: 203, img: '/photos/boubou%20bleu.jpg' },
  { id: 9,  name: 'Réfrigérateur 250L NoFrost',         shop: 'Électro Abidjan',     price: 340000, oldPrice: 420000, rating: 4.1, reviews: 45,  img: '/photos/refregirateur.jpg' },
  { id: 10, name: 'Picolinate de Zinc 50 mg',           shop: 'Santé Plus',          price: 9000,   oldPrice: 12000,  rating: 4.5, reviews: 167, img: '/photos/Picolinate%20de%20zinc%2050%20mg.jpg' },
  { id: 11, name: 'Marine Collagen',                    shop: 'Beauté & Soins',      price: 12000,  oldPrice: 15000,  rating: 4.3, reviews: 98,  img: '/photos/marine%20collagen%20.jpeg' },
  { id: 12, name: 'MacBook Air M2 13" 256Go',           shop: 'iStore Dakar',        price: 265000, oldPrice: null,   rating: 4.9, reviews: 34,  img: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=300&h=300&fit=crop&crop=center' },
]

const SLIDE_PRODUCTS = [
  {
    name: 'iPhone 18 Pro',
    label: 'Nouveau · Titanium Desert · 256Go',
    detail: 'Puce A18 Pro · 48MP · Super Retina XDR',
    shop: 'iStore Dakar',
    price: 920000,
    oldPrice: 980000,
    img: '/photos/iphone18.png',
    bg: 'linear-gradient(135deg, #1a0a0a 0%, #3d1a1a 50%, #2d0f0f 100%)',
    badge: 'NOUVEAU',
    badgeColor: '#ef4444',
  },
  {
    name: 'iPhone Duo',
    label: 'Double écran · Silver & Desert Titanium',
    detail: 'A18 Pro · Face ID · iOS 18 · Two Display',
    shop: 'iStore Dakar',
    price: 1450000,
    oldPrice: null,
    img: '/photos/iphone%20duo.png',
    bg: 'linear-gradient(135deg, #0a0a1a 0%, #1a1a3d 50%, #0f0f2d 100%)',
    badge: 'EXCLUSIF',
    badgeColor: BLUE,
  },
  {
    name: 'Climatiseur Astech CertiTube',
    label: 'A+++ · R32 Eco-Friendly · 12 000 BTU',
    detail: '100% Copper · 11 Tube Coils · Silencieux',
    shop: 'Électro Dakar',
    price: 380000,
    oldPrice: 450000,
    img: '/photos/climatiseur.png',
    bg: 'linear-gradient(135deg, #0a1628 0%, #0e2240 50%, #0a1a32 100%)',
    badge: 'PROMO',
    badgeColor: '#16a34a',
  },
  {
    name: 'Mixa Niacinamide Bright',
    label: 'Crème anti-taches · Peaux sèches',
    detail: '9% Shea Butter + Niacinamide + Vit. C · 400ml',
    shop: 'Beauté & Soins',
    price: 8500,
    oldPrice: 11000,
    img: '/photos/mixa-la-creme-niacinamide-correction-eclat-1dakar-universcosmetix-photoroom.png',
    bg: 'linear-gradient(135deg, #1a1400 0%, #3d3000 50%, #2d2400 100%)',
    badge: null,
    badgeColor: '',
  },
  {
    name: 'Créatine Monohydrate Pure',
    label: 'Optimum Nutrition · 600g · 120 Servings',
    detail: 'Pure Creatine Monohydrate · Force & Endurance',
    shop: 'SportNutrition Dakar',
    price: 28000,
    oldPrice: 35000,
    img: '/photos/creatine.png',
    bg: 'linear-gradient(135deg, #001a0a 0%, #003d1a 50%, #002d14 100%)',
    badge: null,
    badgeColor: '',
  },
  {
    name: 'Serious Mass Vanilla',
    label: 'Optimum Nutrition · 2.73kg · 8 Servings',
    detail: '1 268 Calories · 50g Protéines · 256g Glucides',
    shop: 'SportNutrition Dakar',
    price: 78000,
    oldPrice: 95000,
    img: '/photos/mass.png',
    bg: 'linear-gradient(135deg, #0f0f00 0%, #2a2a00 50%, #1f1f00 100%)',
    badge: null,
    badgeColor: '',
  },
]

function fmt(p: number) {
  return p.toLocaleString('fr-FR') + ' FCFA'
}

function Stars({ r }: { r: number }) {
  return (
    <span style={{ display: 'inline-flex', gap: 1 }}>
      {[1,2,3,4,5].map(i => (
        <Star key={i} size={10}
          fill={i <= Math.round(r) ? '#f59e0b' : 'none'}
          color={i <= Math.round(r) ? '#f59e0b' : '#d1d5db'} />
      ))}
    </span>
  )
}

function ProductCard({ p }: { p: typeof PRODUCTS[0] }) {
  const [liked, setLiked] = useState(false)
  return (
    <Link href={`/produit/${p.id}`} style={{ textDecoration: 'none', display: 'block' }}>
      <div className="product-card">
        <button
          onClick={e => { e.preventDefault(); e.stopPropagation(); setLiked(l => !l) }}
          className="product-wish"
          aria-label="Ajouter aux favoris"
        >
          <Heart size={12} fill={liked ? '#ef4444' : 'none'} color={liked ? '#ef4444' : '#9ca3af'} />
        </button>
        <div className="product-img">
          <img
            src={p.img}
            alt={p.name}
            loading="lazy"
            style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '6px' }}
          />
        </div>
        <div className="product-info">
          <div className="product-name">{p.name}</div>
          <div className="product-stars">
            <Stars r={p.rating} />
            <span style={{ fontSize: '0.63rem', color: '#9ca3af' }}>({p.reviews})</span>
          </div>
          <div className="product-price">{fmt(p.price)}</div>
          {p.oldPrice && <div className="product-old-price">{fmt(p.oldPrice)}</div>}
        </div>
      </div>
    </Link>
  )
}


export default function HomePage() {
  const [slideIdx, setSlideIdx] = useState(0)
  const [q, setQ] = useState('')
  const [dbProducts, setDbProducts] = useState<typeof PRODUCTS>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const supabase = createClient()

  useEffect(() => {
    async function loadProducts() {
      const { data: prods } = await supabase
        .from('products')
        .select(`id, name, price, compare_price, shop_id, status`)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(20)

      if (!prods) return

      const shopIds = Array.from(new Set(prods.map((p) => p.shop_id)))
      const productIds = prods.map((p) => p.id)

      const shopsData = await getShopsData(shopIds)
      const { data: imgsData } = await supabase.from('product_images').select('product_id, url').in('product_id', productIds)

      const mapped = prods.map((p) => {
        const shop = shopsData?.find((s) => s.id === p.shop_id)
        const img = imgsData?.find((i) => i.product_id === p.id)
        return {
          id: p.id,
          name: p.name,
          shop: shop?.name || 'Boutique',
          price: p.price,
          oldPrice: p.compare_price,
          rating: 5,
          reviews: 0,
          img: img?.url || 'https://images.unsplash.com/photo-1610945264803-c22b62d2a7b3?w=300&h=300&fit=crop&crop=center'
        }
      })
      setDbProducts(mapped as any)
    }
    loadProducts()
  }, [supabase])

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setSlideIdx(i => (i + 1) % SLIDE_PRODUCTS.length)
    }, 3500)
  }

  useEffect(() => {
    startTimer()
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [])

  const goTo = (i: number) => { setSlideIdx(i); startTimer() }
  const prev = () => goTo((slideIdx - 1 + SLIDE_PRODUCTS.length) % SLIDE_PRODUCTS.length)
  const next = () => goTo((slideIdx + 1) % SLIDE_PRODUCTS.length)
  const slide = SLIDE_PRODUCTS[slideIdx]

  // Combine DB products with mock products for display
  const allProducts = useMemo(() => {
    const combined = [...dbProducts, ...PRODUCTS]
    // Filter duplicates by id if any (though IDs from DB are strings and mock are numbers)
    return combined
  }, [dbProducts])

  return (
    <div style={{ minHeight: '100vh', width: '100%', maxWidth: '100vw', background: '#f3f4f6', fontFamily: 'Inter, system-ui, sans-serif', overflowX: 'hidden' }}>

      {/* ── TOP BAR ── */}
      <div className="home-topbar pwa-top-bar" style={{
        background: 'linear-gradient(90deg, #1d4ed8 0%, #2D6BE4 50%, #6d28d9 100%)',
        padding: '10px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        flexWrap: 'wrap',
      }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: 'rgba(255,255,255,0.15)',
          border: '1px solid rgba(255,255,255,0.3)',
          padding: '3px 10px',
          borderRadius: 20,
          color: 'white',
          fontSize: '0.72rem',
          fontWeight: 700,
          letterSpacing: '0.05em',
          animation: 'pulseGlow 2s ease-in-out infinite',
        }}>
          🔥 NOUVEAU
        </span>
        <span style={{ color: 'white', fontWeight: 600, fontSize: '0.88rem' }}>
          🏪 Vous vendez ?{' '}
          <Link
            href="/register?role=merchant"
            style={{
              color: 'white',
              fontWeight: 900,
              textDecoration: 'none',
              background: 'rgba(255,255,255,0.2)',
              padding: '4px 14px',
              borderRadius: 20,
              border: '1px solid rgba(255,255,255,0.4)',
              fontSize: '0.85rem',
              letterSpacing: '0.01em',
              display: 'inline-flex', alignItems: 'center', gap: 5,
              transition: 'background 0.2s',
            }}
          >
              Ouvrez votre boutique en 2 minutes →
            </Link>
            {' '}
            <Link
              href="/login"
              style={{
                color: 'white',
                fontWeight: 700,
                textDecoration: 'none',
                background: 'transparent',
                padding: '4px 10px',
                borderRadius: 20,
                fontSize: '0.85rem',
                display: 'inline-flex', alignItems: 'center',
                textDecorationLine: 'underline',
              }}
            >
              Se connecter
            </Link>
          </span>
        </div>

      {/* ── NAVBAR ── */}
      <nav className="home-navbar" role="navigation" aria-label="Navigation principale">
        {/* Ligne 1: Logo + Search (desktop) + Icons */}
        <div className="navbar-row1">
          {/* Logo */}
          <Link href="/" className="navbar-logo" style={{ display: 'flex', alignItems: 'center' }}>
            <img 
              src="/logos/logo-jokoo-cart.png" 
              alt="Jokoo" 
              style={{ height: '40px', width: 'auto', objectFit: 'contain', mixBlendMode: 'multiply' }} 
            />
          </Link>

          {/* Search bar — desktop only (hidden on mobile) */}
          <div className="navbar-desktop-search" style={{ display: 'none' }}>
            <input
              type="search"
              placeholder="Cherchez un produit, une marque ou une catégorie"
              value={q}
              onChange={e => setQ(e.target.value)}
              className="navbar-search-input"
              style={{ flex: 1, borderRadius: '10px 0 0 10px' }}
              aria-label="Rechercher"
              suppressHydrationWarning
            />
            <button className="navbar-search-btn" style={{ borderRadius: '0 10px 10px 0' }}>
              <Search size={15} /> Rechercher
            </button>
          </div>

          {/* Actions — desktop */}
          <div className="navbar-actions-desktop" style={{ display: 'none', gap: 8, marginLeft: 'auto' }}>
            <Link href="/login" className="navbar-action-btn">
              <User size={15} /> Connexion
            </Link>
            <Link href="/panier" className="navbar-action-btn" style={{ position: 'relative' }}>
              <ShoppingCart size={15} /> Panier
              <span style={{ position: 'absolute', top: -5, right: -5, background: BLUE, color: 'white', borderRadius: '50%', width: 17, height: 17, fontSize: '0.6rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'auto' }}>0</span>
            </Link>
          </div>

          {/* Icons — mobile only (right side) */}
          <div className="navbar-actions" style={{ marginLeft: 'auto' }}>
            <Link href="/panier" style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 44, height: 44, borderRadius: 10, border: '1px solid #e5e7eb', textDecoration: 'none', color: '#374151' }} aria-label="Panier">
              <ShoppingCart size={20} />
              <span style={{ position: 'absolute', top: 4, right: 4, background: BLUE, color: 'white', borderRadius: '50%', width: 15, height: 15, fontSize: '0.55rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'auto' }}>0</span>
            </Link>
            <Link href="/login" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 44, height: 44, borderRadius: 10, border: '1px solid #e5e7eb', textDecoration: 'none', color: '#374151' }} aria-label="Connexion">
              <User size={20} />
            </Link>
          </div>
        </div>

        {/* Search row — mobile only */}
        <div className="navbar-search-row">
          <input
            type="search"
            placeholder="Cherchez un produit ou une marque..."
            value={q}
            onChange={e => setQ(e.target.value)}
            className="navbar-search-input"
            aria-label="Rechercher"
            suppressHydrationWarning
          />
          <button className="navbar-search-btn">
            <Search size={15} />
            <span style={{ display: 'none' }}>Rechercher</span>
            <span aria-hidden>OK</span>
          </button>
        </div>

        {/* Category bar */}
        <div className="navbar-cats" role="navigation" aria-label="Catégories">
          <Link href="/boutiques" className="navbar-cat-item" style={{ color: BLUE, fontWeight: 700 }}>
            <Store size={13} /> Boutiques
          </Link>
          {CATEGORIES.map(cat => (
            <Link key={cat.slug} href={`/boutiques?cat=${cat.slug}`} className="navbar-cat-item">
              {cat.label}
            </Link>
          ))}
        </div>
      </nav>

      {/* ── PAGE CONTENT ── */}
      <div className="home-page-content" style={{ padding: '10px 10px' }}>

        {/* ── CAROUSEL ── */}
        <div className="home-carousel">
          <div className="carousel-inner" style={{ background: slide.bg }}>
            {/* Texte produit */}
            <div className="carousel-text-col">
              {slide.badge && (
                <div style={{ display: 'inline-block', background: slide.badgeColor, color: 'white', fontWeight: 800, fontSize: '0.68rem', padding: '3px 10px', borderRadius: 6, marginBottom: 10, alignSelf: 'flex-start', letterSpacing: '0.08em' }}>
                  {slide.badge}
                </div>
              )}
              <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.55)', marginBottom: 4, fontWeight: 500 }}>{slide.shop}</div>
              <h2 style={{ fontFamily: 'Outfit, sans-serif', color: 'white', fontWeight: 900, fontSize: 'clamp(1.1rem, 4vw, 2rem)', lineHeight: 1.15, marginBottom: 6 }}>
                {slide.name}
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 'clamp(0.7rem, 2.5vw, 0.85rem)', marginBottom: 4, fontWeight: 500 }}>{slide.label}</p>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 'clamp(0.65rem, 2vw, 0.75rem)', marginBottom: 14 }}>{slide.detail}</p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
                <span style={{ color: 'white', fontWeight: 900, fontSize: 'clamp(0.95rem, 3.5vw, 1.5rem)', fontFamily: 'Outfit, sans-serif' }}>{fmt(slide.price)}</span>
                {slide.oldPrice && (
                  <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 'clamp(0.75rem, 2.5vw, 0.95rem)', textDecoration: 'line-through' }}>{fmt(slide.oldPrice)}</span>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button style={{ background: 'white', color: '#111', border: 'none', borderRadius: 9, padding: 'clamp(8px, 2vw, 12px) clamp(14px, 3vw, 22px)', fontWeight: 800, fontSize: 'clamp(0.75rem, 2.5vw, 0.88rem)', cursor: 'pointer', minHeight: 'auto' }}>
                  Voir →
                </button>
                <button style={{ background: 'rgba(255,255,255,0.12)', color: 'white', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 9, padding: 'clamp(8px, 2vw, 12px) clamp(12px, 2.5vw, 18px)', fontWeight: 700, fontSize: 'clamp(0.72rem, 2vw, 0.85rem)', cursor: 'pointer', minHeight: 'auto' }}>
                  + Panier
                </button>
              </div>
            </div>

            {/* Image produit */}
            <div className="carousel-img-col">
              <img
                key={slideIdx}
                src={slide.img}
                alt={slide.name}
                style={{ animation: 'fadeInRight 0.5s ease' }}
              />
            </div>
          </div>

          {/* Flèches */}
          <button onClick={prev} className="carousel-btn carousel-btn-prev" aria-label="Précédent">‹</button>
          <button onClick={next} className="carousel-btn carousel-btn-next" aria-label="Suivant">›</button>

          {/* Dots */}
          <div className="carousel-dots">
            {SLIDE_PRODUCTS.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className="carousel-dot"
                aria-label={`Slide ${i + 1}`}
                style={{ width: i === slideIdx ? 22 : 6, background: i === slideIdx ? 'white' : 'rgba(255,255,255,0.35)' }}
              />
            ))}
          </div>
        </div>

        {/* ── CATÉGORIES ── */}
        <div className="home-section">
          <div className="section-header">
            <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '0.95rem', color: '#111827' }}>
              Toutes les catégories
            </h2>
            <Link href="/boutiques" className="section-view-more">
              Voir tout <ArrowRight size={12} />
            </Link>
          </div>
          <div className="cats-scroll">
            {CATEGORIES.map(cat => (
              <Link key={cat.slug} href={`/boutiques?cat=${cat.slug}`} className="cat-item">
                <div className="cat-img-wrap">
                  <img src={cat.img} alt={cat.label} loading="lazy" />
                </div>
                <span className="cat-label">{cat.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* ── VENTES FLASH ── */}
        <div id="flash" className="home-section">
          <div className="section-header">
            <div>
              <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '0.95rem', color: '#dc2626' }}>
                ⚡ Ventes Flash
              </h2>
              <p style={{ fontSize: '0.7rem', color: '#9ca3af', marginTop: 2 }}>Meilleures offres du moment</p>
            </div>
            <Link href="/boutiques" className="section-view-more">
              Voir plus <ArrowRight size={12} />
            </Link>
          </div>
          <div className="products-grid">
            {allProducts.slice(0, 6).map((p: any) => <ProductCard key={p.id} p={p} />)}
          </div>
        </div>

        {/* ── PRODUITS POPULAIRES ── */}
        <div id="popular" className="home-section">
          <div className="section-header">
            <div>
              <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '0.95rem', color: '#111827' }}>
                🏆 Produits populaires
              </h2>
              <p style={{ fontSize: '0.7rem', color: '#9ca3af', marginTop: 2 }}>Les favoris de nos clients</p>
            </div>
            <Link href="/boutiques" className="section-view-more">
              Voir plus <ArrowRight size={12} />
            </Link>
          </div>
          <div className="products-grid">
            {allProducts.slice(0, 12).map((p: any) => <ProductCard key={p.id} p={p} />)}
          </div>
        </div>

        {/* ── BANNIÈRE MARCHANDS ── */}
        <div className="merchant-banner">
          <h2 style={{ fontFamily: 'Outfit, sans-serif', color: 'white', fontWeight: 900, fontSize: 'clamp(1rem, 4vw, 1.3rem)', marginBottom: 6 }}>
            Vendez sur Jokoo
          </h2>
          <p style={{ color: '#94a3b8', marginBottom: 16, fontSize: '0.82rem', lineHeight: 1.5 }}>
            Créez votre boutique en 2 minutes · Lien unique · Wave & Orange Money
          </p>
          {/* Stats row */}
          <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
            {[['🚀','2 min','Pour ouvrir'],['🌍','Afrique','Toute la zone'],['📱','Wave/OM','Paiements']].map(([icon, val, lbl]) => (
              <div key={lbl} style={{ textAlign: 'center', flex: 1 }}>
                <div style={{ fontSize: '1.3rem', marginBottom: 2 }}>{icon}</div>
                <div style={{ color: 'white', fontWeight: 800, fontSize: '0.88rem' }}>{val}</div>
                <div style={{ color: '#94a3b8', fontSize: '0.65rem' }}>{lbl}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Link href="/register?role=merchant" style={{ background: BLUE, color: 'white', padding: '10px 18px', borderRadius: 9, fontWeight: 800, textDecoration: 'none', fontSize: '0.85rem', minHeight: 44, display: 'flex', alignItems: 'center' }}>
              🏪 Créer ma boutique
            </Link>
            <Link href="/login" style={{ background: 'rgba(255,255,255,0.15)', color: 'white', padding: '10px 18px', borderRadius: 9, fontWeight: 700, textDecoration: 'none', fontSize: '0.85rem', border: '1px solid rgba(255,255,255,0.3)', minHeight: 44, display: 'flex', alignItems: 'center' }}>
              Se connecter
            </Link>
            <Link href="/boutiques" style={{ background: 'rgba(255,255,255,0.08)', color: 'white', padding: '10px 18px', borderRadius: 9, fontWeight: 700, textDecoration: 'none', fontSize: '0.85rem', border: '1px solid rgba(255,255,255,0.15)', minHeight: 44, display: 'flex', alignItems: 'center' }}>
              Explorer →
            </Link>
          </div>
        </div>

        {/* ── AVANTAGES ── */}
        <div className="advantages-grid">
          {[
            { icon: <Truck size={18} color={BLUE} />,      title: 'Livraison rapide',  desc: 'Partout en Afrique' },
            { icon: <Shield size={18} color="#16a34a" />,   title: 'Paiement sécurisé', desc: 'Wave · Orange Money' },
            { icon: <Tag size={18} color="#d97706" />,      title: 'Meilleures offres', desc: 'Prix vérifiés' },
            { icon: <Zap size={18} color="#7c3aed" />,     title: 'Retours faciles',   desc: '7 jours garantis' },
          ].map(item => (
            <div key={item.title} className="advantage-card">
              <div style={{ flexShrink: 0 }}>{item.icon}</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.78rem', color: '#111827', lineHeight: 1.2 }}>{item.title}</div>
                <div style={{ fontSize: '0.68rem', color: '#9ca3af', marginTop: 2 }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* ── FOOTER ── */}
      <footer className="home-footer">
        <div style={{ marginBottom: 20 }}>
          <div style={{ marginBottom: 12, display: 'inline-block', background: 'white', padding: '6px 12px', borderRadius: 8 }}>
            <img 
              src="/logos/logo-jokoo-cart.png" 
              alt="Jokoo" 
              style={{ height: '32px', width: 'auto', objectFit: 'contain', display: 'block' }} 
            />
          </div>
          <p style={{ fontSize: '0.78rem', lineHeight: 1.7 }}>
            La marketplace africaine de référence. Achetez et vendez en toute confiance.
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 20, marginBottom: 20 }}>
          {[
            { title: 'Acheteurs',    links: ['Comment acheter','Suivre ma commande','Retours','Aide'] },
            { title: 'Marchands',   links: ['Ouvrir ma boutique','Tarifs','Comment vendre'] },
            { title: 'Jokoo',links: ['À propos','Presse','Contact'] },
          ].map(col => (
            <div key={col.title}>
              <div style={{ color: 'white', fontWeight: 700, fontSize: '0.82rem', marginBottom: 8 }}>{col.title}</div>
              {col.links.map(l => <div key={l} style={{ fontSize: '0.74rem', marginBottom: 6, cursor: 'pointer' }}>{l}</div>)}
            </div>
          ))}
        </div>
        <div style={{ borderTop: '1px solid #1f2937', paddingTop: 16, textAlign: 'center', fontSize: '0.72rem' }}>
          © 2026 Jokoo · Tous droits réservés · Dakar, Sénégal
        </div>
      </footer>

    </div>
  )
}
