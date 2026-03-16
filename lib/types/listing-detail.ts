// Complete type definitions for Admin Listing Review UI
// Based on specification document with all 56 photo categories and complete field reference

export interface ListingDetailModel {
  // Section 1: Listing Metadata
  id: string
  seller_id: string
  status: AuctionStatusName
  admin_status: AdminStatus | null
  rejection_reason: string | null
  reviewed_at: string | null
  reviewed_by: string | null
  made_live_at: string | null
  created_at: string
  updated_at: string

  // Section 2: Photos & Media
  cover_photo_url: string | null
  photo_urls: PhotoUrlsMap | null  // JSONB with 56 categories
  deed_of_sale_url: string | null

  // Section 3: Basic Vehicle Information
  brand: string | null
  model: string | null
  variant: string | null
  body_type: string | null
  year: number | null

  // Section 4: Mechanical Specification
  engine_type: string | null
  engine_displacement: number | null // Liters
  cylinder_count: number | null
  horsepower: number | null
  torque: number | null // Nm
  transmission: string | null
  fuel_type: string | null
  drive_type: string | null

  // Section 5: Dimensions & Capacity
  length: number | null // mm
  width: number | null // mm
  height: number | null // mm
  wheelbase: number | null // mm
  ground_clearance: number | null // mm
  seating_capacity: number | null
  door_count: number | null
  fuel_tank_capacity: number | null // Liters
  curb_weight: number | null // kg
  gross_weight: number | null // kg

  // Section 6: Exterior Details
  exterior_color: string | null
  paint_type: string | null
  rim_type: string | null
  rim_size: string | null
  tire_size: string | null
  tire_brand: string | null

  // Section 7: Condition & History
  condition: string | null
  mileage: number | null // km
  previous_owners: number | null
  usage_type: string | null
  has_modifications: boolean | null
  modifications_details: string | null
  has_warranty: boolean | null
  warranty_details: string | null

  // Section 8: Documentation & Location
  plate_number: string | null
  orcr_status: string | null
  registration_status: string | null
  registration_expiry: string | null // Date
  province: string | null
  city_municipality: string | null
  barangay: string | null

  // Section 9: Listing Description & Features
  description: string | null
  known_issues: string | null
  features: string[] | null

  // Section 10: Auction & Pricing Configuration
  starting_price: number
  reserve_price: number | null
  current_bid: number
  sold_price: number | null
  bidding_type: 'public' | 'private'
  visibility: string | null
  bid_increment: number
  min_bid_increment: number | null
  deposit_amount: number
  enable_incremental_bidding: boolean | null
  auto_live_after_approval: boolean | null
  allows_installment: boolean | null
  snipe_guard_enabled: boolean | null
  snipe_guard_threshold_seconds: number | null
  snipe_guard_extend_seconds: number | null
  auction_start_time: string | null
  auction_end_time: string | null

  // Section 11: Auction Activity
  total_bids: number
  watchers_count: number
  views_count: number
  winner_id: string | null
  winner_name: string | null

  // Section 12: Transaction & Cancellation
  transaction_id: string | null
  cancellation_reason: string | null
  sold_at: string | null

  // Relations
  seller?: SellerInfo
  auction_statuses?: { status_name: string; display_name: string }
}

export type AdminStatus = 'pending' | 'approved' | 'rejected'

export type AuctionStatusName = 
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'rejected'
  | 'scheduled'
  | 'live'
  | 'ended'
  | 'cancelled'
  | 'in_transaction'
  | 'sold'
  | 'deal_failed'

export interface SellerInfo {
  id: string
  full_name: string | null
  email: string
  profile_image_url: string | null
}

// Photo URLs JSONB structure with 56 categories
export interface PhotoUrlsMap {
  // Exterior (20 categories)
  front_view?: string[]
  rear_view?: string[]
  left_side?: string[]
  right_side?: string[]
  front_left_angle?: string[]
  front_right_angle?: string[]
  rear_left_angle?: string[]
  rear_right_angle?: string[]
  roof?: string[]
  undercarriage?: string[]
  front_bumper?: string[]
  rear_bumper?: string[]
  left_fender?: string[]
  right_fender?: string[]
  hood?: string[]
  trunk_tailgate?: string[]
  fuel_door?: string[]
  side_mirrors?: string[]
  door_handles?: string[]
  exterior_lights?: string[]

  // Interior (15 categories)
  dashboard?: string[]
  steering_wheel?: string[]
  center_console?: string[]
  front_seats?: string[]
  rear_seats?: string[]
  headliner?: string[]
  door_panels?: string[]
  carpet_floor_mats?: string[]
  trunk_interior?: string[]
  glove_box?: string[]
  sun_visors?: string[]
  instrument_cluster?: string[]
  infotainment_screen?: string[]
  climate_controls?: string[]
  interior_lights?: string[]

