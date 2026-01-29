import { createClient } from '@/lib/supabase/server'
import KycClient from './KycClient'

// Helper to transform Supabase relation arrays to single objects
function transformKycDocument<T extends Record<string, unknown>>(doc: T) {
  return {
    ...doc,
    kyc_statuses: Array.isArray(doc.kyc_statuses)
      ? doc.kyc_statuses[0] || null
      : doc.kyc_statuses,
    users: Array.isArray(doc.users)
      ? doc.users[0] || null
      : doc.users,
  }
}

async function getKycStats() {
  const supabase = await createClient()

  const { data: statuses } = await supabase.from('kyc_statuses').select('id, status_name')

  const pendingId = statuses?.find((s) => s.status_name === 'pending')?.id
  const underReviewId = statuses?.find((s) => s.status_name === 'under_review')?.id
  const approvedId = statuses?.find((s) => s.status_name === 'approved')?.id

  const [{ count: pending }, { count: underReview }, { count: approved }] = await Promise.all([
    supabase.from('kyc_documents').select('*', { count: 'exact', head: true }).eq('status_id', pendingId),
    supabase.from('kyc_documents').select('*', { count: 'exact', head: true }).eq('status_id', underReviewId),
    supabase.from('kyc_documents').select('*', { count: 'exact', head: true }).eq('status_id', approvedId),
  ])

  return {
    pending: pending || 0,
    underReview: underReview || 0,
    approved: approved || 0,
  }
}

async function getKycDocuments() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('kyc_documents')
    .select(`
      id,
      document_type,
      selfie_with_id_url,
      submitted_at,
      reviewed_at,
      rejection_reason,
      created_at,
      kyc_statuses (id, status_name, display_name),
      users!kyc_documents_user_id_fkey (id, full_name, email, profile_image_url)
    `)
    .order('submitted_at', { ascending: false, nullsFirst: false })

  if (error) {
    console.error('Error fetching KYC documents:', error)
    return []
  }

  return (data || []).map(transformKycDocument)
}

async function getStatuses() {
  const supabase = await createClient()
  const { data } = await supabase.from('kyc_statuses').select('id, status_name, display_name')
  return data || []
}

export default async function KycPage() {
  const [stats, documents, statuses] = await Promise.all([
    getKycStats(),
    getKycDocuments(),
    getStatuses(),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">KYC Verification</h1>
        <p className="text-gray-500 mt-1">Review and manage user identity verification</p>
      </div>

      <KycClient initialDocuments={documents} statuses={statuses} stats={stats} />
    </div>
  )
}
