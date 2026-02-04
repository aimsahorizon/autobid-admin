'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Search,
  Gavel,
  Clock,
  Eye,
  TrendingUp,
  Timer,
  Users,
  Trophy,
  ChevronRight,
  X,
  Car,
  DollarSign,
  Activity,
  Zap,
  RefreshCw,
  Square,
  CheckSquare,
  Trash2,
  AlertTriangle,
  Archive
} from 'lucide-react'
import StatusBadge from '@/components/ui/StatusBadge'
import { bulkDeleteAuctions, deleteAllAuctions } from './actions'
import { useRouter } from 'next/navigation'

interface Bid {
  id: string
  auction_id: string
  bidder_id: string
  bid_amount: number
  is_auto_bid: boolean
  created_at: string
  bid_statuses: { status_name: string; display_name: string } | null
  users: { id: string; full_name: string | null; email: string; profile_image_url: string | null } | null
}

interface Auction {
  id: string
  title: string
  description: string | null
  starting_price: number
  reserve_price: number | null
  current_price: number
  bid_increment: number
  deposit_amount: number
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
    transmission: string | null
    fuel_type: string | null
  } | null
  auction_photos: Array<{ id: string; photo_url: string; is_primary: boolean; category: string }>
  users: { id: string; full_name: string | null; email: string; profile_image_url: string | null } | null
}

interface AuctionsClientProps {
  initialAuctions: Auction[]
  stats: { totalActive: number; endingSoon: number; totalBids: number }
  initialBids: Bid[]
}

// Helper to transform Supabase relation arrays to single objects
function transformAuction(auction: Record<string, unknown>): Auction {
  return {
    ...auction,
    auction_statuses: Array.isArray(auction.auction_statuses)
      ? auction.auction_statuses[0] || null
      : auction.auction_statuses,
    auction_categories: Array.isArray(auction.auction_categories)
      ? auction.auction_categories[0] || null
      : auction.auction_categories,
    auction_vehicles: Array.isArray(auction.auction_vehicles)
      ? auction.auction_vehicles[0] || null
      : auction.auction_vehicles,
    users: Array.isArray(auction.users)
      ? auction.users[0] || null
      : auction.users,
  } as Auction
}

