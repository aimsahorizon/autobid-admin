'use client'

import { useState, useRef } from 'react'
import { X, Upload, FileText, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import { locationService } from '@/lib/supabase/locations'

interface ImportModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function ImportModal({ isOpen, onClose }: ImportModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState<{ total: number; current: number; success: number; errors: string[] } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!isOpen) return null

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setProgress(null)
    }
  }

  const parseCSV = (text: string) => {
    const lines = text.split(/?
/).filter(line => line.trim() !== '')
    const data = []
    
    // Simple parser: assumes Region, Province, City, Barangay order
    // Skips header if "Region" is in the first line
    let startIndex = 0
    if (lines[0].toLowerCase().includes('region')) {
      startIndex = 1
    }

    for (let i = startIndex; i < lines.length; i++) {
      // Handle simple CSV splitting. For robust parsing, a library is better, 
      // but this works for standard export formats without commas in names.
      const parts = lines[i].split(',').map(p => p.trim().replace(/^"(.*)"$/, '$1'))
      
      if (parts.length >= 4) {
        data.push({
          region: parts[0],
          province: parts[1],
          city: parts[2],
          barangay: parts[3]
        })
      }
    }
    return data
  }

  const handleImport = async () => {
    if (!file) return

    setLoading(true)
    setProgress(null)

    try {
      const text = await file.text()
      const data = parseCSV(text)
      
      if (data.length === 0) {
        throw new Error('No valid data found in file. Ensure format is: Region, Province, City, Barangay')
      }

      // Process in chunks to allow progress updates if we were doing client-side chunking,
      // but for now we'll send it all to the service which is implemented simply.
      // In a real large-scale scenario, we'd batch this.
      
      const result = await locationService.bulkImport(data)
      
      setProgress({
        total: data.length,
        current: data.length,
        success: result.success,
        errors: result.errors
      })

    } catch (error: any) {
      setProgress({
        total: 0,
        current: 0,
        success: 0,
        errors: [error.message]
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Bulk Import Locations</h3>
          <button 
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto">
          {!progress ? (
            <div className="space-y-6">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors ${
                  file ? 'border-purple-200 bg-purple-50' : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
                }`}
              >
                <input 
                  ref={fileInputRef}
                  type="file" 
                  accept=".csv,.txt" 
                  className="hidden" 
                  onChange={handleFileChange}
                />
                
                {file ? (
                  <>
                    <FileText className="w-10 h-10 text-purple-600 mb-3" />
                    <p className="font-medium text-gray-900">{file.name}</p>
                    <p className="text-sm text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                  </>
                ) : (
                  <>
                    <Upload className="w-10 h-10 text-gray-400 mb-3" />
                    <p className="font-medium text-gray-900">Click to upload CSV</p>
                    <p className="text-sm text-gray-500 mt-1">Format: Region, Province, City, Barangay</p>
                  </>
                )}
              </div>

              <div className="bg-blue-50 text-blue-700 p-4 rounded-lg text-sm flex gap-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <div>
                  <p className="font-medium mb-1">Import Format Guide</p>
                  <p className="opacity-90">Please ensure your CSV follows this column structure exactly:</p>
                  <code className="block mt-2 bg-blue-100 px-2 py-1 rounded">Region, Province, City, Barangay</code>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-center">
                {loading ? (
                  <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
                ) : (
                  progress.errors.length === 0 ? (
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  ) : (
                    <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                  )
                )}
                
                <h4 className="text-lg font-medium text-gray-900">
                  {loading ? 'Processing Import...' : 'Import Complete'}
                </h4>
                <p className="text-gray-500">
                  {loading 
                    ? `Reading ${progress.total} locations...` 
                    : `Successfully imported ${progress.success} of ${progress.total} items.`}
                </p>
              </div>

              {progress.errors.length > 0 && (
                <div className="bg-red-50 rounded-lg p-4 border border-red-100">
                  <h5 className="text-sm font-medium text-red-800 mb-2">Errors ({progress.errors.length})</h5>
                  <div className="max-h-32 overflow-y-auto text-xs text-red-700 space-y-1">
                    {progress.errors.map((err, i) => (
                      <div key={i}>{err}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {progress && !loading ? 'Close' : 'Cancel'}
          </button>
          
          {!progress && (
            <button 
              onClick={handleImport}
              disabled={!file || loading}
              className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Importing...' : 'Start Import'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
