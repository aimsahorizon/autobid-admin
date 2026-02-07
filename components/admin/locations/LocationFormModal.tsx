'use client'

import { useState, useEffect } from 'react'
import { X, Save, Loader2 } from 'lucide-react'
import { locationService } from '@/lib/supabase/locations'
import { AddrRegion, AddrProvince, AddrCity, AddrBarangay } from '@/lib/types/database'

type LocationType = 'regions' | 'provinces' | 'cities' | 'barangays'

interface LocationFormModalProps {
  isOpen: boolean
  onClose: () => void
  type: LocationType
  parentId?: string
  editItem?: AddrRegion | AddrProvince | AddrCity | AddrBarangay | null
  onSuccess: () => void
}

export default function LocationFormModal({ 
  isOpen, 
  onClose, 
  type, 
  parentId, 
  editItem, 
  onSuccess 
}: LocationFormModalProps) {
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (editItem) {
      setName(editItem.name)
      if (type === 'regions' && 'code' in editItem) {
        setCode((editItem as AddrRegion).code || '')
      }
    } else {
      setName('')
      setCode('')
    }
    setError(null)
  }, [editItem, type, isOpen])

  if (!isOpen) return null

  const getTitle = () => {
    const action = editItem ? 'Edit' : 'Add'
    const entity = type.slice(0, -1).replace(/^\w/, c => c.toUpperCase())
    return `${action} ${entity}`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setLoading(true)
    setError(null)

    try {
      if (editItem) {
        // Update
        if (type === 'regions') {
          await locationService.updateRegion(editItem.id, { name, code: code || null })
        } else if (type === 'provinces') {
          await locationService.updateProvince(editItem.id, { name })
        } else if (type === 'cities') {
          await locationService.updateCity(editItem.id, { name })
        } else if (type === 'barangays') {
          await locationService.updateBarangay(editItem.id, { name })
        }
      } else {
        // Create
        if (type === 'regions') {
          await locationService.createRegion(name, code || '')
        } else if (type === 'provinces' && parentId) {
          await locationService.createProvince(parentId, name)
        } else if (type === 'cities' && parentId) {
          await locationService.createCity(parentId, name)
        } else if (type === 'barangays' && parentId) {
          await locationService.createBarangay(parentId, name)
        } else {
          throw new Error('Parent ID is missing')
        }
      }
      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">{getTitle()}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
              placeholder={`Enter ${type.slice(0, -1)} name`}
              required
            />
          </div>

          {type === 'regions' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Region Code (Optional)
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
                placeholder="e.g. NCR, IX"
              />
            </div>
          )}

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
