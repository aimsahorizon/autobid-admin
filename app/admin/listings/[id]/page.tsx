import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import ListingDetailClient from './ListingDetailClient'

async function getListing(id: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('auctions')
    .select(`
      *,
      auction_statuses (id, status_name, display_name),
      auction_categories (category_name, display_name),
      auction_vehicles (*),
      auction_photos (id, photo_url, category, display_order, is_primary),
      users!auctions_seller_id_fkey (id, full_name, email, profile_image_url)
    `)
    .eq('id', id)
    .single()

  if (error || !data) return null
  return data
}

async function getStatuses() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('auction_statuses')
    .select('id, status_name, display_name')
  return data || []
}

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  
  const [listing, statuses] = await Promise.all([getListing(id), getStatuses()])

  if (!listing) {
    notFound()
  }

  // Get current admin user ID for moderation
  const { data: { user } } = await supabase.auth.getUser()
  const { data: adminUser } = await supabase
    .from('admin_users')
    .select('id')
    .eq('user_id', user?.id)
    .single()

  return (
    <ListingDetailClient 
      listing={listing} 
      statuses={statuses} 
      adminUserId={adminUser?.id || null} 
    />
  )
}
