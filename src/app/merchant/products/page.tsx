'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getMyShopAction } from '@/app/actions'
import {
  Package, Plus, Search, Edit2, Trash2, Eye, EyeOff,
  LayoutDashboard, ShoppingBag, Store, LogOut,
  ChevronRight, Loader2
} from 'lucide-react'

const navItems = [
  { href: '/merchant/dashboard',    icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/merchant/products',     icon: Package,         label: 'Produits', active: true },
  { href: '/merchant/products/new', icon: Plus,            label: '+ Nouveau' },
  { href: '/merchant/orders',       icon: ShoppingBag,     label: 'Commandes' },
  { href: '/merchant/shop',         icon: Store,           label: 'Ma Boutique' },
]

const statusConfig: Record<string, { label: string; badge: string }> = {
  active:       { label: 'Publié',    badge: 'badge-active' },
  draft:        { label: 'Brouillon', badge: 'badge-draft' },
  out_of_stock: { label: 'Rupture',   badge: 'badge-suspended' },
  archived:     { label: 'Archivé',   badge: 'badge-draft' },
}

interface Product {
  id: string
  name: string
  price: number
  compare_price: number | null
  stock: number
  status: string
  sku: string | null
  created_at: string
  product_images: { url: string }[]
}

export default function MerchantProductsPage() {
  const router = useRouter()
  const supabase = createClient()
  const [search, setSearch]             = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [products, setProducts]         = useState<Product[]>([])
  const [loading, setLoading]           = useState(true)
  const [deleting, setDeleting]         = useState<string | null>(null)
  const [toggling, setToggling]         = useState<string | null>(null)

  const [error, setError] = useState<string | null>(null)

  useEffect(() => { loadProducts() }, [])

  async function loadProducts() {
    setLoading(true)
    setError(null)
    try {
      const shop = await getMyShopAction()
      
      // Aucune boutique trouvée → rediriger vers les réglages boutique
      if (!shop) { router.push('/merchant/shop'); return }

      // Charger les produits de cette boutique
      const { data, error } = await supabase
        .from('products')
        .select('id, name, price, compare_price, stock, status, sku, created_at, product_images(url)')
        .eq('shop_id', shop.id)
        .order('created_at', { ascending: false })

      if (!error && data) setProducts(data as Product[])
    } catch {}
    setLoading(false)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  async function toggleStatus(product: Product) {
    const newStatus = product.status === 'active' ? 'draft' : 'active'
    setToggling(product.id)
    setProducts(prev => prev.map(p => p.id === product.id ? { ...p, status: newStatus } : p))
    await supabase.from('products').update({ status: newStatus }).eq('id', product.id)
    setToggling(null)
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer ce produit définitivement ?')) return
    setDeleting(id)
    const { error } = await supabase.from('products').delete().eq('id', id)
    if (!error) setProducts(prev => prev.filter(p => p.id !== id))
    setDeleting(null)
  }

  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'all' || p.status === filterStatus
    return matchSearch && matchStatus
  })

  const stats = {
    total:   products.length,
    active:  products.filter(p => p.status === 'active').length,
    draft:   products.filter(p => p.status === 'draft').length,
    rupture: products.filter(p => p.status === 'out_of_stock').length,
  }

  return (
    <div className="merchant-page-wrapper">
      {/* Sidebar */}
      <aside className="sidebar">
        <div style={{ padding: '24px 20px', borderBottom: '1px solid hsl(222 25% 22%)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: 'linear-gradient(135deg, hsl(32 95% 55%), hsl(220 90% 56%))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Package size={18} color="white" />
            </div>
            <span style={{ fontWeight: 700, fontFamily: 'Outfit, sans-serif' }}>Mes Produits</span>
          </div>
        </div>
        <nav style={{ padding: '16px 12px', flex: 1 }}>
          {navItems.map(item => (
            <Link key={item.href} href={item.href} className={`sidebar-nav-item ${item.active ? 'active' : ''}`} style={{ marginBottom: 2 }}>
              <item.icon size={18} /><span style={{ flex: 1 }}>{item.label}</span>
              {item.active && <ChevronRight size={14} />}
            </Link>
          ))}
        </nav>
        <div style={{ padding: '16px 12px', borderTop: '1px solid hsl(222 25% 22%)' }}>
          <button onClick={handleLogout} className="sidebar-nav-item" style={{ width: '100%', color: 'hsl(0 72% 60%)', background: 'none', border: 'none', cursor: 'pointer' }}>
            <LogOut size={18} /> Déconnexion
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="merchant-content-area">
        {/* Mobile header */}
        <div className="merchant-mobile-header">
          <div>
            <div className="merchant-mobile-header-title">Mes Produits</div>
            <div className="merchant-mobile-header-sub">{stats.total} produit{stats.total !== 1 ? 's' : ''}</div>
          </div>
          <Link href="/merchant/products/new" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 38, height: 38, borderRadius: 10, background: 'hsl(221 83% 53%)', color: 'white', textDecoration: 'none', flexShrink: 0 }} aria-label="Nouveau produit">
            <Plus size={18} />
          </Link>
        </div>
        {/* Desktop Topbar */}
        <div className="merchant-desktop-topbar" style={{ background: 'white', borderBottom: '1px solid hsl(214 32% 91%)', padding: '0 28px', height: 64, alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 30, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <div>
            <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '1.1rem', color: 'hsl(222 47% 11%)' }}>Mes Produits</h2>
            <p style={{ fontSize: '0.75rem', color: 'hsl(215 16% 55%)' }}>{stats.total} produit{stats.total !== 1 ? 's' : ''}</p>
          </div>
          <Link href="/merchant/products/new" className="btn btn-primary btn-sm">
            <Plus size={16} /> Nouveau produit
          </Link>
        </div>

        <div className="merchant-inner animate-fade-in">
          {/* Stats */}
          <div className="merchant-stats-grid" style={{ marginBottom: 16 }}>
                {[
                  { label: 'Total',      value: stats.total,   color: 'hsl(221 83% 53%)' },
                  { label: 'Publiés',    value: stats.active,  color: 'hsl(142 72% 45%)' },
                  { label: 'Brouillons', value: stats.draft,   color: 'hsl(215 16% 47%)' },
                  { label: 'Rupture',    value: stats.rupture, color: 'hsl(0 72% 51%)' },
                ].map(s => (
                  <div key={s.label} className="card" style={{ padding: '12px 14px' }}>
                    <div style={{ fontSize: '0.7rem', color: 'hsl(215 16% 47%)', fontWeight: 500 }}>{s.label}</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'Outfit, sans-serif', color: s.color, lineHeight: 1.2, marginTop: 4 }}>{s.value}</div>
                  </div>
                ))}
              </div>

          {error ? (
            <div style={{ padding: '40px 20px', textAlign: 'center' }}>
              <div className="alert alert-error" style={{ display: 'inline-flex', gap: 10, marginBottom: 16 }}>
                {error}
              </div>
              <br />
              <button onClick={loadProducts} className="btn btn-primary btn-sm">Réessayer</button>
            </div>
          ) : loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60, gap: 12, color: 'hsl(215 16% 55%)' }}>
              <Loader2 size={26} className="animate-spin" color="hsl(221 83% 53%)" />
              <span style={{ fontSize: '0.88rem' }}>Chargement des produits...</span>
            </div>
          ) : (
            <>

              {/* Filtres + Recherche */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {[
                  { key: 'all',          label: 'Tous' },
                  { key: 'active',       label: 'Publiés' },
                  { key: 'draft',        label: 'Brouillons' },
                  { key: 'out_of_stock', label: 'Rupture' },
                ].map(tab => (
                  <button key={tab.key} onClick={() => setFilterStatus(tab.key)}
                    style={{ padding: '6px 12px', borderRadius: 8, border: '1.5px solid', cursor: 'pointer', fontWeight: 600, fontSize: '0.78rem', transition: 'all 0.2s',
                      background: filterStatus === tab.key ? 'hsl(221 83% 53%)' : 'white',
                      color: filterStatus === tab.key ? 'white' : 'hsl(215 16% 47%)',
                      borderColor: filterStatus === tab.key ? 'hsl(221 83% 53%)' : 'hsl(214 32% 91%)' }}>
                    {tab.label}
                  </button>
                ))}
                </div>
                <div style={{ position: 'relative', marginLeft: 'auto' }}>
                  <Search size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'hsl(215 16% 55%)' }} />
                  <input type="text" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} className="input" style={{ paddingLeft: 34, width: 'min(200px, calc(100vw - 32px))', height: 38, fontSize: '0.88rem' }} />
                </div>
              </div>

              {/* Table */}
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Produit</th>
                        <th>Prix</th>
                        <th>Stock</th>
                        <th>Statut</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map(product => {
                        const sc = statusConfig[product.status] ?? { label: product.status, badge: 'badge-draft' }
                        const thumb = product.product_images?.[0]?.url
                        return (
                          <tr key={product.id} style={{ opacity: deleting === product.id ? 0.3 : 1, transition: 'opacity 0.3s' }}>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ width: 44, height: 44, borderRadius: 10, background: 'hsl(222 35% 18%)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                                  {thumb
                                    ? <img src={thumb} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    : <Package size={18} color="hsl(220 15% 40%)" />
                                  }
                                </div>
                                <div>
                                  <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{product.name}</div>
                                  <div style={{ fontSize: '0.72rem', color: 'hsl(220 15% 50%)' }}>
                                    {new Date(product.created_at).toLocaleDateString('fr-FR')}
                                    {product.sku && ` · ${product.sku}`}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td>
                              <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{Number(product.price).toLocaleString('fr-FR')} F</div>
                              {product.compare_price && (
                                <div style={{ fontSize: '0.75rem', color: 'hsl(220 15% 50%)', textDecoration: 'line-through' }}>
                                  {Number(product.compare_price).toLocaleString('fr-FR')} F
                                </div>
                              )}
                            </td>
                            <td>
                              <span style={{ fontWeight: 600, color: product.stock === 0 ? 'hsl(0 72% 55%)' : product.stock < 5 ? 'hsl(32 95% 55%)' : 'hsl(142 72% 55%)' }}>
                                {product.stock} unités
                              </span>
                            </td>
                            <td><span className={`badge ${sc.badge}`}>{sc.label}</span></td>
                            <td>
                              <div style={{ display: 'flex', gap: 6 }}>
                                <Link href={`/merchant/products/${product.id}/edit`} className="btn btn-secondary btn-sm btn-icon" title="Modifier">
                                  <Edit2 size={13} />
                                </Link>
                                <button onClick={() => toggleStatus(product)} className="btn btn-secondary btn-sm btn-icon" title={product.status === 'active' ? 'Masquer' : 'Publier'} disabled={toggling === product.id}>
                                  {toggling === product.id
                                    ? <Loader2 size={13} className="animate-spin" />
                                    : product.status === 'active' ? <EyeOff size={13} /> : <Eye size={13} />
                                  }
                                </button>
                                <button onClick={() => handleDelete(product.id)} className="btn btn-danger btn-sm btn-icon" title="Supprimer" disabled={!!deleting}>
                                  {deleting === product.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>

                  {filtered.length === 0 && (
                    <div className="empty-state">
                      <Package size={40} color="hsl(220 15% 40%)" />
                      <p style={{ color: 'hsl(220 15% 55%)', fontWeight: 500 }}>
                        {products.length === 0 ? 'Aucun produit encore. Créez votre premier !' : 'Aucun résultat'}
                      </p>
                      {products.length === 0 && (
                        <Link href="/merchant/products/new" className="btn btn-primary btn-sm">
                          <Plus size={14} /> Créer mon premier produit
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
