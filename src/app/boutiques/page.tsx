'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search, ShoppingBag, Star, Filter, MapPin, Package, ArrowRight, Home, Tag, Store } from 'lucide-react'

const categories = [
  { emoji: '🛒', label: 'Tous', slug: '' },
  { emoji: '👗', label: 'Mode', slug: 'mode-vetements' },
  { emoji: '📱', label: 'Électronique', slug: 'electronique' },
  { emoji: '🌿', label: 'Alimentation', slug: 'alimentation' },
  { emoji: '💄', label: 'Beauté', slug: 'beaute-sante' },
  { emoji: '🏠', label: 'Maison', slug: 'maison-deco' },
  { emoji: '💻', label: 'Informatique', slug: 'informatique' },
  { emoji: '⚽', label: 'Sport', slug: 'sport-loisirs' },
]

const mockShops = [
  { id: '1', name: 'Mode Dakar', city: 'Dakar', country: 'Sénégal', rating: 4.8, reviews: 124, products: 87, emoji: '👗', category: 'mode-vetements', desc: 'Mode africaine contemporaine, wax et tissus traditionnels.' },
  { id: '2', name: 'Tech Abidjan', city: 'Abidjan', country: 'Côte d\'Ivoire', rating: 4.6, reviews: 89, products: 56, emoji: '📱', category: 'electronique', desc: 'Smartphones, accessoires et électronique au meilleur prix.' },
  { id: '3', name: 'Bio Bamako', city: 'Bamako', country: 'Mali', rating: 4.9, reviews: 201, products: 34, emoji: '🌿', category: 'alimentation', desc: 'Produits bio et naturels du Mali. Karité, huiles et épices.' },
  { id: '4', name: 'Beauté Conakry', city: 'Conakry', country: 'Guinée', rating: 4.7, reviews: 156, products: 98, emoji: '💄', category: 'beaute-sante', desc: 'Cosmétiques naturels et produits de beauté africains.' },
  { id: '5', name: 'Textile Lomé', city: 'Lomé', country: 'Togo', rating: 4.5, reviews: 78, products: 123, emoji: '🧵', category: 'mode-vetements', desc: 'Tissus, pagnes et vêtements traditionnels togolais.' },
  { id: '6', name: 'Agro Ouaga', city: 'Ouagadougou', country: 'Burkina Faso', rating: 4.8, reviews: 67, products: 45, emoji: '🌾', category: 'alimentation', desc: 'Produits agricoles frais et transformés du Burkina Faso.' },
  { id: '7', name: 'Déco Cotonou', city: 'Cotonou', country: 'Bénin', rating: 4.4, reviews: 43, products: 67, emoji: '🏺', category: 'maison-deco', desc: 'Artisanat béninois, sculptures et décoration africaine.' },
  { id: '8', name: 'Sport Accra', city: 'Accra', country: 'Ghana', rating: 4.6, reviews: 112, products: 89, emoji: '⚽', category: 'sport-loisirs', desc: 'Équipements sportifs et vêtements de sport de qualité.' },
]

