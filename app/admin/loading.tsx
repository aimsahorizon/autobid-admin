import { Loader2 } from 'lucide-react'

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
      <div className="relative">
        <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center animate-pulse">
          <Loader2 className="w-6 h-6 text-purple-600 animate-spin" />
        </div>
        <div className="absolute -inset-4 bg-purple-50 rounded-full blur-xl opacity-20 animate-pulse"></div>
      </div>
      <p className="text-sm font-medium text-gray-400 animate-pulse">Loading dashboard...</p>
    </div>
  )
}
