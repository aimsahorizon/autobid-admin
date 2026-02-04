'use client'

import { useState, useTransition } from 'react'
import { Plus, Pencil, Trash2, Loader2, Filter } from 'lucide-react'
import DataTable from '@/components/ui/DataTable'
import Modal from '@/components/ui/Modal'
import { VehicleBrand, VehicleModel } from '@/lib/types/database'
import { createModel, updateModel, deleteModel } from './actions'
import { useRouter } from 'next/navigation'

interface ModelsTabProps {
  models: VehicleModel[]
  brands: VehicleBrand[]
}

export default function ModelsTab({ models, brands }: ModelsTabProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [searchQuery, setSearchQuery] = useState('')
  const [brandFilter, setBrandFilter] = useState('all')
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'delete' | null>(null)
  const [selectedModel, setSelectedModel] = useState<VehicleModel | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Form State
  const [formData, setFormData] = useState({
    brand_id: '',
    name: '',
    body_type: 'Sedan',
    is_active: true
  })

  // Body types list could be dynamic or constant
  const bodyTypes = ['Sedan', 'SUV', 'Hatchback', 'Coupe', 'Convertible', 'Van', 'Truck', 'Wagon', 'Crossover', 'MPV']

  const filteredModels = models.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (m.vehicle_brands?.name || '').toLowerCase().includes(searchQuery.toLowerCase())
    const matchesBrand = brandFilter === 'all' || m.brand_id === brandFilter
    return matchesSearch && matchesBrand
  })

  const openCreateModal = () => {
    setFormData({ brand_id: brands[0]?.id || '', name: '', body_type: 'Sedan', is_active: true })
    setModalMode('create')
    setError(null)
  }

  const openEditModal = (model: VehicleModel) => {
    setSelectedModel(model)
    setFormData({ 
      brand_id: model.brand_id, 
      name: model.name, 
      body_type: model.body_type, 
      is_active: model.is_active 
    })
    setModalMode('edit')
    setError(null)
  }

  const openDeleteModal = (model: VehicleModel) => {
    setSelectedModel(model)
    setModalMode('delete')
    setError(null)
  }

  const closeModal = () => {
    setModalMode(null)
    setSelectedModel(null)
    setFormData({ brand_id: '', name: '', body_type: 'Sedan', is_active: true })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const data = new FormData()
    data.append('brand_id', formData.brand_id)
    data.append('name', formData.name)
    data.append('body_type', formData.body_type)
    data.append('is_active', String(formData.is_active))

    startTransition(async () => {
      try {
        if (modalMode === 'create') {
          await createModel(data)
        } else if (modalMode === 'edit' && selectedModel) {
          data.append('id', selectedModel.id)
          await updateModel(data)
        }
        router.refresh()
        closeModal()
      } catch (err: any) {
        setError(err.message || 'Something went wrong')
      }
    })
  }

  const handleDelete = async () => {
    if (!selectedModel) return

    startTransition(async () => {
      try {
        await deleteModel(selectedModel.id)
        router.refresh()
        closeModal()
      } catch (err: any) {
        setError(err.message || 'Something went wrong')
      }
    })
  }

  const columns = [
    { key: 'name', header: 'Model Name', className: 'font-medium' },
    { 
      key: 'brand', 
      header: 'Brand', 
      render: (model: VehicleModel) => (
        <span className="font-medium text-gray-700">{model.vehicle_brands?.name || 'Unknown'}</span>
      )
    },
    { key: 'body_type', header: 'Body Type' },
    {
      key: 'status',
      header: 'Status',
      render: (model: VehicleModel) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          model.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
        }`}>
          {model.is_active ? 'Active' : 'Inactive'}
        </span>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: (model: VehicleModel) => (
        <div className="flex items-center justify-end gap-2">
          <button 
            onClick={() => openEditModal(model)}
            className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button 
            onClick={() => openDeleteModal(model)}
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
          <h2 className="text-lg font-semibold text-gray-900">Vehicle Models</h2>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded-lg">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={brandFilter}
              onChange={(e) => setBrandFilter(e.target.value)}
              className="text-sm bg-transparent border-none focus:ring-0 text-gray-700 outline-none"
            >
              <option value="all">All Brands</option>
              {brands.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Model
        </button>
      </div>

      <DataTable 
        data={filteredModels}
        columns={columns}
        onSearch={(q) => setSearchQuery(q)}
        searchPlaceholder="Search models..."
      />

      {/* Create/Edit Modal */}
      <Modal
        isOpen={modalMode === 'create' || modalMode === 'edit'}
        onClose={closeModal}
        title={modalMode === 'create' ? 'Add New Model' : 'Edit Model'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg">
              {error}
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Brand
            </label>
            <select
              required
              value={formData.brand_id}
              onChange={(e) => setFormData({ ...formData, brand_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
            >
              <option value="" disabled>Select a brand</option>
              {brands.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Model Name
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
              placeholder="e.g. Camry"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Body Type
            </label>
            <select
              value={formData.body_type}
              onChange={(e) => setFormData({ ...formData, body_type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
            >
              {bodyTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active_model"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
            />
            <label htmlFor="is_active_model" className="text-sm font-medium text-gray-700">
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
              {modalMode === 'create' ? 'Create Model' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={modalMode === 'delete'}
        onClose={closeModal}
        title="Delete Model"
        maxWidth="max-w-sm"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to delete <strong>{selectedModel?.name}</strong>? This action cannot be undone.
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
