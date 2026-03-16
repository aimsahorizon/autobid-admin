'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export interface ActionResult {
  success: boolean
  error?: string
  data?: unknown
}

export async function bulkDeleteListings(listingIds: string[]): Promise<ActionResult> {
  try {
    const supabase = createAdminClient()

    if (listingIds.length === 0) {
      return { success: false, error: 'No valid listings to delete' }
    }

    const { error } = await supabase
      .from('auctions')
      .delete()
      .in('id', listingIds)

    if (error) throw error

    revalidatePath('/admin/listings')
    revalidatePath('/admin/auctions')
    return { success: true }
  } catch (err) {
    console.error('Bulk delete listings error:', err)
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error occurred' }
  }
}

export async function deleteAllListings(): Promise<ActionResult> {
  try {
    const supabase = createAdminClient()
    
    const { error } = await supabase
      .from('auctions')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')
    
    if (error) throw error

    revalidatePath('/admin/listings')
    revalidatePath('/admin/auctions')
    return { success: true }
  } catch (err) {
    console.error('Delete all listings error:', err)
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error occurred' }
  }
}
