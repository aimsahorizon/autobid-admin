'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle, XCircle, Power, FileText, History } from 'lucide-react'
import { ListingDetailModel } from '@/lib/types/listing-detail'
import Modal from '@/components/ui/Modal'

interface AdminActionPanelProps {
  listing: ListingDetailModel
  adminUserId: string | null
}

export default function AdminActionPanel({ listing, adminUserId }: AdminActionPanelProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalType, setModalType] = useState<'approve' | 'reject' | null>(null)
  const [reason, setReason] = useState('')

  const openModal = (type: 'approve' | 'reject') => {
    setModalType(type)
    setModalOpen(true)
    setReason('')
  }

  const closeModal = () => {
    setModalOpen(false)
    setModalType(null)
    setReason('')
  }

  const handleAction = async () => {
    if (!modalType) return

    // Validate rejection reason
    if (modalType === 'reject' && !reason.trim()) {
      alert('Please provide a reason for rejection.')
      return
    }

    setLoading(true)
    const supabase = createClient()

    try {
      if (modalType === 'approve') {
        // Determine correct status based on seller's configuration:
        // 1. auto_live_after_approval = true → go live immediately
        // 2. future start_time is set → scheduled (will go live at that time)
        // 3. otherwise → approved (seller decides when to go live)
        let newStatus: string
        const updateFields: Record<string, unknown> = {
          reviewed_at: new Date().toISOString(),
          reviewed_by: adminUserId,
          review_notes: reason || 'Approved by admin',
        }

        if (listing.auto_live_after_approval) {
          newStatus = 'live'
          const now = new Date()
          // Use seller's configured duration (end - start), or fall back to their end_time if still valid
          if (listing.auction_start_time && listing.auction_end_time) {
            const sellerStart = new Date(listing.auction_start_time)
            const sellerEnd = new Date(listing.auction_end_time)
            const durationMs = sellerEnd.getTime() - sellerStart.getTime()
            if (durationMs > 0) {
              // Preserve the seller's intended duration, starting from now
              updateFields.start_time = now.toISOString()
              updateFields.end_time = new Date(now.getTime() + durationMs).toISOString()
            } else {
              // Invalid duration, just use the seller's end_time if it's in the future
              updateFields.start_time = now.toISOString()
              updateFields.end_time = sellerEnd > now ? sellerEnd.toISOString() : new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()
            }
          } else if (listing.auction_end_time && new Date(listing.auction_end_time) > now) {
            // No start time but valid end time
            updateFields.start_time = now.toISOString()
          } else {
            // No valid times at all, fallback to 7 days
            updateFields.start_time = now.toISOString()
            updateFields.end_time = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()
          }
        } else if (listing.auction_start_time && new Date(listing.auction_start_time) > new Date()) {
          // Seller set a future start time → schedule it
          newStatus = 'scheduled'
        } else {
          // No auto-live, no future schedule → approved, seller decides
          newStatus = 'approved'
        }

        const { data: statusData } = await supabase
          .from('auction_statuses')
          .select('id')
          .eq('status_name', newStatus)
          .single()

        updateFields.status_id = statusData?.id

        await supabase
          .from('auctions')
          .update(updateFields)
          .eq('id', listing.id)

        // Log moderation action
        if (adminUserId) {
          await supabase.from('auction_moderation').insert({
            auction_id: listing.id,
            moderator_id: adminUserId,
            action: 'approve',
            notes: reason || `Approved → ${newStatus}`
          })
        }
      } else if (modalType === 'reject') {
        const rejectedStatusId = (await supabase.from('auction_statuses').select('id').eq('status_name', 'rejected').single()).data?.id

        await supabase
          .from('auctions')
          .update({
            status_id: rejectedStatusId,
            rejection_reason: reason,
            reviewed_at: new Date().toISOString(),
            reviewed_by: adminUserId,
            review_notes: reason
          })
          .eq('id', listing.id)

        if (adminUserId) {
          await supabase.from('auction_moderation').insert({
            auction_id: listing.id,
            moderator_id: adminUserId,
            action: 'reject',
            reason: reason,
            notes: reason
          })
        }
      }

      router.refresh()
      closeModal()
    } catch (error) {
      console.error('Error performing admin action:', error)
      alert('Failed to complete action. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const isPending = listing.status === 'pending_approval'
  const isApproved = listing.status === 'scheduled' || listing.status === 'live'
  const canMakeLive = listing.status === 'scheduled'

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 p-6 sticky top-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Admin Actions</h2>

        <div className="space-y-3">
          {/* Pending Listing Actions */}
          {isPending && (
            <>
              <button
                onClick={() => openModal('approve')}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCircle className="w-5 h-5" />
                Approve Listing
              </button>

              <button
                onClick={() => openModal('reject')}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <XCircle className="w-5 h-5" />
                Reject Listing
              </button>
            </>
          )}

          {/* Approved/Scheduled Listing Actions */}
          {isApproved && canMakeLive && (
            <button
              onClick={() => {/* Implement make live */}}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Power className="w-5 h-5" />
              Make Live Now
            </button>
          )}



          {/* Common Actions */}
          <div className="pt-4 border-t border-gray-200 space-y-3">
            <a
              href={`/admin/users/${listing.seller_id}`}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
            >
              View Seller Profile
            </a>

            <a
              href={`/admin/auctions/${listing.id}/bids`}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
            >
              <FileText className="w-4 h-4" />
              View Bid History
            </a>

            <button
              onClick={() => {/* Implement audit log */}}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
            >
              <History className="w-4 h-4" />
              Audit Log
            </button>
          </div>
        </div>
      </div>

      {/* Action Modal */}
      <Modal isOpen={modalOpen} onClose={closeModal} title="">
        <div className="p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            {modalType === 'approve' && 'Approve Listing'}
            {modalType === 'reject' && 'Reject Listing'}
          </h3>

          <p className="text-gray-600 mb-4">
            {modalType === 'approve' && 'This will approve the listing for display. The listing will go live based on its configuration.'}
            {modalType === 'reject' && 'This will reject the listing and notify the seller. Please provide a reason.'}
          </p>

          {(modalType === 'reject' || modalType === 'approve') && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {modalType === 'approve' ? 'Notes (Optional)' : 'Reason *'}
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={
                  modalType === 'approve' 
                    ? 'Optional approval notes...' 
                    : 'Enter rejection reason...'
                }
                rows={4}
                required={modalType !== 'approve'}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={closeModal}
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleAction}
              disabled={loading}
              className={`flex-1 px-4 py-2.5 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 ${
                modalType === 'approve' 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {loading ? 'Processing...' : 'Confirm'}
            </button>
          </div>
        </div>
      </Modal>
    </>
  )
}
