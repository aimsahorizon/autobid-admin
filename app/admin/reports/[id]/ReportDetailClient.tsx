'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  User,
  AlertTriangle,
  FileText,
  Calendar,
  DollarSign,
  ExternalLink,
  Save,
  CheckCircle,
  XCircle,
} from 'lucide-react'
import { TransactionReport } from '@/lib/types/database'
import StatusBadge from '@/components/ui/StatusBadge'
import { updateReportStatus } from '../actions'
import Link from 'next/link'

interface ReportDetailClientProps {
  report: TransactionReport
}

export default function ReportDetailClient({ report: initialReport }: ReportDetailClientProps) {
  const router = useRouter()
  const [report, setReport] = useState(initialReport)
  const [status, setStatus] = useState(report.status)
  const [adminNotes, setAdminNotes] = useState(report.admin_notes || '')
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleSave = async () => {
    setIsSaving(true)
    setMessage(null)

    const result = await updateReportStatus(report.id, {
      status: status as 'pending' | 'reviewing' | 'resolved' | 'dismissed',
      admin_notes: adminNotes,
    })

    setIsSaving(false)

    if (result.success) {
      setMessage({ type: 'success', text: 'Report updated successfully' })
      setReport({ ...report, status: status as typeof report.status, admin_notes: adminNotes })
      setTimeout(() => setMessage(null), 3000)
      router.refresh()
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to update report' })
    }
  }

  const handleDismiss = async () => {
    setIsSaving(true)
    setMessage(null)

    const result = await updateReportStatus(report.id, {
      status: 'dismissed',
      admin_notes: adminNotes || 'Report dismissed by admin',
    })

    setIsSaving(false)

    if (result.success) {
      setMessage({ type: 'success', text: 'Report dismissed' })
      setStatus('dismissed')
      setReport({ ...report, status: 'dismissed', admin_notes: adminNotes || 'Report dismissed by admin' })
      setTimeout(() => {
        setMessage(null)
        router.push('/admin/reports')
      }, 2000)
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to dismiss report' })
    }
  }


  const getReasonColor = (reason: string) => {
    switch (reason) {
      case 'Fraud':
        return 'text-red-700 bg-red-100 border-red-300'
      case 'Harassment':
        return 'text-orange-700 bg-orange-100 border-orange-300'
      case 'Misrepresentation':
        return 'text-yellow-700 bg-yellow-100 border-yellow-300'
      case 'Non-payment':
        return 'text-purple-700 bg-purple-100 border-purple-300'
      case 'Non-delivery':
        return 'text-blue-700 bg-blue-100 border-blue-300'
      case 'Other':
        return 'text-gray-700 bg-gray-100 border-gray-300'
      default:
        return 'text-gray-700 bg-gray-100 border-gray-300'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => router.push('/admin/reports')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Reports
          </button>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Report Details</h1>
          <p className="text-gray-500 mt-2">Review and manage transaction report</p>
        </div>
        <StatusBadge status={report.status} />
      </div>

      {/* Success/Error Message */}
      {message && (
        <div
          className={`p-4 rounded-lg border ${
            message.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertTriangle className="w-5 h-5" />
            )}
            <p className="font-medium">{message.text}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Report Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Report Information */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-gray-600" />
                Report Information
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600 mb-2 block">Reason</label>
                <span className={`inline-block px-3 py-1.5 text-sm font-semibold rounded-lg border ${getReasonColor(report.reason)}`}>
                  {report.reason}
                </span>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 mb-2 block">Description</label>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <p className="text-gray-800 whitespace-pre-wrap">{report.description}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                <div>
                  <label className="text-sm font-medium text-gray-600 mb-1 block">Submitted</label>
                  <div className="flex items-center gap-2 text-gray-900">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-sm">{formatDate(report.created_at)}</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 mb-1 block">Last Updated</label>
                  <div className="flex items-center gap-2 text-gray-900">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-sm">{formatDate(report.updated_at)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Transaction Details */}
          {report.transaction && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-gray-600" />
                  Associated Transaction
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600 mb-1 block">Transaction ID</label>
                    <p className="text-gray-900 text-sm font-mono">{report.transaction.id.slice(0, 8)}...</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600 mb-1 block">Agreed Price</label>
                    <p className="text-gray-900 text-sm font-semibold">
                      ₱{report.transaction.agreed_price?.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600 mb-1 block">Transaction Status</label>
                    <StatusBadge
                      status={report.transaction.status}
                    />
                  </div>
                </div>
                <Link
                  href={`/admin/transactions/${report.transaction.id}`}
                  className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-800 text-sm font-medium transition-colors"
                >
                  View Full Transaction
                  <ExternalLink className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Users & Actions */}
        <div className="space-y-6">
          {/* Reporter Info */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-blue-50">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                Reporter
              </h2>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-700 font-bold text-xl">
                    {report.reporter?.full_name?.charAt(0) || 'U'}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {report.reporter?.full_name || 'Unknown User'}
                  </h3>
                  <p className="text-sm text-gray-500">{report.reporter?.email || 'N/A'}</p>
                </div>
              </div>
              <Link
                href={`/admin/users/${report.reporter_id}`}
                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
              >
                View User Profile
                <ExternalLink className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Reported User Info */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-red-50">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                Reported User
              </h2>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-red-700 font-bold text-xl">
                    {report.reported_user?.full_name?.charAt(0) || 'U'}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {report.reported_user?.full_name || 'Unknown User'}
                  </h3>
                  <p className="text-sm text-gray-500">{report.reported_user?.email || 'N/A'}</p>
                </div>
              </div>
              <Link
                href={`/admin/users/${report.reported_user_id}`}
                className="inline-flex items-center gap-2 text-red-600 hover:text-red-800 text-sm font-medium transition-colors"
              >
                View User Profile
                <ExternalLink className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Admin Actions */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-900">Admin Actions</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'pending' | 'reviewing' | 'resolved' | 'dismissed')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                >
                  <option value="pending">Pending</option>
                  <option value="reviewing">Reviewing</option>
                  <option value="resolved">Resolved</option>
                  <option value="dismissed">Dismissed</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Admin Notes</label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={6}
                  placeholder="Add internal notes about this report..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-1 flex items-center justify-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? 'Saving...' : 'Update Report'}
                </button>
              </div>
              <button
                onClick={handleDismiss}
                disabled={isSaving || status === 'dismissed'}
                className="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <XCircle className="w-4 h-4" />
                Dismiss Report
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
