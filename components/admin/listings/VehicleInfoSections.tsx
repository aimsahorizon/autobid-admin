'use client'

import { ListingDetailModel } from '@/lib/types/listing-detail'
import { Car, Cog, Ruler, Palette, FileText, MapPin, AlertTriangle, Tag } from 'lucide-react'

interface VehicleInfoSectionsProps {
  listing: ListingDetailModel
}

export default function VehicleInfoSections({ listing }: VehicleInfoSectionsProps) {
  const formatNumber = (num: number | null) => num?.toLocaleString() ?? '—'
  const displayValue = (value: string | number | null) => value ?? '—'

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Car className="w-5 h-5 text-gray-400" />
          Basic Information
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <InfoField label="Brand" value={displayValue(listing.brand)} />
          <InfoField label="Model" value={displayValue(listing.model)} />
          <InfoField label="Variant" value={displayValue(listing.variant)} />
          <InfoField label="Body Type" value={displayValue(listing.body_type)} />
          <InfoField label="Year" value={displayValue(listing.year)} />
        </div>
      </div>

      {/* Mechanical Specification */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Cog className="w-5 h-5 text-gray-400" />
          Mechanical Specification
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <InfoField label="Engine Type" value={displayValue(listing.engine_type)} />
          <InfoField 
            label="Engine Displacement" 
            value={listing.engine_displacement ? `${listing.engine_displacement}L` : '—'} 
          />
          <InfoField label="Cylinder Count" value={displayValue(listing.cylinder_count)} />
          <InfoField 
            label="Horsepower" 
            value={listing.horsepower ? `${listing.horsepower} hp` : '—'} 
          />
          <InfoField 
            label="Torque" 
            value={listing.torque ? `${listing.torque} Nm` : '—'} 
          />
          <InfoField label="Transmission" value={displayValue(listing.transmission)} />
          <InfoField label="Fuel Type" value={displayValue(listing.fuel_type)} />
          <InfoField label="Drive Type" value={displayValue(listing.drive_type)} />
        </div>
      </div>

      {/* Dimensions & Capacity */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Ruler className="w-5 h-5 text-gray-400" />
          Dimensions & Capacity
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <InfoField 
            label="Length" 
            value={listing.length ? `${formatNumber(listing.length)} mm` : '—'} 
          />
          <InfoField 
            label="Width" 
            value={listing.width ? `${formatNumber(listing.width)} mm` : '—'} 
          />
          <InfoField 
            label="Height" 
            value={listing.height ? `${formatNumber(listing.height)} mm` : '—'} 
          />
          <InfoField 
            label="Wheelbase" 
            value={listing.wheelbase ? `${formatNumber(listing.wheelbase)} mm` : '—'} 
          />
          <InfoField 
            label="Ground Clearance" 
            value={listing.ground_clearance ? `${formatNumber(listing.ground_clearance)} mm` : '—'} 
          />
          <InfoField label="Seating Capacity" value={displayValue(listing.seating_capacity)} />
          <InfoField label="Door Count" value={displayValue(listing.door_count)} />
          <InfoField 
            label="Fuel Tank Capacity" 
            value={listing.fuel_tank_capacity ? `${listing.fuel_tank_capacity} L` : '—'} 
          />
          <InfoField 
            label="Curb Weight" 
            value={listing.curb_weight ? `${formatNumber(listing.curb_weight)} kg` : '—'} 
          />
          <InfoField 
            label="Gross Weight" 
            value={listing.gross_weight ? `${formatNumber(listing.gross_weight)} kg` : '—'} 
          />
        </div>
      </div>

      {/* Exterior Details */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Palette className="w-5 h-5 text-gray-400" />
          Exterior Details
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <InfoField label="Exterior Color" value={displayValue(listing.exterior_color)} />
          <InfoField label="Paint Type" value={displayValue(listing.paint_type)} />
          <InfoField label="Rim Type" value={displayValue(listing.rim_type)} />
          <InfoField label="Rim Size" value={displayValue(listing.rim_size)} />
          <InfoField label="Tire Size" value={displayValue(listing.tire_size)} />
          <InfoField label="Tire Brand" value={displayValue(listing.tire_brand)} />
        </div>
      </div>

      {/* Condition & History */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-gray-400" />
          Condition & History
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <InfoField 
            label="Condition" 
            value={displayValue(listing.condition)}
            badge
          />
          <InfoField 
            label="Mileage" 
            value={listing.mileage ? `${formatNumber(listing.mileage)} km` : '—'} 
          />
          <InfoField label="Previous Owners" value={displayValue(listing.previous_owners)} />
          <InfoField label="Usage Type" value={displayValue(listing.usage_type)} />
          <InfoField 
            label="Has Modifications" 
            value={listing.has_modifications ? 'Yes' : 'No'}
            boolean={true}
          />
          <InfoField 
            label="Has Warranty" 
            value={listing.has_warranty ? 'Yes' : 'No'}
            boolean={true}
          />
        </div>
        
        {listing.has_modifications && listing.modifications_details && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs font-medium text-blue-700 mb-1">Modifications Details:</p>
            <p className="text-sm text-blue-900 whitespace-pre-wrap">{listing.modifications_details}</p>
          </div>
        )}
        
        {listing.has_warranty && listing.warranty_details && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-xs font-medium text-green-700 mb-1">Warranty Details:</p>
            <p className="text-sm text-green-900 whitespace-pre-wrap">{listing.warranty_details}</p>
          </div>
        )}
      </div>

      {/* Documentation & Location */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-gray-400" />
          Documentation & Location
        </h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Documentation</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <InfoField 
                label="Plate Number" 
                value={listing.plate_number ? listing.plate_number.toUpperCase() : '—'}
                mono
              />
              <InfoField label="OR/CR Status" value={displayValue(listing.orcr_status)} badge />
              <InfoField label="Registration Status" value={displayValue(listing.registration_status)} badge />
              <InfoField 
                label="Registration Expiry" 
                value={listing.registration_expiry 
                  ? new Date(listing.registration_expiry).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                  : '—'
                }
                expired={listing.registration_expiry ? new Date(listing.registration_expiry) < new Date() : undefined}
              />
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Location</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <InfoField label="Province" value={displayValue(listing.province)} />
              <InfoField label="City/Municipality" value={displayValue(listing.city_municipality)} />
              <InfoField label="Barangay" value={displayValue(listing.barangay)} />
            </div>
            <p className="mt-3 text-sm text-gray-600">
              {[listing.barangay, listing.city_municipality, listing.province]
                .filter(Boolean)
                .join(', ') || '—'}
            </p>
          </div>
        </div>
      </div>

      {/* Description & Features */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Tag className="w-5 h-5 text-gray-400" />
          Description & Features
        </h2>

        {listing.description && (
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Description</h3>
            <p className="text-gray-600 whitespace-pre-wrap">{listing.description}</p>
          </div>
        )}

        {listing.known_issues && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-yellow-700 mb-1">Known Issues:</p>
                <p className="text-sm text-yellow-900 whitespace-pre-wrap">{listing.known_issues}</p>
              </div>
            </div>
          </div>
        )}

        {listing.features && listing.features.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Features</h3>
            <div className="flex flex-wrap gap-2">
              {listing.features.map((feature, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-purple-100 text-purple-700 text-sm font-medium rounded-full"
                >
                  {feature}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function InfoField({ 
  label, 
  value, 
  badge, 
  boolean, 
  mono, 
  expired 
}: { 
  label: string
  value: string | number
  badge?: boolean
  boolean?: boolean
  mono?: boolean
  expired?: boolean
}) {
  return (
    <div className="bg-gray-50 rounded-lg p-3">
      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{label}</p>
      {badge ? (
        <span className="inline-flex px-2 py-0.5 bg-gray-200 text-gray-700 text-sm font-medium rounded">
          {String(value)}
        </span>
      ) : boolean ? (
        <span
          className={`inline-flex px-2 py-0.5 text-sm font-semibold rounded ${
            value === 'Yes' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'
          }`}
        >
          {String(value)}
        </span>
      ) : mono ? (
        <code className="font-mono text-sm font-medium text-gray-900">{String(value)}</code>
      ) : expired ? (
        <p className={`font-medium ${expired ? 'text-red-600' : 'text-gray-900'}`}>
          {String(value)}
          {expired && <span className="ml-2 text-xs">(Expired)</span>}
        </p>
      ) : (
        <p className="font-medium text-gray-900">{String(value)}</p>
      )}
    </div>
  )
}
