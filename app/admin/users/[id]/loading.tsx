export default function Loading() {
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mb-4" />
        <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-gray-200 animate-pulse" />
              <div className="space-y-2">
                <div className="h-6 w-40 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-56 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-3 w-16 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 w-28 bg-gray-200 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="h-5 w-32 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="divide-y divide-gray-200">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between px-6 py-3">
                  <div className="space-y-1">
                    <div className="h-4 w-40 bg-gray-200 rounded animate-pulse" />
                    <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
                  </div>
                  <div className="h-6 w-20 bg-gray-200 rounded-full animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="h-5 w-16 bg-gray-200 rounded animate-pulse mb-4" />
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
                  <div className="h-5 w-12 bg-gray-200 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
