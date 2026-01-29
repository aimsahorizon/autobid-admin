'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Search,
  CreditCard,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  FileText,
  User,
  Eye,
  ChevronRight,
} from 'lucide-react'
import StatusBadge from '@/components/ui/StatusBadge'

interface TransactionForm {
  id: string
  transaction_id: string
  role: 'seller' | 'buyer'
  status: 'draft' | 'submitted' | 'reviewed' | 'changes_requested' | 'confirmed'
  agreed_price: number
  payment_method: string | null
  delivery_date: string | null
  delivery_location: string | null
  or_cr_verified: boolean
  deeds_of_sale_ready: boolean
  plate_number_confirmed: boolean
  registration_valid: boolean
  no_outstanding_loans: boolean
  mechanical_inspection_done: boolean
  additional_terms: string | null
  review_notes: string | null
  submitted_at: string | null
  created_at: string
  updated_at: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Transaction = Record<string, any> & {
  forms: TransactionForm[]
}

interface TransactionsClientProps {
  initialTransactions: Transaction[]
  stats: { pendingReview: number; inProgress: number; completed: number; failed: number }
}

export default function TransactionsClient({ initialTransactions, stats }: TransactionsClientProps) {
  const router = useRouter()
  const [transactions, setTransactions] = useState(initialTransactions)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'pending' | 'in_transaction' | 'sold' | 'deal_failed'>('all')
  const [loading, setLoading] = useState<string | null>(null)

  const filteredTransactions = transactions.filter((tx) => {
    const vehicle = tx.auctions?.auction_vehicles
    const searchLower = search.toLowerCase()
    const matchesSearch =
      vehicle?.brand?.toLowerCase().includes(searchLower) ||
      vehicle?.model?.toLowerCase().includes(searchLower) ||
      tx.seller?.full_name?.toLowerCase().includes(searchLower) ||
      tx.buyer?.full_name?.toLowerCase().includes(searchLower)

    if (filter === 'all') return matchesSearch
    if (filter === 'pending') {
      return matchesSearch && !tx.admin_approved && tx.seller_confirmed && tx.buyer_confirmed
    }
    return matchesSearch && tx.status === filter
  })

  const getVehicleName = (tx: Transaction) => {
    const v = tx.auctions?.auction_vehicles
    if (v?.year && v?.brand && v?.model) {
      return `${v.year} ${v.brand} ${v.model}`
    }
    return tx.auctions?.title || 'Unknown Vehicle'
  }

  const isReadyForApproval = (tx: Transaction) => {
    return tx.seller_confirmed && tx.buyer_confirmed && !tx.admin_approved && tx.status === 'in_transaction'
  }

  const getSellerForm = (tx: Transaction) => tx.forms.find((f) => f.role === 'seller')
  const getBuyerForm = (tx: Transaction) => tx.forms.find((f) => f.role === 'buyer')

  const getFormStatusColor = (status: string | undefined) => {
    switch (status) {
      case 'confirmed':
        return 'text-green-600 bg-green-100'
      case 'submitted':
        return 'text-blue-600 bg-blue-100'
      case 'reviewed':
        return 'text-purple-600 bg-purple-100'
      case 'changes_requested':
        return 'text-orange-600 bg-orange-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const handleApprove = async (txId: string) => {
    setLoading(txId)
    const supabase = createClient()

    const { error } = await supabase
      .from('auction_transactions')
      .update({
        admin_approved: true,
        status: 'sold',
        completed_at: new Date().toISOString(),
      })
      .eq('id', txId)

    if (!error) {
      setTransactions((prev) =>
        prev.map((tx) =>
          tx.id === txId ? { ...tx, admin_approved: true, status: 'sold' as const } : tx
        )
      )
    }

    setLoading(null)
  }

  const getLegalChecklistCount = (form: TransactionForm | undefined) => {
    if (!form) return { completed: 0, total: 6 }
    const checks = [
      form.or_cr_verified,
      form.deeds_of_sale_ready,
      form.plate_number_confirmed,
      form.registration_valid,
      form.no_outstanding_loans,
      form.mechanical_inspection_done,
    ]
    return {
      completed: checks.filter(Boolean).length,
      total: 6,
    }
  }

  return (
    <>
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <AlertCircle className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-orange-700">{stats.pendingReview}</p>
              <p className="text-sm text-orange-600">Pending Review</p>
            </div>
          </div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-700">{stats.inProgress}</p>
              <p className="text-sm text-blue-600">In Progress</p>
            </div>
          </div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-700">{stats.completed}</p>
              <p className="text-sm text-green-600">Completed</p>
            </div>
          </div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-700">{stats.failed}</p>
              <p className="text-sm text-red-600">Failed Deals</p>
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
              placeholder="Search by vehicle, seller, or buyer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {(['all', 'pending', 'in_transaction', 'sold', 'deal_failed'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  filter === status
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status === 'in_transaction' ? 'In Progress' : status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div className="space-y-4">
        {filteredTransactions.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No transactions found</p>
          </div>
        ) : (
          filteredTransactions.map((tx) => {
            const sellerForm = getSellerForm(tx)
            const buyerForm = getBuyerForm(tx)
            const sellerChecklist = getLegalChecklistCount(sellerForm)
            const buyerChecklist = getLegalChecklistCount(buyerForm)

            return (
              <div
                key={tx.id}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Main Transaction Info */}
                <div className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Vehicle Info */}
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                        <CreditCard className="w-8 h-8 text-gray-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{getVehicleName(tx)}</h3>
                        <p className="text-lg font-bold text-purple-600">
                          ₱{tx.agreed_price?.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(tx.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {/* Parties */}
                    <div className="flex gap-6">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Seller</p>
                          <p className="text-sm font-medium">{tx.seller?.full_name || tx.seller?.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Buyer</p>
                          <p className="text-sm font-medium">{tx.buyer?.full_name || tx.buyer?.email}</p>
                        </div>
                      </div>
                    </div>

                    {/* Progress */}
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${tx.seller_form_submitted ? 'bg-green-100' : 'bg-gray-100'}`}>
                        <FileText className={`w-3 h-3 ${tx.seller_form_submitted ? 'text-green-600' : 'text-gray-400'}`} />
                      </div>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${tx.buyer_form_submitted ? 'bg-green-100' : 'bg-gray-100'}`}>
                        <FileText className={`w-3 h-3 ${tx.buyer_form_submitted ? 'text-green-600' : 'text-gray-400'}`} />
                      </div>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${tx.seller_confirmed && tx.buyer_confirmed ? 'bg-green-100' : 'bg-gray-100'}`}>
                        <CheckCircle className={`w-3 h-3 ${tx.seller_confirmed && tx.buyer_confirmed ? 'text-green-600' : 'text-gray-400'}`} />
                      </div>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${tx.admin_approved ? 'bg-purple-100' : 'bg-gray-100'}`}>
                        <CheckCircle className={`w-3 h-3 ${tx.admin_approved ? 'text-purple-600' : 'text-gray-400'}`} />
                      </div>
                    </div>

                    {/* Status & Actions */}
                    <div className="flex items-center gap-3">
                      <StatusBadge status={tx.status} />
                      {isReadyForApproval(tx) && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleApprove(tx.id)
                          }}
                          disabled={loading === tx.id}
                          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                          {loading === tx.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <CheckCircle className="w-4 h-4" />
                          )}
                          Approve
                        </button>
                      )}
                      <button
                        onClick={() => router.push(`/admin/transactions/${tx.id}`)}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        View Details
                      </button>
                    </div>
                  </div>

                  {/* Progress Labels */}
                  <div className="mt-4 pt-4 border-t border-gray-100 flex gap-4 text-xs text-gray-500">
                    <span className={tx.seller_form_submitted ? 'text-green-600' : ''}>
                      Seller Form {tx.seller_form_submitted ? '✓' : '○'}
                    </span>
                    <span className={tx.buyer_form_submitted ? 'text-green-600' : ''}>
                      Buyer Form {tx.buyer_form_submitted ? '✓' : '○'}
                    </span>
                    <span className={tx.seller_confirmed && tx.buyer_confirmed ? 'text-green-600' : ''}>
                      Both Confirmed {tx.seller_confirmed && tx.buyer_confirmed ? '✓' : '○'}
                    </span>
                    <span className={tx.admin_approved ? 'text-purple-600' : ''}>
                      Admin Approved {tx.admin_approved ? '✓' : '○'}
                    </span>
                  </div>
                </div>

                {/* Forms Summary */}
                {(sellerForm || buyerForm) && (
                  <div className="px-6 pb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Seller Form Summary */}
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-blue-900 flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            Seller Form
                          </h4>
                          {sellerForm ? (
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getFormStatusColor(sellerForm.status)}`}>
                              {sellerForm.status.replace(/_/g, ' ')}
                            </span>
                          ) : (
                            <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-600">
                              Not Started
                            </span>
                          )}
                        </div>
                        {sellerForm ? (
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-blue-700">Payment Method:</span>
                              <span className="font-medium text-blue-900">{sellerForm.payment_method || 'Not specified'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-blue-700">Delivery:</span>
                              <span className="font-medium text-blue-900">
                                {sellerForm.delivery_date
                                  ? new Date(sellerForm.delivery_date).toLocaleDateString()
                                  : 'Not set'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-blue-700">Legal Checklist:</span>
                              <span className="font-medium text-blue-900">
                                {sellerChecklist.completed}/{sellerChecklist.total} items
                              </span>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-blue-700">Awaiting seller submission</p>
                        )}
                      </div>

                      {/* Buyer Form Summary */}
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-green-900 flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            Buyer Form
                          </h4>
                          {buyerForm ? (
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getFormStatusColor(buyerForm.status)}`}>
                              {buyerForm.status.replace(/_/g, ' ')}
                            </span>
                          ) : (
                            <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-600">
                              Not Started
                            </span>
                          )}
                        </div>
                        {buyerForm ? (
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-green-700">Payment Method:</span>
                              <span className="font-medium text-green-900">{buyerForm.payment_method || 'Not specified'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-green-700">Delivery:</span>
                              <span className="font-medium text-green-900">
                                {buyerForm.delivery_date
                                  ? new Date(buyerForm.delivery_date).toLocaleDateString()
                                  : 'Not set'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-green-700">Legal Checklist:</span>
                              <span className="font-medium text-green-900">
                                {buyerChecklist.completed}/{buyerChecklist.total} items
                              </span>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-green-700">Awaiting buyer submission</p>
                        )}
                      </div>
                    </div>

                    {/* View Full Details Link */}
                    <button
                      onClick={() => router.push(`/admin/transactions/${tx.id}`)}
                      className="mt-4 w-full py-2 text-center text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center justify-center gap-1"
                    >
                      View Complete Form Details
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </>
  )
}
