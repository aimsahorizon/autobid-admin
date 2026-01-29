import { createClient } from '@/lib/supabase/server'
import TransactionsClient from './TransactionsClient'

// Helper to transform Supabase relation arrays to single objects
function transformTransaction<T extends Record<string, unknown>>(data: T) {
  const auctions = data.auctions as Record<string, unknown>[] | Record<string, unknown> | null
  const seller = data.seller as Record<string, unknown>[] | Record<string, unknown> | null
  const buyer = data.buyer as Record<string, unknown>[] | Record<string, unknown> | null

  let transformedAuctions = Array.isArray(auctions) ? auctions[0] || null : auctions
  if (transformedAuctions) {
    transformedAuctions = {
      ...transformedAuctions,
      auction_vehicles: Array.isArray(transformedAuctions.auction_vehicles)
        ? transformedAuctions.auction_vehicles[0] || null
        : transformedAuctions.auction_vehicles,
    }
  }

  return {
    ...data,
    auctions: transformedAuctions,
    seller: Array.isArray(seller) ? seller[0] || null : seller,
    buyer: Array.isArray(buyer) ? buyer[0] || null : buyer,
  }
}

async function getTransactionStats() {
  const supabase = await createClient()

  const [
    { count: pendingReview },
    { count: inProgress },
    { count: completed },
    { count: failed },
  ] = await Promise.all([
    supabase
      .from('auction_transactions')
      .select('*', { count: 'exact', head: true })
      .eq('admin_approved', false)
      .eq('seller_confirmed', true)
      .eq('buyer_confirmed', true),
    supabase
      .from('auction_transactions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'in_transaction'),
    supabase
      .from('auction_transactions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'sold'),
    supabase
      .from('auction_transactions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'deal_failed'),
  ])

  return {
    pendingReview: pendingReview || 0,
    inProgress: inProgress || 0,
    completed: completed || 0,
    failed: failed || 0,
  }
}

async function getTransactions() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('auction_transactions')
    .select(`
      id,
      agreed_price,
      status,
      seller_form_submitted,
      buyer_form_submitted,
      seller_confirmed,
      buyer_confirmed,
      admin_approved,
      admin_notes,
      created_at,
      completed_at,
      auctions (
        id,
        title,
        auction_vehicles (brand, model, year),
        auction_photos (photo_url, is_primary)
      ),
      seller:users!auction_transactions_seller_id_fkey (id, full_name, email),
      buyer:users!auction_transactions_buyer_id_fkey (id, full_name, email)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching transactions:', error)
    return []
  }

  // Fetch transaction forms for each transaction
  const transactionsWithForms = await Promise.all(
    (data || []).map(async (tx) => {
      const { data: forms } = await supabase
        .from('transaction_forms')
        .select('*')
        .eq('transaction_id', tx.id)

      return {
        ...transformTransaction(tx),
        forms: forms || [],
      }
    })
  )

  return transactionsWithForms
}

export default async function TransactionsPage() {
  const [stats, transactions] = await Promise.all([getTransactionStats(), getTransactions()])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
        <p className="text-gray-500 mt-1">Manage auction transactions and deals</p>
      </div>

      <TransactionsClient initialTransactions={transactions} stats={stats} />
    </div>
  )
}