  // Engine & Mechanical (12 categories)
  engine_bay_overview?: string[]
  engine_block?: string[]
  battery?: string[]
  fluid_reservoirs?: string[]
  air_filter?: string[]
  alternator?: string[]
  belts_hoses?: string[]
  suspension?: string[]
  brakes_front?: string[]
  brakes_rear?: string[]
  exhaust_system?: string[]
  transmission?: string[]

  // Wheels & Tires (4 categories)
  front_left_wheel?: string[]
  front_right_wheel?: string[]
  rear_left_wheel?: string[]
  rear_right_wheel?: string[]

  // Documents (5 categories)
  or_cr?: string[]
  registration_papers?: string[]
  insurance?: string[]
  maintenance_records?: string[]
  inspection_report?: string[]
}

// Photo category definitions for UI display
export const PHOTO_CATEGORIES = {
  exterior: [
    { key: 'front_view', label: 'Front View' },
    { key: 'rear_view', label: 'Rear View' },
    { key: 'left_side', label: 'Left Side' },
    { key: 'right_side', label: 'Right Side' },
    { key: 'front_left_angle', label: 'Front Left Angle' },
    { key: 'front_right_angle', label: 'Front Right Angle' },
    { key: 'rear_left_angle', label: 'Rear Left Angle' },
    { key: 'rear_right_angle', label: 'Rear Right Angle' },
    { key: 'roof', label: 'Roof' },
    { key: 'undercarriage', label: 'Undercarriage' },
    { key: 'front_bumper', label: 'Front Bumper' },
    { key: 'rear_bumper', label: 'Rear Bumper' },
    { key: 'left_fender', label: 'Left Fender' },
    { key: 'right_fender', label: 'Right Fender' },
    { key: 'hood', label: 'Hood' },
    { key: 'trunk_tailgate', label: 'Trunk/Tailgate' },
    { key: 'fuel_door', label: 'Fuel Door' },
    { key: 'side_mirrors', label: 'Side Mirrors' },
    { key: 'door_handles', label: 'Door Handles' },
    { key: 'exterior_lights', label: 'Exterior Lights' },
  ],
  interior: [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'steering_wheel', label: 'Steering Wheel' },
    { key: 'center_console', label: 'Center Console' },
    { key: 'front_seats', label: 'Front Seats' },
    { key: 'rear_seats', label: 'Rear Seats' },
    { key: 'headliner', label: 'Headliner' },
    { key: 'door_panels', label: 'Door Panels' },
    { key: 'carpet_floor_mats', label: 'Carpet/Floor Mats' },
    { key: 'trunk_interior', label: 'Trunk Interior' },
    { key: 'glove_box', label: 'Glove Box' },
    { key: 'sun_visors', label: 'Sun Visors' },
    { key: 'instrument_cluster', label: 'Instrument Cluster' },
    { key: 'infotainment_screen', label: 'Infotainment Screen' },
    { key: 'climate_controls', label: 'Climate Controls' },
    { key: 'interior_lights', label: 'Interior Lights' },
  ],
  mechanical: [
    { key: 'engine_bay_overview', label: 'Engine Bay Overview' },
    { key: 'engine_block', label: 'Engine Block' },
    { key: 'battery', label: 'Battery' },
    { key: 'fluid_reservoirs', label: 'Fluid Reservoirs' },
    { key: 'air_filter', label: 'Air Filter' },
    { key: 'alternator', label: 'Alternator' },
    { key: 'belts_hoses', label: 'Belts & Hoses' },
    { key: 'suspension', label: 'Suspension' },
    { key: 'brakes_front', label: 'Brakes Front' },
    { key: 'brakes_rear', label: 'Brakes Rear' },
    { key: 'exhaust_system', label: 'Exhaust System' },
    { key: 'transmission', label: 'Transmission' },
  ],
  wheels: [
    { key: 'front_left_wheel', label: 'Front Left Wheel' },
    { key: 'front_right_wheel', label: 'Front Right Wheel' },
    { key: 'rear_left_wheel', label: 'Rear Left Wheel' },
    { key: 'rear_right_wheel', label: 'Rear Right Wheel' },
  ],
  documents: [
    { key: 'or_cr', label: 'OR/CR' },
    { key: 'registration_papers', label: 'Registration Papers' },
    { key: 'insurance', label: 'Insurance' },
    { key: 'maintenance_records', label: 'Maintenance Records' },
    { key: 'inspection_report', label: 'Inspection Report' },
  ],
} as const

export const PHOTO_CATEGORY_GROUPS = [
  { name: 'Exterior', key: 'exterior', count: 20 },
  { name: 'Interior', key: 'interior', count: 15 },
  { name: 'Engine & Mechanical', key: 'mechanical', count: 12 },
  { name: 'Wheels & Tires', key: 'wheels', count: 4 },
  { name: 'Documents', key: 'documents', count: 5 },
] as const
