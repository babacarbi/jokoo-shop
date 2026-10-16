'use client'

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'

export type CartItem = {
  id: number
  name: string
  price: number
  img: string
  shop: string
  merchantPhone: string
  quantity: number
}

type CartContextType = {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'quantity'>, qty?: number) => void
  updateQty: (id: number, qty: number) => void
  removeItem: (id: number) => void
  clearCart: () => void
  totalItems: number
  totalPrice: number
}

const CartContext = createContext<CartContextType | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [hydrated, setHydrated] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('ma_cart')
      if (saved) {
        const parsed = JSON.parse(saved)
        setItems(parsed)
        
        // Autoréparation des noms de boutique inconnus
        const healShops = async () => {
          const toHeal = parsed.filter((i: any) => typeof i.id === 'string' && (i.shop === 'Boutique' || i.shop === 'Boutique Inconnue'))
          if (toHeal.length === 0) return
          
          const { createClient } = await import('@/lib/supabase/client')
          const supabase = createClient()
          const pIds = toHeal.map((i: any) => i.id)
          const { data: prods } = await supabase.from('products').select('id, shop_id').in('id', pIds)
          if (!prods) return
          
          const { getShopsData } = await import('@/app/actions')
          const sIds = Array.from(new Set(prods.map(p => p.shop_id).filter(Boolean))) as string[]
          const shops = await getShopsData(sIds)
          if (!shops || shops.length === 0) return
          
          setItems(prev => prev.map(item => {
            const p = prods.find(pr => pr.id === item.id)
            if (p) {
              const s = shops.find(sh => sh.id === p.shop_id)
              if (s) return { ...item, shop: s.name, merchantPhone: s.phone || item.merchantPhone }
            }
            return item
          }))
        }
        healShops()
      }
    } catch {}
    setHydrated(true)
  }, [])

  // Persist to localStorage
  useEffect(() => {
    if (!hydrated) return
    localStorage.setItem('ma_cart', JSON.stringify(items))
  }, [items, hydrated])

  const addItem = useCallback((product: Omit<CartItem, 'quantity'>, qty = 1) => {
    setItems(prev => {
      const existing = prev.find(i => i.id === product.id)
      if (existing) {
        return prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + qty } : i)
      }
      return [...prev, { ...product, quantity: qty }]
    })
  }, [])

  const updateQty = useCallback((id: number, qty: number) => {
    if (qty <= 0) {
      setItems(prev => prev.filter(i => i.id !== id))
    } else {
      setItems(prev => prev.map(i => i.id === id ? { ...i, quantity: qty } : i))
    }
  }, [])

  const removeItem = useCallback((id: number) => {
    setItems(prev => prev.filter(i => i.id !== id))
  }, [])

  const clearCart = useCallback(() => setItems([]), [])

  const totalItems = items.reduce((s, i) => s + i.quantity, 0)
  const totalPrice = items.reduce((s, i) => s + i.price * i.quantity, 0)

  return (
    <CartContext.Provider value={{ items, addItem, updateQty, removeItem, clearCart, totalItems, totalPrice }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
