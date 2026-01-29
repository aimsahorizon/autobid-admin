'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, FileCheck, Clock, CheckCircle, AlertTriangle } from 'lucide-react'
import StatusBadge from '@/components/ui/StatusBadge'

interface KycDocument {
  id: string
  document_type: string
  selfie_with_id_url: string | null
  submitted_at: string | null
  reviewed_at: string | null
  rejection_reason: string | null
  created_at: string
  kyc_statuses: { id: string; status_name: string; display_name: string } | null
  users: { id: string; full_name: string | null; email: string; profile_image_url: string | null } | null
}

interface KycClientProps {
  initialDocuments: KycDocument[]
  statuses: Array<{ id: string; status_name: string; display_name: string }>
  stats: { pending: number; underReview: number; approved: number }
}

export default function KycClient({ initialDocuments, statuses, stats }: KycClientProps) {
  const router = useRouter()
  const [documents] = useState(initialDocuments)
  const [search, setSearch] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')

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
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-700">{stats.underReview}</p>
              <p className="text-sm text-blue-600">Under Review</p>
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
            {filteredDocuments.map((doc) => (
              <div
                key={doc.id}
                onClick={() => router.push(`/admin/kyc/${doc.id}`)}
                className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
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
                  <div className="text-right">
                    <StatusBadge status={doc.kyc_statuses?.status_name || 'pending'} />
                    {doc.rejection_reason && (
                      <p className="text-xs text-red-500 mt-2 max-w-xs truncate">
                        {doc.rejection_reason}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
