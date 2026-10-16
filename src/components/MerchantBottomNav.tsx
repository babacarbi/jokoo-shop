'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Package, Plus, ShoppingBag, Store } from 'lucide-react'

const merchantNav = [
  { href: '/merchant/dashboard',    icon: LayoutDashboard, label: 'Tableau' },
  { href: '/merchant/products',     icon: Package,         label: 'Produits' },
  { href: '/merchant/products/new', icon: Plus,            label: 'Ajouter',  fab: true },
  { href: '/merchant/orders',       icon: ShoppingBag,     label: 'Commandes' },
  { href: '/merchant/shop',         icon: Store,           label: 'Boutique' },
]

export default function MerchantBottomNav() {
  const pathname = usePathname()

  return (
    <nav className="merchant-bottom-nav" role="navigation" aria-label="Navigation marchand">
      {merchantNav.map(item => {
        const isActive =
          item.href === '/merchant/dashboard'
            ? pathname === item.href
            : item.href === '/merchant/products/new'
            ? pathname === item.href
            : pathname.startsWith(item.href) && item.href !== '/merchant/products/new'

        const Icon = item.icon

        if (item.fab) {
          return (
            <Link
              key={item.href}
              href={item.href}
              className="merchant-nav-item fab-item"
              aria-label="Ajouter un produit"
            >
              <span className="merchant-nav-fab">
                <Icon size={22} color="white" />
              </span>
              <span className="merchant-nav-label" style={{ color: 'hsl(221 83% 53%)', fontWeight: 700 }}>
                {item.label}
              </span>
            </Link>
          )
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`merchant-nav-item${isActive ? ' active' : ''}`}
            aria-label={item.label}
            aria-current={isActive ? 'page' : undefined}
          >
            <span className="merchant-nav-icon">
              <Icon size={21} strokeWidth={isActive ? 2.5 : 1.8} />
            </span>
            <span className="merchant-nav-label">{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
