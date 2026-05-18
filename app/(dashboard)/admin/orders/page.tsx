import { adminService } from '@/services/adminService'
import { OrdersClient } from '@/components/admin/orders-client'
import { cookies } from 'next/headers'
import type { Order } from '@/lib/types'

export default async function AdminOrdersPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value

  let initialOrders: Order[] = []
  try {
    const data = await adminService.getOrders({ page: 1 }, token)
    initialOrders = data.data.items
  } catch (error) {
    console.error('Error fetching orders on server:', error)
  }

  return (
    <div className="animate-in fade-in duration-500">
      <OrdersClient initialOrders={initialOrders} />
    </div>
  )
}
