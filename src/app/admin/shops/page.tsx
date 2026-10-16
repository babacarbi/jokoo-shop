'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Store, Search, Filter, CheckCircle, XCircle, Eye,
  MoreHorizontal, LayoutDashboard, Users, ShoppingBag,
  BarChart3, Settings, LogOut, Shield, ChevronRight,
  AlertTriangle, Clock, MapPin
} from 'lucide-react'

const navItems = [
  { href: '/admin/dashboard',  icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin/shops',      icon: Store,           label: 'Boutiques', active: true },
  { href: '/admin/users',      icon: Users,           label: 'Utilisateurs' },
  { href: '/admin/orders',     icon: ShoppingBag,     label: 'Commandes' },
  { href: '/admin/analytics',  icon: BarChart3,       label: 'Analytiques' },
  { href: '/admin/settings',   icon: Settings,        label: 'Paramètres' },
]

const mockShops = [
  { id: '1', name: 'Mode Dakar', owner: 'Aminata Diallo', city: 'Dakar', country: 'Sénégal', status: 'pending',  products: 0,   created: '08/09/2026', plan: 'free' },
  { id: '2', name: 'Tech Abidjan', owner: 'Kofi Mensah', city: 'Abidjan', country: 'Côte d\'Ivoire', status: 'active', products: 87, created: '01/09/2026', plan: 'pro' },
  { id: '3', name: 'Bio Bamako', owner: 'Fatoumata Traoré', city: 'Bamako', country: 'Mali', status: 'active', products: 56, created: '15/08/2026', plan: 'free' },
  { id: '4', name: 'Beauté Conakry', owner: 'Mariama Bah', city: 'Conakry', country: 'Guinée', status: 'suspended', products: 42, created: '10/08/2026', plan: 'pro' },
  { id: '5', name: 'Agro Ouaga', owner: 'Issouf Sawadogo', city: 'Ouagadougou', country: 'Burkina Faso', status: 'pending', products: 0, created: '07/09/2026', plan: 'free' },
  { id: '6', name: 'Textile Lomé', owner: 'Ama Ayida', city: 'Lomé', country: 'Togo', status: 'active', products: 123, created: '20/07/2026', plan: 'premium' },
]

const statusConfig: Record<string, { label: string; badge: string; icon: React.ElementType; color: string }> = {
  pending:   { label: 'En attente', badge: 'badge-pending',   icon: Clock,        color: 'hsl(32 95% 55%)' },
  active:    { label: 'Active',     badge: 'badge-active',    icon: CheckCircle,  color: 'hsl(142 72% 45%)' },
  suspended: { label: 'Suspendue',  badge: 'badge-suspended', icon: XCircle,      color: 'hsl(0 72% 55%)' },
  closed:    { label: 'Fermée',     badge: 'badge-draft',     icon: XCircle,      color: 'hsl(220 15% 55%)' },
}

const planConfig: Record<string, { label: string; color: string }> = {
  free:    { label: 'Gratuit',  color: 'hsl(220 15% 60%)' },
  pro:     { label: 'Pro',      color: 'hsl(220 90% 65%)' },
  premium: { label: 'Premium',  color: 'hsl(38 92% 60%)' },
}

export default function AdminShopsPage() {
  const router = useRouter()
  const supabase = createClient()
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [shops, setShops] = useState(mockShops)

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  function toggleStatus(shopId: string, newStatus: string) {
    setShops(prev => prev.map(s => s.id === shopId ? { ...s, status: newStatus } : s))
  }

  const filtered = shops.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.owner.toLowerCase().includes(search.toLowerCase()) ||
      s.city.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'all' || s.status === filterStatus
    return matchSearch && matchStatus
  })

  const counts = {
    all:       shops.length,
    active:    shops.filter(s => s.status === 'active').length,
    pending:   shops.filter(s => s.status === 'pending').length,
    suspended: shops.filter(s => s.status === 'suspended').length,
  }

  return (
    <div style={{ display: 'flex', width: '100%' }}>
      {/* Sidebar */}
      <aside className="sidebar">
        <div style={{ padding: '24px 20px', borderBottom: '1px solid hsl(222 25% 22%)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, hsl(220 90% 56%), hsl(142 72% 45%))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Shield size={20} color="white" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontFamily: 'Outfit, sans-serif', fontSize: '1rem' }}>Super Admin</div>
              <div style={{ fontSize: '0.72rem', color: 'hsl(220 15% 55%)' }}>Jokoo</div>
            </div>
          </div>
        </div>
        <nav style={{ padding: '16px 12px', flex: 1 }}>
          {navItems.map(item => (
            <Link key={item.href} href={item.href} className={`sidebar-nav-item ${item.active ? 'active' : ''}`} style={{ marginBottom: 2 }}>
              <item.icon size={18} />
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.active && <ChevronRight size={14} />}
            </Link>
          ))}
        </nav>
        <div style={{ padding: '16px 12px', borderTop: '1px solid hsl(222 25% 22%)' }}>
          <button onClick={handleLogout} className="sidebar-nav-item btn-ghost" style={{ width: '100%', color: 'hsl(0 72% 60%)' }}>
            <LogOut size={18} /> Déconnexion
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="main-content" style={{ flex: 1 }}>
        {/* Topbar */}
        <div style={{ background: 'hsl(222 40% 12%)', borderBottom: '1px solid hsl(222 25% 22%)', padding: '0 28px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 30 }}>
          <div>
            <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '1.1rem' }}>Gestion des boutiques</h2>
            <p style={{ fontSize: '0.78rem', color: 'hsl(220 15% 55%)' }}>{shops.length} boutiques enregistrées</p>
          </div>
        </div>

        <div style={{ padding: 28 }} className="animate-fade-in">
          {/* Tabs statut */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
            {[
              { key: 'all',       label: 'Toutes',     count: counts.all },
              { key: 'active',    label: 'Actives',    count: counts.active },
              { key: 'pending',   label: 'En attente', count: counts.pending },
              { key: 'suspended', label: 'Suspendues', count: counts.suspended },
            ].map(tab => (
              <button key={tab.key} onClick={() => setFilterStatus(tab.key)}
                style={{
                  padding: '8px 16px', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', transition: 'all 0.2s',
                  background: filterStatus === tab.key ? 'hsl(220 90% 56%)' : 'hsl(222 35% 16%)',
                  color: filterStatus === tab.key ? 'white' : 'hsl(220 15% 65%)',
                  display: 'flex', alignItems: 'center', gap: 8
                }}>
                {tab.label}
                <span style={{ background: filterStatus === tab.key ? 'rgba(255,255,255,0.25)' : 'hsl(222 25% 25%)', padding: '1px 7px', borderRadius: 20, fontSize: '0.75rem' }}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Recherche */}
          <div style={{ position: 'relative', marginBottom: 20, maxWidth: 400 }}>
            <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'hsl(220 15% 55%)' }} />
            <input type="text" placeholder="Rechercher une boutique..." value={search} onChange={e => setSearch(e.target.value)} className="input" style={{ paddingLeft: 42 }} />
          </div>

          {/* Tableau */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
              <table>
                <thead>
                  <tr>
                    <th>Boutique</th>
                    <th>Propriétaire</th>
                    <th>Localisation</th>
                    <th>Plan</th>
                    <th>Produits</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(shop => {
                    const sc = statusConfig[shop.status]
                    const pc = planConfig[shop.plan]
                    return (
                      <tr key={shop.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 36, height: 36, borderRadius: 9, background: 'hsl(220 90% 56% / 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>
                              🏪
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{shop.name}</div>
                              <div style={{ fontSize: '0.72rem', color: 'hsl(220 15% 55%)' }}>Créée le {shop.created}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ fontSize: '0.88rem', fontWeight: 500 }}>{shop.owner}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.82rem', color: 'hsl(220 15% 65%)' }}>
                            <MapPin size={12} /> {shop.city}, {shop.country}
                          </div>
                        </td>
                        <td>
                          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: pc.color }}>{pc.label}</span>
                        </td>
                        <td style={{ fontWeight: 600, fontSize: '0.88rem' }}>{shop.products}</td>
                        <td>
                          <span className={`badge ${sc.badge}`}>
                            {sc.label}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            {shop.status === 'pending' && (<>
                              <button onClick={() => toggleStatus(shop.id, 'active')} className="btn btn-success btn-sm" title="Activer">
                                <CheckCircle size={13} /> Activer
                              </button>
                              <button onClick={() => toggleStatus(shop.id, 'suspended')} className="btn btn-danger btn-sm" title="Refuser">
                                <XCircle size={13} />
                              </button>
                            </>)}
                            {shop.status === 'active' && (
                              <button onClick={() => toggleStatus(shop.id, 'suspended')} className="btn btn-secondary btn-sm">
                                <XCircle size={13} /> Suspendre
                              </button>
                            )}
                            {shop.status === 'suspended' && (
                              <button onClick={() => toggleStatus(shop.id, 'active')} className="btn btn-success btn-sm">
                                <CheckCircle size={13} /> Réactiver
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {filtered.length === 0 && (
                <div className="empty-state">
                  <Store size={40} color="hsl(220 15% 40%)" />
                  <p style={{ color: 'hsl(220 15% 55%)', fontWeight: 500 }}>Aucune boutique trouvée</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
