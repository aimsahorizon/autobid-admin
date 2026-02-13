import { createClient } from '@/lib/supabase/server'
import StatsCard from '@/components/ui/StatsCard'
import { Users, Car, FileCheck, Gavel, Clock, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import StatusBadge from '@/components/ui/StatusBadge'

async function getStats() {
  const supabase = await createClient()

  const [
    { count: totalUsers },
    { count: pendingListings },
    { count: activeAuctions },
    { count: totalListings },
    { count: pendingKyc },
    { count: pendingTransactions },
  ] = await Promise.all([
    supabase.from('users').select('*', { count: 'exact', head: true }),
    supabase.from('auctions').select('*', { count: 'exact', head: true })
      .eq('status_id', (await supabase.from('auction_statuses').select('id').eq('status_name', 'pending_approval').single()).data?.id),
    supabase.from('auctions').select('*', { count: 'exact', head: true })
      .eq('status_id', (await supabase.from('auction_statuses').select('id').eq('status_name', 'live').single()).data?.id),
    supabase.from('auctions').select('*', { count: 'exact', head: true }),
    supabase.from('kyc_documents').select('*', { count: 'exact', head: true })
      .eq('status_id', (await supabase.from('kyc_statuses').select('id').eq('status_name', 'pending').single()).data?.id),
    supabase.from('auction_transactions').select('*', { count: 'exact', head: true })
      .eq('admin_approved', false),
  ])

  return {
    totalUsers: totalUsers || 0,
    pendingListings: pendingListings || 0,
    activeAuctions: activeAuctions || 0,
    totalListings: totalListings || 0,
    pendingKyc: pendingKyc || 0,
    pendingTransactions: pendingTransactions || 0,
  }
}

async function getRecentListings() {
  const supabase = await createClient()

  const { data } = await supabase
    .from('auctions')
    .select(`
      id,
      title,
      starting_price,
      created_at,
      auction_statuses (status_name, display_name),
      users!auctions_seller_id_fkey (full_name, email),
      auction_vehicles (brand, model, year)
    `)
    .order('created_at', { ascending: false })
    .limit(5)

  return data || []
}

async function getPendingKyc() {
  const supabase = await createClient()

  const { data: pendingStatus } = await supabase
    .from('kyc_statuses')
    .select('id')
    .eq('status_name', 'pending')
    .single()

  if (!pendingStatus) return []

  const { data } = await supabase
    .from('kyc_documents')
    .select(`
      id,
      document_type,
      submitted_at,
      users (full_name, email)
    `)
    .eq('status_id', pendingStatus.id)
    .order('submitted_at', { ascending: false })
    .limit(5)

  return data || []
}

export default async function AdminDashboard() {
  const [stats, recentListings, pendingKyc] = await Promise.all([
    getStats(),
    getRecentListings(),
    getPendingKyc(),
  ])

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex items-end justify-between border-b border-gray-100 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Overview</h1>
          <p className="text-gray-500 mt-2">Welcome back. Here's what's happening today.</p>
        </div>
        <div className="text-sm text-gray-400">
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Users"
          value={stats.totalUsers.toLocaleString()}
          icon={Users}
        />
        <StatsCard
          title="Active Auctions"
          value={stats.activeAuctions.toLocaleString()}
          icon={Gavel}
        />
        <StatsCard
          title="Pending Listings"
          value={stats.pendingListings.toLocaleString()}
          icon={Clock}
          trend={stats.pendingListings > 0 ? { value: stats.pendingListings, isPositive: false } : undefined}
        />
        <StatsCard
          title="Pending KYC"
          value={stats.pendingKyc.toLocaleString()}
          icon={FileCheck}
          trend={stats.pendingKyc > 0 ? { value: stats.pendingKyc, isPositive: false } : undefined}
        />
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Left Column: Recent Listings (Takes up 2/3 space on large screens) */}
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Recent Listings</h2>
                <p className="text-sm text-gray-500 mt-1">Latest vehicles submitted for auction</p>
              </div>
              <Link
                href="/admin/listings"
                className="group flex items-center gap-1 text-sm font-medium text-purple-600 hover:text-purple-700 transition-colors"
              >
                View all
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
            
            <div className="divide-y divide-gray-50">
              {recentListings.length === 0 ? (
                <div className="px-8 py-12 text-center text-gray-400">
                  <Car className="w-12 h-12 mx-auto mb-3 text-gray-200" />
                  No listings found
                </div>
              ) : (
                recentListings.map((listing: Record<string, unknown>) => {
                  const vehicle = listing.auction_vehicles as Record<string, unknown> | null
                  const user = listing.users as Record<string, unknown> | null
                  const status = listing.auction_statuses as Record<string, unknown> | null
                  
                  return (
                    <Link
                      key={listing.id as string}
                      href={`/admin/listings/${listing.id}`}
                      className="block px-8 py-5 hover:bg-gray-50/80 transition-all group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 group-hover:bg-purple-100 group-hover:text-purple-600 transition-colors">
                            <Car className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 group-hover:text-purple-700 transition-colors">
                              {String(vehicle?.year || '')} {String(vehicle?.brand || '')} {String(vehicle?.model || '')}
                            </p>
                            <p className="text-sm text-gray-500">
                              Listed by {String(user?.full_name || user?.email || 'Unknown')}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-6">
                          <div className="text-right hidden sm:block">
                            <p className="text-sm font-medium text-gray-900">
                              ₱{(listing.starting_price as number)?.toLocaleString()}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">Starting Price</p>
                          </div>
                          <StatusBadge status={String(status?.status_name || 'draft')} />
                        </div>
                      </div>
                    </Link>
                  )
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Pending KYC & Action Items */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            <div className="px-6 py-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Pending KYC</h2>
              <Link
                href="/admin/kyc"
                className="text-sm font-medium text-purple-600 hover:text-purple-700"
              >
                View all
              </Link>
            </div>
            
            <div className="divide-y divide-gray-50">
              {pendingKyc.length === 0 ? (
                <div className="px-6 py-12 text-center text-gray-400">
                  <FileCheck className="w-10 h-10 mx-auto mb-3 text-gray-200" />
                  All caught up!
                </div>
              ) : (
                pendingKyc.map((kyc: Record<string, unknown>) => {
                  const user = kyc.users as Record<string, unknown> | null
                  const fullName = String(user?.full_name || 'Unknown User')
                  const initials = fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'U'
                  
                  return (
                    <Link
                      key={kyc.id as string}
                      href={`/admin/kyc/${kyc.id}`}
                      className="block px-6 py-4 hover:bg-gray-50/80 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                         <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600 border border-gray-200">
                              {initials}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{fullName}</p>
                              <p className="text-xs text-gray-500">{String(kyc.document_type || '').replace(/_/g, ' ')}</p>
                            </div>
                         </div>
                         <div className="w-2 h-2 rounded-full bg-amber-400" />
                      </div>
                      <div className="flex justify-between items-center text-xs text-gray-400 pl-11">
                         <span>Submitted {typeof kyc.submitted_at === 'string' ? new Date(kyc.submitted_at).toLocaleDateString() : ''}</span>
                      </div>
                    </Link>
                  )
                })
              )}
            </div>
          </div>

          {/* Platform Summary / Quick Stats */}
          <div className="bg-purple-900 rounded-2xl p-6 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
               <Gavel className="w-32 h-32 transform rotate-12" />
            </div>
            <h3 className="text-lg font-bold mb-1 relative z-10">Platform Status</h3>
            <p className="text-purple-200 text-sm mb-6 relative z-10">Real-time overview</p>
            
            <div className="grid grid-cols-2 gap-4 relative z-10">
              <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                <p className="text-2xl font-bold">{stats.totalListings}</p>
                <p className="text-xs text-purple-200">Total Listings</p>
              </div>
              <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                 <p className="text-2xl font-bold">{stats.pendingTransactions}</p>
                 <p className="text-xs text-purple-200">Open Deals</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
