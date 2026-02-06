'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Car, Eye, Gavel, Star, Trash2, CheckSquare, Square, AlertTriangle, Loader2, Archive, Shield } from 'lucide-react'
import StatusBadge from '@/components/ui/StatusBadge'
import { bulkDeleteListings, deleteAllListings } from './actions'

interface Listing {
  id: string
  title: string
  starting_price: number
  reserve_price: number | null
  current_price: number
  total_bids: number
  view_count: number
  is_featured: boolean
  start_time: string | null
  end_time: string | null
  created_at: string
  auction_statuses: { id: string; status_name: string; display_name: string } | null
  auction_categories: { category_name: string; display_name: string } | null
  auction_vehicles: {
    brand: string | null
    model: string | null
    variant: string | null
    year: number | null
    mileage: number | null
    condition: string | null
    exterior_color: string | null
  } | null
  auction_photos: Array<{ id: string; photo_url: string; is_primary: boolean }>
  users: { id: string; full_name: string | null; email: string } | null
}

interface Status {
  id: string
  status_name: string
  display_name: string
}

interface ListingsClientProps {
  initialListings: Listing[]
  statuses: Status[]
}

export default function ListingsClient({ initialListings, statuses }: ListingsClientProps) {
  const router = useRouter()
  const [listings, setListings] = useState(initialListings)
  const [search, setSearch] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [isDeleteEnabled, setIsDeleteEnabled] = useState(false)
  const [isSelectionEnabled, setIsSelectionEnabled] = useState(false)
  
  // Bulk Action State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const toggleSelectionMode = () => {
    if (isSelectionEnabled) {
      setSelectedIds(new Set())
    }
    setIsSelectionEnabled(!isSelectionEnabled)
  }
  const [modalMode, setModalMode] = useState<'delete' | null>(null)
  const [actionScope, setActionScope] = useState<'single' | 'selected' | 'all'>('single')
  const [deleteType, setDeleteType] = useState<'soft' | 'hard'>('soft')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [targetListingForDelete, setTargetListingForDelete] = useState<Listing | null>(null)


  const filteredListings = listings.filter((listing) => {
    const vehicle = listing.auction_vehicles
    const searchLower = search.toLowerCase()
    const matchesSearch =
      listing.title?.toLowerCase().includes(searchLower) ||
      vehicle?.brand?.toLowerCase().includes(searchLower) ||
      vehicle?.model?.toLowerCase().includes(searchLower) ||
      listing.users?.full_name?.toLowerCase().includes(searchLower) ||
      listing.users?.email?.toLowerCase().includes(searchLower)

    if (selectedStatus === 'all') return matchesSearch
    return matchesSearch && listing.auction_statuses?.status_name === selectedStatus
  })

  // Selection Logic
  const toggleSelectListing = (id: string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredListings.length && filteredListings.length > 0) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredListings.map(l => l.id)))
    }
  }

  const openDeleteModal = (listing: Listing | null = null, scope: 'single' | 'selected' | 'all' = 'single') => {
    if (listing) setTargetListingForDelete(listing)
    setActionScope(scope)
    setDeleteType('soft')
    setModalMode('delete')
    setError(null)
  }

  const closeModal = () => {
    setModalMode(null)
    setTargetListingForDelete(null)
    setError(null)
  }

  const handleExecuteDelete = async () => {
    setLoading(true)
    setError(null)

    let result;

    try {
      if (actionScope === 'single' && targetListingForDelete) {
        result = await bulkDeleteListings([targetListingForDelete.id], deleteType)
      } else if (actionScope === 'selected') {
        result = await bulkDeleteListings(Array.from(selectedIds), deleteType)
      } else if (actionScope === 'all') {
        result = await deleteAllListings(deleteType)
      }

      if (result?.success) {
        // Optimistic update
        if (actionScope === 'single' && targetListingForDelete) {
          if (deleteType === 'hard') {
            setListings(prev => prev.filter(l => l.id !== targetListingForDelete.id))
          } else {
            // Refresh logic usually better for soft deletes to get updated status
            // But we can optimistically update status to 'cancelled' if we knew the ID
            // Here just removing from view if status filter is active might be confusing
            // Simplest is to let router.refresh() handle it or filter out locally
             setListings(prev => prev.filter(l => l.id !== targetListingForDelete.id)) // temporary removal from view
          }
        } else {
           // For bulk/all, best to refresh or clear
           // We can filter out selected
           setListings(prev => prev.filter(l => !selectedIds.has(l.id)))
        }
        
        setSelectedIds(new Set())
        closeModal()
        router.refresh()
      } else {
        setError(result?.error || 'Failed to delete')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    }

    setLoading(false)
  }

  const getPrimaryPhoto = (photos: Array<{ photo_url: string; is_primary: boolean }>) => {
    const primary = photos?.find((p) => p.is_primary)
    return primary?.photo_url || photos?.[0]?.photo_url
  }

  const getVehicleName = (listing: Listing) => {
    const v = listing.auction_vehicles
    if (v?.year && v?.brand && v?.model) {
      return `${v.year} ${v.brand} ${v.model}${v.variant ? ` ${v.variant}` : ''}`
    }
    return listing.title || 'Untitled Listing'
  }

  return (
    <>
      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
          <div className="flex flex-col sm:flex-row gap-4 flex-1 w-full lg:w-auto">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by vehicle, seller..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              />
            </div>
            <div className="flex gap-2 flex-wrap items-center">
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

          <div className="flex gap-2 items-center ml-auto shrink-0">
            <button
              onClick={toggleSelectionMode}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isSelectionEnabled 
                  ? 'bg-purple-100 text-purple-700 hover:bg-purple-200' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              title={isSelectionEnabled ? 'Disable Selection' : 'Enable Selection'}
            >
              <CheckSquare className="w-4 h-4" />
              {isSelectionEnabled ? 'Enabled' : 'Select'}
            </button>
            <button
              onClick={() => setIsDeleteEnabled(!isDeleteEnabled)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isDeleteEnabled 
                  ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              title={isDeleteEnabled ? 'Disable Deletion' : 'Enable Deletion'}
            >
              <Shield className="w-4 h-4" />
              {isDeleteEnabled ? 'Enabled' : 'Delete'}
            </button>
             {isDeleteEnabled && (
               <button
                onClick={() => openDeleteModal(null, 'all')}
                className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg font-medium transition-colors animate-in fade-in"
                title="Delete All Listings"
              >
                <Trash2 className="w-4 h-4" />
                Delete All
              </button>
             )}
          </div>
        </div>

        {/* Bulk Selection Bar */}
        {isSelectionEnabled && selectedIds.size > 0 && (
          <div className="mt-4 flex items-center justify-between bg-purple-50 p-3 rounded-lg border border-purple-100 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2 text-purple-900 font-medium">
              <CheckSquare className="w-5 h-5 text-purple-600" />
              {selectedIds.size} listing{selectedIds.size > 1 ? 's' : ''} selected
            </div>
            <div className="flex gap-2">
               <button
                onClick={() => setSelectedIds(new Set())}
                className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
              >
                Cancel
              </button>
              {isDeleteEnabled && (
                <button
                  onClick={() => openDeleteModal(null, 'selected')}
                  className="flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors shadow-sm animate-in fade-in"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Selected
                </button>
              )}
            </div>
          </div>
        )}

         {/* Select All Checkbox */}
        {isSelectionEnabled && (
          <div className="mt-4 flex items-center gap-2 animate-in fade-in">
            <button 
              onClick={toggleSelectAll}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
            >
              {selectedIds.size === filteredListings.length && filteredListings.length > 0 ? (
                <CheckSquare className="w-4 h-4 text-purple-600" />
              ) : (
                <Square className="w-4 h-4" />
              )}
              Select All {filteredListings.length > 0 && `(${filteredListings.length})`}
            </button>
          </div>
        )}
      </div>

      {/* Listings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredListings.length === 0 ? (
          <div className="col-span-full bg-white rounded-xl border border-gray-200 p-12 text-center">
            <Car className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No listings found</p>
          </div>
        ) : (
          filteredListings.map((listing) => (
            <div
              key={listing.id}
              onClick={() => router.push(`/admin/listings/${listing.id}`)}
              className={`group relative bg-white rounded-xl border overflow-hidden hover:shadow-lg transition-all cursor-pointer ${
                  selectedIds.has(listing.id) ? 'border-purple-500 ring-2 ring-purple-500' : 'border-gray-200'
              }`}
            >
              {/* Card Actions */}
              <div className="absolute top-3 right-3 z-20 flex gap-2">
                {isSelectionEnabled && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleSelectListing(listing.id)
                    }}
                    className="p-1 bg-white/80 rounded-full hover:bg-white transition-colors shadow-sm animate-in fade-in"
                  >
                    {selectedIds.has(listing.id) ? (
                      <CheckSquare className="w-6 h-6 text-purple-600" />
                    ) : (
                      <Square className="w-6 h-6 text-gray-500 hover:text-purple-600" />
                    )}
                  </button>
                )}
                
                {isDeleteEnabled && (
                   <button
                    onClick={(e) => {
                        e.stopPropagation()
                        openDeleteModal(listing, 'single')
                    }}
                    className="p-1 bg-white/80 rounded-full hover:bg-red-50 text-gray-500 hover:text-red-600 transition-colors shadow-sm animate-in fade-in"
                    title="Delete Listing"
                   >
                       <Trash2 className="w-6 h-6" />
                   </button>
                )}
              </div>

              {/* Image */}
              <div className="relative aspect-[16/10] bg-gray-100">
                {getPrimaryPhoto(listing.auction_photos) ? (
                  <img
                    src={getPrimaryPhoto(listing.auction_photos)}
                    alt={getVehicleName(listing)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Car className="w-16 h-16 text-gray-300" />
                  </div>
                )}
                {listing.is_featured && (
                  <div className="absolute top-3 left-3 bg-yellow-500 text-white px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1">
                    <Star className="w-3 h-3" />
                    Featured
                  </div>
                )}
                <div className="absolute top-3 right-3 opacity-0"> {/* Hidden but keeping layout if needed, though status badge is overlaid elsewhere usually or here if we want */}
                   {/* We might want to show status if not deleted */}
                </div>
                 <div className="absolute bottom-3 right-3">
                  <StatusBadge status={listing.auction_statuses?.status_name || 'draft'} />
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">
                  {getVehicleName(listing)}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  by {listing.users?.full_name || listing.users?.email || 'Unknown'}
                </p>

                <div className="flex items-center justify-between mt-4">
                  <div>
                    <p className="text-xs text-gray-400">Starting Price</p>
                    <p className="text-lg font-bold text-purple-600">
                      ₱{listing.starting_price?.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Current Price</p>
                    <p className="text-lg font-bold text-gray-900">
                      ₱{listing.current_price?.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Gavel className="w-4 h-4" />
                    {listing.total_bids} bids
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    {listing.view_count} views
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

       {/* Delete Confirmation Modal */}
      {modalMode === 'delete' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-red-100 rounded-full">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {actionScope === 'all' 
                    ? 'Delete All Listings' 
                    : actionScope === 'selected' 
                      ? `Delete ${selectedIds.size} Listings`
                      : 'Delete Listing'}
                </h2>
                <p className="text-gray-500 text-sm">Select deletion method</p>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <div className="mb-6 space-y-4">
              {/* Deletion Type Selection */}
              <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
                <button
                  onClick={() => setDeleteType('soft')}
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                    deleteType === 'soft' 
                      ? 'bg-white text-purple-700 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Cancel (Soft)
                </button>
                <button
                  onClick={() => setDeleteType('hard')}
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                    deleteType === 'hard' 
                      ? 'bg-white text-red-700 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Delete (Hard)
                </button>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-2">
                  {deleteType === 'soft' ? (
                    <>
                      <strong>Soft Delete</strong> will mark listings as <strong>Cancelled</strong>. They will still exist in the database.
                    </>
                  ) : (
                    <>
                      <strong>Hard Delete</strong> will <span className="text-red-600 font-bold">permanently remove</span> the listing data.
                    </>
                  )}
                </p>

                {deleteType === 'hard' && (
                  <ul className="text-xs text-red-500 list-disc list-inside mt-2 space-y-1">
                    <li>Removes listing</li>
                    <li>Deletes all associated bids and photos</li>
                    <li>This action cannot be undone</li>
                  </ul>
                )}
                
                {actionScope === 'all' && deleteType === 'hard' && (
                   <p className="mt-3 text-sm font-bold text-red-600 border-t border-red-200 pt-2">
                     WARNING: You are about to wipe the entire listings database!
                   </p>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={closeModal}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteDelete}
                disabled={loading}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 text-white rounded-lg transition-colors font-medium disabled:opacity-50 ${
                  deleteType === 'hard' ? 'bg-red-600 hover:bg-red-700' : 'bg-purple-600 hover:bg-purple-700'
                }`}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    {deleteType === 'hard' ? <Trash2 className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
                    Confirm {deleteType === 'soft' ? 'Cancel' : 'Delete'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}