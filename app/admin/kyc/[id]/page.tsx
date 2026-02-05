import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import KycDetailClient from './KycDetailClient'

async function getKycDocument(id: string) {
  const supabase = createAdminClient()

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

  // Helper to extract clean path from potentially full URLs
  const getCleanPath = (url: string) => {
    if (url.includes('kyc-documents/')) {
      return url.split('kyc-documents/')[1].split('?')[0]
    }
    return url.split('?')[0]
  }

  // Generate signed URLs for all document images
  const documentFields = [
    'national_id_front_url',
    'national_id_back_url',
    'secondary_gov_id_front_url',
    'secondary_gov_id_back_url',
    'proof_of_address_url',
    'selfie_with_id_url'
  ]

  const signedUrls: Record<string, string | null> = {}

  for (const field of documentFields) {
    const path = data[field] as string | null
    if (path) {
      const cleanPath = getCleanPath(path)
      const { data: signedData } = await supabase.storage
        .from('kyc-documents')
        .createSignedUrl(cleanPath, 3600)
      
      signedUrls[field] = signedData?.signedUrl || null
    } else {
      signedUrls[field] = null
    }
  }

  return {
    ...data,
    signed_urls: signedUrls
  }
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
