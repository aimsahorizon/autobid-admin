'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  ArrowLeft,
  Car,
  User,
  Calendar,
  Eye,
  Gavel,
  CheckCircle,
  XCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Power,
  Camera,
} from 'lucide-react'
import StatusBadge from '@/components/ui/StatusBadge'

interface ListingDetailClientProps {
  listing: Record<string, unknown>
  statuses: Array<{ id: string; status_name: string; display_name: string }>
}

type PhotoCategory = 'front' | 'rear' | 'side' | 'interior' | 'engine' | 'other'

export default function ListingDetailClient({ listing, statuses }: ListingDetailClientProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const [reviewNotes, setReviewNotes] = useState('')
  const [isActive, setIsActive] = useState(!!listing.is_active)

  const photos = (listing.auction_photos as Array<{ id: string; photo_url: string; is_primary: boolean; category: string }>) || []
  const vehicle = listing.auction_vehicles as Record<string, unknown>
  const seller = listing.users as Record<string, unknown>
  const status = listing.auction_statuses as { status_name: string; display_name: string }

  // Group photos by category
  const photosByCategory = photos.reduce((acc, photo) => {
    const cat = (photo.category || 'other').toLowerCase() as PhotoCategory
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(photo)
    return acc
  }, {} as Record<PhotoCategory, typeof photos>)

  const categories: { key: PhotoCategory; label: string }[] = [
    { key: 'front', label: 'Front View' },
    { key: 'rear', label: 'Rear View' },
    { key: 'side', label: 'Side View' },
    { key: 'interior', label: 'Interior' },
    { key: 'engine', label: 'Engine Bay' },
    { key: 'other', label: 'Other Photos' },
  ]

  const handleStatusChange = async (newStatusName: string, notes?: string) => {
    setLoading(true)
    const supabase = createClient()

    const newStatus = statuses.find((s) => s.status_name === newStatusName)
    if (!newStatus) {
      setLoading(false)
      return
    }

    const { error } = await supabase
      .from('auctions')
      .update({ status_id: newStatus.id })
      .eq('id', listing.id)

    if (!error) {
      // Log to audit
      await supabase.from('auction_moderation').insert({
        auction_id: listing.id,
        action: newStatusName === 'approved' ? 'approve' : 'reject',
        reason: notes || null,
        notes: notes || null,
      })

      router.refresh()
    }

    setLoading(false)
  }

  const toggleActive = async () => {
    setLoading(true)
    const supabase = createClient()
    
    const { error } = await supabase
      .from('auctions')
      .update({ is_active: !isActive })
      .eq('id', listing.id)

    if (!error) {
      setIsActive(!isActive)
      router.refresh()
    }
    setLoading(false)
  }

  const getVehicleName = (): string => {
    if (vehicle?.year && vehicle?.brand && vehicle?.model) {
      const year = String(vehicle.year)
      const brand = String(vehicle.brand)
      const model = String(vehicle.model)
      const variant = vehicle.variant ? ` ${String(vehicle.variant)}` : ''
      return `${year} ${brand} ${model}${variant}`
    }
    return (listing.title as string) || 'Untitled Listing'
  }

  const nextPhoto = () => setCurrentPhotoIndex((i) => (i + 1) % photos.length)
  const prevPhoto = () => setCurrentPhotoIndex((i) => (i - 1 + photos.length) % photos.length)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{getVehicleName()}</h1>
              {!isActive && (
                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-bold uppercase rounded">
                  Inactive
                </span>
              )}
            </div>
            <p className="text-gray-500">Listing ID: {listing.id as string}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleActive}
            disabled={loading}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              isActive
                ? 'bg-red-50 text-red-600 hover:bg-red-100'
                : 'bg-green-50 text-green-600 hover:bg-green-100'
            }`}
          >
            <Power className="w-4 h-4" />
            {isActive ? 'Deactivate' : 'Activate'}
          </button>
          <StatusBadge status={status?.status_name || 'draft'} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Photos & Vehicle Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Photo Gallery (Categorized) */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Camera className="w-5 h-5 text-gray-400" />
              Vehicle Photos
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {categories.map((cat) => (
                <div key={cat.key} className="space-y-3">
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                    {cat.label}
                  </h3>
                  <div className="aspect-[4/3] bg-gray-100 rounded-lg overflow-hidden border border-gray-200 relative group">
                    {photosByCategory[cat.key]?.[0] ? (
                      <img
                        src={photosByCategory[cat.key]![0].photo_url}
                        alt={`${cat.label} of ${getVehicleName()}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                        <Car className="w-8 h-8 mb-2 opacity-50" />
                        <span className="text-xs">No image</span>
                      </div>
                    )}
                    {photosByCategory[cat.key]?.length > 1 && (
                       <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/60 text-white text-xs rounded-md">
                         +{photosByCategory[cat.key]!.length - 1} more
                       </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* View All (Simple Carousel fallback for deep inspection if needed) */}
             {photos.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <p className="text-sm text-gray-500 mb-2">All Photos ({photos.length})</p>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {photos.map((photo, i) => (
                       <div key={photo.id || i} className="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden border border-gray-200">
                          <img src={photo.photo_url} className="w-full h-full object-cover" />
                       </div>
                    ))}
                  </div>
                </div>
             )}
          </div>

          {/* Vehicle Details */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Vehicle Details</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { label: 'Brand', value: vehicle?.brand as string | null },
                { label: 'Model', value: vehicle?.model as string | null },
                { label: 'Variant', value: vehicle?.variant as string | null },
                { label: 'Year', value: vehicle?.year as string | number | null },
                { label: 'Mileage', value: vehicle?.mileage ? `${(vehicle.mileage as number).toLocaleString()} km` : null },
                { label: 'Condition', value: vehicle?.condition as string | null },
                { label: 'Exterior Color', value: vehicle?.exterior_color as string | null },
                { label: 'Transmission', value: vehicle?.transmission as string | null },
                { label: 'Fuel Type', value: vehicle?.fuel_type as string | null },
              ].filter((item): item is { label: string; value: string | number } => item.value != null)
              .map((item) => (
                <div key={item.label} className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">{item.label}</p>
                  <p className="font-medium text-gray-900 mt-1">{String(item.value)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Description */}
          {typeof listing.description === 'string' && listing.description && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Description</h2>
              <p className="text-gray-600 whitespace-pre-wrap">{listing.description}</p>
            </div>
          )}
        </div>

        {/* Right Column - Actions & Info */}
        <div className="space-y-6">
          {/* Pricing */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Pricing</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-500">Starting Price</span>
                <span className="font-semibold text-gray-900">
                  ₱{(listing.starting_price as number)?.toLocaleString()}
                </span>
              </div>
              {typeof listing.reserve_price === 'number' && listing.reserve_price > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Reserve Price</span>
                  <span className="font-semibold text-gray-900">
                    ₱{listing.reserve_price.toLocaleString()}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Current Price</span>
                <span className="font-semibold text-purple-600">
                  ₱{(listing.current_price as number)?.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Bid Increment</span>
                <span className="font-semibold text-gray-900">
                  ₱{(listing.bid_increment as number)?.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Deposit Required</span>
                <span className="font-semibold text-gray-900">
                  ₱{(listing.deposit_amount as number)?.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Statistics</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <Gavel className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">{listing.total_bids as number}</p>
                <p className="text-xs text-gray-500">Total Bids</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <Eye className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">{listing.view_count as number}</p>
                <p className="text-xs text-gray-500">Views</p>
              </div>
            </div>
          </div>

          {/* Seller Info */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Seller Information</h2>
            <div className="flex items-center gap-3">
              {(seller?.profile_image_url as string) ? (
                <img
                  src={seller.profile_image_url as string}
                  alt="Seller"
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-purple-600" />
                </div>
              )}
              <div>
                <p className="font-medium text-gray-900">
                  {(seller?.full_name as string) || 'Unknown Seller'}
                </p>
                <p className="text-sm text-gray-500">{seller?.email as string}</p>
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Schedule</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Created</p>
                  <p className="font-medium text-gray-900">
                    {new Date(listing.created_at as string).toLocaleString('en-US', { 
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric', 
                      hour: '2-digit', 
                      minute: '2-digit',
                      timeZone: 'Asia/Manila'
                    })}
                  </p>
                </div>
              </div>
              {typeof listing.start_time === 'string' && (
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="text-xs text-gray-500">Start Time</p>
                    <p className="font-medium text-gray-900">
                      {new Date(listing.start_time).toLocaleString('en-US', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric', 
                        hour: '2-digit', 
                        minute: '2-digit',
                        timeZone: 'Asia/Manila'
                      })}
                    </p>
                  </div>
                </div>
              )}
              {typeof listing.end_time === 'string' && (
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-red-500" />
                  <div>
                    <p className="text-xs text-gray-500">End Time</p>
                    <p className="font-medium text-gray-900">
                      {new Date(listing.end_time).toLocaleString('en-US', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric', 
                        hour: '2-digit', 
                        minute: '2-digit',
                        timeZone: 'Asia/Manila'
                      })}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Admin Actions */}
          {status?.status_name === 'pending_approval' && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Admin Actions</h2>
              <div className="space-y-4">
                <textarea
                  placeholder="Review notes (optional)"
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none"
                  rows={3}
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => handleStatusChange('approved', reviewNotes)}
                    disabled={loading}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4" />
                    )}
                    Approve
                  </button>
                  <button
                    onClick={() => handleStatusChange('cancelled', reviewNotes)}
                    disabled={loading}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <XCircle className="w-4 h-4" />
                    )}
                    Reject
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
