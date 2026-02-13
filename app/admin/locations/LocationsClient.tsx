'use client'

import { useState, useEffect } from 'react'
import { locationService } from '@/lib/supabase/locations'
import { AddrRegion, AddrProvince, AddrCity, AddrBarangay } from '@/lib/types/database'
import { 
  ChevronRight, 
  Plus, 
  Upload, 
  MapPin, 
  Search, 
  ArrowLeft,
  Loader2,
  Trash2,
  Edit,
  CheckCircle,
  XCircle
} from 'lucide-react'
import ImportModal from '@/components/admin/locations/ImportModal'
import LocationFormModal from '@/components/admin/locations/LocationFormModal'

type ViewLevel = 'regions' | 'provinces' | 'cities' | 'barangays'

export default function LocationsClient() {
  // Navigation State
  const [viewLevel, setViewLevel] = useState<ViewLevel>('regions')
  const [selectedRegion, setSelectedRegion] = useState<AddrRegion | null>(null)
  const [selectedProvince, setSelectedProvince] = useState<AddrProvince | null>(null)
  const [selectedCity, setSelectedCity] = useState<AddrCity | null>(null)

  // Data State
  const [regions, setRegions] = useState<AddrRegion[]>([])
  const [provinces, setProvinces] = useState<AddrProvince[]>([])
  const [cities, setCities] = useState<AddrCity[]>([])
  const [barangays, setBarangays] = useState<AddrBarangay[]>([])
  
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  
  // Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)

  // Fetch Data
  useEffect(() => {
    fetchData()
  }, [viewLevel, selectedRegion, selectedProvince, selectedCity])

  const fetchData = async () => {
    setLoading(true)
    try {
      if (viewLevel === 'regions') {
        const data = await locationService.getRegions()
        setRegions(data)
      } else if (viewLevel === 'provinces' && selectedRegion) {
        const data = await locationService.getProvinces(selectedRegion.id)
        setProvinces(data)
      } else if (viewLevel === 'cities' && selectedProvince) {
        const data = await locationService.getCities(selectedProvince.id)
        setCities(data)
      } else if (viewLevel === 'barangays' && selectedCity) {
        const data = await locationService.getBarangays(selectedCity.id)
        setBarangays(data)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Navigation Handlers
  const handleRegionClick = (region: AddrRegion) => {
    setSelectedRegion(region)
    setViewLevel('provinces')
  }

  const handleProvinceClick = (province: AddrProvince) => {
    setSelectedProvince(province)
    setViewLevel('cities')
  }

  const handleCityClick = (city: AddrCity) => {
    setSelectedCity(city)
    setViewLevel('barangays')
  }

  const handleBack = () => {
    if (viewLevel === 'barangays') {
      setViewLevel('cities')
      setSelectedCity(null)
    } else if (viewLevel === 'cities') {
      setViewLevel('provinces')
      setSelectedProvince(null)
    } else if (viewLevel === 'provinces') {
      setViewLevel('regions')
      setSelectedRegion(null)
    }
  }

  // Action Handlers
  const handleAdd = () => {
    setEditingItem(null)
    setIsFormModalOpen(true)
  }

  const handleEdit = (item: any) => {
    setEditingItem(item)
    setIsFormModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this location? This action cannot be undone.')) return

    try {
      if (viewLevel === 'regions') await locationService.deleteRegion(id)
      else if (viewLevel === 'provinces') await locationService.deleteProvince(id)
      else if (viewLevel === 'cities') await locationService.deleteCity(id)
      else if (viewLevel === 'barangays') await locationService.deleteBarangay(id)
      
      fetchData()
    } catch (error) {
      console.error('Delete failed:', error)
      alert('Failed to delete. It may have child records.')
    }
  }

  // Toggle Active Handler
  const handleToggleActive = async (id: string, currentStatus: boolean, type: ViewLevel) => {
    // Optimistic update
    const updateState = (prevItems: any[]) => 
      prevItems.map(item => item.id === id ? { ...item, is_active: !currentStatus } : item)

    try {
      if (type === 'regions') {
        setRegions(updateState)
        await locationService.updateRegion(id, { is_active: !currentStatus })
      } else if (type === 'provinces') {
        setProvinces(updateState)
        await locationService.updateProvince(id, { is_active: !currentStatus })
      } else if (type === 'cities') {
        setCities(updateState)
        await locationService.updateCity(id, { is_active: !currentStatus })
      } else if (type === 'barangays') {
        setBarangays(updateState)
        await locationService.updateBarangay(id, { is_active: !currentStatus })
      }
    } catch (error) {
      console.error('Failed to toggle status:', error)
      fetchData() // Revert on error
    }
  }

  // Breadcrumbs
  const renderBreadcrumbs = () => (
    <div className="flex items-center text-sm text-gray-500 mb-6 overflow-x-auto whitespace-nowrap">
      <button 
        onClick={() => {
          setViewLevel('regions')
          setSelectedRegion(null)
          setSelectedProvince(null)
          setSelectedCity(null)
        }}
        className={`hover:text-purple-600 ${viewLevel === 'regions' ? 'font-semibold text-purple-600' : ''}`}
      >
        Regions
      </button>
      {selectedRegion && (
        <>
          <ChevronRight className="w-4 h-4 mx-2" />
          <button 
            onClick={() => {
              setViewLevel('provinces')
              setSelectedProvince(null)
              setSelectedCity(null)
            }}
            className={`hover:text-purple-600 ${viewLevel === 'provinces' ? 'font-semibold text-purple-600' : ''}`}
          >
            {selectedRegion.name}
          </button>
        </>
      )}
      {selectedProvince && (
        <>
          <ChevronRight className="w-4 h-4 mx-2" />
          <button 
             onClick={() => {
              setViewLevel('cities')
              setSelectedCity(null)
            }}
            className={`hover:text-purple-600 ${viewLevel === 'cities' ? 'font-semibold text-purple-600' : ''}`}
          >
            {selectedProvince.name}
          </button>
        </>
      )}
      {selectedCity && (
        <>
          <ChevronRight className="w-4 h-4 mx-2" />
          <span className="font-semibold text-purple-600">
            {selectedCity.name}
          </span>
        </>
      )}
    </div>
  )

  // List Rendering
  const renderList = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
        </div>
      )
    }

    let items: any[] = []
    if (viewLevel === 'regions') items = regions
    else if (viewLevel === 'provinces') items = provinces
    else if (viewLevel === 'cities') items = cities
    else items = barangays

    // Filter by search
    if (searchQuery) {
      items = items.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
    }

    if (items.length === 0) {
      return (
        <div className="text-center py-20 text-gray-500">
          <MapPin className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>No locations found.</p>
        </div>
      )
    }

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase">
            <tr>
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.map((item) => (
              <tr 
                key={item.id} 
                className="hover:bg-gray-50 transition-colors group cursor-pointer"
                onClick={() => {
                  if (viewLevel === 'regions') handleRegionClick(item)
                  else if (viewLevel === 'provinces') handleProvinceClick(item)
                  else if (viewLevel === 'cities') handleCityClick(item)
                }}
              >
                <td className="px-6 py-4 font-medium text-gray-900 flex items-center gap-3">
                  {item.name}
                  {viewLevel !== 'barangays' && (
                    <ChevronRight className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </td>
                <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => handleToggleActive(item.id, item.is_active, viewLevel)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                      item.is_active
                        ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                        : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {item.is_active ? (
                      <>
                        <CheckCircle className="w-3 h-3" />
                        Active
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3 h-3" />
                        Inactive
                      </>
                    )}
                  </button>
                </td>
                <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="flex justify-end items-center gap-2">
                    <button 
                      onClick={() => handleEdit(item)}
                      className="p-1.5 text-gray-400 hover:text-purple-600 rounded-lg hover:bg-purple-50 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(item.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Location Management</h1>
          <p className="text-sm text-gray-500">Manage operational areas and service availability.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Upload className="w-4 h-4" />
            Bulk Import
          </button>
          <button 
            onClick={handleAdd}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors shadow-sm shadow-purple-200"
          >
            <Plus className="w-4 h-4" />
            Add {viewLevel.slice(0, -1).replace(/^\w/, c => c.toUpperCase())}
          </button>
        </div>
      </div>

      {/* Navigation & Toolbar */}
      <div className="mb-6">
        {renderBreadcrumbs()}
        
        <div className="flex items-center gap-4">
          {viewLevel !== 'regions' && (
            <button 
              onClick={handleBack}
              className="p-2 text-gray-500 hover:text-gray-900 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text"
              placeholder={`Search ${viewLevel}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      {renderList()}

      {/* Modals */}
      {isImportModalOpen && (
        <ImportModal 
          isOpen={isImportModalOpen} 
          onClose={() => {
            setIsImportModalOpen(false)
            fetchData() // Refresh after import
          }} 
        />
      )}
      
      {isFormModalOpen && (
        <LocationFormModal
          isOpen={isFormModalOpen}
          onClose={() => setIsFormModalOpen(false)}
          type={viewLevel}
          parentId={
            viewLevel === 'provinces' ? selectedRegion?.id :
            viewLevel === 'cities' ? selectedProvince?.id :
            viewLevel === 'barangays' ? selectedCity?.id :
            undefined
          }
          editItem={editingItem}
          onSuccess={() => {
            fetchData()
          }}
        />
      )}
    </div>
  )
}
