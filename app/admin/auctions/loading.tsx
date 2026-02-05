export default function Loading() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div>
        <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse" />
        <div className="h-4 w-64 bg-gray-200 rounded mt-2 animate-pulse" />
      </div>

      {/* Stats Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse border border-gray-200" />
        ))}
      </div>

      {/* Filters Skeleton */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex gap-4">
          <div className="flex-1 h-10 bg-gray-100 rounded-lg animate-pulse" />
          <div className="w-24 h-10 bg-gray-100 rounded-lg animate-pulse" />
          <div className="w-24 h-10 bg-gray-100 rounded-lg animate-pulse" />
        </div>
      </div>

      {/* Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {/* Image Skeleton */}
            <div className="aspect-[16/9] bg-gray-200 animate-pulse" />
            
            {/* Content Skeleton */}
            <div className="p-4 space-y-4">
              <div className="h-6 w-3/4 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse" />
              
              <div className="flex justify-between items-center pt-2">
                <div className="space-y-2">
                  <div className="h-3 w-16 bg-gray-200 rounded animate-pulse" />
                  <div className="h-6 w-24 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="space-y-2 text-right">
                  <div className="h-3 w-16 bg-gray-200 rounded animate-pulse ml-auto" />
                  <div className="h-5 w-20 bg-gray-200 rounded animate-pulse ml-auto" />
                </div>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
