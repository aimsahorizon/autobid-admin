import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import TransactionDetailClient from './TransactionDetailClient'

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

async function getTransaction(id: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('auction_transactions')
    .select(`
      id,
      auction_id,
      agreed_price,
      status,
      seller_form_submitted,
      buyer_form_submitted,
      seller_confirmed,
      buyer_confirmed,
      admin_approved,
      admin_notes,
      reviewed_by,
      created_at,
      updated_at,
      completed_at,
      auctions (
        id,
        title,
        auction_vehicles (brand, model, year, transmission, fuel_type, mileage),
        auction_photos (photo_url, is_primary)
      ),
      seller:users!auction_transactions_seller_id_fkey (id, full_name, email, phone_number, profile_image_url),
      buyer:users!auction_transactions_buyer_id_fkey (id, full_name, email, phone_number, profile_image_url)
    `)
    .eq('id', id)
    .single()

  if (error || !data) return null
  return transformTransaction(data)
}

async function getTransactionForms(transactionId: string) {
  const supabase = await createClient()

  const { data } = await supabase
    .from('transaction_forms')
    .select('*')
    .eq('transaction_id', transactionId)

  return data || []
}

async function getTransactionTimeline(transactionId: string) {
  const supabase = await createClient()

  const { data } = await supabase
    .from('transaction_timeline')
    .select('*')
    .eq('transaction_id', transactionId)
    .order('created_at', { ascending: false })

  return data || []
}

async function getTransactionChat(transactionId: string) {
  const supabase = await createClient()

  const { data } = await supabase
    .from('transaction_chat_messages')
    .select('*')
    .eq('transaction_id', transactionId)
    .order('created_at', { ascending: true })
    .limit(50)

  return data || []
}

export default async function TransactionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [transaction, forms, timeline, chat] = await Promise.all([
    getTransaction(id),
    getTransactionForms(id),
    getTransactionTimeline(id),
    getTransactionChat(id),
  ])

  if (!transaction) {
    notFound()
  }

  return (
    <TransactionDetailClient
      transaction={transaction}
      forms={forms}
      timeline={timeline}
      chat={chat}
    />
  )
}
