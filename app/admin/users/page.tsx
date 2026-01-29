import { createClient } from '@/lib/supabase/server'
import UsersClient from './UsersClient'

// Helper to transform Supabase relation arrays to single objects
function transformUser<T extends Record<string, unknown>>(user: T) {
  const kycDocs = user.kyc_documents as Array<Record<string, unknown>> | undefined
  return {
    ...user,
    user_roles: Array.isArray(user.user_roles)
      ? user.user_roles[0] || null
      : user.user_roles,
    kyc_documents: kycDocs?.map(doc => ({
      ...doc,
      kyc_statuses: Array.isArray(doc.kyc_statuses)
        ? doc.kyc_statuses[0] || null
        : doc.kyc_statuses,
    })) || [],
  }
}

async function getUsers() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('users')
    .select(`
      id,
      email,
      username,
      full_name,
      first_name,
      last_name,
      middle_name,
      phone_number,
      date_of_birth,
      sex,
      profile_image_url,
      is_verified,
      is_active,
      created_at,
      last_login_at,
      role_id,
      user_roles (id, role_name, display_name),
      kyc_documents (
        id,
        kyc_statuses (status_name)
      )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching users:', error)
    return []
  }

  return (data || []).map(transformUser)
}

async function getRoles() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('user_roles')
    .select('id, role_name, display_name')
    .order('display_name')

  if (error) {
    console.error('Error fetching roles:', error)
    return []
  }

  return data || []
}

export default async function UsersPage() {
  const [users, roles] = await Promise.all([getUsers(), getRoles()])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-gray-500 mt-1">Manage all registered users</p>
        </div>
        <div className="text-sm text-gray-500">
          {users.length} total users
        </div>
      </div>

      <UsersClient initialUsers={users} roles={roles} />
    </div>
  )
}
