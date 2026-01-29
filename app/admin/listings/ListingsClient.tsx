'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Car, Eye, Gavel, Star } from 'lucide-react'
import StatusBadge from '@/components/ui/StatusBadge'

interface Listing {
  id: string
  title: string
  starting_price: number
  reserve_price: number | null
  current_price: number
  total_bids: number
  view_count: number
  is_featured: boolean
  start_time: string | null
  end_time: string | null
  created_at: string
  auction_statuses: { id: string; status_name: string; display_name: string } | null
  auction_categories: { category_name: string; display_name: string } | null
  auction_vehicles: {
    brand: string | null
    model: string | null
    variant: string | null
    year: number | null
    mileage: number | null
    condition: string | null
    exterior_color: string | null
  } | null
  auction_photos: Array<{ id: string; photo_url: string; is_primary: boolean }>
  users: { id: string; full_name: string | null; email: string } | null
}

interface Status {
  id: string
  status_name: string
  display_name: string
}

interface ListingsClientProps {
  initialListings: Listing[]
  statuses: Status[]
}

export default function ListingsClient({ initialListings, statuses }: ListingsClientProps) {
  const router = useRouter()
  const [listings] = useState(initialListings)
  const [search, setSearch] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')

  const filteredListings = listings.filter((listing) => {
    const vehicle = listing.auction_vehicles
    const searchLower = search.toLowerCase()
    const matchesSearch =
      listing.title?.toLowerCase().includes(searchLower) ||
      vehicle?.brand?.toLowerCase().includes(searchLower) ||
      vehicle?.model?.toLowerCase().includes(searchLower) ||
      listing.users?.full_name?.toLowerCase().includes(searchLower) ||
      listing.users?.email?.toLowerCase().includes(searchLower)

    if (selectedStatus === 'all') return matchesSearch
    return matchesSearch && listing.auction_statuses?.status_name === selectedStatus
  })

  const getPrimaryPhoto = (photos: Array<{ photo_url: string; is_primary: boolean }>) => {
    const primary = photos?.find((p) => p.is_primary)
    return primary?.photo_url || photos?.[0]?.photo_url
  }

  const getVehicleName = (listing: Listing) => {
    const v = listing.auction_vehicles
    if (v?.year && v?.brand && v?.model) {
      return `${v.year} ${v.brand} ${v.model}${v.variant ? ` ${v.variant}` : ''}`
    }
    return listing.title || 'Untitled Listing'
  }

  return (
    <>
      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by vehicle, seller..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setSelectedStatus('all')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedStatus === 'all'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            {statuses.map((status) => (
              <button
                key={status.id}
                onClick={() => setSelectedStatus(status.status_name)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedStatus === status.status_name
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status.display_name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Listings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredListings.length === 0 ? (
          <div className="col-span-full bg-white rounded-xl border border-gray-200 p-12 text-center">
            <Car className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No listings found</p>
          </div>
        ) : (
          filteredListings.map((listing) => (
            <div
              key={listing.id}
              onClick={() => router.push(`/admin/listings/${listing.id}`)}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all cursor-pointer group"
            >
              {/* Image */}
              <div className="relative aspect-[16/10] bg-gray-100">
                {getPrimaryPhoto(listing.auction_photos) ? (
                  <img
                    src={getPrimaryPhoto(listing.auction_photos)}
                    alt={getVehicleName(listing)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Car className="w-16 h-16 text-gray-300" />
                  </div>
                )}
                {listing.is_featured && (
                  <div className="absolute top-3 left-3 bg-yellow-500 text-white px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1">
                    <Star className="w-3 h-3" />
                    Featured
                  </div>
                )}
                <div className="absolute top-3 right-3">
                  <StatusBadge status={listing.auction_statuses?.status_name || 'draft'} />
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">
                  {getVehicleName(listing)}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  by {listing.users?.full_name || listing.users?.email || 'Unknown'}
                </p>

                <div className="flex items-center justify-between mt-4">
                  <div>
                    <p className="text-xs text-gray-400">Starting Price</p>
                    <p className="text-lg font-bold text-purple-600">
                      ₱{listing.starting_price?.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Current Price</p>
                    <p className="text-lg font-bold text-gray-900">
                      ₱{listing.current_price?.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Gavel className="w-4 h-4" />
                    {listing.total_bids} bids
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    {listing.view_count} views
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  )
}
