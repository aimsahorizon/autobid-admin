import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Mail, Calendar, Shield, CheckCircle, XCircle, User } from 'lucide-react'
import StatusBadge from '@/components/ui/StatusBadge'

interface PageProps {
  params: Promise<{ id: string }>
}

async function getUser(id: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('users')
    .select(`
      id,
      email,
      username,
      full_name,
      first_name,
      last_name,
      middle_name,
      date_of_birth,
      sex,
      profile_image_url,
      profile_photo_url,
      cover_photo_url,
      is_verified,
      is_active,
      created_at,
      last_login_at,
      role_id,
      user_roles (id, role_name, display_name),
      kyc_documents (
        id,
        kyc_statuses (status_name)
      )
    `)
    .eq('id', id)
    .single()

  if (error || !data) return null

  return {
    ...data,
    user_roles: Array.isArray(data.user_roles) ? data.user_roles[0] || null : data.user_roles,
    kyc_documents: (data.kyc_documents || []).map((doc: Record<string, unknown>) => ({
      ...doc,
      kyc_statuses: Array.isArray(doc.kyc_statuses) ? doc.kyc_statuses[0] || null : doc.kyc_statuses,
    })),
  }
}

async function getUserListings(userId: string) {
  const supabase = await createClient()

  const { data } = await supabase
    .from('auctions')
    .select(`
      id,
      title,
      starting_price,
      current_price,
      total_bids,
      created_at,
      auction_statuses (status_name, display_name),
      auction_vehicles (brand, model, year)
    `)
    .eq('seller_id', userId)
    .order('created_at', { ascending: false })
    .limit(20)

  return (data || []).map((item: Record<string, unknown>) => ({
    ...item,
    auction_statuses: Array.isArray(item.auction_statuses) ? item.auction_statuses[0] || null : item.auction_statuses,
    auction_vehicles: Array.isArray(item.auction_vehicles) ? item.auction_vehicles[0] || null : item.auction_vehicles,
  }))
}

export default async function UserDetailPage({ params }: PageProps) {
  const { id } = await params
  const [user, listings] = await Promise.all([getUser(id), getUserListings(id)])

  if (!user) notFound()

  const kycStatus = user.kyc_documents?.[0]?.kyc_statuses?.status_name || 'none'

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '—'
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Manila',
    })
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <Link
          href="/admin/users"
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Users
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">User Profile</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: User Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                <span className="text-purple-700 font-bold text-xl">
                  {user.full_name?.charAt(0)?.toUpperCase() || user.email.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{user.full_name || 'Unnamed User'}</h2>
                <p className="text-gray-500">{user.email}</p>
                {user.username && <p className="text-sm text-gray-400">@{user.username}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <InfoField icon={<Mail className="w-4 h-4" />} label="Email" value={user.email} />
              <InfoField icon={<User className="w-4 h-4" />} label="First Name" value={user.first_name || '—'} />
              <InfoField icon={<User className="w-4 h-4" />} label="Last Name" value={user.last_name || '—'} />
              {user.middle_name && (
                <InfoField icon={<User className="w-4 h-4" />} label="Middle Name" value={user.middle_name} />
              )}
              <InfoField icon={<Calendar className="w-4 h-4" />} label="Date of Birth" value={user.date_of_birth || '—'} />
              <InfoField icon={<User className="w-4 h-4" />} label="Sex" value={user.sex ? user.sex.charAt(0).toUpperCase() + user.sex.slice(1) : '—'} />
              <InfoField icon={<Shield className="w-4 h-4" />} label="Role" value={user.user_roles?.display_name || '—'} />
              <InfoField icon={<Calendar className="w-4 h-4" />} label="Joined" value={formatDate(user.created_at)} />
              <InfoField icon={<Calendar className="w-4 h-4" />} label="Last Login" value={formatDate(user.last_login_at)} />
            </div>
          </div>

          {/* Listings */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-900">Listings ({listings.length})</h2>
            </div>
            {listings.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {listings.map((listing: Record<string, unknown>) => {
                  const vehicle = listing.auction_vehicles as Record<string, unknown> | null
                  const status = listing.auction_statuses as Record<string, string> | null
                  const title = vehicle
                    ? `${vehicle.year || ''} ${vehicle.brand || ''} ${vehicle.model || ''}`.trim()
                    : (listing.title as string) || 'Untitled'
                  return (
                    <Link
                      key={listing.id as string}
                      href={`/admin/listings/${listing.id}`}
                      className="flex items-center justify-between px-6 py-3 hover:bg-gray-50 transition-colors"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">{title}</p>
                        <p className="text-xs text-gray-500">{formatDate(listing.created_at as string)}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-700">
                          ₱{((listing.current_price as number) || (listing.starting_price as number) || 0).toLocaleString()}
                        </span>
                        {status && <StatusBadge status={status.status_name} />}
                      </div>
                    </Link>
                  )
                })}
              </div>
            ) : (
              <div className="px-6 py-8 text-center text-gray-400">No listings found</div>
            )}
          </div>
        </div>

        {/* Right: Status Cards */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Status</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Verified</span>
                {user.is_verified ? (
                  <span className="flex items-center gap-1 text-green-600 text-sm font-medium">
                    <CheckCircle className="w-4 h-4" /> Yes
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-red-600 text-sm font-medium">
                    <XCircle className="w-4 h-4" /> No
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Active</span>
                {user.is_active ? (
                  <span className="flex items-center gap-1 text-green-600 text-sm font-medium">
                    <CheckCircle className="w-4 h-4" /> Yes
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-red-600 text-sm font-medium">
                    <XCircle className="w-4 h-4" /> No
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">KYC</span>
                <StatusBadge status={kycStatus} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">User ID</h3>
            <code className="text-xs font-mono text-gray-700 break-all">{user.id}</code>
          </div>
        </div>
      </div>
    </div>
  )
}

function InfoField({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-xs text-gray-500 uppercase tracking-wide mb-1">
        {icon}
        {label}
      </div>
      <p className="text-sm text-gray-900">{value}</p>
    </div>
  )
}
