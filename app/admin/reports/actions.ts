'use server'

import { revalidatePath } from 'next/cache'
import { updateReport } from '@/lib/supabase/reports'

export interface UpdateReportData {
  status?: 'pending' | 'reviewing' | 'resolved' | 'dismissed'
  admin_notes?: string
}

export interface ActionResult {
  success: boolean
  error?: string
  data?: unknown
}

export async function updateReportStatus(
  reportId: string,
  data: UpdateReportData
): Promise<ActionResult> {
  try {
    const result = await updateReport(reportId, data)

    if (!result.success) {
      return { success: false, error: result.error }
    }

    revalidatePath('/admin/reports')
    revalidatePath(`/admin/reports/${reportId}`)
    return { success: true, data: result.data }
  } catch (err) {
    console.error('Update report error:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error occurred',
    }
  }
}
