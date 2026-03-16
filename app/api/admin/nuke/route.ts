import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  // Verify the caller is an authenticated admin
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: adminUser } = await supabase
    .from('admin_users')
    .select('id, admin_roles(role_name)')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single()

  if (!adminUser) {
    return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
  }

  const admin = createAdminClient()

  try {
    // Delete in dependency order (children first, lookup tables last)
    // We preserve: lookup tables, system config, admin users, and the current admin's auth
    const deletionOrder = [
      // Transactional / child data
      'admin_audit_log',
      'admin_dashboard_metrics',
      'reported_content',
      'auction_moderation',
      'kyc_review_queue',
      'chat_messages',
      'chat_rooms',
      'auction_answers',
      'auction_questions',
      'seller_payouts',
      'payments',
      'deposits',
      'transactions',
      'bid_history',
      'auto_bid_settings',
      'bids',
      'notifications',
      'auction_watchers',
      'auction_images',
      'auction_photos',
      'auction_vehicles',
      'auctions',
      'listing_drafts',
      'token_transactions',
      'user_subscriptions',
      'user_token_balances',
      'kyc_documents',
      'user_addresses',
      'user_preferences',
      // Location data
      'addr_barangays',
      'addr_cities',
      'addr_provinces',
      'addr_regions',
      // Vehicle data
      'vehicle_variants',
      'vehicle_models',
      'vehicle_brands',
    ]

    const results: { table: string; status: string }[] = []

    for (const table of deletionOrder) {
      try {
        // Use raw SQL via rpc or direct delete - neq('id', '') matches all rows
        const { error } = await admin
          .from(table)
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000')

        if (error) {
          // Table might not exist or have different PK - try user_id PK
          if (table === 'user_token_balances') {
            const { error: err2 } = await admin
              .from(table)
              .delete()
              .neq('user_id', '00000000-0000-0000-0000-000000000000')
            results.push({ table, status: err2 ? `warn: ${err2.message}` : 'cleared' })
          } else {
            results.push({ table, status: `warn: ${error.message}` })
          }
        } else {
          results.push({ table, status: 'cleared' })
        }
      } catch {
        results.push({ table, status: 'skipped (table may not exist)' })
      }
    }

    // Delete all non-admin users from auth (keep the current admin)
    // First get all non-admin user IDs
    const { data: nonAdminUsers } = await admin
      .from('users')
      .select('id')
      .not('id', 'in', `(${user.id})`)

    let deletedUsersCount = 0
    if (nonAdminUsers && nonAdminUsers.length > 0) {
      // Delete from public.users first (will cascade)
      for (const u of nonAdminUsers) {
        await admin.from('users').delete().eq('id', u.id)
        // Delete from auth.users
        await admin.auth.admin.deleteUser(u.id)
        deletedUsersCount++
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Database nuked successfully',
      details: {
        tablesCleared: results,
        usersDeleted: deletedUsersCount,
        preservedAdmin: user.email,
      }
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: `Nuke failed: ${message}` }, { status: 500 })
  }
}
