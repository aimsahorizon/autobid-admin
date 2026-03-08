'use client'

import { ListingDetailModel } from '@/lib/types/listing-detail'
import { DollarSign, Gavel, Eye, Shield, Calendar, TrendingUp } from 'lucide-react'

interface AuctionInfoSectionsProps {
  listing: ListingDetailModel
}

export default function AuctionInfoSections({ listing }: AuctionInfoSectionsProps) {
  const formatPrice = (price: number | null) => 
    price !== null ? `₱${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return '—'
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Manila'
    })
  }

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '—'
    const minutes = Math.floor(seconds / 60)
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`
  }

  const isReserveMet = listing.reserve_price !== null && listing.current_bid >= listing.reserve_price

  return (
    <div className="space-y-6">
      {/* Auction Configuration */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-gray-400" />
          Auction Configuration
        </h2>

        {/* Pricing */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Pricing</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <PriceCard label="Starting Price" value={formatPrice(listing.starting_price)} highlight />
            <PriceCard 
              label="Reserve Price" 
              value={listing.reserve_price !== null ? formatPrice(listing.reserve_price) : 'No reserve'}
              adminOnly
            />
            <PriceCard 
              label="Current Bid" 
              value={listing.current_bid > 0 ? formatPrice(listing.current_bid) : 'No bids'}
              purple
            />
            {listing.sold_price !== null && (
              <PriceCard label="Sold Price" value={formatPrice(listing.sold_price)} success />
            )}
          </div>

          {listing.reserve_price !== null && (
            <div className="mt-4">
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold ${
                isReserveMet 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-red-100 text-red-700'
              }`}>
                {isReserveMet ? '✓ Reserve Met' : '✗ Reserve Not Met'}
              </div>
            </div>
          )}
        </div>

        {/* Bidding Configuration */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Bidding Configuration</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <ConfigField label="Bidding Type">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full ${
                listing.bidding_type === 'public' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'bg-orange-100 text-orange-700'
              }`}>
                {listing.bidding_type === 'private' && '🔒'}
                {listing.bidding_type.toUpperCase()}
              </span>
            </ConfigField>
            
            <ConfigField label="Visibility">
              <span className="text-sm font-medium text-gray-900">
                {listing.visibility || listing.bidding_type || '—'}
              </span>
            </ConfigField>
            
            <ConfigField label="Bid Increment">
              <span className="text-sm font-medium text-gray-900">
                {formatPrice(listing.bid_increment)}
              </span>
            </ConfigField>
            
            <ConfigField label="Min Bid Increment">
              <span className="text-sm font-medium text-gray-900">
                {formatPrice(listing.min_bid_increment || listing.bid_increment)}
              </span>
            </ConfigField>
            
            <ConfigField label="Deposit Amount">
              <span className="text-sm font-medium text-gray-900">
                {listing.deposit_amount > 0 ? formatPrice(listing.deposit_amount) : 'No deposit'}
              </span>
            </ConfigField>
            
            <ConfigField label="Incremental Bidding">
              <ToggleIndicator enabled={listing.enable_incremental_bidding ?? true} />
            </ConfigField>
            
            <ConfigField label="Auto Live After Approval">
              <ToggleIndicator enabled={listing.auto_live_after_approval ?? false} />
            </ConfigField>
            
            <ConfigField label="Allows Installment">
              <ToggleIndicator enabled={listing.allows_installment ?? false} />
            </ConfigField>
          </div>
        </div>

        {/* Snipe Guard */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
            <Shield className="w-4 h-4 text-gray-500" />
            Snipe Guard
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <ConfigField label="Snipe Guard">
              <ToggleIndicator enabled={listing.snipe_guard_enabled ?? false} />
            </ConfigField>
            
            {listing.snipe_guard_enabled && (
              <>
                <ConfigField label="Threshold">
                  <span className="text-sm font-medium text-gray-900">
                    {formatDuration(listing.snipe_guard_threshold_seconds)}
                  </span>
                </ConfigField>
                
                <ConfigField label="Extension">
                  <span className="text-sm font-medium text-gray-900">
                    {formatDuration(listing.snipe_guard_extend_seconds)}
                  </span>
                </ConfigField>
              </>
            )}
          </div>
        </div>

        {/* Auction Timing */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            Auction Timing
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <ConfigField label="Auction Start Time">
              <span className="text-sm font-medium text-gray-900">
                {formatDateTime(listing.auction_start_time)}
              </span>
            </ConfigField>
            
            <ConfigField label="Auction End Time">
              <span className="text-sm font-medium text-gray-900">
                {formatDateTime(listing.auction_end_time)}
              </span>
            </ConfigField>
          </div>
        </div>
      </div>

      {/* Auction Activity */}
      {(listing.status === 'live' || listing.status === 'ended' || listing.status === 'sold') && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-gray-400" />
            Auction Activity
          </h2>

          <div className="grid grid-cols-3 gap-6">
            <ActivityStat 
              icon={<Gavel className="w-6 h-6 text-purple-600" />}
              value={listing.total_bids}
              label="Total Bids"
              color="purple"
            />
            
            <ActivityStat 
              icon={<Eye className="w-6 h-6 text-blue-600" />}
              value={listing.watchers_count}
              label="Watchers"
              color="blue"
            />
            
            <ActivityStat 
              icon={<Eye className="w-6 h-6 text-gray-600" />}
              value={listing.views_count}
              label="Views"
              color="gray"
            />
          </div>

          {listing.winner_id && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Winner Information</h3>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <Gavel className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <a
                    href={`/admin/users/${listing.winner_id}`}
                    className="text-sm font-medium text-purple-600 hover:underline"
                  >
                    {listing.winner_name || 'View Winner Profile'}
                  </a>
                  <p className="text-xs text-gray-500">Winning Bidder</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Transaction & Cancellation */}
      {(listing.transaction_id || listing.cancellation_reason || listing.sold_at) && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Transaction Information</h2>

          {listing.transaction_id && (
            <div className="mb-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Transaction ID</p>
              <a
                href={`/admin/transactions?id=${listing.transaction_id}`}
                className="text-sm font-medium text-purple-600 hover:underline"
              >
                View Transaction Details →
              </a>
            </div>
          )}

          {listing.sold_at && (
            <div className="mb-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Sold At</p>
              <p className="text-sm font-medium text-gray-900">{formatDateTime(listing.sold_at)}</p>
            </div>
          )}

          {listing.cancellation_reason && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-xs font-medium text-red-700 mb-1">Cancellation Reason:</p>
              <p className="text-sm text-red-900 whitespace-pre-wrap">{listing.cancellation_reason}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function PriceCard({ 
  label, 
  value, 
  highlight, 
  purple, 
  success, 
  adminOnly 
}: { 
  label: string
  value: string
  highlight?: boolean
  purple?: boolean
  success?: boolean
  adminOnly?: boolean
}) {
  return (
    <div className={`rounded-lg p-4 ${
      highlight ? 'bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200' :
      purple ? 'bg-purple-50 border border-purple-200' :
      success ? 'bg-green-50 border border-green-200' :
      'bg-gray-50 border border-gray-200'
    }`}>
      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
        {label} {adminOnly && <span className="text-orange-600">(Admin Only)</span>}
      </p>
      <p className={`text-lg font-bold ${
        highlight ? 'text-purple-700' :
        purple ? 'text-purple-600' :
        success ? 'text-green-700' :
        'text-gray-900'
      }`}>
        {value}
      </p>
    </div>
  )
}

function ConfigField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="bg-gray-50 rounded-lg p-3">
      <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">{label}</p>
      {children}
    </div>
  )
}

function ToggleIndicator({ enabled }: { enabled: boolean }) {
  return (
    <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${
      enabled ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'
    }`}>
      {enabled ? 'Enabled' : 'Disabled'}
    </span>
  )
}

function ActivityStat({ 
  icon, 
  value, 
  label, 
  color 
}: { 
  icon: React.ReactNode
  value: number
  label: string
  color: string
}) {
  return (
    <div className={`text-center p-4 bg-${color}-50 rounded-lg border border-${color}-200`}>
      <div className="flex justify-center mb-2">{icon}</div>
      <p className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</p>
      <p className="text-xs text-gray-500 uppercase tracking-wide mt-1">{label}</p>
    </div>
  )
}
