'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface UserFormData {
  email: string
  password?: string
  full_name: string
  username: string
  first_name: string
  last_name: string
  middle_name?: string
  date_of_birth: string
  sex: 'male' | 'female'
  role_id: string | null
  is_verified: boolean
  is_active: boolean
}

export interface ActionResult {
  success: boolean
  error?: string
  data?: unknown
}

export async function createUser(formData: UserFormData): Promise<ActionResult> {
  try {
    const supabase = createAdminClient()

    // Generate display_name from name components
    const displayName = formData.middle_name
      ? `${formData.first_name} ${formData.middle_name} ${formData.last_name}`
      : `${formData.first_name} ${formData.last_name}`

    // First, create the auth user using Supabase Auth Admin API
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: formData.email,
      password: formData.password || generateTempPassword(),
      email_confirm: formData.is_verified,
      user_metadata: {
        full_name: formData.full_name,
        display_name: displayName,
        username: formData.username,
      },
    })

    if (authError) {
      console.error('Auth error:', authError)
      return { success: false, error: authError.message }
    }

    if (!authData.user) {
      return { success: false, error: 'Failed to create auth user' }
    }

    // Now insert into the users table with all required fields
    const { data, error: dbError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email: formData.email,
        username: formData.username,
        full_name: formData.full_name,
        display_name: displayName,
        first_name: formData.first_name,
        last_name: formData.last_name,
        middle_name: formData.middle_name || null,
        date_of_birth: formData.date_of_birth,
        sex: formData.sex,
        role_id: formData.role_id || null,
        is_verified: formData.is_verified,
        is_active: formData.is_active,
      })
      .select()
      .single()

    if (dbError) {
      // Rollback: delete the auth user if db insert fails
      await supabase.auth.admin.deleteUser(authData.user.id)
      console.error('DB error:', dbError)
      return { success: false, error: dbError.message }
    }

    revalidatePath('/admin/users')
    return { success: true, data }
  } catch (err) {
    console.error('Create user error:', err)
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error occurred' }
  }
}

export async function updateUser(
  userId: string,
  formData: Partial<UserFormData>
): Promise<ActionResult> {
  try {
    const supabase = createAdminClient()

    // Build update object with only provided fields
    const updateData: Record<string, unknown> = {}

    if (formData.full_name !== undefined) updateData.full_name = formData.full_name
    if (formData.first_name !== undefined) updateData.first_name = formData.first_name
    if (formData.last_name !== undefined) updateData.last_name = formData.last_name
    if (formData.middle_name !== undefined) updateData.middle_name = formData.middle_name || null
    if (formData.role_id !== undefined) updateData.role_id = formData.role_id || null
    if (formData.is_verified !== undefined) updateData.is_verified = formData.is_verified
    if (formData.is_active !== undefined) updateData.is_active = formData.is_active

    // Recalculate display_name if name components changed
    if (formData.first_name || formData.last_name || formData.middle_name !== undefined) {
      // Fetch current user data to get missing name parts
      const { data: currentUser } = await supabase
        .from('users')
        .select('first_name, last_name, middle_name')
        .eq('id', userId)
        .single()

      if (currentUser) {
        const firstName = formData.first_name ?? currentUser.first_name
        const lastName = formData.last_name ?? currentUser.last_name
        const middleName = formData.middle_name !== undefined ? formData.middle_name : currentUser.middle_name

        updateData.display_name = middleName
          ? `${firstName} ${middleName} ${lastName}`
          : `${firstName} ${lastName}`
        updateData.full_name = updateData.display_name
      }
    }

    updateData.updated_at = new Date().toISOString()

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      console.error('Update error:', error)
      return { success: false, error: error.message }
    }

    // Update auth user metadata if name changed
    if (formData.full_name || formData.first_name || formData.last_name) {
      await supabase.auth.admin.updateUserById(userId, {
        user_metadata: {
          full_name: data.full_name,
          display_name: data.display_name,
        },
      })
    }

    // Update auth user email verification status
    if (formData.is_verified !== undefined) {
      await supabase.auth.admin.updateUserById(userId, {
        email_confirm: formData.is_verified,
      })
    }

    revalidatePath('/admin/users')
    return { success: true, data }
  } catch (err) {
    console.error('Update user error:', err)
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error occurred' }
  }
}

