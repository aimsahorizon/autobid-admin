'use client'

import { useState, useTransition } from 'react'
import Image from 'next/image'
import { Plus, Pencil, Trash2, Search, Loader2 } from 'lucide-react'
import DataTable from '@/components/ui/DataTable'
import Modal from '@/components/ui/Modal'
import { VehicleBrand } from '@/lib/types/database'
import { createBrand, updateBrand, deleteBrand } from './actions'
import { useRouter } from 'next/navigation'

interface BrandsTabProps {
  brands: VehicleBrand[]
}

export default function BrandsTab({ brands }: BrandsTabProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [searchQuery, setSearchQuery] = useState('')
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'delete' | null>(null)
  const [selectedBrand, setSelectedBrand] = useState<VehicleBrand | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    is_active: true,
    logo: null as File | null
  })

  const filteredBrands = brands.filter(b => 
    b.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const openCreateModal = () => {
    setFormData({ name: '', is_active: true, logo: null })
    setModalMode('create')
    setError(null)
  }

  const openEditModal = (brand: VehicleBrand) => {
    setSelectedBrand(brand)
    setFormData({ name: brand.name, is_active: brand.is_active, logo: null })
    setModalMode('edit')
    setError(null)
  }

  const openDeleteModal = (brand: VehicleBrand) => {
    setSelectedBrand(brand)
    setModalMode('delete')
    setError(null)
  }

  const closeModal = () => {
    setModalMode(null)
    setSelectedBrand(null)
    setFormData({ name: '', is_active: true, logo: null })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const data = new FormData()
    data.append('name', formData.name)
    data.append('is_active', String(formData.is_active))
    if (formData.logo) {
      data.append('logo', formData.logo)
    }

    startTransition(async () => {
      try {
        if (modalMode === 'create') {
          await createBrand(data)
        } else if (modalMode === 'edit' && selectedBrand) {
          data.append('id', selectedBrand.id)
          await updateBrand(data)
        }
        router.refresh()
        closeModal()
        // router.refresh() is handled by the action's revalidatePath, 
        // but explicit refresh ensures client state sync if needed.
      } catch (err: any) {
        setError(err.message || 'Something went wrong')
      }
    })
  }

  const handleDelete = async () => {
    if (!selectedBrand) return

    startTransition(async () => {
      try {
        await deleteBrand(selectedBrand.id)
        router.refresh()
        closeModal()
      } catch (err: any) {
        setError(err.message || 'Something went wrong')
      }
    })
  }

  const columns = [
    {
      key: 'logo',
      header: 'Logo',
      render: (brand: VehicleBrand) => (
        <div className="w-10 h-10 relative bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
          {brand.logo_url ? (
            <Image 
              src={brand.logo_url} 
              alt={brand.name} 
              fill 
              className="object-contain p-1"
            />
          ) : (
            <span className="text-xs text-gray-400">No Logo</span>
          )}
        </div>
      )
    },
    { key: 'name', header: 'Name', className: 'font-medium' },
    {
      key: 'status',
      header: 'Status',
      render: (brand: VehicleBrand) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          brand.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
        }`}>
          {brand.is_active ? 'Active' : 'Inactive'}
        </span>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: (brand: VehicleBrand) => (
        <div className="flex items-center justify-end gap-2">
          <button 
            onClick={() => openEditModal(brand)}
            className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button 
            onClick={() => openDeleteModal(brand)}
            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Vehicle Brands</h2>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Brand
        </button>
      </div>

      <DataTable 
        data={filteredBrands}
        columns={columns}
        onSearch={(q) => setSearchQuery(q)}
        searchPlaceholder="Search brands..."
      />

      {/* Create/Edit Modal */}
      <Modal
        isOpen={modalMode === 'create' || modalMode === 'edit'}
        onClose={closeModal}
        title={modalMode === 'create' ? 'Add New Brand' : 'Edit Brand'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg">
              {error}
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Brand Name
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
              placeholder="e.g. Toyota"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Logo
            </label>
            <div className="flex items-center gap-4">
              {selectedBrand?.logo_url && !formData.logo && (
                 <div className="w-12 h-12 relative bg-gray-100 rounded-lg overflow-hidden">
                    <Image src={selectedBrand.logo_url} alt="Current" fill className="object-contain p-1" />
                 </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFormData({ ...formData, logo: e.target.files?.[0] || null })}
                className="flex-1 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
            />
            <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
              Active Status
            </label>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              {modalMode === 'create' ? 'Create Brand' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={modalMode === 'delete'}
        onClose={closeModal}
        title="Delete Brand"
        maxWidth="max-w-sm"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to delete <strong>{selectedBrand?.name}</strong>? This action cannot be undone.
          </p>
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg">
              {error}
            </div>
          )}
          <div className="flex justify-end gap-3">
            <button
              onClick={closeModal}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={isPending}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