export default function AuctionsClient({ initialAuctions, stats, initialBids }: AuctionsClientProps) {
  const router = useRouter()
  const [auctions, setAuctions] = useState(initialAuctions)
  const [bids, setBids] = useState(initialBids)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'live' | 'scheduled' | 'ended'>('all')
  const [selectedAuction, setSelectedAuction] = useState<Auction | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdate, setLastUpdate] = useState(new Date())
  
  // Bulk Action State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [modalMode, setModalMode] = useState<'delete' | null>(null)
  const [actionScope, setActionScope] = useState<'single' | 'selected' | 'all'>('single')
  const [deleteType, setDeleteType] = useState<'soft' | 'hard'>('soft')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [targetAuctionForDelete, setTargetAuctionForDelete] = useState<Auction | null>(null)

  // Real-time countdown timer
  const [, setTick] = useState(0)
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 1000)
    return () => clearInterval(interval)
  }, [])

  // Real-time subscription for bids
  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel('bids-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'bids' },
        async (payload) => {
          const { data: newBid } = await supabase
            .from('bids')
            .select(`
              id,
              auction_id,
              bidder_id,
              bid_amount,
              is_auto_bid,
              created_at,
              bid_statuses (status_name, display_name),
              users (id, full_name, email, profile_image_url)
            `)
            .eq('id', payload.new.id)
            .single()

          if (newBid) {
            const transformedBid: Bid = {
              ...newBid,
              bid_statuses: Array.isArray(newBid.bid_statuses) ? newBid.bid_statuses[0] || null : newBid.bid_statuses,
              users: Array.isArray(newBid.users) ? newBid.users[0] || null : newBid.users,
            }
            setBids(prev => [transformedBid, ...prev])
            setLastUpdate(new Date())

            setAuctions(prev => prev.map(a =>
              a.id === newBid.auction_id
                ? { ...a, current_price: newBid.bid_amount, total_bids: a.total_bids + 1 }
                : a
            ))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const refreshData = useCallback(async () => {
    setIsRefreshing(true)
    const supabase = createClient()

    const { data: freshAuctions } = await supabase
      .from('auctions')
      .select(`
        id,
        title,
        description,
        starting_price,
        reserve_price,
        current_price,
        bid_increment,
        deposit_amount,
        total_bids,
        view_count,
        is_featured,
        start_time,
        end_time,
        created_at,
        auction_statuses (id, status_name, display_name),
        auction_categories (category_name, display_name),
        auction_vehicles (brand, model, variant, year, mileage, condition, exterior_color, transmission, fuel_type),
        auction_photos (id, photo_url, is_primary, category),
        users!auctions_seller_id_fkey (id, full_name, email, profile_image_url)
      `)
      .order('start_time', { ascending: false })

    if (freshAuctions) {
      setAuctions(freshAuctions.map(transformAuction))
      setLastUpdate(new Date())
    }

    setIsRefreshing(false)
  }, [])

  const filteredAuctions = auctions.filter((auction) => {
    const vehicle = auction.auction_vehicles
    const searchLower = search.toLowerCase()
    const matchesSearch =
      auction.title?.toLowerCase().includes(searchLower) ||
      vehicle?.brand?.toLowerCase().includes(searchLower) ||
      vehicle?.model?.toLowerCase().includes(searchLower) ||
      auction.users?.full_name?.toLowerCase().includes(searchLower)

    if (filter === 'all') return matchesSearch
    return matchesSearch && auction.auction_statuses?.status_name === filter
  })

  // Selection Logic
  const toggleSelectAuction = (id: string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredAuctions.length && filteredAuctions.length > 0) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredAuctions.map(a => a.id)))
    }
  }

  const openDeleteModal = (auction: Auction | null = null, scope: 'single' | 'selected' | 'all' = 'single') => {
    if (auction) setTargetAuctionForDelete(auction)
    setActionScope(scope)
    setDeleteType('soft')
    setModalMode('delete')
    setError(null)
  }

  const closeModal = () => {
    setModalMode(null)
    setTargetAuctionForDelete(null)
    setError(null)
  }

  const handleExecuteDelete = async () => {
    setLoading(true)
    setError(null)

    let result;

    try {
      if (actionScope === 'single' && targetAuctionForDelete) {
        result = await bulkDeleteAuctions([targetAuctionForDelete.id], deleteType)
      } else if (actionScope === 'selected') {
        result = await bulkDeleteAuctions(Array.from(selectedIds), deleteType)
      } else if (actionScope === 'all') {
        result = await deleteAllAuctions(deleteType)
      }

      if (result?.success) {
        // Optimistic update
        if (actionScope === 'single' && targetAuctionForDelete) {
          if (deleteType === 'hard') {
            setAuctions(prev => prev.filter(a => a.id !== targetAuctionForDelete.id))
          } else {
             // If soft delete (cancel), we might keep it but update status, or remove if filter is active
             // For simplicity, just refresh
             await refreshData()
          }
        } else {
           await refreshData()
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

  const getVehicleName = (auction: Auction) => {
    const v = auction.auction_vehicles
    if (v?.year && v?.brand && v?.model) {
      return `${v.year} ${v.brand} ${v.model}${v.variant ? ` ${v.variant}` : ''}`
    }
    return auction.title || 'Untitled'
  }

  const getPrimaryPhoto = (photos: Array<{ photo_url: string; is_primary: boolean }>) => {
    const primary = photos?.find((p) => p.is_primary)
    return primary?.photo_url || photos?.[0]?.photo_url
  }

  const getTimeRemaining = (endTime: string | null) => {
    if (!endTime) return { text: '-', urgent: false, ended: false }
    const end = new Date(endTime)
    const now = new Date()
    const diff = end.getTime() - now.getTime()

    if (diff <= 0) return { text: 'Ended', urgent: false, ended: true }

    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((diff % (1000 * 60)) / 1000)

    if (hours > 24) {
      const days = Math.floor(hours / 24)
      return { text: `${days}d ${hours % 24}h`, urgent: false, ended: false }
    }
    if (hours > 0) {
      return { text: `${hours}h ${minutes}m`, urgent: hours < 1, ended: false }
    }
    return { text: `${minutes}m ${seconds}s`, urgent: true, ended: false }
  }

  const getAuctionBids = (auctionId: string) => {
    return bids.filter(b => b.auction_id === auctionId).sort((a, b) => b.bid_amount - a.bid_amount)
  }

  const getHighestBidder = (auctionId: string) => {
    const auctionBids = getAuctionBids(auctionId)
    return auctionBids[0] || null
  }

  const getInitials = (name: string | null, email: string) => {
    if (name) return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    return email[0].toUpperCase()
  }

  return (
    <>
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Live Auctions</p>
              <p className="text-3xl font-bold mt-1">{stats.totalActive}</p>
            </div>
            <div className="p-3 bg-white/20 rounded-xl">
              <Activity className="w-6 h-6" />
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">Ending Soon</p>
              <p className="text-3xl font-bold mt-1">{stats.endingSoon}</p>
            </div>
            <div className="p-3 bg-white/20 rounded-xl">
              <Timer className="w-6 h-6" />
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Total Bids</p>
              <p className="text-3xl font-bold mt-1">{stats.totalBids.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-white/20 rounded-xl">
              <Gavel className="w-6 h-6" />
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Last Update</p>
              <p className="text-lg font-bold mt-1">{lastUpdate.toLocaleTimeString()}</p>
            </div>
            <button
              onClick={refreshData}
              disabled={isRefreshing}
              className="p-3 bg-white/20 rounded-xl hover:bg-white/30 transition-colors"
            >
              <RefreshCw className={`w-6 h-6 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Filters & Actions */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by vehicle, brand, seller..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
            />
          </div>
          <div className="flex gap-2">
            {(['all', 'live', 'scheduled', 'ended'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === status
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status === 'live' && <span className="inline-block w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse" />}
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
             <button
              onClick={() => openDeleteModal(null, 'all')}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg font-medium transition-colors"
              title="Delete All Auctions"
            >
              <Trash2 className="w-4 h-4" />
              Delete All
            </button>
          </div>
        </div>

        {/* Bulk Selection Bar */}
        {selectedIds.size > 0 && (
          <div className="mt-4 flex items-center justify-between bg-purple-50 p-3 rounded-lg border border-purple-100 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2 text-purple-900 font-medium">
              <CheckSquare className="w-5 h-5 text-purple-600" />
              {selectedIds.size} auction{selectedIds.size > 1 ? 's' : ''} selected
            </div>
            <div className="flex gap-2">
               <button
                onClick={() => setSelectedIds(new Set())}
                className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => openDeleteModal(null, 'selected')}
                className="flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors shadow-sm"
              >
                <Trash2 className="w-4 h-4" />
                Delete Selected
              </button>
            </div>
          </div>
        )}

         {/* Select All Checkbox */}
        <div className="mt-4 flex items-center gap-2">
          <button 
            onClick={toggleSelectAll}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
          >
            {selectedIds.size === filteredAuctions.length && filteredAuctions.length > 0 ? (
              <CheckSquare className="w-4 h-4 text-purple-600" />
            ) : (
              <Square className="w-4 h-4" />
            )}
            Select All {filteredAuctions.length > 0 && `(${filteredAuctions.length})`}
          </button>
        </div>
      </div>

      {/* Auction Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredAuctions.length === 0 ? (
          <div className="col-span-full bg-white rounded-xl border border-gray-200 p-12 text-center">
            <Car className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No auctions found</p>
          </div>
        ) : (
          filteredAuctions.map((auction) => {
            const timeInfo = getTimeRemaining(auction.end_time)
            const highestBidder = getHighestBidder(auction.id)
            const auctionBids = getAuctionBids(auction.id)
            const isLive = auction.auction_statuses?.status_name === 'live'

            return (
              <div
                key={auction.id}
                className={`group relative bg-white rounded-xl border-2 overflow-hidden transition-all hover:shadow-xl ${
                  isLive ? 'border-green-400' : 'border-gray-200'
                } ${timeInfo.urgent && isLive ? 'ring-2 ring-red-400 ring-opacity-50' : ''} ${
                    selectedIds.has(auction.id) ? 'ring-2 ring-purple-500 border-purple-500' : ''
                }`}
              >
                {/* Selection Checkbox */}
                 <div className="absolute top-3 right-3 z-20">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleSelectAuction(auction.id)
                      }}
                      className="p-1 bg-white/80 rounded-full hover:bg-white transition-colors"
                    >
                      {selectedIds.has(auction.id) ? (
                        <CheckSquare className="w-6 h-6 text-purple-600" />
                      ) : (
                        <Square className="w-6 h-6 text-gray-500 hover:text-purple-600" />
                      )}
                    </button>
                  </div>

                {/* Clickable Area for Details */}
                <div onClick={() => setSelectedAuction(auction)} className="cursor-pointer">
                    {/* Cover Photo */}
                    <div className="relative aspect-[16/9] bg-gray-100">
                      {getPrimaryPhoto(auction.auction_photos) ? (
                        <img
                          src={getPrimaryPhoto(auction.auction_photos)}
                          alt={getVehicleName(auction)}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Car className="w-20 h-20 text-gray-300" />
                        </div>
                      )}

                      {/* Status Badge Overlay */}
                      <div className="absolute top-3 left-3 z-10">
                        {isLive ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-500 text-white rounded-full text-sm font-medium">
                            <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                            LIVE
                          </span>
                        ) : (
                          <StatusBadge status={auction.auction_statuses?.status_name || 'draft'} />
                        )}
                      </div>

                      {/* Time Remaining Overlay */}
                      {isLive && (
                        <div className={`absolute top-12 right-3 px-3 py-1 rounded-full text-sm font-bold z-10 ${
                          timeInfo.urgent ? 'bg-red-500 text-white animate-pulse' : 'bg-black/70 text-white'
                        }`}>
                          <Clock className="w-4 h-4 inline mr-1" />
                          {timeInfo.text}
                        </div>
                      )}

                      {/* Bid Count Overlay */}
                      <div className="absolute bottom-3 right-3 px-3 py-1 bg-black/70 text-white rounded-full text-sm font-medium z-10">
                        <Gavel className="w-4 h-4 inline mr-1" />
                        {auction.total_bids} bids
                      </div>

                      {/* Featured Badge */}
                      {auction.is_featured && (
                        <div className="absolute bottom-3 left-3 px-3 py-1 bg-yellow-500 text-white rounded-full text-sm font-medium z-10">
                          <Zap className="w-4 h-4 inline mr-1" />
                          Featured
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <h3 className="font-bold text-gray-900 text-lg truncate">{getVehicleName(auction)}</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Seller: {auction.users?.full_name || auction.users?.email}
                      </p>

                      {/* Price Section */}
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-gray-500 uppercase">Current Bid</p>
                            <p className="text-2xl font-bold text-purple-600">
                              ₱{auction.current_price?.toLocaleString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-500 uppercase">Starting</p>
                            <p className="text-sm text-gray-600">₱{auction.starting_price?.toLocaleString()}</p>
                          </div>
                        </div>
                      </div>

                      {/* Highest Bidder */}
                      {highestBidder && (
                        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              {highestBidder.users?.profile_image_url ? (
                                <img
                                  src={highestBidder.users.profile_image_url}
                                  alt="Bidder"
                                  className="w-10 h-10 rounded-full object-cover border-2 border-green-400"
                                />
                              ) : (
                                <div className="w-10 h-10 bg-green-200 rounded-full flex items-center justify-center border-2 border-green-400">
                                  <span className="text-sm font-bold text-green-700">
                                    {getInitials(highestBidder.users?.full_name || null, highestBidder.users?.email || 'U')}
                                  </span>
                                </div>
                              )}
                              <Trophy className="absolute -bottom-1 -right-1 w-4 h-4 text-yellow-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-green-600 font-medium uppercase">Highest Bidder</p>
                              <p className="font-semibold text-gray-900 truncate">
                                {highestBidder.users?.full_name || highestBidder.users?.email}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-green-600">₱{highestBidder.bid_amount.toLocaleString()}</p>
                              {highestBidder.is_auto_bid && (
                                <span className="text-xs text-gray-500">Auto-bid</span>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Stats Row */}
                      <div className="mt-3 flex items-center justify-between text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          {auction.view_count} views
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {auctionBids.length} bidders
                        </span>
                        <span className="flex items-center gap-1 text-purple-600">
                          View Details
                          <ChevronRight className="w-4 h-4" />
                        </span>
                      </div>
                    </div>
                </div>
                 {/* Quick Action: Delete */}
                <div className="absolute top-2 right-12 z-20">
                   <button
                    onClick={(e) => {
                        e.stopPropagation()
                        openDeleteModal(auction, 'single')
                    }}
                    className="p-1 bg-white/80 rounded-full hover:bg-red-50 text-gray-500 hover:text-red-600 transition-colors"
                    title="Delete Auction"
                   >
                       <Trash2 className="w-5 h-5" />
                   </button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Auction Detail Modal */}
      {selectedAuction && (
        <AuctionDetailModal
          auction={selectedAuction}
          bids={getAuctionBids(selectedAuction.id)}
          onClose={() => setSelectedAuction(null)}
          getVehicleName={getVehicleName}
          getPrimaryPhoto={getPrimaryPhoto}
          getTimeRemaining={getTimeRemaining}
          getInitials={getInitials}
        />
      )}

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
                    ? 'Delete All Auctions' 
                    : actionScope === 'selected' 
                      ? `Delete ${selectedIds.size} Auctions`
                      : 'Delete Auction'}
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
                      <strong>Soft Delete</strong> will mark auctions as <strong>Cancelled</strong>. They will still exist in the database.
                    </>
                  ) : (
                    <>
                      <strong>Hard Delete</strong> will <span className="text-red-600 font-bold">permanently remove</span> the auction data.
                    </>
                  )}
                </p>

                {deleteType === 'hard' && (
                  <ul className="text-xs text-red-500 list-disc list-inside mt-2 space-y-1">
                    <li>Removes auction listing</li>
                    <li>Deletes all associated bids and photos</li>
                    <li>This action cannot be undone</li>
                  </ul>
                )}
                
                {actionScope === 'all' && deleteType === 'hard' && (
                   <p className="mt-3 text-sm font-bold text-red-600 border-t border-red-200 pt-2">
                     WARNING: You are about to wipe the entire auction database!
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
                  <RefreshCw className="w-4 h-4 animate-spin" />
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

// Auction Detail Modal Component
function AuctionDetailModal({
  auction,
  bids,
  onClose,
  getVehicleName,
  getPrimaryPhoto,
  getTimeRemaining,
  getInitials,
}: {
  auction: Auction
  bids: Bid[]
  onClose: () => void
  getVehicleName: (a: Auction) => string
  getPrimaryPhoto: (p: Array<{ photo_url: string; is_primary: boolean }>) => string | undefined
  getTimeRemaining: (t: string | null) => { text: string; urgent: boolean; ended: boolean }
  getInitials: (n: string | null, e: string) => string
}) {
  const timeInfo = getTimeRemaining(auction.end_time)
  const isLive = auction.auction_statuses?.status_name === 'live'
  const vehicle = auction.auction_vehicles

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="relative">
          <div className="aspect-[21/9] bg-gray-100">
            {getPrimaryPhoto(auction.auction_photos) ? (
              <img
                src={getPrimaryPhoto(auction.auction_photos)}
                alt={getVehicleName(auction)}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Car className="w-24 h-24 text-gray-300" />
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          {isLive && (
            <div className={`absolute bottom-4 right-4 px-4 py-2 rounded-lg font-bold ${
              timeInfo.urgent ? 'bg-red-500 text-white animate-pulse' : 'bg-white shadow-lg text-gray-900'
            }`}>
              <Clock className="w-5 h-5 inline mr-2" />
              {timeInfo.text} remaining
            </div>
          )}
          <div className="absolute bottom-4 left-4">
            {isLive ? (
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg font-bold">
                <span className="w-3 h-3 bg-white rounded-full animate-pulse" />
                LIVE AUCTION
              </span>
            ) : (
              <StatusBadge status={auction.auction_statuses?.status_name || 'draft'} />
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Auction Details */}
            <div className="lg:col-span-2 space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{getVehicleName(auction)}</h2>
                <p className="text-gray-500 mt-1">
                  Seller: {auction.users?.full_name || auction.users?.email}
                </p>
              </div>

              {/* Price Cards */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-purple-50 rounded-xl p-4 text-center">
                  <p className="text-xs text-purple-600 uppercase font-medium">Current Bid</p>
                  <p className="text-2xl font-bold text-purple-700 mt-1">
                    ₱{auction.current_price?.toLocaleString()}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <p className="text-xs text-gray-600 uppercase font-medium">Starting Price</p>
                  <p className="text-xl font-bold text-gray-700 mt-1">
                    ₱{auction.starting_price?.toLocaleString()}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <p className="text-xs text-gray-600 uppercase font-medium">Bid Increment</p>
                  <p className="text-xl font-bold text-gray-700 mt-1">
                    ₱{auction.bid_increment?.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Vehicle Details */}
              {vehicle && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Vehicle Details</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    {vehicle.brand && (
                      <div>
                        <p className="text-gray-500">Brand</p>
                        <p className="font-medium">{vehicle.brand}</p>
                      </div>
                    )}
                    {vehicle.model && (
                      <div>
                        <p className="text-gray-500">Model</p>
                        <p className="font-medium">{vehicle.model}</p>
                      </div>
                    )}
                    {vehicle.year && (
                      <div>
                        <p className="text-gray-500">Year</p>
                        <p className="font-medium">{vehicle.year}</p>
                      </div>
                    )}
                    {vehicle.mileage && (
                      <div>
                        <p className="text-gray-500">Mileage</p>
                        <p className="font-medium">{vehicle.mileage.toLocaleString()} km</p>
                      </div>
                    )}
                    {vehicle.transmission && (
                      <div>
                        <p className="text-gray-500">Transmission</p>
                        <p className="font-medium">{vehicle.transmission}</p>
                      </div>
                    )}
                    {vehicle.fuel_type && (
                      <div>
                        <p className="text-gray-500">Fuel Type</p>
                        <p className="font-medium">{vehicle.fuel_type}</p>
                      </div>
                    )}
                    {vehicle.exterior_color && (
                      <div>
                        <p className="text-gray-500">Color</p>
                        <p className="font-medium">{vehicle.exterior_color}</p>
                      </div>
                    )}
                    {vehicle.condition && (
                      <div>
                        <p className="text-gray-500">Condition</p>
                        <p className="font-medium">{vehicle.condition}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Auction Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Gavel className="w-8 h-8 text-purple-600" />
                  <div>
                    <p className="text-2xl font-bold">{auction.total_bids}</p>
                    <p className="text-xs text-gray-500">Total Bids</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Eye className="w-8 h-8 text-blue-600" />
                  <div>
                    <p className="text-2xl font-bold">{auction.view_count}</p>
                    <p className="text-xs text-gray-500">Views</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <DollarSign className="w-8 h-8 text-green-600" />
                  <div>
                    <p className="text-2xl font-bold">₱{auction.deposit_amount?.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">Deposit Required</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Bid History */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                Live Bid History ({bids.length})
              </h3>
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {bids.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No bids yet</p>
                ) : (
                  bids.map((bid, index) => (
                    <div
                      key={bid.id}
                      className={`p-3 rounded-lg ${
                        index === 0
                          ? 'bg-green-100 border-2 border-green-400'
                          : 'bg-white border border-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          {bid.users?.profile_image_url ? (
                            <img
                              src={bid.users.profile_image_url}
                              alt="Bidder"
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              index === 0 ? 'bg-green-200' : 'bg-gray-200'
                            }`}>
                              <span className="text-xs font-bold">
                                {getInitials(bid.users?.full_name || null, bid.users?.email || 'U')}
                              </span>
                            </div>
                          )}
                          {index === 0 && (
                            <Trophy className="absolute -top-1 -right-1 w-4 h-4 text-yellow-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`font-medium truncate ${index === 0 ? 'text-green-800' : 'text-gray-900'}`}>
                            {bid.users?.full_name || bid.users?.email}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(bid.created_at).toLocaleTimeString()}
                            {bid.is_auto_bid && ' • Auto-bid'}
                          </p>
                        </div>
                        <p className={`font-bold ${index === 0 ? 'text-green-600' : 'text-gray-700'}`}>
                          ₱{bid.bid_amount.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}