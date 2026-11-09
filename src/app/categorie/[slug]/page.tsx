'use client'

import { useEffect, useState, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, PackageSearch, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

/** Catégories de l'accueil -> catégories base de données + mots-clés */
const CATS: Record<string, { label: string; db: string[]; kw?: string[]; exclude?: string[] }> = {
  telephonie:     { label: 'Téléphones & Tablettes', db: ['electronique'], kw: ['telephon', 'smartphone', 'iphone', 'galaxy', 'tablette', 'samsung', 'tecno', 'infinix', 'xiaomi', 'redmi', 'ipad'] },
  'tv-hifi':      { label: 'TV & High Tech',         db: ['electronique'], kw: ['tv', 'televis', 'hifi', 'casque', 'enceinte', 'audio', 'barre de son', 'ecran', 'bluetooth', 'jbl'] },
  electromenager: { label: 'Électroménager',         db: ['maison-deco', 'electronique'], kw: ['air fryer', 'airfryer', 'frigo', 'refrigerateur', 'congelateur', 'cuisiniere', 'mixeur', 'blender', 'bouilloire', 'climatiseur', 'ventilateur', 'micro-onde', 'machine a laver', 'fer a repasser', 'robot', 'friteuse', 'aspirateur'] },
  cosmetique:     { label: 'Cosmétique',             db: ['beaute-sante'], exclude: ['complement', 'creatine', 'whey', 'vitamine', 'proteine', 'omega', 'collagene', 'desinfect', 'javel', 'detergent'] },
  mode:           { label: 'Mode',                   db: ['mode-vetements'] },
  alimentation:   { label: 'Alimentation',           db: ['alimentation'], exclude: ['complement', 'creatine', 'whey', 'vitamine', 'proteine'] },
  informatique:   { label: 'Informatique',           db: ['informatique'] },
  complement:     { label: 'Complément alimentaire', db: ['beaute-sante', 'alimentation'], kw: ['complement', 'creatine', 'whey', 'vitamine', 'proteine', 'omega', 'collagene'] },
  scolaire:       { label: 'Scolaire',               db: ['livres-education'] },
  desinfection:   { label: 'Désinfection',           db: ['maison-deco', 'beaute-sante'], kw: ['desinfect', 'javel', 'nettoy', 'detergent', 'lessive', 'antiseptique', 'hygiene', 'gel hydro'] },
  maison:         { label: 'Maison & Déco',          db: ['maison-deco'], exclude: ['air fryer', 'airfryer', 'frigo', 'climatiseur', 'ventilateur', 'mixeur', 'blender', 'friteuse', 'desinfect', 'javel', 'detergent'] },
  bebe:           { label: 'Bébé & Enfant',          db: ['bebe-enfant'] },
  sport:          { label: 'Sport & Loisirs',        db: ['sport-loisirs'] },
}

const norm = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

interface Prod { id: string; name: string; price: number; compare_price: number | null; category_id: string | null; product_images?: { url: string }[] }

function matches(p: Prod, dbSlug: string | null, cfg: (typeof CATS)[string]) {
  const name = norm(p.name)
  if (cfg.exclude?.some(k => name.includes(k))) return false
  const kwHit = cfg.kw?.some(k => name.includes(k)) ?? false
  if (dbSlug && cfg.db.includes(dbSlug)) return cfg.kw ? kwHit : true
  return !dbSlug && kwHit // produit sans catégorie : uniquement par mots-clés
}

export default function CategoriePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const cfg = CATS[slug]
  const router = useRouter()
  const [products, setProducts] = useState<Prod[] | null>(null)

  useEffect(() => {
    if (!cfg) { setProducts([]); return }
    const supabase = createClient()
    ;(async () => {
      const [{ data: prods }, { data: cats }] = await Promise.all([
        supabase.from('products').select('id, name, price, compare_price, category_id, product_images(url)').eq('status', 'active'),
        supabase.from('categories').select('id, slug'),
      ])
      const slugById: Record<string, string> = Object.fromEntries((cats ?? []).map((c: any) => [c.id, c.slug]))
      const list = ((prods ?? []) as unknown as Prod[]).filter(p => matches(p, p.category_id ? slugById[p.category_id] ?? null : null, cfg))
      setProducts(list)
    })().catch(() => setProducts([]))
  }, [slug])

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6', fontFamily: 'Inter, system-ui, sans-serif', paddingBottom: 'calc(90px + env(safe-area-inset-bottom, 0px))' }}>
      <header style={{ background: 'white', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, position: 'sticky', top: 0, zIndex: 50, borderBottom: '1px solid #e5e7eb' }}>
        <button onClick={() => router.back()} aria-label="Retour" style={{ background: 'none', border: 'none', padding: 6, display: 'flex', cursor: 'pointer', minHeight: 'auto' }}>
          <ArrowLeft size={20} color="#374151" />
        </button>
        <Link href="/" aria-label="Accueil Jokoo" style={{ display: 'flex' }}>
          <img src="/logos/logo-jokoo-cart.png" alt="Jokoo" style={{ height: 30, width: 'auto' }} />
        </Link>
        <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '0.98rem', color: '#111827', margin: 0, marginLeft: 'auto', textAlign: 'right' }}>{cfg?.label ?? 'Catégorie'}</h1>
      </header>

      <main style={{ padding: 12, maxWidth: 720, margin: '0 auto' }}>
        {products === null && <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Loader2 className="animate-spin" size={28} color="#f97316" /></div>}

        {products?.length === 0 && (
          <div style={{ textAlign: 'center', background: 'white', borderRadius: 16, padding: '44px 20px', border: '1px solid #e5e7eb' }}>
            <PackageSearch size={44} color="#d1d5db" style={{ marginBottom: 12 }} />
            <div style={{ fontWeight: 800, color: '#111827', marginBottom: 6 }}>Aucun produit correspondant</div>
            <p style={{ color: '#6b7280', fontSize: '0.85rem', lineHeight: 1.6, margin: '0 0 18px' }}>
              Il n'y a pas encore de produit dans cette catégorie.
            </p>
            <Link href="/categories" style={{ display: 'inline-block', background: '#f97316', color: 'white', padding: '12px 22px', borderRadius: 12, fontWeight: 800, textDecoration: 'none', fontSize: '0.88rem' }}>
              Voir les autres catégories
            </Link>
          </div>
        )}

        {!!products?.length && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
            {products.map(p => {
              const img = p.product_images?.[0]?.url
              const disc = p.compare_price && p.compare_price > p.price ? Math.round((1 - p.price / p.compare_price) * 100) : null
              return (
                <Link key={p.id} href={`/produit/${p.id}`} style={{ background: 'white', borderRadius: 14, overflow: 'hidden', textDecoration: 'none', border: '1px solid #e5e7eb', position: 'relative', display: 'block' }}>
                  <div style={{ aspectRatio: '1 / 1', background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {img ? <img src={img} alt={p.name} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <PackageSearch size={32} color="#d1d5db" />}
                  </div>
                  {disc && <span style={{ position: 'absolute', top: 8, left: 8, background: '#ef4444', color: 'white', fontWeight: 800, fontSize: '0.66rem', padding: '3px 7px', borderRadius: 6 }}>-{disc}%</span>}
                  <div style={{ padding: '10px 12px' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', lineHeight: 1.3, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', minHeight: '2.6em' }}>{p.name}</div>
                    <div style={{ fontWeight: 900, color: '#111827', fontSize: '0.95rem', marginTop: 6 }}>{Number(p.price).toLocaleString('fr-FR')} FCFA</div>
                    {p.compare_price && p.compare_price > p.price && <div style={{ fontSize: '0.72rem', color: '#9ca3af', textDecoration: 'line-through' }}>{Number(p.compare_price).toLocaleString('fr-FR')} FCFA</div>}
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
