import { createClient } from '@/lib/supabase/server'
import { TransactionReport } from '@/lib/types/database'

// Helper to transform Supabase relation arrays to single objects
function transformReport<T extends Record<string, unknown>>(report: T) {
  return {
    ...report,
    reporter: Array.isArray(report.reporter) 
      ? report.reporter[0] || null 
      : report.reporter,
    reported_user: Array.isArray(report.reported_user) 
      ? report.reported_user[0] || null 
      : report.reported_user,
    transaction: Array.isArray(report.transaction) 
      ? report.transaction[0] || null 
      : report.transaction,
  }
}

/**
 * Fetch all transaction reports with user and transaction details
 */
export async function getAllReports() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('transaction_reports')
    .select(`
      *,
      reporter:reporter_id (
        id,
        full_name,
        email,
        username
      ),
      reported_user:reported_user_id (
        id,
        full_name,
        email,
        username
      ),
      transaction:transaction_id (
        id,
        auction_id,
        agreed_price,
        status
      )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching reports:', error)
    return []
  }

  return (data || []).map(transformReport) as TransactionReport[]
}

/**
 * Fetch reports filtered by status
 */
export async function getReportsByStatus(status: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('transaction_reports')
    .select(`
      *,
      reporter:reporter_id (
        id,
        full_name,
        email,
        username
      ),
      reported_user:reported_user_id (
        id,
        full_name,
        email,
        username
      ),
      transaction:transaction_id (
        id,
        auction_id,
        agreed_price,
        status
      )
    `)
    .eq('status', status)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching reports by status:', error)
    return []
  }

  return (data || []).map(transformReport) as TransactionReport[]
}

/**
 * Fetch a single report by ID with all details
 */
export async function getReportById(reportId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('transaction_reports')
    .select(`
      *,
      reporter:reporter_id (
        id,
        full_name,
        email,
        username,
        profile_image_url,
        profile_photo_url
      ),
      reported_user:reported_user_id (
        id,
        full_name,
        email,
        username,
        profile_image_url,
        profile_photo_url
      ),
      transaction:transaction_id (
        id,
        auction_id,
        agreed_price,
        status,
        seller_id,
        buyer_id,
        seller_confirmed,
        buyer_confirmed,
        admin_approved,
        created_at
      )
    `)
    .eq('id', reportId)
    .single()

  if (error) {
    console.error('Error fetching report:', error)
    return null
  }

  return transformReport(data) as TransactionReport
}

/**
 * Get count of pending reports
 */
export async function getPendingReportsCount() {
  const supabase = await createClient()

  const { count, error } = await supabase
    .from('transaction_reports')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending')

  if (error) {
    console.error('Error fetching pending reports count:', error)
    return 0
  }

  return count || 0
}

/**
 * Update report status and admin notes
 */
export async function updateReport(
  reportId: string,
  updates: { status?: string; admin_notes?: string }
) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('transaction_reports')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', reportId)
    .select()
    .single()

  if (error) {
    console.error('Error updating report:', error)
    return { success: false, error: error.message }
  }

  return { success: true, data }
}
