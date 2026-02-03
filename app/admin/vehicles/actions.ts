'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// --- BRANDS ---

export async function getBrands() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('vehicle_brands')
    .select('*')
    .order('name')
  
  if (error) throw new Error(error.message)
  return data
}

export async function createBrand(formData: FormData) {
  const supabase = await createClient()
  const name = formData.get('name') as string
  const isActive = formData.get('is_active') === 'true'
  const logoFile = formData.get('logo') as File | null

  let logoUrl = null

  if (logoFile && logoFile.size > 0) {
    const fileName = `${Date.now()}-${logoFile.name.replace(/[^a-zA-Z0-9.]/g, '')}`
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('vehicle-logos')
      .upload(fileName, logoFile)

    if (uploadError) {
        // Try to create bucket if it doesn't exist (basic error handling)
        if (uploadError.message.includes('bucket not found')) {
            await supabase.storage.createBucket('vehicle-logos', { public: true })
            // Retry upload
             const { data: retryData, error: retryError } = await supabase.storage
                .from('vehicle-logos')
                .upload(fileName, logoFile)
             
             if (retryError) throw new Error('Failed to upload logo: ' + retryError.message)
             const { data: { publicUrl } } = supabase.storage.from('vehicle-logos').getPublicUrl(fileName)
             logoUrl = publicUrl
        } else {
            throw new Error('Failed to upload logo: ' + uploadError.message)
        }
    } else {
        const { data: { publicUrl } } = supabase.storage.from('vehicle-logos').getPublicUrl(fileName)
        logoUrl = publicUrl
    }
  }

  const { error } = await supabase
    .from('vehicle_brands')
    .insert({
      name,
      is_active: isActive,
      logo_url: logoUrl
    })

  if (error) throw new Error(error.message)
  revalidatePath('/admin/vehicles')
}

export async function updateBrand(formData: FormData) {
  const supabase = await createClient()
  const id = formData.get('id') as string
  const name = formData.get('name') as string
  const isActive = formData.get('is_active') === 'true'
  const logoFile = formData.get('logo') as File | null

  const updates: any = {
    name,
    is_active: isActive
  }

  if (logoFile && logoFile.size > 0) {
     const fileName = `${Date.now()}-${logoFile.name.replace(/[^a-zA-Z0-9.]/g, '')}`
    const { error: uploadError } = await supabase.storage
      .from('vehicle-logos')
      .upload(fileName, logoFile)

    if (uploadError) throw new Error('Failed to upload logo: ' + uploadError.message)
    
    const { data: { publicUrl } } = supabase.storage.from('vehicle-logos').getPublicUrl(fileName)
    updates.logo_url = publicUrl
  }

  const { error } = await supabase
    .from('vehicle_brands')
    .update(updates)
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/admin/vehicles')
}

export async function deleteBrand(id: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('vehicle_brands')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/admin/vehicles')
}

// --- MODELS ---

export async function getModels(brandId?: string) {
  const supabase = await createClient()
  let query = supabase
    .from('vehicle_models')
    .select(`
      *,
      vehicle_brands (name)
    `)
    .order('name')

  if (brandId && brandId !== 'all') {
    query = query.eq('brand_id', brandId)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data
}

export async function createModel(formData: FormData) {
  const supabase = await createClient()
  const brand_id = formData.get('brand_id') as string
  const name = formData.get('name') as string
  const body_type = formData.get('body_type') as string
  const is_active = formData.get('is_active') === 'true'

  const { error } = await supabase
    .from('vehicle_models')
    .insert({ brand_id, name, body_type, is_active })

  if (error) throw new Error(error.message)
  revalidatePath('/admin/vehicles')
}

export async function updateModel(formData: FormData) {
  const supabase = await createClient()
  const id = formData.get('id') as string
  const brand_id = formData.get('brand_id') as string
  const name = formData.get('name') as string
  const body_type = formData.get('body_type') as string
  const is_active = formData.get('is_active') === 'true'

  const { error } = await supabase
    .from('vehicle_models')
    .update({ brand_id, name, body_type, is_active })
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/admin/vehicles')
}

export async function deleteModel(id: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('vehicle_models')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/admin/vehicles')
}

// --- VARIANTS ---

export async function getVariants(modelId?: string) {
  const supabase = await createClient()
  let query = supabase
    .from('vehicle_variants')
    .select(`
      *,
      vehicle_models (
        name,
        vehicle_brands (name)
      )
    `)
    .order('name')

  if (modelId && modelId !== 'all') {
    query = query.eq('model_id', modelId)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data
}

export async function createVariant(formData: FormData) {
  const supabase = await createClient()
  const model_id = formData.get('model_id') as string
  const name = formData.get('name') as string
  const transmission = formData.get('transmission') as string
  const fuel_type = formData.get('fuel_type') as string
  const is_active = formData.get('is_active') === 'true'

  const { error } = await supabase
    .from('vehicle_variants')
    .insert({ model_id, name, transmission, fuel_type, is_active })

  if (error) throw new Error(error.message)
  revalidatePath('/admin/vehicles')
}

export async function updateVariant(formData: FormData) {
  const supabase = await createClient()
  const id = formData.get('id') as string
  const model_id = formData.get('model_id') as string
  const name = formData.get('name') as string
  const transmission = formData.get('transmission') as string
  const fuel_type = formData.get('fuel_type') as string
  const is_active = formData.get('is_active') === 'true'

  const { error } = await supabase
    .from('vehicle_variants')
    .update({ model_id, name, transmission, fuel_type, is_active })
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/admin/vehicles')
}

export async function deleteVariant(id: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('vehicle_variants')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/admin/vehicles')
}
