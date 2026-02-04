'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export interface ActionResult {
  success: boolean
  error?: string
  data?: unknown
}

export async function bulkDeleteAuctions(auctionIds: string[], type: 'soft' | 'hard'): Promise<ActionResult> {
  try {
    const supabase = createAdminClient()

    if (auctionIds.length === 0) {
      return { success: false, error: 'No valid auctions to delete' }
    }

    if (type === 'soft') {
      // Soft delete: Set status to 'cancelled'
      const { data: cancelledStatus } = await supabase
        .from('auction_statuses')
        .select('id')
        .eq('status_name', 'cancelled')
        .single()

      if (!cancelledStatus) {
        throw new Error('Cancelled status not found')
      }

      const { error } = await supabase
        .from('auctions')
        .update({ status_id: cancelledStatus.id, updated_at: new Date().toISOString() })
        .in('id', auctionIds)

      if (error) throw error
    } else {
      // Hard delete: DELETE from auctions table (cascades to bids, photos, etc.)
      const { error } = await supabase
        .from('auctions')
        .delete()
        .in('id', auctionIds)

      if (error) throw error
    }

    revalidatePath('/admin/auctions')
    revalidatePath('/admin/listings')
    return { success: true }
  } catch (err) {
    console.error('Bulk delete auctions error:', err)
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error occurred' }
  }
}

export async function deleteAllAuctions(type: 'soft' | 'hard'): Promise<ActionResult> {
  try {
    const supabase = createAdminClient()

    // Get IDs of auctions visible in the "Auctions" page (live, scheduled, ended, pending_approval)
    // Or should it delete ALL auctions? 
    // Usually "Delete All" on a filtered page implies deleting all matching the context.
    // However, for safety and clarity, let's fetch the IDs that would be displayed and delete them.
    // But waiting... "Delete All" usually means "Everything in the database" if not filtered.
    // Given the prompt "delete at once all the auctionn and listings", I'll implement it to delete ALL auctions in the DB.
    
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
        // We update ALL records that are not already cancelled? Or just all? 
        // Updating all is safer for "Delete All".
        .neq('status_id', cancelledStatus.id) 

      if (error) throw error
    } else {
      const { error } = await supabase
        .from('auctions')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000') // Hack to delete all (Supabase requires a WHERE clause usually or explicit permissions)
      
      if (error) throw error
    }

    revalidatePath('/admin/auctions')
    revalidatePath('/admin/listings')
    return { success: true }
  } catch (err) {
    console.error('Delete all auctions error:', err)
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error occurred' }
  }
}
