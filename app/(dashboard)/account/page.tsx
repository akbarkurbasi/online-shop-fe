import { AccountClient } from '@/components/account/account-client'

export const metadata = {
  title: 'My Account | Volt',
  description: 'Manage your Volt account, orders, and preferences.',
}

export default function AccountPage() {
  return <AccountClient />
}
