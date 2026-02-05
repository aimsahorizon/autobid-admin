export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 w-32 bg-gray-200 rounded-lg animate-pulse" />
          <div className="h-4 w-48 bg-gray-200 rounded mt-2 animate-pulse" />
        </div>
        <div className="h-5 w-24 bg-gray-200 rounded animate-pulse" />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Search Bar Skeleton */}
        <div className="p-4 border-b border-gray-200">
          <div className="h-10 w-full max-w-md bg-gray-100 rounded-lg animate-pulse" />
        </div>

        {/* Table Header Skeleton */}
        <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 border-b border-gray-200">
          <div className="col-span-4 h-4 bg-gray-200 rounded animate-pulse" />
          <div className="col-span-3 h-4 bg-gray-200 rounded animate-pulse" />
          <div className="col-span-2 h-4 bg-gray-200 rounded animate-pulse" />
          <div className="col-span-2 h-4 bg-gray-200 rounded animate-pulse" />
          <div className="col-span-1 h-4 bg-gray-200 rounded animate-pulse" />
        </div>

        {/* Table Rows Skeleton */}
        <div className="divide-y divide-gray-200">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="grid grid-cols-12 gap-4 px-6 py-4 items-center">
              <div className="col-span-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse" />
                <div className="space-y-2">
                  <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                  <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
              <div className="col-span-3 h-4 bg-gray-200 rounded animate-pulse" />
              <div className="col-span-2 h-6 w-20 bg-gray-200 rounded-full animate-pulse" />
              <div className="col-span-2 h-4 w-24 bg-gray-200 rounded animate-pulse" />
              <div className="col-span-1 h-8 w-8 bg-gray-200 rounded animate-pulse ml-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
