import { privateApiClient } from '@/lib/api-client'

export interface CartItemBackend {
  id: string
  cart_id: string
  product_id: string
  quantity: number
  selected_variants: any[]
  product?: any
}

export interface CartBackend {
  id: string
  user_id: string
  items: CartItemBackend[]
}

export const cartService = {
  getCart: () =>
    privateApiClient.get<{ data: CartBackend }>(`/api/v1/cart`),

  addToCart: (data: { productId: string; quantity: number; selectedVariants: any[] }) =>
    privateApiClient.post<CartBackend>(`/api/v1/cart/items`, data),

  updateItem: (id: string, quantity: number) =>
    privateApiClient.put<any>(`/api/v1/cart/items/${id}`, { quantity }),

  removeItem: (id: string) =>
    privateApiClient.delete<any>(`/api/v1/cart/items/${id}`),

  clearCart: () =>
    privateApiClient.delete<any>(`/api/v1/cart/items/clear`),
}