export default function BoutiquesPage() {
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('')
  const [sortBy, setSortBy] = useState<'rating' | 'products'>('rating')

  const filtered = mockShops
    .filter(s => {
      const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.city.toLowerCase().includes(search.toLowerCase()) ||
        s.desc.toLowerCase().includes(search.toLowerCase())
      const matchCat = !activeCategory || s.category === activeCategory
      return matchSearch && matchCat
    })
    .sort((a, b) => sortBy === 'rating' ? b.rating - a.rating : b.products - a.products)

  return (
    <div style={{ minHeight: '100vh', background: 'hsl(222 47% 8%)' }}>
      {/* Navbar */}
      <nav style={{ background: 'hsl(222 40% 10% / 0.95)', backdropFilter: 'blur(16px)', borderBottom: '1px solid hsl(222 25% 18%)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', flexShrink: 0 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, hsl(220 90% 56%), hsl(142 72% 45%))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShoppingBag size={16} color="white" />
            </div>
            <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1rem' }}>
              <span className="gradient-text">Jokoo</span>
            </span>
          </Link>
          <div style={{ flex: 1, maxWidth: 460, position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'hsl(220 15% 55%)' }} />
            <input type="text" placeholder="Rechercher une boutique..." value={search} onChange={e => setSearch(e.target.value)} className="input" style={{ paddingLeft: 38, height: 40, fontSize: '0.86rem' }} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Link href="/" className="btn btn-ghost btn-sm"><Home size={15} /> Accueil</Link>
            <Link href="/login" className="btn btn-primary btn-sm">Connexion</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, hsl(220 90% 56% / 0.12), hsl(142 72% 45% / 0.08))', borderBottom: '1px solid hsl(222 25% 15%)', padding: '40px 24px', textAlign: 'center' }}>
        <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '2rem', fontWeight: 800, marginBottom: 8 }}>
          🏪 Toutes les boutiques
        </h1>
        <p style={{ color: 'hsl(220 15% 60%)', fontSize: '0.95rem' }}>
          {mockShops.length} boutiques vérifiées sur la plateforme
        </p>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 24px' }}>
        {/* Filtres catégories */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, overflowX: 'auto', paddingBottom: 4 }} className="no-scrollbar">
          {categories.map(cat => (
            <button key={cat.slug} onClick={() => setActiveCategory(cat.slug)}
              style={{
                flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 16px', borderRadius: 10, border: 'none', cursor: 'pointer',
                fontWeight: 600, fontSize: '0.84rem', transition: 'all 0.2s',
                background: activeCategory === cat.slug ? 'hsl(220 90% 56%)' : 'hsl(222 35% 14%)',
                color: activeCategory === cat.slug ? 'white' : 'hsl(220 15% 65%)',
              }}>
              <span>{cat.emoji}</span> {cat.label}
            </button>
          ))}
        </div>

        {/* Sort + count */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <p style={{ fontSize: '0.88rem', color: 'hsl(220 15% 60%)' }}>
            <strong style={{ color: 'hsl(220 20% 90%)' }}>{filtered.length}</strong> boutiques trouvées
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Filter size={14} color="hsl(220 15% 55%)" />
            <select value={sortBy} onChange={e => setSortBy(e.target.value as 'rating' | 'products')} className="input" style={{ width: 'auto', padding: '6px 12px', fontSize: '0.84rem', height: 36 }}>
              <option value="rating">Mieux notées</option>
              <option value="products">Plus de produits</option>
            </select>
          </div>
        </div>

        {/* Grille boutiques */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {filtered.map(shop => (
            <Link key={shop.id} href={`/boutiques/${shop.id}`} style={{ textDecoration: 'none' }}>
              <div className="absolute -inset-1 bg-gradient-to-r from-orange-500/20 to-blue-600/20 rounded-2xl blur-lg group-hover:blur-xl transition-all duration-300 opacity-0 group-hover:opacity-100" />
              <div className="card card-hover" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <div style={{ width: 56, height: 56, borderRadius: 14, background: 'hsl(220 90% 56% / 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', marginBottom: 14 }}>
                  {shop.emoji}
                </div>

                <div style={{ flex: 1 }}>
                  <h3 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '1.05rem', marginBottom: 4 }}>
                    {shop.name}
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: 'hsl(220 15% 60%)', marginBottom: 10, lineHeight: 1.5 }}>
                    {shop.desc}
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, fontSize: '0.8rem', color: 'hsl(220 15% 60%)' }}>
                    <MapPin size={12} /> {shop.city}, {shop.country}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, fontSize: '0.8rem', color: 'hsl(220 15% 60%)' }}>
                    <Package size={12} /> {shop.products} produits disponibles
                  </div>
                </div>

                <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid hsl(222 25% 20%)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Star size={13} fill="hsl(38 92% 60%)" color="hsl(38 92% 60%)" />
                    <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'hsl(38 92% 65%)' }}>{shop.rating}</span>
                    <span style={{ fontSize: '0.75rem', color: 'hsl(220 15% 55%)' }}>({shop.reviews} avis)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8rem', color: 'hsl(220 90% 65%)', fontWeight: 600 }}>
                    Voir <ArrowRight size={13} />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="empty-state">
            <Store size={48} color="hsl(220 15% 35%)" />
            <h3 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, color: 'hsl(220 15% 60%)' }}>Aucune boutique trouvée</h3>
            <p style={{ fontSize: '0.88rem', color: 'hsl(220 15% 45%)' }}>Essayez un autre terme de recherche</p>
            <button onClick={() => { setSearch(''); setActiveCategory('') }} className="btn btn-secondary">Voir toutes les boutiques</button>
          </div>
        )}
      </div>
    </div>
  )
}
