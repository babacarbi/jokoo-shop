'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CatalogProduct } from '@/types'
import { Search, X, Package, Loader2 } from 'lucide-react'

interface CatalogModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (product: CatalogProduct) => void
}

export default function CatalogModal({ isOpen, onClose, onSelect }: CatalogModalProps) {
  const [products, setProducts] = useState<CatalogProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const supabase = createClient()

  useEffect(() => {
    if (!isOpen) return
    async function fetchCatalog() {
      setLoading(true)
      const { data, error } = await supabase
        .from('catalog_products')
        .select('*')
        .eq('is_active', true)
        .order('name')
      
      if (!error && data) {
        setProducts(data as CatalogProduct[])
      } else {
        // Mock data fallback si la table est vide ou pas encore migrée
        setProducts([
          { id: '1', name: 'Robe Wax Premium', description: 'Une superbe robe en wax africain de haute qualité.', base_price: 25000, is_active: true, created_at: '', updated_at: '' },
          { id: '2', name: 'Boubou Brodé Homme', description: 'Boubou traditionnel avec broderies.', base_price: 45000, is_active: true, created_at: '', updated_at: '' },
          { id: '3', name: 'Tissu Bazin Riche', description: 'Tissu Bazin de premier choix.', base_price: 35000, is_active: true, created_at: '', updated_at: '' },
        ])
      }
      setLoading(false)
    }
    fetchCatalog()
  }, [isOpen])

  if (!isOpen) return null

  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} onClick={onClose} />
      
      <div className="card animate-fade-in" style={{ position: 'relative', width: '100%', maxWidth: 600, maxHeight: '85vh', display: 'flex', flexDirection: 'column', background: 'white', overflow: 'hidden', padding: 0 }}>
        
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid hsl(214 32% 91%)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '1.1rem', color: 'hsl(222 47% 11%)' }}>Catalogue global</h3>
            <p style={{ fontSize: '0.8rem', color: 'hsl(215 16% 55%)' }}>Sélectionnez un produit de base pour pré-remplir votre fiche</p>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-icon" style={{ padding: 6, minHeight: 'auto' }}>
            <X size={18} />
          </button>
        </div>

        {/* Search */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid hsl(214 32% 91%)', background: 'hsl(210 20% 98%)' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'hsl(215 16% 55%)' }} />
            <input 
              type="text" 
              placeholder="Rechercher un modèle..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              className="input" 
              style={{ paddingLeft: 38, width: '100%' }} 
            />
          </div>
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 10 }}>
          {loading ? (
            <div style={{ padding: 40, display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'hsl(215 16% 55%)' }}>
              <Loader2 size={24} className="animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'hsl(215 16% 55%)' }}>
              <Package size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
              <p>Aucun modèle trouvé.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 8 }}>
              {filtered.map(product => (
                <div 
                  key={product.id} 
                  style={{ display: 'flex', gap: 12, padding: 12, borderRadius: 10, border: '1px solid hsl(214 32% 91%)', cursor: 'pointer', transition: 'all 0.2s', background: 'white' }}
                  onClick={() => onSelect(product)}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'hsl(221 83% 53%)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'hsl(214 32% 91%)'}
                >
                  <div style={{ width: 48, height: 48, borderRadius: 8, background: 'hsl(210 17% 95%)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {product.image_url ? (
                      <img src={product.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }} />
                    ) : (
                      <Package size={20} color="hsl(215 16% 55%)" />
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'hsl(222 47% 11%)' }}>{product.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'hsl(215 16% 55%)', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {product.description || 'Aucune description'}
                    </div>
                  </div>
                  <div style={{ fontWeight: 700, color: 'hsl(221 83% 53%)', fontSize: '0.9rem', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center' }}>
                    Dès {product.base_price.toLocaleString('fr-FR')} F
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
