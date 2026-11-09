'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ChevronRight } from 'lucide-react'

const CATEGORIES = [
  { label: 'Téléphones & Tablettes', slug: 'telephonie',    img: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300&h=300&fit=crop&crop=center' },
  { label: 'TV & High Tech',         slug: 'tv-hifi',        img: 'https://images.unsplash.com/photo-1593784991095-a205069470b6?w=300&h=300&fit=crop&crop=center' },
  { label: 'Électroménager',         slug: 'electromenager', img: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=300&h=300&fit=crop&crop=center' },
  { label: 'Cosmétique',             slug: 'cosmetique',     img: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=300&h=300&fit=crop&crop=center' },
  { label: 'Mode',                   slug: 'mode',           img: 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=300&h=300&fit=crop&crop=center' },
  { label: 'Alimentation',           slug: 'alimentation',   img: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=300&h=300&fit=crop&crop=center' },
  { label: 'Informatique',           slug: 'informatique',   img: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=300&h=300&fit=crop&crop=center' },
  { label: 'Complément alimentaire', slug: 'complement',     img: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&h=300&fit=crop&crop=center' },
  { label: 'Scolaire',               slug: 'scolaire',       img: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=300&h=300&fit=crop&crop=center' },
  { label: 'Désinfection',           slug: 'desinfection',   img: 'https://images.unsplash.com/photo-1584483766114-2cea6facdf57?w=300&h=300&fit=crop&crop=center' },
  { label: 'Maison & Déco',          slug: 'maison',         img: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=300&h=300&fit=crop&crop=center' },
  { label: 'Bébé & Enfant',          slug: 'bebe',           img: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?w=300&h=300&fit=crop&crop=center' },
  { label: 'Sport & Loisirs',        slug: 'sport',          img: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=300&h=300&fit=crop&crop=center' },
]

export default function CategoriesPage() {
  const router = useRouter()
  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6', fontFamily: 'Inter, system-ui, sans-serif', paddingBottom: 'calc(90px + env(safe-area-inset-bottom, 0px))' }}>
      <header style={{ background: 'white', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, position: 'sticky', top: 0, zIndex: 50, borderBottom: '1px solid #e5e7eb' }}>
        <button onClick={() => router.back()} aria-label="Retour" style={{ background: 'none', border: 'none', padding: 6, display: 'flex', cursor: 'pointer', minHeight: 'auto' }}>
          <ArrowLeft size={20} color="#374151" />
        </button>
        <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.05rem', color: '#111827', margin: 0 }}>Catégories</h1>
      </header>
      <main style={{ padding: 12, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, maxWidth: 640, margin: '0 auto' }}>
        {CATEGORIES.map(c => (
          <Link key={c.slug} href={`/boutiques?cat=${c.slug}`} style={{ background: 'white', borderRadius: 16, overflow: 'hidden', textDecoration: 'none', border: '1px solid #e5e7eb', display: 'block' }}>
            <img src={c.img} alt={c.label} loading="lazy" style={{ width: '100%', aspectRatio: '1 / 1', objectFit: 'cover', display: 'block' }} />
            <div style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 6, color: '#111827', fontWeight: 800, fontSize: '0.84rem' }}>
              <span style={{ flex: 1 }}>{c.label}</span>
              <ChevronRight size={16} color="#9ca3af" />
            </div>
          </Link>
        ))}
      </main>
    </div>
  )
}
