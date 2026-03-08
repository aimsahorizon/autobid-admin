import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import ListingDetailClient from './ListingDetailClient'

async function getListing(id: string) {
  const supabase = await createClient()

  // Fetch the main auction data with all related information
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

  // Get watchers count
  const { count: watchersCount } = await supabase
    .from('auction_watchers')
    .select('*', { count: 'exact', head: true })
    .eq('auction_id', id)

  // Get winner information if auction has ended
  let winnerInfo = null
  if (data.status_id && ['ended', 'sold', 'in_transaction'].includes(data.auction_statuses?.status_name || '')) {
    const { data: winningBid } = await supabase
      .from('bids')
      .select('bidder_id, users (id, full_name, email)')
      .eq('auction_id', id)
      .order('bid_amount', { ascending: false })
      .limit(1)
      .single()

    if (winningBid) {
      winnerInfo = {
        winner_id: winningBid.bidder_id,
        winner_name: (winningBid.users as any)?.full_name
      }
    }
  }

  // Merge watchers count and winner info
  return {
    ...data,
    watchers_count: watchersCount || 0,
    views_count: data.view_count || 0,
    ...(winnerInfo || {})
  }
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
  
  const listing = await getListing(id)

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
      adminUserId={adminUser?.id || null} 
    />
  )
}
