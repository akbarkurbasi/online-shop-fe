import { OrdersClient } from '@/components/account/orders-client'

export const metadata = {
  title: 'Order History | Volt',
  description: 'View and track your previous Volt orders.',
}

export default function OrdersPage() {
  return <OrdersClient />
}
