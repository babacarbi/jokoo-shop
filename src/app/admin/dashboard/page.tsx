'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard, Store, Users, ShoppingBag, BarChart3,
  Settings, LogOut, Shield, ChevronRight, TrendingUp,
  TrendingDown, Package, DollarSign, Clock, CheckCircle
} from 'lucide-react'

const navItems = [
  { href: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard',       active: true },
  { href: '/admin/shops',     icon: Store,           label: 'Boutiques' },
  { href: '/admin/users',     icon: Users,           label: 'Utilisateurs' },
  { href: '/admin/orders',    icon: ShoppingBag,     label: 'Commandes' },
  { href: '/admin/analytics', icon: BarChart3,       label: 'Analytiques' },
  { href: '/admin/settings',  icon: Settings,        label: 'Paramètres' },
]

const stats = [
  { label: 'Boutiques actives',  value: '48',      change: '+12%', up: true,  icon: Store,       color: 'hsl(221 83% 53%)',  bg: 'hsl(221 83% 96%)' },
  { label: 'Revenus du mois',    value: '2.4M F',  change: '+8%',  up: true,  icon: DollarSign,  color: 'hsl(158 64% 40%)', bg: 'hsl(158 64% 96%)' },
  { label: 'Commandes totales',  value: '1 284',   change: '+23%', up: true,  icon: Package,     color: 'hsl(25 95% 53%)',   bg: 'hsl(25 95% 96%)' },
  { label: 'En attente valid.', value: '7',        change: '-3',   up: false, icon: Clock,       color: 'hsl(38 92% 50%)',   bg: 'hsl(48 96% 95%)' },
]

const recentShops = [
  { name: 'Agro Ouaga',   owner: 'Issouf Sawadogo', city: 'Ouagadougou', status: 'pending', date: '07/09' },
  { name: 'Mode Dakar',   owner: 'Aminata Diallo',  city: 'Dakar',       status: 'active',  date: '01/09' },
  { name: 'Tech Abidjan', owner: 'Kofi Mensah',     city: 'Abidjan',     status: 'active',  date: '28/08' },
]

const recentOrders = [
  { id: '#1042', customer: 'Moussa D.', shop: 'Mode Dakar',   amount: '45 000 F', status: 'delivered' },
  { id: '#1041', customer: 'Aïssatou B.', shop: 'Bio Bamako', amount: '12 500 F', status: 'processing' },
  { id: '#1040', customer: 'Ibrahim K.', shop: 'Tech Abidjan', amount: '280 000 F', status: 'pending' },
]

export default function AdminDashboard() {
  const router = useRouter()
  const supabase = createClient()
  const [adminName, setAdminName] = useState('Admin')

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setAdminName(user.user_metadata?.full_name ?? user.email ?? 'Admin')
    })
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const statusBadge: Record<string, { label: string; color: string; bg: string }> = {
    pending:    { label: 'En attente',  color: 'hsl(38 92% 38%)',  bg: 'hsl(48 96% 94%)' },
    active:     { label: 'Active',      color: 'hsl(158 64% 35%)', bg: 'hsl(158 64% 95%)' },
    suspended:  { label: 'Suspendue',   color: 'hsl(0 72% 45%)',   bg: 'hsl(0 86% 97%)' },
    delivered:  { label: 'Livré',       color: 'hsl(158 64% 35%)', bg: 'hsl(158 64% 95%)' },
    processing: { label: 'En cours',    color: 'hsl(221 83% 45%)', bg: 'hsl(221 83% 96%)' },
  }

  return (
    <div style={{ display: 'flex', width: '100%', fontFamily: 'Inter, sans-serif' }}>
      {/* Sidebar */}
      <aside className="sidebar">
        <div style={{ padding: '24px 20px', borderBottom: '1px solid hsl(214 32% 91%)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 42, height: 42, borderRadius: 11, background: 'linear-gradient(135deg, hsl(221 83% 53%), hsl(158 64% 40%))', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px hsl(221 83% 53% / 0.3)' }}>
              <Shield size={20} color="white" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontFamily: 'Outfit, sans-serif', fontSize: '0.95rem', color: 'hsl(222 47% 11%)' }}>Super Admin</div>
              <div style={{ fontSize: '0.72rem', color: 'hsl(215 16% 55%)' }}>Jokoo</div>
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

        <div style={{ padding: '16px 12px', borderTop: '1px solid hsl(214 32% 91%)' }}>
          <div style={{ padding: '10px 14px', marginBottom: 8 }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'hsl(222 47% 11%)', marginBottom: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{adminName}</div>
            <div style={{ fontSize: '0.7rem', color: 'hsl(215 16% 55%)' }}>Administrateur</div>
          </div>
          <button onClick={handleLogout} className="sidebar-nav-item" style={{ width: '100%', color: 'hsl(0 72% 51%)', background: 'none', border: 'none', cursor: 'pointer' }}>
            <LogOut size={18} /> Déconnexion
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="main-content" style={{ flex: 1, background: 'hsl(210 20% 98%)' }}>
        {/* Topbar */}
        <div style={{ background: 'white', borderBottom: '1px solid hsl(214 32% 91%)', padding: '0 28px', height: 66, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 30, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <div>
            <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.15rem', color: 'hsl(222 47% 11%)' }}>Vue d'ensemble</h2>
            <p style={{ fontSize: '0.75rem', color: 'hsl(215 16% 55%)' }}>Bonjour 👋 — Lundi 8 septembre 2026</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Link href="/admin/shops" className="btn btn-secondary btn-sm">Boutiques en attente <span style={{ background: 'hsl(38 92% 50%)', color: 'white', borderRadius: 999, padding: '1px 7px', fontSize: '0.72rem', fontWeight: 800 }}>7</span></Link>
          </div>
        </div>

        <div style={{ padding: 28 }} className="animate-fade-in">
          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 28 }}>
            {stats.map(s => (
              <div key={s.label} className="stat-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div className="stat-label">{s.label}</div>
                    <div className="stat-value" style={{ marginTop: 8 }}>{s.value}</div>
                    <div className="stat-change" style={{ marginTop: 8, color: s.up ? 'hsl(158 64% 40%)' : 'hsl(0 72% 51%)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      {s.up ? <TrendingUp size={13} /> : <TrendingDown size={13} />} {s.change} ce mois
                    </div>
                  </div>
                  <div className="stat-icon" style={{ background: s.bg }}>
                    <s.icon size={22} color={s.color} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {/* Boutiques récentes */}
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '1rem', color: 'hsl(222 47% 11%)' }}>Nouvelles boutiques</h3>
                <Link href="/admin/shops" className="btn btn-ghost btn-sm" style={{ fontSize: '0.78rem', color: 'hsl(221 83% 53%)' }}>Voir tout</Link>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {recentShops.map(shop => {
                  const sc = statusBadge[shop.status]
                  return (
                    <div key={shop.name} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 10, background: 'hsl(210 20% 98%)', border: '1px solid hsl(214 32% 91%)' }}>
                      <div style={{ width: 36, height: 36, borderRadius: 9, background: 'hsl(221 83% 96%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>🏪</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'hsl(222 47% 11%)' }}>{shop.name}</div>
                        <div style={{ fontSize: '0.74rem', color: 'hsl(215 16% 55%)' }}>{shop.owner} · {shop.city}</div>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: sc.color, background: sc.bg, padding: '3px 8px', borderRadius: 999 }}>{sc.label}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Commandes récentes */}
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '1rem', color: 'hsl(222 47% 11%)' }}>Commandes récentes</h3>
                <Link href="/admin/orders" className="btn btn-ghost btn-sm" style={{ fontSize: '0.78rem', color: 'hsl(221 83% 53%)' }}>Voir tout</Link>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {recentOrders.map(order => {
                  const sc = statusBadge[order.status] ?? statusBadge['pending']
                  return (
                    <div key={order.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 10, background: 'hsl(210 20% 98%)', border: '1px solid hsl(214 32% 91%)' }}>
                      <div style={{ width: 36, height: 36, borderRadius: 9, background: 'hsl(158 64% 96%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 800, color: 'hsl(158 64% 40%)', flexShrink: 0 }}>{order.id}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'hsl(222 47% 11%)' }}>{order.customer}</div>
                        <div style={{ fontSize: '0.74rem', color: 'hsl(215 16% 55%)' }}>{order.shop}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'hsl(222 47% 11%)' }}>{order.amount}</div>
                        <span style={{ fontSize: '0.68rem', fontWeight: 700, color: sc.color, background: sc.bg, padding: '2px 6px', borderRadius: 999 }}>{sc.label}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
