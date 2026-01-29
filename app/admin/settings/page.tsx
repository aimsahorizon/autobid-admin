import { createClient } from '@/lib/supabase/server'
import SettingsClient from './SettingsClient'

async function getAdminUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data } = await supabase
    .from('admin_users')
    .select(`
      *,
      admin_roles (role_name, display_name),
      users (id, full_name, email, profile_image_url, created_at)
    `)
    .eq('user_id', user.id)
    .single()

  return data
}

export default async function SettingsPage() {
  const adminUser = await getAdminUser()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1">Manage your account and preferences</p>
      </div>

      <SettingsClient adminUser={adminUser} />
    </div>
  )
}
