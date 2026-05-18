export interface Category {
  id: string
  name: string
  slug: string
}

export interface Variant {
  id: string
  name: string // e.g., "Small", "Blue"
  type: string // e.g., "size", "color", "weight"
  value: string // e.g., "#000000" for color, "S" for size
  price?: number | null // Explicit price for this variant; null = inherit base price
  priceAdjustment?: number // Optional adjustment relative to base price
  stock: number
}

export interface Product {
  id: string
  name: string
  description: string
  category: string // Stores Category slug or id
  price: number
  originalPrice?: number
  image: string
  rating: number
  reviews: number
  stock: number
  inStock: boolean // added for consistency
  featured?: boolean
  created_at?: string
  tags: string[]
  variants?: Variant[]
}

export interface CartItem {
  id: string // This should ideally be productID + variantIDs
  product_id: string
  name: string
  price: number
  quantity: number
  image: string
  category: string
  selectedVariants?: {
    type: string
    name: string
    value: string
  }[]
  selected: boolean
}

export interface Order {
  id: string
  customer_name: string
  customer_email: string
  customer_phone: string
  customer_address: string
  city: string
  state: string
  zip_code: string
  items: CartItem[]
  total: number
  status: 'pending' | 'paid' | 'failed' | 'expired' | 'shipped' | 'delivered' | 'cancelled'
  created_at: string
  payment_url?: string
}

export interface Article {
  id: string
  title: string
  description: string
  content: string
  image: string
  author: string
  category: string
  publishedAt: string
  featured?: boolean
  readTime: number
  excerpt: string
  slug?: string
}
