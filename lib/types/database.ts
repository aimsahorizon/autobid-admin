// Database types for AutoBid Admin

export interface User {
  id: string
  email: string
  full_name: string | null
  profile_image_url: string | null
  role_id: string | null
  is_verified: boolean
  is_active: boolean
  last_login_at: string | null
  created_at: string
  updated_at: string
  user_roles?: UserRole
  kyc_documents?: KycDocument[]
}

export interface UserRole {
  id: string
  role_name: 'buyer' | 'seller' | 'both'
  display_name: string
}

export interface AdminUser {
  id: string
  user_id: string
  role_id: string
  is_active: boolean
  created_at: string
  admin_roles?: AdminRole
  users?: User
}

export interface AdminRole {
  id: string
  role_name: 'super_admin' | 'moderator'
  display_name: string
}

export interface KycDocument {
  id: string
  user_id: string
  status_id: string
  selfie_url: string | null
  document_type: 'national_id' | 'passport' | 'drivers_license'
  submitted_at: string | null
  reviewed_at: string | null
  rejection_reason: string | null
  created_at: string
  kyc_statuses?: KycStatus
  users?: User
}

export interface KycStatus {
  id: string
  status_name: 'pending' | 'under_review' | 'approved' | 'rejected' | 'expired'
  display_name: string
}

export interface Auction {
  id: string
  seller_id: string
  category_id: string | null
  status_id: string
  title: string
  description: string | null
  starting_price: number
  reserve_price: number | null
  current_price: number
  bid_increment: number
  deposit_amount: number
  start_time: string | null
  end_time: string | null
  total_bids: number
  view_count: number
  is_featured: boolean
  created_at: string
  updated_at: string
  auction_statuses?: AuctionStatus
  auction_categories?: AuctionCategory
  auction_vehicles?: AuctionVehicle
  auction_photos?: AuctionPhoto[]
  users?: User
}

export interface AuctionStatus {
  id: string
  status_name: 'draft' | 'pending_approval' | 'scheduled' | 'live' | 'ended' | 'cancelled' | 'sold' | 'unsold'
  display_name: string
}

export interface AuctionCategory {
  id: string
  category_name: string
  display_name: string
  is_active: boolean
}

export interface AuctionVehicle {
  auction_id: string
  brand: string | null
  model: string | null
  variant: string | null
  year: number | null
  mileage: number | null
  condition: string | null
  exterior_color: string | null
  transmission: string | null
  fuel_type: string | null
}

export interface AuctionPhoto {
  id: string
  auction_id: string
  photo_url: string
  category: string
  display_order: number
  is_primary: boolean
}

export interface Bid {
  id: string
  auction_id: string
  bidder_id: string
  status_id: string
  bid_amount: number
  is_auto_bid: boolean
  created_at: string
  bid_statuses?: BidStatus
  users?: User
  auctions?: Auction
}

export interface BidStatus {
  id: string
  status_name: 'active' | 'outbid' | 'winning' | 'won' | 'lost' | 'refunded'
  display_name: string
}

export interface Transaction {
  id: string
  user_id: string
  auction_id: string | null
  type_id: string
  status_id: string
  amount: number
  currency: string
  payment_method_id: string | null
  external_transaction_id: string | null
  created_at: string
  transaction_types?: TransactionType
  transaction_statuses?: TransactionStatus
  users?: User
  auctions?: Auction
}

export interface TransactionType {
  id: string
  type_name: 'deposit' | 'bid' | 'payment' | 'refund' | 'withdrawal' | 'seller_payout'
  display_name: string
}

export interface TransactionStatus {
  id: string
  status_name: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'refunded'
  display_name: string
}

export interface AuctionTransaction {
  id: string
  auction_id: string
  seller_id: string
  buyer_id: string
  agreed_price: number
  status: 'in_transaction' | 'sold' | 'deal_failed'
  seller_form_submitted: boolean
  buyer_form_submitted: boolean
  seller_confirmed: boolean
  buyer_confirmed: boolean
  admin_approved: boolean
  created_at: string
  completed_at: string | null
  auctions?: Auction
  seller?: User
  buyer?: User
}

export interface AdminStats {
  totalUsers: number
  activeAuctions: number
  pendingListings: number
  totalListings: number
  pendingKyc: number
  pendingTransactions: number
  todaySubmissions: number
  totalRevenue: number
}

export interface VehicleBrand {
  id: string
  name: string
  logo_url: string | null
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export interface VehicleModel {
  id: string
  brand_id: string
  name: string
  body_type: string
  is_active: boolean
  created_at?: string
  updated_at?: string
  vehicle_brands?: VehicleBrand
}

export interface VehicleVariant {
  id: string
  model_id: string
  name: string
  transmission: string
  fuel_type: string
  is_active: boolean
  created_at?: string
  updated_at?: string
  vehicle_models?: VehicleModel
}
