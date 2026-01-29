import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import KycDetailClient from './KycDetailClient'

async function getKycDocument(id: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('kyc_documents')
    .select(`
      *,
      kyc_statuses (id, status_name, display_name),
      users!kyc_documents_user_id_fkey (id, full_name, email, profile_image_url, is_verified, created_at)
    `)
    .eq('id', id)
    .single()

  if (error || !data) return null
  return data
}

async function getStatuses() {
  const supabase = await createClient()
  const { data } = await supabase.from('kyc_statuses').select('id, status_name, display_name')
  return data || []
}

export default async function KycDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [document, statuses] = await Promise.all([getKycDocument(id), getStatuses()])

  if (!document) {
    notFound()
  }

  return <KycDetailClient document={document} statuses={statuses} />
}
