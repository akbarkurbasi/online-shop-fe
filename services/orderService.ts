/**
 * orderService.ts
 *
 * Langsung hit backend Go di localhost:8000.
 * TIDAK ada proxy Next.js.
 *
 * SEMUA endpoint order adalah PRIVATE — user harus login.
 * Admin order (lihat semua, ubah status) ada di adminService.ts.
 */
import { privateApiClient } from '@/lib/api-client'
import type { Order } from '@/lib/types'

export const orderService = {
  createOrder: (orderData: Partial<Order>) =>
    privateApiClient.post<{ data: Order }>('/api/v1/orders', orderData),

  getOrders: () =>
    privateApiClient.get<{ data: { items: Order[] } }>('/api/v1/orders'),

  myOrders: (params?: { limit?: number; page?: number }) =>
    privateApiClient.get<{
      data: {
        items: Order[]
        paging?: { current_page: number; total_page: number; total_items: number }
      }
    }>('/api/v1/orders/my-orders', {
      params: { limit: 1000, ...(params || {}) } as Record<string, string | number>,
    }),

  getOrderById: (id: string) =>
    privateApiClient.get<Order>(`/orders/${id}`),

  cancelOrder: (id: string) =>
    privateApiClient.patch<Order>(`/orders/${id}`, { status: 'cancelled' }),
}
