'use client'

import { useState, useTransition } from 'react'
import { Plus, Pencil, Trash2, Loader2, Filter } from 'lucide-react'
import DataTable from '@/components/ui/DataTable'
import Modal from '@/components/ui/Modal'
import { VehicleModel, VehicleVariant } from '@/lib/types/database'
import { createVariant, updateVariant, deleteVariant } from './actions'
import { useRouter } from 'next/navigation'

interface VariantsTabProps {
  variants: VehicleVariant[]
  models: VehicleModel[]
}

export default function VariantsTab({ variants, models }: VariantsTabProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [searchQuery, setSearchQuery] = useState('')
  const [modelFilter, setModelFilter] = useState('all')
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'delete' | null>(null)
  const [selectedVariant, setSelectedVariant] = useState<VehicleVariant | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Form State
  const [formData, setFormData] = useState({
    model_id: '',
    name: '',
    transmission: 'Automatic',
    fuel_type: 'Gasoline',
    is_active: true
  })

  const transmissionTypes = ['Automatic', 'Manual', 'CVT', 'DCT', 'Semi-Automatic']
  const fuelTypes = ['Gasoline', 'Diesel', 'Hybrid', 'Electric', 'LPG', 'CNG']

  const filteredVariants = variants.filter(v => {
    const matchesSearch = v.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (v.vehicle_models?.name || '').toLowerCase().includes(searchQuery.toLowerCase())
    const matchesModel = modelFilter === 'all' || v.model_id === modelFilter
    return matchesSearch && matchesModel
  })

  const openCreateModal = () => {
    setFormData({ 
      model_id: models[0]?.id || '', 
      name: '', 
      transmission: 'Automatic', 
      fuel_type: 'Gasoline', 
      is_active: true 
    })
    setModalMode('create')
    setError(null)
  }

  const openEditModal = (variant: VehicleVariant) => {
    setSelectedVariant(variant)
    setFormData({ 
      model_id: variant.model_id, 
      name: variant.name, 
      transmission: variant.transmission,
      fuel_type: variant.fuel_type,
      is_active: variant.is_active 
    })
    setModalMode('edit')
    setError(null)
  }

  const openDeleteModal = (variant: VehicleVariant) => {
    setSelectedVariant(variant)
    setModalMode('delete')
    setError(null)
  }

  const closeModal = () => {
    setModalMode(null)
    setSelectedVariant(null)
    setFormData({ model_id: '', name: '', transmission: 'Automatic', fuel_type: 'Gasoline', is_active: true })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const data = new FormData()
    data.append('model_id', formData.model_id)
    data.append('name', formData.name)
    data.append('transmission', formData.transmission)
    data.append('fuel_type', formData.fuel_type)
    data.append('is_active', String(formData.is_active))

    startTransition(async () => {
      try {
        if (modalMode === 'create') {
          await createVariant(data)
        } else if (modalMode === 'edit' && selectedVariant) {
          data.append('id', selectedVariant.id)
          await updateVariant(data)
        }
        router.refresh()
        closeModal()
      } catch (err: any) {
        setError(err.message || 'Something went wrong')
      }
    })
  }

  const handleDelete = async () => {
    if (!selectedVariant) return

    startTransition(async () => {
      try {
        await deleteVariant(selectedVariant.id)
        router.refresh()
        closeModal()
      } catch (err: any) {
        setError(err.message || 'Something went wrong')
      }
    })
  }

  // Helper to display Brand - Model
  const getModelDisplayName = (model: VehicleModel) => {
    return `${model.vehicle_brands?.name || 'Unknown'} - ${model.name}`
  }

  // Sort models for dropdown
  const sortedModels = [...models].sort((a, b) => 
    getModelDisplayName(a).localeCompare(getModelDisplayName(b))
  )

  const columns = [
    { key: 'name', header: 'Variant Name', className: 'font-medium' },
    { 
      key: 'model', 
      header: 'Model', 
      render: (variant: VehicleVariant) => (
        <span className="font-medium text-gray-700">
           {variant.vehicle_models ? getModelDisplayName(variant.vehicle_models) : 'Unknown'}
        </span>
      )
    },
    { key: 'transmission', header: 'Transmission' },
    { key: 'fuel_type', header: 'Fuel Type' },
    {
      key: 'status',
      header: 'Status',
      render: (variant: VehicleVariant) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          variant.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
        }`}>
          {variant.is_active ? 'Active' : 'Inactive'}
        </span>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: (variant: VehicleVariant) => (
        <div className="flex items-center justify-end gap-2">
          <button 
            onClick={() => openEditModal(variant)}
            className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button 
            onClick={() => openDeleteModal(variant)}
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-gray-900">Vehicle Variants</h2>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded-lg">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={modelFilter}
              onChange={(e) => setModelFilter(e.target.value)}
              className="text-sm bg-transparent border-none focus:ring-0 text-gray-700 outline-none max-w-[200px]"
            >
              <option value="all">All Models</option>
              {sortedModels.map(m => (
                <option key={m.id} value={m.id}>{getModelDisplayName(m)}</option>
              ))}
            </select>
          </div>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Variant
        </button>
      </div>

      <DataTable 
        data={filteredVariants}
        columns={columns}
        onSearch={(q) => setSearchQuery(q)}
        searchPlaceholder="Search variants..."
      />

      {/* Create/Edit Modal */}
      <Modal
        isOpen={modalMode === 'create' || modalMode === 'edit'}
        onClose={closeModal}
        title={modalMode === 'create' ? 'Add New Variant' : 'Edit Variant'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg">
              {error}
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Model
            </label>
            <select
              required
              value={formData.model_id}
              onChange={(e) => setFormData({ ...formData, model_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
            >
              <option value="" disabled>Select a model</option>
              {sortedModels.map(m => (
                <option key={m.id} value={m.id}>{getModelDisplayName(m)}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Variant Name
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
              placeholder="e.g. 2.0 G"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                Transmission
                </label>
                <select
                value={formData.transmission}
                onChange={(e) => setFormData({ ...formData, transmission: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                >
                {transmissionTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                ))}
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                Fuel Type
                </label>
                <select
                value={formData.fuel_type}
                onChange={(e) => setFormData({ ...formData, fuel_type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                >
                {fuelTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                ))}
                </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active_variant"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
            />
            <label htmlFor="is_active_variant" className="text-sm font-medium text-gray-700">
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
              {modalMode === 'create' ? 'Create Variant' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={modalMode === 'delete'}
        onClose={closeModal}
        title="Delete Variant"
        maxWidth="max-w-sm"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to delete <strong>{selectedVariant?.name}</strong>? This action cannot be undone.
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
