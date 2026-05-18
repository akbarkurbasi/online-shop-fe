/**
 * productService.ts
 *
 * Langsung hit backend Go di localhost:8000.
 * TIDAK ada proxy Next.js.
 *
 * PUBLIC  → GET /products, GET /products/:id, GET /categories
 * (admin CRUD ada di adminService.ts)
 */
import { publicApiClient } from '@/lib/api-client'
import type { Product, Category } from '@/lib/types'

export const productService = {
  // Bump default limit so the shop can paginate client-side over the full catalog
  // (backend defaults to 10/page). Override via params.limit when needed.
  getProducts: (params?: { category?: string; query?: string; featured?: boolean; limit?: number; page?: number }) =>
    publicApiClient.get<{ data: { items: Product[]; paging?: { current_page: number; total_page: number; total_items: number } } }>(
      '/api/v1/products',
      {
        params: { limit: 1000, ...(params || {}) } as unknown as Record<string, string | number>,
      }
    ),

  getProductById: (id: string) =>
    publicApiClient.get<{ data: Product }>(`/api/v1/products/${id}`),

  getCategories: () =>
    publicApiClient.get<{ data: Category[] }>('/api/v1/categories'),
}
