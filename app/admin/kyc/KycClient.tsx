'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Search, FileCheck, Clock, CheckCircle, AlertTriangle, Loader2, MessageSquare, XCircle, X } from 'lucide-react'
import StatusBadge from '@/components/ui/StatusBadge'

interface KycDocument {
  id: string
  user_id: string
  document_type: string
  selfie_with_id_url: string | null
  submitted_at: string | null
  reviewed_at: string | null
  rejection_reason: string | null
  created_at: string
  kyc_statuses: { id: string; status_name: string; display_name: string } | null
  users: { id: string; full_name: string | null; email: string; profile_image_url: string | null } | null
}

interface AppealInfo {
  id: string
  appeal_reason: string
  status: string
  admin_notes: string | null
  reviewed_at: string | null
  created_at: string
}

interface KycClientProps {
  initialDocuments: KycDocument[]
  statuses: Array<{ id: string; status_name: string; display_name: string }>
  stats: { pending: number; appealPending: number; approved: number }
  appealsMap: Record<string, AppealInfo>
  adminUserId: string
}

export default function KycClient({ initialDocuments, statuses, stats, appealsMap, adminUserId }: KycClientProps) {
  const router = useRouter()
  const [documents] = useState(initialDocuments)
  const [search, setSearch] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [actionAppeal, setActionAppeal] = useState<{ docId: string; appealId: string; userName: string; email: string; action: 'approve' | 'reject' } | null>(null)
  const [adminNotes, setAdminNotes] = useState('')
  const [appealLoading, setAppealLoading] = useState(false)

  const filteredDocuments = documents.filter((doc) => {
    const searchLower = search.toLowerCase()
    const matchesSearch =
      doc.users?.full_name?.toLowerCase().includes(searchLower) ||
      doc.users?.email?.toLowerCase().includes(searchLower)

    if (selectedStatus === 'all') return matchesSearch
    return matchesSearch && doc.kyc_statuses?.status_name === selectedStatus
  })

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    }
    return email[0].toUpperCase()
  }

  const handleAppealAction = async () => {
    if (!actionAppeal) return
    if (actionAppeal.action === 'reject' && !adminNotes.trim()) {
      alert('Admin notes are required when rejecting an appeal.')
      return
    }

    setAppealLoading(true)
    const supabase = createClient()
    const now = new Date().toISOString()

    const { error: appealError } = await supabase
      .from('kyc_appeals')
      .update({
        status: actionAppeal.action === 'approve' ? 'approved' : 'rejected',
        reviewed_by: adminUserId,
        reviewed_at: now,
        admin_notes: adminNotes.trim() || null,
      })
      .eq('id', actionAppeal.appealId)

    if (appealError) {
      alert('Failed to update appeal: ' + appealError.message)
      setAppealLoading(false)
      return
    }

    // Get target status id
    const targetStatusName = actionAppeal.action === 'approve' ? 'under_review' : 'rejected'
    const { data: statusData } = await supabase
      .from('kyc_statuses')
      .select('id')
      .eq('status_name', targetStatusName)
      .single()

    if (statusData) {
      await supabase
        .from('kyc_documents')
        .update({ status_id: statusData.id })
        .eq('id', actionAppeal.docId)
    }

    setAppealLoading(false)
    setActionAppeal(null)
    setAdminNotes('')
    router.refresh()
  }

  return (
    <>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-orange-700">{stats.pending}</p>
              <p className="text-sm text-orange-600">Pending Review</p>
            </div>
          </div>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <MessageSquare className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-700">{stats.appealPending}</p>
              <p className="text-sm text-purple-600">Appeal Submitted</p>
            </div>
          </div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-700">{stats.approved}</p>
              <p className="text-sm text-green-600">Approved</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
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

      {/* Documents List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {filteredDocuments.length === 0 ? (
          <div className="p-12 text-center">
            <FileCheck className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No KYC documents found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredDocuments.map((doc) => {
              const appeal = appealsMap[doc.id]
              const isAppealPending = doc.kyc_statuses?.status_name === 'appeal_pending'

              return (
                <div key={doc.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div
                    onClick={() => { setLoadingId(doc.id); router.push(`/admin/kyc/${doc.id}`) }}
                    className={`cursor-pointer ${loadingId === doc.id ? 'opacity-60 pointer-events-none' : ''}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {doc.users?.profile_image_url ? (
                          <img
                            src={doc.users.profile_image_url}
                            alt={doc.users.full_name || 'User'}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                            <span className="text-lg font-medium text-purple-700">
                              {getInitials(doc.users?.full_name || null, doc.users?.email || 'U')}
                            </span>
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-900">
                            {doc.users?.full_name || 'Unknown User'}
                          </p>
                          <p className="text-sm text-gray-500">{doc.users?.email}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {doc.document_type?.replace(/_/g, ' ')} •{' '}
                            {doc.submitted_at
                              ? `Submitted ${new Date(doc.submitted_at).toLocaleDateString()}`
                              : 'Not submitted'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right flex items-center gap-2">
                        {loadingId === doc.id && <Loader2 className="w-4 h-4 animate-spin text-purple-600" />}
                        <StatusBadge status={doc.kyc_statuses?.status_name || 'pending'} />
                      </div>
                    </div>
                  </div>

                  {/* Appeal info + actions for appeal_pending docs */}
                  {isAppealPending && appeal && (
                    <div className="mt-3 ml-16 p-3 bg-purple-50 border border-purple-100 rounded-lg">
                      <div className="space-y-1.5">
                        <div>
                          <p className="text-xs font-medium text-purple-400 uppercase">Appeal Reason</p>
                          <p className="text-sm text-gray-700">{appeal.appeal_reason}</p>
                        </div>
                        {doc.rejection_reason && (
                          <div>
                            <p className="text-xs font-medium text-purple-400 uppercase">Original Rejection</p>
                            <p className="text-sm text-red-600">{doc.rejection_reason}</p>
                          </div>
                        )}
                        {appeal.admin_notes && (
                          <div>
                            <p className="text-xs font-medium text-purple-400 uppercase">Admin Notes</p>
                            <p className="text-sm text-gray-600">{appeal.admin_notes}</p>
                          </div>
                        )}
                        <p className="text-xs text-gray-400">
                          Appeal submitted {new Date(appeal.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                      {appeal.status === 'pending' && (
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={() => {
                              setActionAppeal({
                                docId: doc.id,
                                appealId: appeal.id,
                                userName: doc.users?.full_name || 'Unknown User',
                                email: doc.users?.email || '',
                                action: 'approve',
                              })
                              setAdminNotes('')
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-medium hover:bg-emerald-100 transition-colors border border-emerald-200"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            Approve Appeal
                          </button>
                          <button
                            onClick={() => {
                              setActionAppeal({
                                docId: doc.id,
                                appealId: appeal.id,
                                userName: doc.users?.full_name || 'Unknown User',
                                email: doc.users?.email || '',
                                action: 'reject',
                              })
                              setAdminNotes('')
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-700 rounded-lg text-sm font-medium hover:bg-rose-100 transition-colors border border-rose-200"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            Reject Appeal
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Show rejection reason for non-appeal rejected docs */}
                  {!isAppealPending && doc.rejection_reason && (
                    <p className="text-xs text-red-500 mt-2 ml-16 max-w-xs truncate">
                      {doc.rejection_reason}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Appeal Action Confirmation Dialog */}
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
              <span className="font-medium">{actionAppeal.userName}</span>
              {' '}({actionAppeal.email})
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
                disabled={appealLoading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAppealAction}
                disabled={appealLoading}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
                  actionAppeal.action === 'approve'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                } disabled:opacity-50`}
              >
                {appealLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                {actionAppeal.action === 'approve' ? 'Confirm Approve' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
