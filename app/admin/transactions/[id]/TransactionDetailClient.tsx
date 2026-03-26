'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  User,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  CreditCard,
  Calendar,
  Mail,
  MessageSquare,
  Shield,
  Car,
  Scale,
  AlertTriangle,
  Camera,
  Loader2,
} from 'lucide-react'
import StatusBadge from '@/components/ui/StatusBadge'
import { createClient } from '@/lib/supabase/client'

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

interface TimelineEvent {
  id: string
  transaction_id: string
  title: string
  description: string | null
  event_type: string
  actor_id: string | null
  actor_name: string | null
  created_at: string
}

interface ChatMessage {
  id: string
  transaction_id: string
  sender_id: string
  sender_name: string
  message: string
  message_type: 'text' | 'system' | 'attachment'
  is_read: boolean
  created_at: string
}

interface AgreementField {
  id: string
  transaction_id: string
  label: string
  value: string
  field_type: string
  category: string
  options: string | null
  added_by: string | null
  display_order: number
  created_at: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Transaction = Record<string, any>

interface TransactionDetailClientProps {
  transaction: Transaction
  forms: TransactionForm[]
  timeline: TimelineEvent[]
  chat: ChatMessage[]
  agreementFields: AgreementField[]
  adminUserId: string
}

export default function TransactionDetailClient({
  transaction,
  forms,
  timeline,
  chat,
  agreementFields,
  adminUserId,
}: TransactionDetailClientProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'agreement' | 'forms' | 'timeline' | 'chat'>('agreement')
  const [resolving, setResolving] = useState(false)
  const [showResolveDialog, setShowResolveDialog] = useState(false)
  const [selectedResolution, setSelectedResolution] = useState<'refund_both' | 'penalize_seller' | 'penalize_buyer' | null>(null)
  const [adminNotes, setAdminNotes] = useState('')
  const [resolveError, setResolveError] = useState<string | null>(null)

  const groupedFields = agreementFields.reduce((acc, field) => {
    const category = field.category || 'General'
    if (!acc[category]) acc[category] = []
    acc[category].push(field)
    return acc
  }, {} as Record<string, AgreementField[]>)

  const sellerForm = forms.find((f) => f.role === 'seller')
  const buyerForm = forms.find((f) => f.role === 'buyer')

  // Extract nested relations with proper typing
  const auctions = transaction.auctions as Record<string, unknown> | null
  const vehicle = auctions?.auction_vehicles as Record<string, unknown> | null
  const auctionPhotos = auctions?.auction_photos as Array<{ photo_url: string; is_primary: boolean }> | null
  const seller = transaction.seller as Record<string, unknown> | null
  const buyer = transaction.buyer as Record<string, unknown> | null

  const vehicleName = vehicle?.year && vehicle?.brand && vehicle?.model
    ? `${String(vehicle.year)} ${String(vehicle.brand)} ${String(vehicle.model)}`
    : String(auctions?.title || 'Unknown Vehicle')

  const primaryPhoto = auctionPhotos?.find((p) => p.is_primary)?.photo_url
    || auctionPhotos?.[0]?.photo_url

  const legalChecklist = [
    { key: 'or_cr_verified', label: 'OR/CR Verified', icon: FileText },
    { key: 'deeds_of_sale_ready', label: 'Deed of Sale Ready', icon: FileText },
    { key: 'plate_number_confirmed', label: 'Plate Number Confirmed', icon: Car },
    { key: 'registration_valid', label: 'Registration Valid', icon: Shield },
    { key: 'no_outstanding_loans', label: 'No Outstanding Loans', icon: CreditCard },
    { key: 'mechanical_inspection_done', label: 'Mechanical Inspection Done', icon: CheckCircle },
  ]

  const getFormStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Confirmed</span>
      case 'submitted':
        return <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">Submitted</span>
      case 'reviewed':
        return <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">Reviewed</span>
      case 'changes_requested':
        return <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">Changes Requested</span>
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">Draft</span>
    }
  }

  const getTimelineIcon = (eventType: string) => {
    switch (eventType) {
      case 'created':
        return <Clock className="w-4 h-4" />
      case 'form_submitted':
        return <FileText className="w-4 h-4" />
      case 'form_confirmed':
        return <CheckCircle className="w-4 h-4" />
      case 'admin_approved':
        return <Shield className="w-4 h-4" />
      case 'completed':
        return <CheckCircle className="w-4 h-4" />
      case 'cancelled':
        return <XCircle className="w-4 h-4" />
      case 'disputed':
        return <Scale className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  const isDisputed = transaction.status === 'disputed'
  const isDisputeResolved = transaction.dispute_resolution != null

  const handleResolveDispute = async () => {
    if (!selectedResolution || !adminNotes.trim()) return
    setResolving(true)
    setResolveError(null)
    try {
      const supabase = createClient()
      const { data, error } = await supabase.rpc('resolve_dispute', {
        p_transaction_id: transaction.id,
        p_admin_id: adminUserId,
        p_resolution: selectedResolution,
        p_admin_notes: adminNotes.trim(),
      })
      if (error) throw error
      const result = data as { success: boolean; error?: string } | null
      if (!result?.success) throw new Error(result?.error || 'Failed to resolve dispute')
      router.refresh()
      setShowResolveDialog(false)
    } catch (err) {
      setResolveError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setResolving(false)
    }
  }

  const rejectionPhotos = transaction.buyer_rejection_photos as string[] | null

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
            <h1 className="text-2xl font-bold text-gray-900">Transaction Details</h1>
            <p className="text-gray-500">ID: {String(transaction.id).slice(0, 8)}...</p>
          </div>
        </div>
        <StatusBadge status={transaction.status === 'sold' ? 'Finalized' : String(transaction.status || 'in_transaction')} />
      </div>

      {/* Vehicle & Price Overview */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row gap-6">
          {primaryPhoto ? (
            <img
              src={primaryPhoto}
              alt={vehicleName}
              className="w-full md:w-64 h-48 object-cover rounded-lg"
            />
          ) : (
            <div className="w-full md:w-64 h-48 bg-gray-100 rounded-lg flex items-center justify-center">
              <Car className="w-16 h-16 text-gray-300" />
            </div>
          )}
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{vehicleName}</h2>
            <p className="text-3xl font-bold text-purple-600 mb-4">
              ₱{(transaction.agreed_price as number)?.toLocaleString()}
            </p>
            {Boolean(vehicle) && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                {typeof vehicle?.transmission === 'string' && (
                  <div>
                    <span className="text-gray-500">Transmission:</span>
                    <span className="ml-2 font-medium">{vehicle.transmission}</span>
                  </div>
                )}
                {typeof vehicle?.fuel_type === 'string' && (
                  <div>
                    <span className="text-gray-500">Fuel:</span>
                    <span className="ml-2 font-medium">{vehicle.fuel_type}</span>
                  </div>
                )}
                {typeof vehicle?.mileage === 'number' && (
                  <div>
                    <span className="text-gray-500">Mileage:</span>
                    <span className="ml-2 font-medium">{vehicle.mileage.toLocaleString()} km</span>
                  </div>
                )}
              </div>
            )}
            <div className="mt-4 flex gap-4 text-sm text-gray-500">
              <span>Created: {new Date(transaction.created_at as string).toLocaleDateString()}</span>
              {typeof transaction.completed_at === 'string' && (
                <span>Completed: {new Date(transaction.completed_at).toLocaleDateString()}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Parties */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Seller */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2">
            <User className="w-5 h-5" />
            Seller
          </h3>
          <div className="flex items-center gap-4 mb-4">
            {typeof seller?.profile_image_url === 'string' ? (
              <img
                src={seller.profile_image_url}
                alt={String(seller?.full_name || 'Seller')}
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <div className="w-16 h-16 bg-blue-200 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-blue-600" />
              </div>
            )}
            <div>
              <p className="text-lg font-semibold text-blue-900">
                {String(seller?.full_name || 'Unknown')}
              </p>
              <div className="flex items-center gap-1 text-blue-700">
                <Mail className="w-4 h-4" />
                {String(seller?.email || '')}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-blue-700">Form Status:</span>
            {Boolean(transaction.seller_form_submitted) ? (
              <CheckCircle className="w-4 h-4 text-green-600" />
            ) : (
              <Clock className="w-4 h-4 text-gray-400" />
            )}
            <span className="text-sm text-blue-700">Confirmed:</span>
            {Boolean(transaction.seller_confirmed) ? (
              <CheckCircle className="w-4 h-4 text-green-600" />
            ) : (
              <Clock className="w-4 h-4 text-gray-400" />
            )}
          </div>
        </div>

        {/* Buyer */}
        <div className="bg-green-50 border border-green-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-green-900 mb-4 flex items-center gap-2">
            <User className="w-5 h-5" />
            Buyer
          </h3>
          <div className="flex items-center gap-4 mb-4">
            {typeof buyer?.profile_image_url === 'string' ? (
              <img
                src={buyer.profile_image_url}
                alt={String(buyer?.full_name || 'Buyer')}
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <div className="w-16 h-16 bg-green-200 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-green-600" />
              </div>
            )}
            <div>
              <p className="text-lg font-semibold text-green-900">
                {String(buyer?.full_name || 'Unknown')}
              </p>
              <div className="flex items-center gap-1 text-green-700">
                <Mail className="w-4 h-4" />
                {String(buyer?.email || '')}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-green-700">Form Status:</span>
            {Boolean(transaction.buyer_form_submitted) ? (
              <CheckCircle className="w-4 h-4 text-green-600" />
            ) : (
              <Clock className="w-4 h-4 text-gray-400" />
            )}
            <span className="text-sm text-green-700">Confirmed:</span>
            {Boolean(transaction.buyer_confirmed) ? (
              <CheckCircle className="w-4 h-4 text-green-600" />
            ) : (
              <Clock className="w-4 h-4 text-gray-400" />
            )}
          </div>
        </div>
      </div>

      {/* Dispute Investigation Panel */}
      {(isDisputed || isDisputeResolved) && (
        <div className={`rounded-xl border-2 p-6 ${isDisputeResolved ? 'bg-gray-50 border-gray-300' : 'bg-purple-50 border-purple-300'}`}>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Scale className={`w-5 h-5 ${isDisputeResolved ? 'text-gray-700' : 'text-purple-700'}`} />
            <span className={isDisputeResolved ? 'text-gray-900' : 'text-purple-900'}>
              {isDisputeResolved ? 'Dispute Resolved' : 'Dispute Investigation'}
            </span>
          </h3>

          {/* Buyer's Rejection */}
          <div className="space-y-4">
            <div className="bg-white rounded-lg border border-red-200 p-4">
              <h4 className="font-medium text-red-800 mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Buyer Rejection
              </h4>
              <p className="text-sm text-gray-700">
                {typeof transaction.buyer_rejection_reason === 'string'
                  ? transaction.buyer_rejection_reason
                  : 'No reason provided'}
              </p>
              {rejectionPhotos && rejectionPhotos.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1">
                    <Camera className="w-3 h-3" />
                    Evidence Photos ({rejectionPhotos.length})
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {rejectionPhotos.map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                        <img src={url} alt={`Evidence ${i + 1}`} className="w-24 h-24 object-cover rounded-lg border border-gray-200 hover:opacity-75 transition-opacity" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Seller's Objection */}
            <div className="bg-white rounded-lg border border-orange-200 p-4">
              <h4 className="font-medium text-orange-800 mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Seller Objection
              </h4>
              <p className="text-sm text-gray-700">
                {typeof transaction.seller_objection_reason === 'string'
                  ? transaction.seller_objection_reason
                  : 'No objection reason provided'}
              </p>
              {typeof transaction.seller_objected_at === 'string' && (
                <p className="text-xs text-gray-500 mt-2">
                  Objected at: {new Date(transaction.seller_objected_at).toLocaleString()}
                </p>
              )}
            </div>

            {/* Resolution Result (if already resolved) */}
            {isDisputeResolved && (
              <div className="bg-white rounded-lg border border-green-200 p-4">
                <h4 className="font-medium text-green-800 mb-2 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Resolution
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">Decision:</span>
                    <StatusBadge status={String(transaction.dispute_resolution).replace(/_/g, ' ')} />
                  </div>
                  {typeof transaction.dispute_admin_notes === 'string' && (
                    <div>
                      <span className="text-gray-500">Admin Notes:</span>
                      <p className="text-gray-700 mt-1 bg-gray-50 p-2 rounded">{transaction.dispute_admin_notes}</p>
                    </div>
                  )}
                  {typeof transaction.dispute_resolved_at === 'string' && (
                    <p className="text-xs text-gray-500">
                      Resolved at: {new Date(transaction.dispute_resolved_at).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Resolution Actions (only if not yet resolved) */}
            {isDisputed && !isDisputeResolved && (
              <div className="bg-white rounded-lg border border-purple-200 p-4">
                <h4 className="font-medium text-purple-800 mb-3 flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Resolve Dispute
                </h4>
                <p className="text-sm text-gray-600 mb-4">
                  Review the chat history and evidence above, then select a resolution.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <button
                    onClick={() => { setSelectedResolution('refund_both'); setShowResolveDialog(true) }}
                    className="px-4 py-3 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
                  >
                    <CheckCircle className="w-4 h-4 mx-auto mb-1" />
                    Refund Both
                  </button>
                  <button
                    onClick={() => { setSelectedResolution('penalize_seller'); setShowResolveDialog(true) }}
                    className="px-4 py-3 bg-orange-50 border border-orange-200 text-orange-700 rounded-lg text-sm font-medium hover:bg-orange-100 transition-colors"
                  >
                    <AlertTriangle className="w-4 h-4 mx-auto mb-1" />
                    Penalize Seller
                  </button>
                  <button
                    onClick={() => { setSelectedResolution('penalize_buyer'); setShowResolveDialog(true) }}
                    className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
                  >
                    <AlertTriangle className="w-4 h-4 mx-auto mb-1" />
                    Penalize Buyer
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Resolve Dispute Confirmation Dialog */}
      {showResolveDialog && selectedResolution && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Confirm Dispute Resolution</h3>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm text-gray-600">
                Resolution: <span className="font-semibold text-gray-900">{selectedResolution.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {selectedResolution === 'refund_both'
                  ? 'Both deposits will be refunded. No penalties applied.'
                  : selectedResolution === 'penalize_seller'
                  ? 'Both deposits refunded. Seller will be suspended for 30 days.'
                  : 'Both deposits refunded. Buyer will be suspended for 30 days.'}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Admin Notes <span className="text-red-500">*</span>
              </label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={4}
                placeholder="Explain the reasoning for this resolution..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-sm"
              />
            </div>
            {resolveError && (
              <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{resolveError}</p>
            )}
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setShowResolveDialog(false); setSelectedResolution(null); setAdminNotes(''); setResolveError(null) }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                disabled={resolving}
              >
                Cancel
              </button>
              <button
                onClick={handleResolveDispute}
                disabled={resolving || !adminNotes.trim()}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {resolving && <Loader2 className="w-4 h-4 animate-spin" />}
                Confirm Resolution
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-200">
          <div className="flex flex-wrap">
            <button
              onClick={() => setActiveTab('agreement')}
              className={`px-6 py-4 font-medium transition-colors ${
                activeTab === 'agreement'
                  ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <FileText className="w-4 h-4 inline mr-2" />
              Agreement ({agreementFields.length})
            </button>
            <button
              onClick={() => setActiveTab('forms')}
              className={`px-6 py-4 font-medium transition-colors ${
                activeTab === 'forms'
                  ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <FileText className="w-4 h-4 inline mr-2" />
              Forms ({forms.length})
            </button>
            <button
              onClick={() => setActiveTab('timeline')}
              className={`px-6 py-4 font-medium transition-colors ${
                activeTab === 'timeline'
                  ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Clock className="w-4 h-4 inline mr-2" />
              Timeline ({timeline.length})
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className={`px-6 py-4 font-medium transition-colors ${
                activeTab === 'chat'
                  ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <MessageSquare className="w-4 h-4 inline mr-2" />
              Chat ({chat.length})
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Agreement Tab */}
          {activeTab === 'agreement' && (
            <div className="space-y-6">
              {agreementFields.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No agreement fields yet</p>
                </div>
              ) : (
                Object.entries(groupedFields).map(([category, fields]) => (
                  <div key={category} className="bg-gray-50 border border-gray-200 rounded-xl overflow-hidden">
                    <div className="bg-gray-100 px-6 py-4 border-b border-gray-200">
                      <h3 className="font-semibold text-gray-900 capitalize">
                        {category.replace(/_/g, ' ')}
                      </h3>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                      {fields.map((field) => (
                        <div key={field.id} className="space-y-1">
                          <span className="text-sm font-medium text-gray-500 block">
                            {field.label}
                          </span>
                          <p className="text-gray-900 bg-white p-3 rounded-lg border border-gray-200">
                            {field.value || <span className="text-gray-400 italic">Not set</span>}
                          </p>
                          <p className="text-xs text-gray-400">
                            Type: {field.field_type} • Added by: {field.added_by ? 'User' : 'System'}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Forms Tab */}
          {activeTab === 'forms' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Seller Form */}
              <div className="border border-blue-200 rounded-xl overflow-hidden">
                <div className="bg-blue-50 px-6 py-4 border-b border-blue-200 flex items-center justify-between">
                  <h3 className="font-semibold text-blue-900 flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Seller Form
                  </h3>
                  {sellerForm ? getFormStatusBadge(sellerForm.status) : (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                      Not Started
                    </span>
                  )}
                </div>
                <div className="p-6">
                  {sellerForm ? (
                    <div className="space-y-6">
                      {/* Agreement Details */}
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">Agreement Details</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between py-2 border-b border-gray-100">
                            <span className="text-gray-500 flex items-center gap-2">
                              <CreditCard className="w-4 h-4" />
                              Agreed Price
                            </span>
                            <span className="font-medium">₱{sellerForm.agreed_price?.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between py-2 border-b border-gray-100">
                            <span className="text-gray-500 flex items-center gap-2">
                              <CreditCard className="w-4 h-4" />
                              Payment Method
                            </span>
                            <span className="font-medium">{sellerForm.payment_method || 'Not specified'}</span>
                          </div>
                          <div className="flex justify-between py-2 border-b border-gray-100">
                            <span className="text-gray-500 flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              Delivery Date
                            </span>
                            <span className="font-medium">
                              {sellerForm.delivery_date
                                ? new Date(sellerForm.delivery_date).toLocaleDateString()
                                : 'Not set'}
                            </span>
                          </div>
                          <div className="flex justify-between py-2 border-b border-gray-100">
                            <span className="text-gray-500 flex items-center gap-2">
                              <MapPin className="w-4 h-4" />
                              Delivery Location
                            </span>
                            <span className="font-medium">{sellerForm.delivery_location || 'Not specified'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Legal Checklist */}
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">Legal Checklist</h4>
                        <div className="space-y-2">
                          {legalChecklist.map((item) => {
                            const isChecked = sellerForm[item.key as keyof TransactionForm] as boolean
                            return (
                              <div
                                key={item.key}
                                className={`flex items-center gap-3 p-3 rounded-lg ${
                                  isChecked ? 'bg-green-50' : 'bg-gray-50'
                                }`}
                              >
                                {isChecked ? (
                                  <CheckCircle className="w-5 h-5 text-green-600" />
                                ) : (
                                  <XCircle className="w-5 h-5 text-gray-400" />
                                )}
                                <span className={isChecked ? 'text-green-700' : 'text-gray-500'}>
                                  {item.label}
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      </div>

                      {/* Additional Terms */}
                      {sellerForm.additional_terms && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Additional Terms</h4>
                          <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                            {sellerForm.additional_terms}
                          </p>
                        </div>
                      )}

                      {/* Submitted At */}
                      {sellerForm.submitted_at && (
                        <p className="text-xs text-gray-500">
                          Submitted: {new Date(sellerForm.submitted_at).toLocaleString()}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">Seller has not submitted their form yet</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Buyer Form */}
              <div className="border border-green-200 rounded-xl overflow-hidden">
                <div className="bg-green-50 px-6 py-4 border-b border-green-200 flex items-center justify-between">
                  <h3 className="font-semibold text-green-900 flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Buyer Form
                  </h3>
                  {buyerForm ? getFormStatusBadge(buyerForm.status) : (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                      Not Started
                    </span>
                  )}
                </div>
                <div className="p-6">
                  {buyerForm ? (
                    <div className="space-y-6">
                      {/* Agreement Details */}
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">Agreement Details</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between py-2 border-b border-gray-100">
                            <span className="text-gray-500 flex items-center gap-2">
                              <CreditCard className="w-4 h-4" />
                              Agreed Price
                            </span>
                            <span className="font-medium">₱{buyerForm.agreed_price?.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between py-2 border-b border-gray-100">
                            <span className="text-gray-500 flex items-center gap-2">
                              <CreditCard className="w-4 h-4" />
                              Payment Method
                            </span>
                            <span className="font-medium">{buyerForm.payment_method || 'Not specified'}</span>
                          </div>
                          <div className="flex justify-between py-2 border-b border-gray-100">
                            <span className="text-gray-500 flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              Delivery Date
                            </span>
                            <span className="font-medium">
                              {buyerForm.delivery_date
                                ? new Date(buyerForm.delivery_date).toLocaleDateString()
                                : 'Not set'}
                            </span>
                          </div>
                          <div className="flex justify-between py-2 border-b border-gray-100">
                            <span className="text-gray-500 flex items-center gap-2">
                              <MapPin className="w-4 h-4" />
                              Delivery Location
                            </span>
                            <span className="font-medium">{buyerForm.delivery_location || 'Not specified'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Legal Checklist */}
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">Legal Checklist</h4>
                        <div className="space-y-2">
                          {legalChecklist.map((item) => {
                            const isChecked = buyerForm[item.key as keyof TransactionForm] as boolean
                            return (
                              <div
                                key={item.key}
                                className={`flex items-center gap-3 p-3 rounded-lg ${
                                  isChecked ? 'bg-green-50' : 'bg-gray-50'
                                }`}
                              >
                                {isChecked ? (
                                  <CheckCircle className="w-5 h-5 text-green-600" />
                                ) : (
                                  <XCircle className="w-5 h-5 text-gray-400" />
                                )}
                                <span className={isChecked ? 'text-green-700' : 'text-gray-500'}>
                                  {item.label}
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      </div>

                      {/* Additional Terms */}
                      {buyerForm.additional_terms && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Additional Terms</h4>
                          <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                            {buyerForm.additional_terms}
                          </p>
                        </div>
                      )}

                      {/* Submitted At */}
                      {buyerForm.submitted_at && (
                        <p className="text-xs text-gray-500">
                          Submitted: {new Date(buyerForm.submitted_at).toLocaleString()}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">Buyer has not submitted their form yet</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Timeline Tab */}
          {activeTab === 'timeline' && (
            <div>
              {timeline.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No timeline events yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {timeline.map((event, index) => (
                    <div key={event.id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          event.event_type === 'admin_approved' || event.event_type === 'completed'
                            ? 'bg-green-100 text-green-600'
                            : event.event_type === 'cancelled'
                            ? 'bg-red-100 text-red-600'
                            : event.event_type === 'disputed'
                            ? 'bg-purple-100 text-purple-600'
                            : 'bg-purple-100 text-purple-600'
                        }`}>
                          {getTimelineIcon(event.event_type)}
                        </div>
                        {index < timeline.length - 1 && (
                          <div className="w-0.5 h-full bg-gray-200 mt-2" />
                        )}
                      </div>
                      <div className="flex-1 pb-6">
                        <h4 className="font-medium text-gray-900">{event.title}</h4>
                        {event.description && (
                          <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                          <span>{new Date(event.created_at).toLocaleString()}</span>
                          {event.actor_name && (
                            <>
                              <span>•</span>
                              <span>by {event.actor_name}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Chat Tab */}
          {activeTab === 'chat' && (
            <div>
              {chat.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No messages in this transaction</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {chat.map((message) => (
                    <div
                      key={message.id}
                      className={`p-4 rounded-lg ${
                        message.message_type === 'system'
                          ? 'bg-gray-100 text-center'
                          : message.sender_id === seller?.id
                          ? 'bg-blue-50 ml-0 mr-12'
                          : 'bg-green-50 ml-12 mr-0'
                      }`}
                    >
                      {message.message_type !== 'system' && (
                        <p className="text-xs font-medium text-gray-600 mb-1">
                          {message.sender_name}
                        </p>
                      )}
                      <p className={`text-sm ${message.message_type === 'system' ? 'text-gray-500 italic' : 'text-gray-900'}`}>
                        {message.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-2">
                        {new Date(message.created_at).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Previous Admin Notes */}
      {typeof transaction.admin_notes === 'string' && transaction.admin_approved && (
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-purple-900 mb-2 flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Admin Notes
          </h3>
          <p className="text-purple-800">{transaction.admin_notes}</p>
        </div>
      )}
    </div>
  )
}