export async function deleteUser(userId: string): Promise<ActionResult> {
  try {
    const supabase = createAdminClient()

    // =========================================================================
    // STEP 1: Handle foreign key constraints that don't have CASCADE
    // These tables reference users but have RESTRICT or no action specified
    // =========================================================================

    // 1. transaction_timeline.actor_id - Set to NULL (audit log should be preserved)
    const { error: timelineError } = await supabase
      .from('transaction_timeline')
      .update({ actor_id: null })
      .eq('actor_id', userId)

    if (timelineError) {
      console.error('Error clearing transaction_timeline actor_id:', timelineError)
      // Continue anyway - may not exist
    }

    // 2. kyc_documents.reviewed_by - Set to NULL (already SET NULL in schema, but being explicit)
    const { error: kycReviewError } = await supabase
      .from('kyc_documents')
      .update({ reviewed_by: null })
      .eq('reviewed_by', userId)

    if (kycReviewError) {
      console.error('Error clearing kyc_documents reviewed_by:', kycReviewError)
    }

    // 3. payments.verified_by - Set to NULL (already SET NULL in schema)
    const { error: paymentsError } = await supabase
      .from('payments')
      .update({ verified_by: null })
      .eq('verified_by', userId)

    if (paymentsError) {
      console.error('Error clearing payments verified_by:', paymentsError)
    }

    // 4. admin_users.created_by - Set to NULL (already SET NULL in schema)
    const { error: adminCreatedByError } = await supabase
      .from('admin_users')
      .update({ created_by: null })
      .eq('created_by', userId)

    if (adminCreatedByError) {
      console.error('Error clearing admin_users created_by:', adminCreatedByError)
    }

    // =========================================================================
    // STEP 2: Delete from users table
    // This will cascade delete all related records with ON DELETE CASCADE:
    // - kyc_documents (user_id)
    // - user_addresses
    // - user_preferences
    // - auctions (seller_id) -> which cascades to auction_images, auction_watchers, etc.
    // - auction_watchers (user_id)
    // - bids (bidder_id)
    // - auto_bid_settings (user_id)
    // - transactions (user_id)
    // - deposits (user_id)
    // - payments (buyer_id)
    // - seller_payouts (seller_id)
    // - auction_questions (user_id)
    // - auction_answers (seller_id)
    // - chat_rooms (buyer_id, seller_id)
    // - chat_messages (sender_id)
    // - notifications (user_id)
    // - admin_users (user_id)
    // - reported_content (reporter_id)
    // - auction_transactions (seller_id, buyer_id)
    // - transaction_chat_messages (sender_id)
    // =========================================================================

    const { error: dbError } = await supabase
      .from('users')
      .delete()
      .eq('id', userId)

    if (dbError) {
      console.error('DB delete error:', dbError)
      return { success: false, error: `Failed to delete user: ${dbError.message}` }
    }

    // =========================================================================
    // STEP 3: Delete the auth user
    // =========================================================================

    const { error: authError } = await supabase.auth.admin.deleteUser(userId)

    if (authError) {
      console.error('Auth delete error:', authError)
      // Note: The user is already deleted from the users table at this point
      // We log but don't fail since the main data is already cleaned up
    }

    revalidatePath('/admin/users')
    return { success: true }
  } catch (err) {
    console.error('Delete user error:', err)
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error occurred' }
  }
}

export async function toggleUserStatus(
  userId: string,
  field: 'is_verified' | 'is_active'
): Promise<ActionResult> {
  try {
    const supabase = createAdminClient()

    // Get current value
    const { data: currentUser, error: fetchError } = await supabase
      .from('users')
      .select('is_verified, is_active')
      .eq('id', userId)
      .single()

    if (fetchError || !currentUser) {
      return { success: false, error: 'User not found' }
    }

    const currentValue = currentUser[field] as boolean
    const newValue = !currentValue

    const { error } = await supabase
      .from('users')
      .update({ [field]: newValue, updated_at: new Date().toISOString() })
      .eq('id', userId)

    if (error) {
      return { success: false, error: error.message }
    }

    // If toggling verification, update auth user as well
    if (field === 'is_verified') {
      await supabase.auth.admin.updateUserById(userId, {
        email_confirm: newValue,
      })
    }

    revalidatePath('/admin/users')
    return { success: true, data: { [field]: newValue } }
  } catch (err) {
    console.error('Toggle status error:', err)
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error occurred' }
  }
}

export async function bulkDeleteUsers(userIds: string[], type: 'soft' | 'hard'): Promise<ActionResult> {
  try {
    const supabase = createAdminClient()
    const supabaseUser = await createClient()
    const { data: { user: currentUser } } = await supabaseUser.auth.getUser()

    // Filter out current user from deletion list to prevent self-deletion
    const targetIds = userIds.filter(id => id !== currentUser?.id)

    if (targetIds.length === 0) {
      return { success: false, error: 'No valid users to delete' }
    }

    if (type === 'soft') {
      const { error } = await supabase
        .from('users')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .in('id', targetIds)

      if (error) throw error
    } else {
      // Hard delete
      // 1. Clear foreign keys references
      await Promise.all([
        supabase.from('transaction_timeline').update({ actor_id: null }).in('actor_id', targetIds),
        supabase.from('kyc_documents').update({ reviewed_by: null }).in('reviewed_by', targetIds),
        supabase.from('payments').update({ verified_by: null }).in('verified_by', targetIds),
        supabase.from('admin_users').update({ created_by: null }).in('created_by', targetIds),
      ])

      // 2. Delete from users table (cascades)
      const { error: dbError } = await supabase
        .from('users')
        .delete()
        .in('id', targetIds)

      if (dbError) throw dbError

      // 3. Delete auth users
      // Note: Supabase Admin API doesn't support bulk delete of auth users efficiently in one call usually,
      // but we can loop or use a custom function if available. For now, we'll loop in parallel.
      await Promise.all(targetIds.map(id => supabase.auth.admin.deleteUser(id)))
    }

    revalidatePath('/admin/users')
    return { success: true }
  } catch (err) {
    console.error('Bulk delete error:', err)
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error occurred' }
  }
}

export async function deleteAllUsers(type: 'soft' | 'hard'): Promise<ActionResult> {
  try {
    const supabase = createAdminClient()
    const supabaseUser = await createClient()
    const { data: { user: currentUser } } = await supabaseUser.auth.getUser()

    if (type === 'soft') {
      const { error } = await supabase
        .from('users')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .neq('id', currentUser?.id || '') // protect current user

      if (error) throw error
    } else {
      // Fetch all user IDs except current user
      const { data: users, error: fetchError } = await supabase
        .from('users')
        .select('id')
        .neq('id', currentUser?.id || '')
      
      if (fetchError) throw fetchError
      if (!users || users.length === 0) return { success: true }

      const targetIds = users.map(u => u.id)

      // Call bulk delete to reuse logic
      return await bulkDeleteUsers(targetIds, 'hard')
    }

    revalidatePath('/admin/users')
    return { success: true }
  } catch (err) {
    console.error('Delete all error:', err)
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error occurred' }
  }
}

// Helper function to generate a temporary password
function generateTempPassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%'
  let password = ''
  for (let i = 0; i < 16; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}
