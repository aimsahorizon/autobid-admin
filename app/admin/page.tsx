import { createClient } from '@/lib/supabase/server'
import StatsCard from '@/components/ui/StatsCard'
import { Users, Car, FileCheck, Gavel, CreditCard, TrendingUp, Clock, AlertCircle } from 'lucide-react'
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
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Welcome back! Here&apos;s what&apos;s happening with AutoBid.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <StatsCard
          title="Total Users"
          value={stats.totalUsers.toLocaleString()}
          icon={Users}
          color="purple"
        />
        <StatsCard
          title="Active Auctions"
          value={stats.activeAuctions.toLocaleString()}
          icon={Gavel}
          color="green"
        />
        <StatsCard
          title="Pending Listings"
          value={stats.pendingListings.toLocaleString()}
          icon={Clock}
          color="orange"
        />
        <StatsCard
          title="Pending KYC"
          value={stats.pendingKyc.toLocaleString()}
          icon={FileCheck}
          color="blue"
        />
      </div>

      {/* Quick Actions */}
      {(stats.pendingListings > 0 || stats.pendingKyc > 0 || stats.pendingTransactions > 0) && (
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-purple-600" />
            <div>
              <p className="font-medium text-purple-900">Items requiring attention</p>
              <p className="text-sm text-purple-700">
                {stats.pendingListings > 0 && `${stats.pendingListings} pending listings`}
                {stats.pendingListings > 0 && stats.pendingKyc > 0 && ' • '}
                {stats.pendingKyc > 0 && `${stats.pendingKyc} pending KYC`}
                {(stats.pendingListings > 0 || stats.pendingKyc > 0) && stats.pendingTransactions > 0 && ' • '}
                {stats.pendingTransactions > 0 && `${stats.pendingTransactions} pending transactions`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Listings */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Recent Listings</h2>
            <Link
              href="/admin/listings"
              className="text-sm text-purple-600 hover:text-purple-700 font-medium"
            >
              View all
            </Link>
          </div>
          <div className="divide-y divide-gray-200">
            {recentListings.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500">
                No listings yet
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
                    className="block px-6 py-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">
                          {String(vehicle?.year || '')}{' '}
                          {String(vehicle?.brand || '')}{' '}
                          {String(vehicle?.model || '')}
                        </p>
                        <p className="text-sm text-gray-500">
                          by {String(user?.full_name || user?.email || 'Unknown')}
                        </p>
                      </div>
                      <div className="text-right">
                        <StatusBadge
                          status={String(status?.status_name || 'draft')}
                        />
                        <p className="text-sm text-gray-500 mt-1">
                          ₱{(listing.starting_price as number)?.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </Link>
                )
              })
            )}
          </div>
        </div>

        {/* Pending KYC */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Pending KYC Verification</h2>
            <Link
              href="/admin/kyc"
              className="text-sm text-purple-600 hover:text-purple-700 font-medium"
            >
              View all
            </Link>
          </div>
          <div className="divide-y divide-gray-200">
            {pendingKyc.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500">
                No pending KYC submissions
              </div>
            ) : (
              pendingKyc.map((kyc: Record<string, unknown>) => {
                const user = kyc.users as Record<string, unknown> | null
                const fullName = String(user?.full_name || 'Unknown User')
                const initials = fullName
                  .split(' ')
                  .map((n: string) => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2) || 'U'
                return (
                  <Link
                    key={kyc.id as string}
                    href={`/admin/kyc/${kyc.id}`}
                    className="block px-6 py-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-purple-700">
                            {initials}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {fullName}
                          </p>
                          <p className="text-sm text-gray-500">
                            {String(kyc.document_type || '').replace(/_/g, ' ')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <StatusBadge status="pending" />
                        <p className="text-xs text-gray-500 mt-1">
                          {typeof kyc.submitted_at === 'string'
                            ? new Date(kyc.submitted_at).toLocaleDateString()
                            : 'Not submitted'}
                        </p>
                      </div>
                    </div>
                  </Link>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* Activity Overview */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Platform Overview</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Car className="w-6 h-6 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.totalListings}</p>
            <p className="text-sm text-gray-500">Total Listings</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Gavel className="w-6 h-6 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.activeAuctions}</p>
            <p className="text-sm text-gray-500">Live Auctions</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
            <p className="text-sm text-gray-500">Registered Users</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.pendingTransactions}</p>
            <p className="text-sm text-gray-500">Pending Deals</p>
          </div>
        </div>
      </div>
    </div>
  )
}
