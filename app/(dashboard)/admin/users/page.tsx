import { adminService, AdminUser } from '@/services/adminService'
import { UsersTable } from '@/components/admin/users-table'
import { cookies } from 'next/headers'

export default async function AdminUsersPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value

  let initialUsers: AdminUser[] = []
  try {
    const data = await adminService.getUsers(token)
    initialUsers = data.data.items
  } catch (error) {
    console.error('Error fetching users on server:', error)
  }

  return (
    <div className="animate-in fade-in duration-500">
      <UsersTable initialUsers={initialUsers} />
    </div>
  )
}
