'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft, FileDown } from 'lucide-react'
import { ListingDetailModel, AdminStatus } from '@/lib/types/listing-detail'
import PhotoGallery from '@/components/admin/listings/PhotoGallery'
import ListingMetadata from '@/components/admin/listings/ListingMetadata'
import VehicleInfoSections from '@/components/admin/listings/VehicleInfoSections'
import AuctionInfoSections from '@/components/admin/listings/AuctionInfoSections'
import AdminActionPanel from '@/components/admin/listings/AdminActionPanel'

interface ListingDetailClientProps {
  listing: Record<string, unknown>
  adminUserId: string | null
}

export default function ListingDetailClient({ listing: rawListing, adminUserId }: ListingDetailClientProps) {
  const router = useRouter()

  // Transform raw listing data to ListingDetailModel
  // Map auction data + auction_vehicles data + computed fields
  const vehicle = (rawListing.auction_vehicles as Record<string, unknown>) || {}
  const seller = (rawListing.users as Record<string, unknown>) || {}
  const status = rawListing.auction_statuses as { status_name: string; display_name: string }

  const listing: ListingDetailModel = {
    // Section 1: Listing Metadata
    id: String(rawListing.id),
    seller_id: String(rawListing.seller_id),
    status: (status?.status_name || 'draft') as ListingDetailModel['status'],
    admin_status: status?.status_name === 'rejected' ? 'rejected' : (status?.status_name === 'scheduled' || status?.status_name === 'live' || status?.status_name === 'approved') ? 'approved' : 'pending' as AdminStatus,
    rejection_reason: (rawListing.rejection_reason as string | null) || (rawListing.review_notes as string | null),
    reviewed_at: rawListing.reviewed_at as string | null,
    reviewed_by: rawListing.reviewed_by as string | null,
    made_live_at: null, // Would need to be added to DB
    created_at: String(rawListing.created_at),
    updated_at: String(rawListing.updated_at),

    // Section 2: Photos & Media
    cover_photo_url: null, // Would need to be added or use first photo
    photo_urls: null, // JSONB structure - would need migration
    deed_of_sale_url: (vehicle.deed_of_sale_url as string | null) || (rawListing.deed_of_sale_url as string | null),

    // Section 3: Basic Vehicle Information (from auction_vehicles)
    brand: vehicle.brand as string | null,
    model: vehicle.model as string | null,
    variant: vehicle.variant as string | null,
    body_type: null, // Would need to be added to auction_vehicles
    year: vehicle.year as number | null,

    // Section 4: Mechanical Specification
    engine_type: vehicle.engine_type as string | null,
    engine_displacement: vehicle.engine_displacement as number | null,
    cylinder_count: vehicle.cylinder_count as number | null,
    horsepower: vehicle.horsepower as number | null,
    torque: vehicle.torque as number | null,
    transmission: vehicle.transmission as string | null,
    fuel_type: vehicle.fuel_type as string | null,
    drive_type: vehicle.drive_type as string | null,

    // Section 5: Dimensions & Capacity
    length: vehicle.length as number | null,
    width: vehicle.width as number | null,
    height: vehicle.height as number | null,
    wheelbase: vehicle.wheelbase as number | null,
    ground_clearance: vehicle.ground_clearance as number | null,
    seating_capacity: vehicle.seating_capacity as number | null,
    door_count: vehicle.door_count as number | null,
    fuel_tank_capacity: vehicle.fuel_tank_capacity as number | null,
    curb_weight: vehicle.curb_weight as number | null,
    gross_weight: vehicle.gross_weight as number | null,

    // Section 6: Exterior Details
    exterior_color: vehicle.exterior_color as string | null,
    paint_type: vehicle.paint_type as string | null,
    rim_type: vehicle.rim_type as string | null,
    rim_size: vehicle.rim_size as string | null,
    tire_size: vehicle.tire_size as string | null,
    tire_brand: vehicle.tire_brand as string | null,

    // Section 7: Condition & History
    condition: vehicle.condition as string | null,
    mileage: vehicle.mileage as number | null,
    previous_owners: vehicle.previous_owners as number | null,
    usage_type: vehicle.usage_type as string | null,
    has_modifications: vehicle.has_modifications as boolean | null,
    modifications_details: vehicle.modifications_details as string | null,
    has_warranty: vehicle.has_warranty as boolean | null,
    warranty_details: vehicle.warranty_details as string | null,

    // Section 8: Documentation & Location
    plate_number: vehicle.plate_number as string | null,
    orcr_status: vehicle.orcr_status as string | null,
    registration_status: vehicle.registration_status as string | null,
    registration_expiry: vehicle.registration_expiry as string | null,
    province: vehicle.province as string | null,
    city_municipality: vehicle.city_municipality as string | null,
    barangay: null, // Would need to be added to auction_vehicles

    // Section 9: Listing Description & Features
    description: rawListing.description as string | null,
    known_issues: vehicle.known_issues as string | null,
    features: vehicle.features as string[] | null,

    // Section 10: Auction & Pricing Configuration
    starting_price: Number(rawListing.starting_price || 0),
    reserve_price: rawListing.reserve_price as number | null,
    current_bid: Number(rawListing.current_price || 0),
    sold_price: null, // Would need to be added
    bidding_type: (rawListing.bidding_type as 'public' | 'private') || 'public',
    visibility: null,
    bid_increment: Number(rawListing.bid_increment || 0),
    min_bid_increment: rawListing.min_bid_increment as number | null,
    deposit_amount: Number(rawListing.deposit_amount || 0),
    enable_incremental_bidding: rawListing.enable_incremental_bidding as boolean | null,
    auto_live_after_approval: rawListing.auto_live_after_approval as boolean | null,
    schedule_live_mode: (rawListing.schedule_live_mode as string | null) as 'auto_live' | 'auto_schedule' | 'manual' | null,
    allows_installment: null, // Would need to be added
    snipe_guard_enabled: null, // Would need to be added
    snipe_guard_threshold_seconds: null, // Would need to be added
    snipe_guard_extend_seconds: null, // Would need to be added
    auction_start_time: rawListing.start_time as string | null,
    auction_end_time: rawListing.end_time as string | null,

    // Section 11: Auction Activity
    total_bids: Number(rawListing.total_bids || 0),
    watchers_count: Number(rawListing.watchers_count || 0),
    views_count: Number(rawListing.views_count || 0),
    winner_id: rawListing.winner_id as string | null,
    winner_name: rawListing.winner_name as string | null,

    // Section 12: Transaction & Cancellation
    transaction_id: null, // Would need to be added
    cancellation_reason: null, // Would need to be added
    sold_at: null, // Would need to be added

    // Relations
    seller: {
      id: String(seller.id || rawListing.seller_id),
      full_name: seller.full_name as string | null,
      email: String(seller.email),
      profile_image_url: seller.profile_image_url as string | null,
    },
    auction_statuses: status
  }

  // Get vehicle name for display
  const getVehicleName = (): string => {
    if (listing.year && listing.brand && listing.model) {
      const variant = listing.variant ? ` ${listing.variant}` : ''
      return `${listing.year} ${listing.brand} ${listing.model}${variant}`
    }
    return (rawListing.title as string) || 'Untitled Listing'
  }

  // Convert auction_photos to photo_urls structure for PhotoGallery
  const photos = (rawListing.auction_photos as Array<{ photo_url: string; category: string }>) || []
  const photoUrls: Record<string, string[]> = {}
  photos.forEach(photo => {
    const category = photo.category || 'other'
    if (!photoUrls[category]) photoUrls[category] = []
    photoUrls[category].push(photo.photo_url)
  })

  const vehicleName = getVehicleName()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-[1600px] mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back to Listings</span>
            </button>
            {listing.deed_of_sale_url && (
              <a
                href={listing.deed_of_sale_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-lg font-medium transition-colors"
              >
                <FileDown className="w-4 h-4" />
                Download Deed of Sale
              </a>
            )}
          </div>
          <h1 className="text-3xl font-bold text-gray-900">{vehicleName}</h1>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-6 py-8 space-y-8">
        {/* Section 1: Listing Metadata */}
        <ListingMetadata listing={listing} />

        {/* Section 2: Photos & Media */}
        <PhotoGallery 
          photoUrls={photoUrls} 
          coverPhotoUrl={listing.cover_photo_url}
          vehicleName={vehicleName}
        />

        {/* Two-Column Layout for Vehicle Info and Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Vehicle Information (Sections 3-9) */}
          <div className="lg:col-span-2">
            <VehicleInfoSections listing={listing} />
          </div>

          {/* Right: Admin Actions */}
          <div>
            <AdminActionPanel listing={listing} adminUserId={adminUserId} />
          </div>
        </div>

        {/* Full-Width: Auction Configuration & Activity (Sections 10-12) */}
        <AuctionInfoSections listing={listing} />
      </div>
    </div>
  )
}
