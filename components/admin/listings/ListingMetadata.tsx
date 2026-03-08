'use client'

import { Copy, User, Calendar, Clock } from 'lucide-react'
import StatusBadge from '@/components/ui/StatusBadge'
import { ListingDetailModel } from '@/lib/types/listing-detail'

interface ListingMetadataProps {
  listing: ListingDetailModel
}

export default function ListingMetadata({ listing }: ListingMetadataProps) {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

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

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Listing ID */}
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Listing ID</p>
          <div className="flex items-center gap-2">
            <code className="text-sm font-mono text-gray-900 truncate">{listing.id.slice(0, 8)}</code>
            <button
              onClick={() => copyToClipboard(listing.id)}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              title="Copy full ID"
            >
              <Copy className="w-3.5 h-3.5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Seller ID */}
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Seller ID</p>
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-gray-400" />
            <a
              href={`/admin/users/${listing.seller_id}`}
              className="text-sm text-purple-600 hover:underline font-medium truncate"
            >
              {listing.seller?.full_name || listing.seller_id.slice(0, 8)}
            </a>
          </div>
        </div>

        {/* Status */}
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Status</p>
          <StatusBadge status={listing.status} />
        </div>

        {/* Admin Status */}
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Admin Status</p>
          {listing.admin_status ? (
            <span
              className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${
                listing.admin_status === 'approved'
                  ? 'bg-green-100 text-green-700'
                  : listing.admin_status === 'rejected'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-yellow-100 text-yellow-700'
              }`}
            >
              {listing.admin_status.charAt(0).toUpperCase() + listing.admin_status.slice(1)}
            </span>
          ) : (
            <span className="text-sm text-gray-400">—</span>
          )}
        </div>

        {/* Rejection Reason (conditional) */}
        {listing.admin_status === 'rejected' && listing.rejection_reason && (
          <div className="md:col-span-2">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Rejection Reason</p>
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-700">{listing.rejection_reason}</p>
            </div>
          </div>
        )}

        {/* Reviewed At */}
        {listing.reviewed_at && (
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Reviewed At</p>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-900">{formatDateTime(listing.reviewed_at)}</span>
            </div>
          </div>
        )}

        {/* Reviewed By */}
        {listing.reviewed_by && (
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Reviewed By</p>
            <a
              href={`/admin/settings?tab=admins&admin=${listing.reviewed_by}`}
              className="text-sm text-purple-600 hover:underline font-medium"
            >
              Admin Profile
            </a>
          </div>
        )}

        {/* Made Live At */}
        {listing.made_live_at && (
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Made Live At</p>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-green-500" />
              <span className="text-sm text-gray-900">{formatDateTime(listing.made_live_at)}</span>
            </div>
          </div>
        )}

        {/* Created At */}
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Created At</p>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-900">{formatDateTime(listing.created_at)}</span>
          </div>
        </div>

        {/* Updated At */}
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Updated At</p>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-900">{formatDateTime(listing.updated_at)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
