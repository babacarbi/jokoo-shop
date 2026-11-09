'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Heart, Trash2, ShoppingBag } from 'lucide-react'
import { getFavorites, toggleFavorite, type FavItem } from '@/lib/favorites'

export default function FavorisPage() {
  const router = useRouter()
  const [favs, setFavs] = useState<FavItem[] | null>(null)
  useEffect(() => { setFavs(getFavorites()) }, [])

  function remove(f: FavItem) {
    toggleFavorite(f)
    setFavs(getFavorites())
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6', fontFamily: 'Inter, system-ui, sans-serif', paddingBottom: 'calc(90px + env(safe-area-inset-bottom, 0px))' }}>
      <header style={{ background: 'white', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, position: 'sticky', top: 0, zIndex: 50, borderBottom: '1px solid #e5e7eb' }}>
        <button onClick={() => router.back()} aria-label="Retour" style={{ background: 'none', border: 'none', padding: 6, display: 'flex', cursor: 'pointer', minHeight: 'auto' }}>
          <ArrowLeft size={20} color="#374151" />
        </button>
        <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.05rem', color: '#111827', margin: 0 }}>Mes favoris</h1>
      </header>
      <main style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 560, margin: '0 auto' }}>
        {favs?.length === 0 && (
          <div style={{ textAlign: 'center', background: 'white', borderRadius: 16, padding: '40px 20px', border: '1px solid #e5e7eb' }}>
            <Heart size={40} color="#d1d5db" style={{ marginBottom: 12 }} />
            <div style={{ fontWeight: 800, color: '#111827', marginBottom: 6 }}>Aucun favori pour le moment</div>
            <p style={{ color: '#6b7280', fontSize: '0.85rem', lineHeight: 1.6, margin: '0 0 18px' }}>
              Touchez le cœur sur un produit pour le retrouver ici.
            </p>
            <Link href="/" style={{ display: 'inline-block', background: '#2D6BE4', color: 'white', padding: '12px 22px', borderRadius: 12, fontWeight: 800, textDecoration: 'none', fontSize: '0.88rem' }}>
              Découvrir les produits
            </Link>
          </div>
        )}
        {favs?.map(f => (
          <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'white', borderRadius: 14, padding: 10, border: '1px solid #e5e7eb' }}>
            <Link href={`/produit/${f.id}`} style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0, textDecoration: 'none' }}>
              {f.img
                ? <img src={f.img} alt={f.name} style={{ width: 64, height: 64, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />
                : <div style={{ width: 64, height: 64, borderRadius: 10, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><ShoppingBag size={22} color="#9ca3af" /></div>}
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</div>
                <div style={{ fontSize: '0.72rem', color: '#6b7280' }}>{f.shop}</div>
                <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#111827' }}>{f.price.toLocaleString('fr-FR')} FCFA</div>
              </div>
            </Link>
            <button onClick={() => remove(f)} aria-label="Retirer des favoris" style={{ background: '#fef2f2', border: 'none', borderRadius: 10, width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', minHeight: 'auto' }}>
              <Trash2 size={16} color="#dc2626" />
            </button>
          </div>
        ))}
      </main>
    </div>
  )
}
