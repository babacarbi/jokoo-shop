'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Shield, Users, Search, LayoutDashboard, Store,
  ShoppingBag, BarChart3, Settings, LogOut, ChevronRight,
  CheckCircle, XCircle, UserCheck, UserX, Mail, Phone, Crown
} from 'lucide-react'

const navItems = [
  { href: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin/shops',     icon: Store,           label: 'Boutiques' },
  { href: '/admin/users',     icon: Users,           label: 'Utilisateurs', active: true },
  { href: '/admin/orders',    icon: ShoppingBag,     label: 'Commandes' },
  { href: '/admin/analytics', icon: BarChart3,       label: 'Analytiques' },
  { href: '/admin/settings',  icon: Settings,        label: 'Paramètres' },
]

const mockUsers = [
  { id: '1', name: 'Aminata Diallo',    email: 'aminata@email.com',  phone: '+221 77 123 45 67', role: 'merchant',     is_active: true,  created: '01/09/2026', shops: 1 },
  { id: '2', name: 'Kofi Mensah',       email: 'kofi@email.com',     phone: '+225 07 234 56 78', role: 'merchant',     is_active: true,  created: '15/08/2026', shops: 2 },
  { id: '3', name: 'Moussa Diop',       email: 'moussa@email.com',   phone: '+221 76 345 67 89', role: 'customer',     is_active: true,  created: '20/08/2026', shops: 0 },
  { id: '4', name: 'Fatoumata Traoré',  email: 'fatou@email.com',    phone: '+223 65 456 78 90', role: 'merchant',     is_active: false, created: '10/07/2026', shops: 1 },
  { id: '5', name: 'Aïssatou Ba',       email: 'aissatou@email.com', phone: '+221 70 567 89 01', role: 'customer',     is_active: true,  created: '05/09/2026', shops: 0 },
  { id: '6', name: 'Super Admin',       email: 'admin@jokoo.com', phone: '', role: 'super_admin', is_active: true,  created: '01/01/2026', shops: 0 },
]

const roleConfig: Record<string, { label: string; badge: string; icon: React.ElementType; color: string }> = {
  super_admin: { label: 'Super Admin', badge: 'badge-primary',   icon: Crown,     color: 'hsl(220 90% 65%)' },
  merchant:    { label: 'Marchand',    badge: 'badge-pending',   icon: Store,     color: 'hsl(32 95% 60%)' },
  customer:    { label: 'Client',      badge: 'badge-active',    icon: UserCheck, color: 'hsl(142 72% 55%)' },
}

export default function AdminUsersPage() {
  const router = useRouter()
  const supabase = createClient()
  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const [users, setUsers] = useState(mockUsers)

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  function toggleUser(userId: string) {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_active: !u.is_active } : u))
  }

  const filtered = users.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
    const matchRole = filterRole === 'all' || u.role === filterRole
    return matchSearch && matchRole
  })

  const counts = {
    all:         users.length,
    super_admin: users.filter(u => u.role === 'super_admin').length,
    merchant:    users.filter(u => u.role === 'merchant').length,
    customer:    users.filter(u => u.role === 'customer').length,
    inactive:    users.filter(u => !u.is_active).length,
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
              <div style={{ fontWeight: 800, fontFamily: 'Outfit, sans-serif' }}>Super Admin</div>
              <div style={{ fontSize: '0.72rem', color: 'hsl(220 15% 55%)' }}>Jokoo</div>
            </div>
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
          <button onClick={handleLogout} className="sidebar-nav-item btn-ghost" style={{ width: '100%', color: 'hsl(0 72% 60%)' }}>
            <LogOut size={18} /> Déconnexion
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="main-content" style={{ flex: 1 }}>
        <div style={{ background: 'hsl(222 40% 12%)', borderBottom: '1px solid hsl(222 25% 22%)', padding: '0 28px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 30 }}>
          <div>
            <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '1.1rem' }}>Gestion des utilisateurs</h2>
            <p style={{ fontSize: '0.78rem', color: 'hsl(220 15% 55%)' }}>{users.length} utilisateurs enregistrés</p>
          </div>
        </div>

        <div style={{ padding: 28 }} className="animate-fade-in">
          {/* Stats rapides */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 24 }}>
            {[
              { label: 'Total', value: counts.all,         color: 'hsl(220 90% 56%)' },
              { label: 'Marchands', value: counts.merchant, color: 'hsl(32 95% 55%)' },
              { label: 'Clients', value: counts.customer,   color: 'hsl(142 72% 45%)' },
              { label: 'Inactifs', value: counts.inactive,  color: 'hsl(0 72% 55%)' },
            ].map(s => (
              <div key={s.label} style={{ background: 'hsl(222 40% 12%)', border: '1px solid hsl(222 25% 22%)', borderRadius: 12, padding: '16px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: '0.75rem', color: 'hsl(220 15% 55%)', fontWeight: 500 }}>{s.label}</span>
                <span style={{ fontSize: '1.6rem', fontWeight: 800, fontFamily: 'Outfit, sans-serif', color: s.color }}>{s.value}</span>
              </div>
            ))}
          </div>

          {/* Filtres */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            {[
              { key: 'all',      label: 'Tous' },
              { key: 'merchant', label: 'Marchands' },
              { key: 'customer', label: 'Clients' },
            ].map(tab => (
              <button key={tab.key} onClick={() => setFilterRole(tab.key)}
                style={{ padding: '7px 14px', borderRadius: 9, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.83rem', transition: 'all 0.2s', background: filterRole === tab.key ? 'hsl(220 90% 56%)' : 'hsl(222 35% 16%)', color: filterRole === tab.key ? 'white' : 'hsl(220 15% 65%)' }}>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Recherche */}
          <div style={{ position: 'relative', marginBottom: 20, maxWidth: 380 }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'hsl(220 15% 55%)' }} />
            <input type="text" placeholder="Rechercher un utilisateur..." value={search} onChange={e => setSearch(e.target.value)} className="input" style={{ paddingLeft: 38 }} />
          </div>

          {/* Tableau */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
              <table>
                <thead>
                  <tr>
                    <th>Utilisateur</th>
                    <th>Contact</th>
                    <th>Rôle</th>
                    <th>Boutiques</th>
                    <th>Inscription</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(user => {
                    const rc = roleConfig[user.role]
                    return (
                      <tr key={user.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 38, height: 38, borderRadius: '50%', background: `${rc.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem', color: rc.color, flexShrink: 0 }}>
                              {user.name.charAt(0)}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{user.name}</div>
                              <div style={{ fontSize: '0.72rem', color: 'hsl(220 15% 50%)' }}>ID: {user.id}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div style={{ fontSize: '0.82rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'hsl(220 15% 70%)', marginBottom: 2 }}>
                              <Mail size={11} /> {user.email}
                            </div>
                            {user.phone && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'hsl(220 15% 55%)' }}>
                                <Phone size={11} /> {user.phone}
                              </div>
                            )}
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${rc.badge}`}>{rc.label}</span>
                        </td>
                        <td style={{ textAlign: 'center', fontWeight: 600, fontSize: '0.9rem' }}>
                          {user.shops > 0 ? <span style={{ color: 'hsl(220 90% 65%)' }}>{user.shops}</span> : <span style={{ color: 'hsl(220 15% 45%)' }}>—</span>}
                        </td>
                        <td style={{ fontSize: '0.82rem', color: 'hsl(220 15% 60%)' }}>{user.created}</td>
                        <td>
                          {user.is_active
                            ? <span className="badge badge-active"><CheckCircle size={10} /> Actif</span>
                            : <span className="badge badge-suspended"><XCircle size={10} /> Inactif</span>
                          }
                        </td>
                        <td>
                          {user.role !== 'super_admin' && (
                            <button
                              onClick={() => toggleUser(user.id)}
                              className={`btn btn-sm ${user.is_active ? 'btn-danger' : 'btn-success'}`}
                            >
                              {user.is_active ? <><UserX size={13} /> Désactiver</> : <><UserCheck size={13} /> Activer</>}
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {filtered.length === 0 && (
                <div className="empty-state">
                  <Users size={40} color="hsl(220 15% 40%)" />
                  <p style={{ color: 'hsl(220 15% 55%)' }}>Aucun utilisateur trouvé</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
