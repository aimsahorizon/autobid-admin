'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export interface ActionResult {
  success: boolean
  error?: string
  data?: unknown
}

export async function bulkDeleteListings(listingIds: string[], type: 'soft' | 'hard'): Promise<ActionResult> {
  try {
    const supabase = createAdminClient()

    if (listingIds.length === 0) {
      return { success: false, error: 'No valid listings to delete' }
    }

    if (type === 'soft') {
      // Soft delete: Set status to 'cancelled' (same as auctions)
      const { data: cancelledStatus } = await supabase
        .from('auction_statuses')
        .select('id')
        .eq('status_name', 'cancelled')
        .single()

      if (!cancelledStatus) {
        throw new Error('Cancelled status not found')
      }

      const { error } = await supabase
        .from('auctions') // Listings are auctions
        .update({ status_id: cancelledStatus.id, updated_at: new Date().toISOString() })
        .in('id', listingIds)

      if (error) throw error
    } else {
      // Hard delete
      const { error } = await supabase
        .from('auctions')
        .delete()
        .in('id', listingIds)

      if (error) throw error
    }

    revalidatePath('/admin/listings')
    revalidatePath('/admin/auctions')
    return { success: true }
  } catch (err) {
    console.error('Bulk delete listings error:', err)
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error occurred' }
  }
}

export async function deleteAllListings(type: 'soft' | 'hard'): Promise<ActionResult> {
  try {
    const supabase = createAdminClient()
    
    if (type === 'soft') {
      const { data: cancelledStatus } = await supabase
        .from('auction_statuses')
        .select('id')
        .eq('status_name', 'cancelled')
        .single()

      if (!cancelledStatus) throw new Error('Cancelled status not found')

      const { error } = await supabase
        .from('auctions')
        .update({ status_id: cancelledStatus.id, updated_at: new Date().toISOString() })
        .neq('status_id', cancelledStatus.id)

      if (error) throw error
    } else {
      const { error } = await supabase
        .from('auctions')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all
      
      if (error) throw error
    }

    revalidatePath('/admin/listings')
    revalidatePath('/admin/auctions')
    return { success: true }
  } catch (err) {
    console.error('Delete all listings error:', err)
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error occurred' }
  }
}
