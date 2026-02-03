'use client'

import { useState } from 'react'
import { VehicleBrand, VehicleModel, VehicleVariant } from '@/lib/types/database'
import BrandsTab from './BrandsTab'
import ModelsTab from './ModelsTab'
import VariantsTab from './VariantsTab'

interface VehiclesClientProps {
  initialBrands: VehicleBrand[]
  initialModels: VehicleModel[]
  initialVariants: VehicleVariant[]
}

export default function VehiclesClient({
  initialBrands,
  initialModels,
  initialVariants
}: VehiclesClientProps) {
  const [activeTab, setActiveTab] = useState<'brands' | 'models' | 'variants'>('brands')

  const tabs = [
    { id: 'brands', label: 'Brands' },
    { id: 'models', label: 'Models' },
    { id: 'variants', label: 'Variants' },
  ] as const

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Vehicle Database</h1>
        <p className="text-gray-500">Manage vehicle brands, models, and variants for listings.</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${activeTab === tab.id
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
              `}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="animate-in fade-in duration-300">
        {activeTab === 'brands' && (
          <BrandsTab brands={initialBrands} />
        )}
        {activeTab === 'models' && (
          <ModelsTab models={initialModels} brands={initialBrands} />
        )}
        {activeTab === 'variants' && (
          <VariantsTab variants={initialVariants} models={initialModels} />
        )}
      </div>
    </div>
  )
}
