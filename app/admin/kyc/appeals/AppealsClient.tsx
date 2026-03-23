'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Search, MessageSquare, CheckCircle, XCircle, Loader2, X } from 'lucide-react'
import StatusBadge from '@/components/ui/StatusBadge'

interface Appeal {
  id: string
  user_id: string
  kyc_document_id: string
  appeal_reason: string
  status: string
  reviewed_by: string | null
  reviewed_at: string | null
  admin_notes: string | null
  created_at: string
  users: { id: string; full_name: string | null; email: string } | null
  kyc_documents: {
    id: string
    rejection_reason: string | null
    status_id: string
    kyc_statuses: { id: string; status_name: string; display_name: string } | null
  } | null
}

interface AppealsClientProps {
  appeals: Appeal[]
  adminUserId: string
  underReviewStatusId: string
  rejectedStatusId: string
}

type TabStatus = 'pending' | 'approved' | 'rejected'

export default function AppealsClient({ appeals, adminUserId, underReviewStatusId, rejectedStatusId }: AppealsClientProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabStatus>('pending')
  const [search, setSearch] = useState('')
  const [actionAppeal, setActionAppeal] = useState<{ appeal: Appeal; action: 'approve' | 'reject' } | null>(null)
  const [adminNotes, setAdminNotes] = useState('')
  const [loading, setLoading] = useState(false)

  const filteredAppeals = appeals.filter(a => {
    if (a.status !== activeTab) return false
    if (!search) return true
    const s = search.toLowerCase()
    return (
      a.users?.full_name?.toLowerCase().includes(s) ||
      a.users?.email?.toLowerCase().includes(s) ||
      a.appeal_reason?.toLowerCase().includes(s)
    )
  })

  const tabs: { key: TabStatus; label: string; count: number }[] = [
    { key: 'pending', label: 'Pending', count: appeals.filter(a => a.status === 'pending').length },
    { key: 'approved', label: 'Approved', count: appeals.filter(a => a.status === 'approved').length },
    { key: 'rejected', label: 'Rejected', count: appeals.filter(a => a.status === 'rejected').length },
  ]

  const handleAction = async () => {
    if (!actionAppeal) return
    const { appeal, action } = actionAppeal

    if (action === 'reject' && !adminNotes.trim()) {
      alert('Admin notes are required when rejecting an appeal.')
      return
    }

    setLoading(true)
    const supabase = createClient()
    const now = new Date().toISOString()

    // Update appeal status
    const { error: appealError } = await supabase
      .from('kyc_appeals')
      .update({
        status: action === 'approve' ? 'approved' : 'rejected',
        reviewed_by: adminUserId,
        reviewed_at: now,
        admin_notes: adminNotes.trim() || null,
      })
      .eq('id', appeal.id)

    if (appealError) {
      alert('Failed to update appeal: ' + appealError.message)
      setLoading(false)
      return
    }

    // Update kyc_documents status
    const newStatusId = action === 'approve' ? underReviewStatusId : rejectedStatusId
    const { error: docError } = await supabase
      .from('kyc_documents')
      .update({ status_id: newStatusId })
      .eq('id', appeal.kyc_document_id)

    if (docError) {
      alert('Appeal updated but failed to update KYC document status: ' + docError.message)
    }

    setLoading(false)
    setActionAppeal(null)
    setAdminNotes('')
    router.refresh()
  }

  return (
    <>
      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === tab.key
                ? 'border-purple-600 text-purple-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
              activeTab === tab.key ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-500'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name, email, or reason..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
        />
      </div>

      {/* Appeals List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {filteredAppeals.length === 0 ? (
          <div className="p-12 text-center">
            <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No {activeTab} appeals found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredAppeals.map(appeal => (
              <div key={appeal.id} className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <p className="font-medium text-gray-900">
                        {appeal.users?.full_name || 'Unknown User'}
                      </p>
                      <StatusBadge status={appeal.status} />
                    </div>
                    <p className="text-sm text-gray-500">{appeal.users?.email}</p>

                    <div className="mt-3 space-y-2">
                      <div>
                        <p className="text-xs font-medium text-gray-400 uppercase">Appeal Reason</p>
                        <p className="text-sm text-gray-700 mt-0.5">{appeal.appeal_reason}</p>
                      </div>

                      {appeal.kyc_documents?.rejection_reason && (
                        <div>
                          <p className="text-xs font-medium text-gray-400 uppercase">Original Rejection Reason</p>
                          <p className="text-sm text-red-600 mt-0.5">{appeal.kyc_documents.rejection_reason}</p>
                        </div>
                      )}

                      {appeal.admin_notes && (
                        <div>
                          <p className="text-xs font-medium text-gray-400 uppercase">Admin Notes</p>
                          <p className="text-sm text-gray-600 mt-0.5">{appeal.admin_notes}</p>
                        </div>
                      )}
                    </div>

                    <p className="text-xs text-gray-400 mt-3">
                      Submitted {new Date(appeal.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      {appeal.reviewed_at && (
                        <> · Reviewed {new Date(appeal.reviewed_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</>
                      )}
                    </p>
                  </div>

                  {appeal.status === 'pending' && (
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => { setActionAppeal({ appeal, action: 'approve' }); setAdminNotes('') }}
                        className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-medium hover:bg-emerald-100 transition-colors"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Approve
                      </button>
                      <button
                        onClick={() => { setActionAppeal({ appeal, action: 'reject' }); setAdminNotes('') }}
                        className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 text-rose-700 rounded-lg text-sm font-medium hover:bg-rose-100 transition-colors"
                      >
                        <XCircle className="w-4 h-4" />
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      {actionAppeal && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {actionAppeal.action === 'approve' ? 'Approve Appeal' : 'Reject Appeal'}
              </h3>
              <button onClick={() => setActionAppeal(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-1">
              <span className="font-medium">{actionAppeal.appeal.users?.full_name || 'Unknown User'}</span>
              {' '}({actionAppeal.appeal.users?.email})
            </p>

            {actionAppeal.action === 'approve' ? (
              <p className="text-sm text-gray-500 mb-4">
                This will set the KYC document back to &quot;under review&quot; so you can re-review the original documents.
              </p>
            ) : (
              <p className="text-sm text-gray-500 mb-4">
                This will keep the KYC document in &quot;rejected&quot; status.
              </p>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Admin Notes {actionAppeal.action === 'reject' ? '(required)' : '(optional)'}
              </label>
              <textarea
                value={adminNotes}
                onChange={e => setAdminNotes(e.target.value)}
                rows={3}
                placeholder={actionAppeal.action === 'approve' ? 'Optional notes...' : 'Reason for rejecting the appeal...'}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none text-sm"
              />
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setActionAppeal(null)}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAction}
                disabled={loading}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
                  actionAppeal.action === 'approve'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                } disabled:opacity-50`}
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {actionAppeal.action === 'approve' ? 'Confirm Approve' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
