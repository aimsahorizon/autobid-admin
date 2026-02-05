export default function Loading() {
  return (
    <div className="space-y-6">
      <div>
        <div className="h-8 w-32 bg-gray-200 rounded-lg animate-pulse" />
        <div className="h-4 w-48 bg-gray-200 rounded mt-2 animate-pulse" />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Tabs Skeleton */}
        <div className="border-b border-gray-200 px-6 pt-4 flex gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="pb-4">
              <div className="h-5 w-24 bg-gray-200 rounded animate-pulse" />
            </div>
          ))}
        </div>

        {/* Form Content Skeleton */}
        <div className="p-6 space-y-6">
          <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                <div className="h-10 w-full bg-gray-100 rounded-lg animate-pulse" />
              </div>
            ))}
          </div>

          <div className="pt-6 border-t border-gray-100">
            <div className="h-6 w-40 bg-gray-200 rounded animate-pulse mb-4" />
            <div className="h-24 w-full bg-gray-100 rounded-lg animate-pulse" />
          </div>

          <div className="flex justify-end pt-4">
             <div className="h-10 w-32 bg-purple-200 rounded-lg animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  )
}
