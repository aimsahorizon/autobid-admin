import { createClient } from '@/lib/supabase/server'
import ListingsClient from './ListingsClient'

// Helper to transform Supabase relation arrays to single objects
function transformListing<T extends Record<string, unknown>>(listing: T) {
  return {
    ...listing,
    auction_statuses: Array.isArray(listing.auction_statuses)
      ? listing.auction_statuses[0] || null
      : listing.auction_statuses,
    auction_categories: Array.isArray(listing.auction_categories)
      ? listing.auction_categories[0] || null
      : listing.auction_categories,
    auction_vehicles: Array.isArray(listing.auction_vehicles)
      ? listing.auction_vehicles[0] || null
      : listing.auction_vehicles,
    users: Array.isArray(listing.users)
      ? listing.users[0] || null
      : listing.users,
  }
}

async function getListings() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('auctions')
    .select(`
      id,
      title,
      starting_price,
      reserve_price,
      current_price,
      total_bids,
      view_count,
      is_featured,
      is_active,
      start_time,
      end_time,
      created_at,
      auction_statuses (id, status_name, display_name),
      auction_categories (category_name, display_name),
      auction_vehicles (brand, model, variant, year, mileage, condition, exterior_color),
      auction_photos (id, photo_url, is_primary),
      users!auctions_seller_id_fkey (id, full_name, email)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching listings:', error)
    return []
  }

  return (data || []).map(transformListing)
}

async function getStatuses() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('auction_statuses')
    .select('id, status_name, display_name')
    .order('display_name')
  return data || []
}

export default async function ListingsPage() {
  const [listings, statuses] = await Promise.all([getListings(), getStatuses()])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Listings</h1>
          <p className="text-gray-500 mt-1">Manage vehicle listings and approvals</p>
        </div>
        <div className="text-sm text-gray-500">{listings.length} total listings</div>
      </div>

      <ListingsClient initialListings={listings} statuses={statuses} />
    </div>
  )
}
