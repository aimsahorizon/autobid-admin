'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  ArrowLeft,
  User,
  FileText,
  Calendar,
  CheckCircle,
  XCircle,
  Loader2,
  Mail,
  Shield,
} from 'lucide-react'
import StatusBadge from '@/components/ui/StatusBadge'

interface KycDetailClientProps {
  document: Record<string, unknown>
  statuses: Array<{ id: string; status_name: string; display_name: string }>
}

export default function KycDetailClient({ document, statuses }: KycDetailClientProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')

  const user = document.users as Record<string, unknown>
  const status = document.kyc_statuses as { id: string; status_name: string; display_name: string }

  const handleApprove = async () => {
    setLoading(true)
    const supabase = createClient()

    const approvedStatus = statuses.find((s) => s.status_name === 'approved')
    if (!approvedStatus) {
      setLoading(false)
      return
    }

    const { error } = await supabase
      .from('kyc_documents')
      .update({
        status_id: approvedStatus.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', document.id)

    if (!error) {
      // Update user verification status
      await supabase
        .from('users')
        .update({ is_verified: true })
        .eq('id', user.id)

      router.refresh()
      router.push('/admin/kyc')
    }

    setLoading(false)
  }

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert('Please provide a rejection reason')
      return
    }

    setLoading(true)
    const supabase = createClient()

    const rejectedStatus = statuses.find((s) => s.status_name === 'rejected')
    if (!rejectedStatus) {
      setLoading(false)
      return
    }

    const { error } = await supabase
      .from('kyc_documents')
      .update({
        status_id: rejectedStatus.id,
        reviewed_at: new Date().toISOString(),
        rejection_reason: rejectionReason,
      })
      .eq('id', document.id)

    if (!error) {
      router.refresh()
      router.push('/admin/kyc')
    }

    setLoading(false)
  }

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    }
    return email[0].toUpperCase()
  }

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
            <h1 className="text-2xl font-bold text-gray-900">KYC Review</h1>
            <p className="text-gray-500">Document ID: {document.id as string}</p>
          </div>
        </div>
        <StatusBadge status={status?.status_name || 'pending'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Information */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">User Information</h2>
          <div className="flex items-center gap-4 mb-6">
            {(user?.profile_image_url as string) ? (
              <img
                src={user.profile_image_url as string}
                alt="User"
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-2xl font-medium text-purple-700">
                  {getInitials(user?.full_name as string | null, user?.email as string)}
                </span>
              </div>
            )}
            <div>
              <p className="text-xl font-semibold text-gray-900">
                {(user?.full_name as string) || 'Unknown User'}
              </p>
              <div className="flex items-center gap-2 text-gray-500">
                <Mail className="w-4 h-4" />
                {user?.email as string}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">User ID</span>
              <span className="font-mono text-sm text-gray-900">{(user?.id as string)?.slice(0, 8)}...</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">Account Created</span>
              <span className="text-gray-900">
                {user?.created_at ? new Date(user.created_at as string).toLocaleDateString() : 'N/A'}
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-gray-500">Verified Status</span>
              <span className={`flex items-center gap-1 ${user?.is_verified ? 'text-green-600' : 'text-gray-400'}`}>
                {user?.is_verified ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Verified
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4" />
                    Not Verified
                  </>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Document Information */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Document Information</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">Document Type</span>
              <span className="text-gray-900 capitalize">
                {(document.document_type as string)?.replace(/_/g, ' ')}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">Submitted At</span>
              <span className="text-gray-900">
                {document.submitted_at
                  ? new Date(document.submitted_at as string).toLocaleString()
                  : 'Not submitted'}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">Status</span>
              <StatusBadge status={status?.status_name || 'pending'} />
            </div>
            {typeof document.reviewed_at === 'string' && (
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Reviewed At</span>
                <span className="text-gray-900">
                  {new Date(document.reviewed_at).toLocaleString()}
                </span>
              </div>
            )}
            {typeof document.rejection_reason === 'string' && (
              <div className="py-2">
                <span className="text-gray-500 block mb-1">Rejection Reason</span>
                <p className="text-red-600 bg-red-50 p-3 rounded-lg text-sm">
                  {document.rejection_reason}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Selfie Image */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Selfie Verification</h2>
          {document.selfie_with_id_url ? (
            <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
              <img
                src={document.selfie_with_id_url as string}
                alt="User Selfie"
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <User className="w-16 h-16 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500">No selfie uploaded</p>
              </div>
            </div>
          )}
        </div>

        {/* Document Image Placeholder */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">ID Document</h2>
          <div className="aspect-[4/3] bg-gray-100 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">Document stored securely in Supabase Vault</p>
              <p className="text-xs text-gray-400 mt-1">Access restricted for privacy</p>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Actions */}
      {status?.status_name === 'pending' || status?.status_name === 'under_review' ? (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Admin Actions</h2>
          <div className="space-y-4">
            <textarea
              placeholder="Rejection reason (required for rejection)"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none"
              rows={3}
            />
            <div className="flex gap-3">
              <button
                onClick={handleApprove}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 font-medium"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <CheckCircle className="w-5 h-5" />
                )}
                Approve KYC
              </button>
              <button
                onClick={handleReject}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 font-medium"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <XCircle className="w-5 h-5" />
                )}
                Reject KYC
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
