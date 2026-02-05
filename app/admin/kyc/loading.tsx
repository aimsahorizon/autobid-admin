export default function Loading() {
  return (
    <div className="space-y-6">
      <div>
        <div className="h-8 w-40 bg-gray-200 rounded-lg animate-pulse" />
        <div className="h-4 w-56 bg-gray-200 rounded mt-2 animate-pulse" />
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
            <div className="flex items-center gap-3 h-full">
              <div className="w-10 h-10 bg-gray-200 rounded-lg" />
              <div className="space-y-2 flex-1">
                <div className="h-6 w-12 bg-gray-200 rounded" />
                <div className="h-4 w-24 bg-gray-200 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters Skeleton */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex gap-4">
          <div className="flex-1 h-10 bg-gray-100 rounded-lg animate-pulse" />
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="w-20 h-10 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
      </div>

      {/* List Skeleton */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden divide-y divide-gray-200">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gray-200 animate-pulse" />
              <div className="space-y-2">
                <div className="h-5 w-40 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
                <div className="h-3 w-32 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
            <div className="text-right space-y-2">
              <div className="h-6 w-24 bg-gray-200 rounded-full animate-pulse ml-auto" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
