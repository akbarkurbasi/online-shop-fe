import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CartItem } from '@/lib/types'
import { cartService } from '@/services/cartService'
import { useAuth } from './auth'

export interface CartState {
  items: CartItem[]
  cartId: string | null
  addItem: (item: CartItem) => Promise<void>
  removeItem: (id: string) => Promise<void>
  updateQuantity: (id: string, quantity: number) => Promise<void>
  toggleItemSelection: (id: string) => void
  selectAllItems: (selected: boolean) => void
  removeSelectedItems: () => Promise<void>
  clearCart: () => Promise<void>
  fetchCart: () => Promise<void>
  getTotalPrice: () => number
  getTotalItems: () => number
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      cartId: null,

      fetchCart: async () => {
        const user = useAuth.getState().user
        if (!user) return

        try {
          const data = await cartService.getCart()
          const cart = data.data
          // Carry forward each item's prior tick state so a refetch (triggered
          // by add/remove/quantity ops) doesn't blow away the user's selection.
          // Brand-new items default to unticked.
          const prevSelected = new Map(get().items.map((i) => [i.id, i.selected]))
          const items: CartItem[] = cart.items.map((item: any) => ({
            id: item.id,
            product_id: item.product_id,
            name: item.product?.name || 'Unknown Product',
            price: item.product?.price || 0,
            quantity: item.quantity,
            image: item.product?.image || '',
            category: item.product?.category || '',
            selectedVariants: item.selected_variants,
            selected: prevSelected.get(item.id) ?? false,
          }))
          set({ items, cartId: cart.id })
        } catch (error) {
          console.error('Failed to fetch cart:', error)
        }
      },

      addItem: async (item: CartItem) => {
        const user = useAuth.getState().user

        if (user) {
          try {
            await cartService.addToCart({
              productId: item.product_id,
              quantity: item.quantity,
              selectedVariants: item.selectedVariants || [],
            })
            await get().fetchCart()
            return
          } catch (error) {
            console.error('Failed to add to backend cart:', error)
          }
        }

        // Fallback or guest mode
        set((state) => {
          const existingItem = state.items.find(
            (i) => i.product_id === item.product_id &&
              JSON.stringify(i.selectedVariants) === JSON.stringify(item.selectedVariants)
          )
          if (existingItem) {
            return {
              items: state.items.map((i) =>
                i.id === existingItem.id
                  ? { ...i, quantity: i.quantity + item.quantity }
                  : i
              ),
            }
          }
          return { items: [...state.items, { ...item, selected: false }] }
        })
      },

      removeItem: async (id: string) => {
        const user = useAuth.getState().user
        if (user) {
          try {
            await cartService.removeItem(id)
            await get().fetchCart()
            return
          } catch (error) {
            console.error('Failed to remove from backend cart:', error)
          }
        }

        set((state) => ({
          items: state.items.filter((i) => i.id !== id),
        }))
      },

      updateQuantity: async (id: string, quantity: number) => {
        const user = useAuth.getState().user
        if (user) {
          try {
            await cartService.updateItem(id, quantity)
            await get().fetchCart()
            return
          } catch (error) {
            console.error('Failed to update backend cart:', error)
          }
        }

        set((state) => ({
          items: state.items
            .map((i) => (i.id === id ? { ...i, quantity } : i))
            .filter((i) => i.quantity > 0),
        }))
      },

      toggleItemSelection: (id: string) => {
        set((state) => ({
          items: state.items.map((i) =>
            i.id === id ? { ...i, selected: !i.selected } : i
          ),
        }))
      },

      selectAllItems: (selected: boolean) => {
        set((state) => ({
          items: state.items.map((i) => ({ ...i, selected })),
        }))
      },

      removeSelectedItems: async () => {
        const user = useAuth.getState().user
        const selectedItems = get().items.filter(i => i.selected)

        if (user) {
          for (const item of selectedItems) {
            await get().removeItem(item.id)
          }
          return
        }

        set((state) => ({
          items: state.items.filter((i) => !i.selected),
        }))
      },

      clearCart: async () => {
        const user = useAuth.getState().user
        // const cartId = get().cartId

        if (user) {
          try {
            await cartService.clearCart()
            await get().fetchCart()
            return
          } catch (error) {
            console.error('Failed to clear backend cart:', error)
          }
        }

        set({ items: [] })
      },

      getTotalPrice: () => {
        return get()
          .items.filter((i) => i.selected)
          .reduce((total, item) => {
            const variantsTotal = (item.selectedVariants ?? []).reduce(
              (sum, v) => sum + (Number(v.value) || 0),
              0
            )
            return total + (item.price + variantsTotal) * item.quantity
          }, 0)
      },

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0)
      },
    }),
    {
      name: 'cart-store',
    }
  )
)
