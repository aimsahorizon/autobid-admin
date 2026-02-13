import { createClient } from '@/lib/supabase/client'
import { AddrRegion, AddrProvince, AddrCity, AddrBarangay } from '@/lib/types/database'

export const locationService = {
  // --- Regions ---
  async getRegions() {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('addr_regions')
      .select('*')
      .order('name')
    if (error) throw error
    return data as AddrRegion[]
  },

  async createRegion(name: string, code: string) {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('addr_regions')
      .insert({ name, code, is_active: true })
      .select()
      .single()
    if (error) throw error
    return data as AddrRegion
  },

  async updateRegion(id: string, updates: Partial<AddrRegion>) {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('addr_regions')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data as AddrRegion
  },

  async deleteRegion(id: string) {
    const supabase = createClient()
    const { error } = await supabase.from('addr_regions').delete().eq('id', id)
    if (error) throw error
  },

  // --- Provinces ---
  async getProvinces(regionId: string) {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('addr_provinces')
      .select('*')
      .eq('region_id', regionId)
      .order('name')
    if (error) throw error
    return data as AddrProvince[]
  },

  async createProvince(regionId: string, name: string) {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('addr_provinces')
      .insert({ region_id: regionId, name, is_active: true })
      .select()
      .single()
    if (error) throw error
    return data as AddrProvince
  },

  async updateProvince(id: string, updates: Partial<AddrProvince>) {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('addr_provinces')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data as AddrProvince
  },

  async deleteProvince(id: string) {
    const supabase = createClient()
    const { error } = await supabase.from('addr_provinces').delete().eq('id', id)
    if (error) throw error
  },

  // --- Cities ---
  async getCities(provinceId: string) {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('addr_cities')
      .select('*')
      .eq('province_id', provinceId)
      .order('name')
    if (error) throw error
    return data as AddrCity[]
  },

  async createCity(provinceId: string, name: string) {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('addr_cities')
      .insert({ province_id: provinceId, name, is_active: true })
      .select()
      .single()
    if (error) throw error
    return data as AddrCity
  },

  async updateCity(id: string, updates: Partial<AddrCity>) {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('addr_cities')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data as AddrCity
  },

  async deleteCity(id: string) {
    const supabase = createClient()
    const { error } = await supabase.from('addr_cities').delete().eq('id', id)
    if (error) throw error
  },

  // --- Barangays ---
  async getBarangays(cityId: string) {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('addr_barangays')
      .select('*')
      .eq('city_id', cityId)
      .order('name')
    if (error) throw error
    return data as AddrBarangay[]
  },

  async createBarangay(cityId: string, name: string) {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('addr_barangays')
      .insert({ city_id: cityId, name, is_active: true })
      .select()
      .single()
    if (error) throw error
    return data as AddrBarangay
  },

  async updateBarangay(id: string, updates: Partial<AddrBarangay>) {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('addr_barangays')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data as AddrBarangay
  },

  async deleteBarangay(id: string) {
    const supabase = createClient()
    const { error } = await supabase.from('addr_barangays').delete().eq('id', id)
    if (error) throw error
  },

  // --- Bulk Import Helper ---
  async bulkImport(data: { region: string; province: string; city: string; barangay: string }[]) {
    const supabase = createClient()
    
    // This is a simplified sequential implementation. 
    // For 42k rows, a more optimized approach (batching, upserts) would be better, 
    // but this ensures integrity for the "Admin Tool" usage pattern.
    // We'll trust the user to upload reasonable chunks or we'll handle it slowly.
    
    // Actually, let's try to be a bit smarter to avoid N+1 queries for everything.
    // Fetch all existing regions/provinces/cities to cache IDs?
    // Given the constraints and likely usage (importing a region at a time),
    // we can optimize by checking existence or using ON CONFLICT if constraints exist.
    // However, I don't know if unique constraints exist on 'name'. 
    // Assuming names are unique per parent.
    
    // Let's do a robust sequential check-or-create for now to be safe.
    
    const results = {
      success: 0,
      errors: [] as string[]
    }

    for (const row of data) {
      try {
        // 1. Region
        let regionId: string
        const { data: existingRegion } = await supabase
          .from('addr_regions')
          .select('id')
          .ilike('name', row.region)
          .single()
        
        if (existingRegion) {
          regionId = existingRegion.id
        } else {
          const { data: newRegion, error: rError } = await supabase
            .from('addr_regions')
            .insert({ name: row.region, is_active: true })
            .select('id')
            .single()
          if (rError) throw rError
          regionId = newRegion.id
        }

        // 2. Province
        let provinceId: string
        const { data: existingProvince } = await supabase
          .from('addr_provinces')
          .select('id')
          .eq('region_id', regionId)
          .ilike('name', row.province)
          .single()
        
        if (existingProvince) {
          provinceId = existingProvince.id
        } else {
          const { data: newProvince, error: pError } = await supabase
            .from('addr_provinces')
            .insert({ region_id: regionId, name: row.province, is_active: true })
            .select('id')
            .single()
          if (pError) throw pError
          provinceId = newProvince.id
        }

        // 3. City
        let cityId: string
        const { data: existingCity } = await supabase
          .from('addr_cities')
          .select('id')
          .eq('province_id', provinceId)
          .ilike('name', row.city)
          .single()
        
        if (existingCity) {
          cityId = existingCity.id
        } else {
          const { data: newCity, error: cError } = await supabase
            .from('addr_cities')
            .insert({ province_id: provinceId, name: row.city, is_active: true })
            .select('id')
            .single()
          if (cError) throw cError
          cityId = newCity.id
        }

        // 4. Barangay
        // Check if exists
        const { data: existingBarangay } = await supabase
            .from('addr_barangays')
            .select('id')
            .eq('city_id', cityId)
            .ilike('name', row.barangay)
            .single()
            
        if (!existingBarangay) {
             const { error: bError } = await supabase
            .from('addr_barangays')
            .insert({ city_id: cityId, name: row.barangay, is_active: true })
            if (bError) throw bError
        }
       
        results.success++
      } catch (e: any) {
        console.error('Import error row:', row, e)
        results.errors.push(`Row ${row.barangay}: ${e.message}`)
      }
    }
    return results
  }
}
