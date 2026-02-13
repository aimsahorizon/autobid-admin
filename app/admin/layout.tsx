import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminLayoutClient from './AdminLayoutClient'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get admin user info (optional - for display purposes)
  const { data: adminUser } = await supabase
    .from('admin_users')
    .select(`
      *,
      admin_roles (role_name, display_name),
      users (full_name, email, profile_image_url)
    `)
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single()

  // Fallback user info if not in admin_users table
  const displayUser = adminUser || {
    admin_roles: { role_name: 'admin', display_name: 'Administrator' },
    users: { full_name: user.email?.split('@')[0], email: user.email, profile_image_url: null }
  }

  return (
    <AdminLayoutClient user={displayUser}>
      {children}
    </AdminLayoutClient>
  )
}
