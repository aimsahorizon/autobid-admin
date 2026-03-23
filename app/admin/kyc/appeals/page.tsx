import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AppealsClient from './AppealsClient'

async function getAdminUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: adminUser } = await supabase
    .from('admin_users')
    .select('id, admin_roles (role_name)')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single()

  if (!adminUser) redirect('/admin')

  const roles = adminUser.admin_roles as unknown as { role_name: string }[] | { role_name: string } | null
  const roleName = Array.isArray(roles) ? roles[0]?.role_name : roles?.role_name
  if (!roleName || !['super_admin', 'operations_admin'].includes(roleName)) {
    redirect('/admin')
  }

  return user.id
}

async function getAppeals() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('kyc_appeals')
    .select(`
      id,
      user_id,
      kyc_document_id,
      appeal_reason,
      status,
      reviewed_by,
      reviewed_at,
      admin_notes,
      created_at,
      users!kyc_appeals_user_id_fkey (id, full_name, email),
      kyc_documents!kyc_appeals_kyc_document_id_fkey (id, rejection_reason, status_id, kyc_statuses (id, status_name, display_name))
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching appeals:', error)
    return []
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data || []).map((appeal: any) => ({
    ...appeal,
    users: Array.isArray(appeal.users) ? appeal.users[0] || null : appeal.users,
    kyc_documents: Array.isArray(appeal.kyc_documents) ? appeal.kyc_documents[0] || null : appeal.kyc_documents,
  }))
}

async function getKycStatuses() {
  const supabase = await createClient()
  const { data } = await supabase.from('kyc_statuses').select('id, status_name')
  return data || []
}

export default async function AppealsPage() {
  const [adminUserId, appeals, statuses] = await Promise.all([
    getAdminUser(),
    getAppeals(),
    getKycStatuses(),
  ])

  const underReviewStatusId = statuses.find(s => s.status_name === 'under_review')?.id || ''
  const rejectedStatusId = statuses.find(s => s.status_name === 'rejected')?.id || ''

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">KYC Appeals</h1>
        <p className="text-gray-500 mt-1">Review user appeals for rejected KYC documents</p>
      </div>

      <AppealsClient
        appeals={appeals}
        adminUserId={adminUserId}
        underReviewStatusId={underReviewStatusId}
        rejectedStatusId={rejectedStatusId}
      />
    </div>
  )
}
