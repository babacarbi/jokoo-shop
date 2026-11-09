'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, LayoutGrid, ShoppingCart, Heart, User } from 'lucide-react'
import { useCart } from '@/lib/cart-context'

const navItems = [
  { href: '/',           icon: Home,         label: 'Accueil' },
  { href: '/categories', icon: LayoutGrid,   label: 'Catégories' },
  { href: '/panier',     icon: ShoppingCart, label: 'Panier', cart: true },
  { href: '/favoris',    icon: Heart,        label: 'Favoris' },
  { href: '/compte',     icon: User,         label: 'Compte' },
]

export default function BottomNav() {
  const pathname = usePathname()
  const { totalItems } = useCart()

  // Ne pas afficher sur les pages admin/merchant
  // ni sur les pages avec leur propre barre d'action (produit, panier, commande)
  if (
    pathname.startsWith('/admin') ||
    pathname.startsWith('/merchant') ||
    pathname.startsWith('/produit') ||
    pathname.startsWith('/panier') ||
    pathname.startsWith('/commande') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/login')
  ) return null

  return (
    <nav className="bottom-nav" role="navigation" aria-label="Navigation principale">
      {navItems.map(item => {
        const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
        const Icon = item.icon
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`bottom-nav-item${isActive ? ' active' : ''}`}
            aria-label={item.label}
            aria-current={isActive ? 'page' : undefined}
          >
            {/* Icon container with active pill */}
            <span className="bottom-nav-icon">
              <Icon
                size={22}
                strokeWidth={isActive ? 2.5 : 1.8}
              />
            </span>

            {/* Badge (panier) */}
            {item.cart && totalItems > 0 && (
              <span className="nav-badge" aria-label={`${totalItems} article${totalItems > 1 ? 's' : ''}`}>
                {totalItems}
              </span>
            )}

            {/* Label */}
            <span className="bottom-nav-label">{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
