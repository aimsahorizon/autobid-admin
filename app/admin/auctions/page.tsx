import { createClient } from '@/lib/supabase/server'
import AuctionsClient from './AuctionsClient'

async function getAuctionStats() {
  const supabase = await createClient()

  const { data: statuses } = await supabase.from('auction_statuses').select('id, status_name')
  const liveId = statuses?.find((s) => s.status_name === 'live')?.id

  const now = new Date()
  const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000)

  const [{ count: totalActive }, { data: endingSoon }, { count: totalBids }] = await Promise.all([
    supabase.from('auctions').select('*', { count: 'exact', head: true }).eq('status_id', liveId),
    supabase
      .from('auctions')
      .select('id')
      .eq('status_id', liveId)
      .lte('end_time', oneHourFromNow.toISOString())
      .gte('end_time', now.toISOString()),
    supabase.from('bids').select('*', { count: 'exact', head: true }),
  ])

  return {
    totalActive: totalActive || 0,
    endingSoon: endingSoon?.length || 0,
    totalBids: totalBids || 0,
  }
}

// Helper to transform Supabase relation arrays to single objects
function transformAuction<T extends Record<string, unknown>>(auction: T) {
  return {
    ...auction,
    auction_statuses: Array.isArray(auction.auction_statuses)
      ? auction.auction_statuses[0] || null
      : auction.auction_statuses,
    auction_categories: Array.isArray(auction.auction_categories)
      ? auction.auction_categories[0] || null
      : auction.auction_categories,
    auction_vehicles: Array.isArray(auction.auction_vehicles)
      ? auction.auction_vehicles[0] || null
      : auction.auction_vehicles,
    users: Array.isArray(auction.users)
      ? auction.users[0] || null
      : auction.users,
  }
}

function transformBid<T extends Record<string, unknown>>(bid: T) {
  return {
    ...bid,
    bid_statuses: Array.isArray(bid.bid_statuses)
      ? bid.bid_statuses[0] || null
      : bid.bid_statuses,
    users: Array.isArray(bid.users)
      ? bid.users[0] || null
      : bid.users,
  }
}

async function getAuctions() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('auctions')
    .select(`
      id,
      title,
      description,
      starting_price,
      reserve_price,
      current_price,
      bid_increment,
      deposit_amount,
      total_bids,
      view_count,
      is_featured,
      start_time,
      end_time,
      created_at,
      auction_statuses (id, status_name, display_name),
      auction_categories (category_name, display_name),
      auction_vehicles (brand, model, variant, year, mileage, condition, exterior_color, transmission, fuel_type),
      auction_photos (id, photo_url, is_primary, category),
      users!auctions_seller_id_fkey (id, full_name, email, profile_image_url)
    `)
    .in('status_id', (
      await supabase.from('auction_statuses')
        .select('id')
        .in('status_name', ['live', 'scheduled', 'ended', 'pending_approval'])
    ).data?.map(s => s.id) || [])
    .order('start_time', { ascending: false })

  if (error) {
    console.error('Error fetching auctions:', error)
    return []
  }

  return (data || []).map(transformAuction)
}

async function getBidsForAuctions(auctionIds: string[]) {
  if (auctionIds.length === 0) return []

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('bids')
    .select(`
      id,
      auction_id,
      bidder_id,
      bid_amount,
      is_auto_bid,
      created_at,
      bid_statuses (status_name, display_name),
      users (id, full_name, email, profile_image_url)
    `)
    .in('auction_id', auctionIds)
    .order('bid_amount', { ascending: false })

  if (error) {
    console.error('Error fetching bids:', error)
    return []
  }

  return (data || []).map(transformBid)
}

export default async function AuctionsPage() {
  const [stats, auctions] = await Promise.all([getAuctionStats(), getAuctions()])

  const auctionIds = auctions.map(a => a.id)
  const allBids = await getBidsForAuctions(auctionIds)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Bid Monitoring Center</h1>
        <p className="text-gray-500 mt-1">Real-time auction monitoring and bid tracking</p>
      </div>

      <AuctionsClient initialAuctions={auctions} stats={stats} initialBids={allBids} />
    </div>
  )
}
