// ==============================
// RÔLES UTILISATEURS
// ==============================
export type UserRole = 'super_admin' | 'merchant' | 'customer'

export type ShopStatus = 'pending' | 'active' | 'suspended' | 'closed'

export type ProductStatus = 'draft' | 'active' | 'out_of_stock' | 'archived'

export type OrderStatus = 
  | 'pending' 
  | 'confirmed' 
  | 'processing' 
  | 'shipped' 
  | 'delivered' 
  | 'cancelled' 
  | 'refunded'

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded'

export type PaymentMethod = 'wave' | 'orange_money' | 'cash_on_delivery'

// ==============================
// UTILISATEURS
// ==============================
export interface User {
  id: string
  email: string
  full_name: string
  avatar_url?: string
  phone?: string
  role: UserRole
  is_active: boolean
  created_at: string
  updated_at: string
}

// ==============================
// BOUTIQUES
// ==============================
export interface Shop {
  id: string
  owner_id: string
  name: string
  slug: string
  description?: string
  logo_url?: string
  banner_url?: string
  address?: string
  city?: string
  country?: string
  phone?: string
  email?: string
  status: ShopStatus
  commission_rate: number
  plan: 'free' | 'pro' | 'premium'
  created_at: string
  updated_at: string
  owner?: User
  products_count?: number
}

// ==============================
// CATÉGORIES
// ==============================
export interface Category {
  id: string
  name: string
  slug: string
  icon?: string
  parent_id?: string
  children?: Category[]
}

// ==============================
// PRODUITS DU CATALOGUE
// ==============================
export interface CatalogProduct {
  id: string
  category_id?: string
  name: string
  description?: string
  base_price: number
  image_url?: string
  is_active: boolean
  category?: Category
  created_at: string
  updated_at: string
}

// ==============================
// PRODUITS
// ==============================
export interface ProductImage {
  id: string
  product_id: string
  url: string
  alt?: string
  position: number
}

export interface ProductVariant {
  id: string
  product_id: string
  name: string        // ex: "Taille L - Rouge"
  sku?: string
  price: number
  stock: number
  attributes: Record<string, string> // { taille: "L", couleur: "Rouge" }
}

export interface Product {
  id: string
  shop_id: string
  category_id?: string
  name: string
  slug: string
  description?: string
  price: number
  compare_price?: number   // Prix barré
  stock: number
  sku?: string
  weight?: number
  status: ProductStatus
  images: ProductImage[]
  variants?: ProductVariant[]
  category?: Category
  shop?: Shop
  created_at: string
  updated_at: string
}

// ==============================
// PANIER
// ==============================
export interface CartItem {
  product_id: string
  variant_id?: string
  quantity: number
  product: Product
  variant?: ProductVariant
}

export interface Cart {
  items: CartItem[]
  shop_id?: string  // Un panier = une boutique
  total: number
}

// ==============================
// COMMANDES
// ==============================
export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  variant_id?: string
  quantity: number
  unit_price: number
  total_price: number
  product?: Product
}

export interface Order {
  id: string
  order_number: string
  customer_id: string
  shop_id: string
  status: OrderStatus
  payment_status: PaymentStatus
  payment_method?: PaymentMethod
  items: OrderItem[]
  subtotal: number
  delivery_fee: number
  total: number
  delivery_address: DeliveryAddress
  notes?: string
  created_at: string
  updated_at: string
  customer?: User
  shop?: Shop
}

export interface DeliveryAddress {
  full_name: string
  phone: string
  address: string
  city: string
  country: string
  notes?: string
}

// ==============================
// API RESPONSES
// ==============================
export interface ApiResponse<T> {
  data: T | null
  error: string | null
  success: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  total_pages: number
}

// ==============================
// DASHBOARD STATS
// ==============================
export interface AdminStats {
  total_shops: number
  active_shops: number
  pending_shops: number
  total_users: number
  total_orders: number
  total_revenue: number
  platform_commission: number
}

export interface MerchantStats {
  total_products: number
  total_orders: number
  pending_orders: number
  total_revenue: number
  monthly_revenue: number
  avg_order_value: number
}
