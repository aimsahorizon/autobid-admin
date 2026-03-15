'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export interface ActionResult {
  success: boolean
  error?: string
  data?: unknown
}

export async function bulkDeleteAuctions(auctionIds: string[]): Promise<ActionResult> {
  try {
    const supabase = createAdminClient()

    if (auctionIds.length === 0) {
      return { success: false, error: 'No valid auctions to delete' }
    }

    const { error } = await supabase
      .from('auctions')
      .delete()
      .in('id', auctionIds)

    if (error) throw error

    revalidatePath('/admin/auctions')
    revalidatePath('/admin/listings')
    return { success: true }
  } catch (err) {
    console.error('Bulk delete auctions error:', err)
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error occurred' }
  }
}

export async function deleteAllAuctions(): Promise<ActionResult> {
  try {
    const supabase = createAdminClient()

    const { error } = await supabase
      .from('auctions')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')
    
    if (error) throw error

    revalidatePath('/admin/auctions')
    revalidatePath('/admin/listings')
    return { success: true }
  } catch (err) {
    console.error('Delete all auctions error:', err)
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error occurred' }
  }
}
