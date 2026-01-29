import { Loader2 } from 'lucide-react'

export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <Loader2 className="w-10 h-10 text-purple-600 animate-spin mx-auto mb-4" />
        <p className="text-gray-500">Loading...</p>
      </div>
    </div>
  )
}
