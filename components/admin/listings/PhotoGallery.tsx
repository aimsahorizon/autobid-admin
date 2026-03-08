'use client'

import { useState } from 'react'
import { Camera, ChevronDown, ChevronUp, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { PhotoUrlsMap, PHOTO_CATEGORIES, PHOTO_CATEGORY_GROUPS } from '@/lib/types/listing-detail'

interface PhotoGalleryProps {
  photoUrls: PhotoUrlsMap | null
  coverPhotoUrl: string | null
  vehicleName: string
}

export default function PhotoGallery({ photoUrls, coverPhotoUrl, vehicleName }: PhotoGalleryProps) {
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    exterior: true,
    interior: false,
    mechanical: false,
    wheels: false,
    documents: false,
  })
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxImages, setLightboxImages] = useState<string[]>([])
  const [lightboxIndex, setLightboxIndex] = useState(0)

  const toggleGroup = (groupKey: string) => {
    setExpandedGroups(prev => ({ ...prev, [groupKey]: !prev[groupKey] }))
  }

  const openLightbox = (images: string[], index: number) => {
    setLightboxImages(images)
    setLightboxIndex(index)
    setLightboxOpen(true)
  }

  const closeLightbox = () => {
    setLightboxOpen(false)
    setLightboxImages([])
    setLightboxIndex(0)
  }

  const nextImage = () => {
    setLightboxIndex((prev) => (prev + 1) % lightboxImages.length)
  }

  const prevImage = () => {
    setLightboxIndex((prev) => (prev - 1 + lightboxImages.length) % lightboxImages.length)
  }

  // Get first available photo from photo_urls for fallback
  const getFirstAvailablePhoto = (): string | null => {
    if (!photoUrls) return null
    for (const categoryKey of Object.keys(photoUrls)) {
      const urls = photoUrls[categoryKey as keyof PhotoUrlsMap]
      if (urls && urls.length > 0) {
        return urls[0]
      }
    }
    return null
  }

  const displayCoverPhoto = coverPhotoUrl || getFirstAvailablePhoto()
  const totalPhotos = photoUrls 
    ? Object.values(photoUrls).reduce((sum, urls) => sum + (urls?.length || 0), 0)
    : 0

  const getPhotosForCategory = (categoryKey: string): string[] => {
    if (!photoUrls) return []
    return photoUrls[categoryKey as keyof PhotoUrlsMap] || []
  }

  const getCategoryPhotoCount = (groupKey: string): number => {
    const categories = PHOTO_CATEGORIES[groupKey as keyof typeof PHOTO_CATEGORIES]
    return categories.reduce((sum, cat) => sum + getPhotosForCategory(cat.key).length, 0)
  }

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Hero Cover Photo */}
        <div className="relative">
          {displayCoverPhoto ? (
            <div className="aspect-[21/9] bg-gray-100 overflow-hidden">
              <img
                src={displayCoverPhoto}
                alt={`${vehicleName} - Cover`}
                className="w-full h-full object-cover cursor-pointer hover:opacity-95 transition-opacity"
                onClick={() => openLightbox([displayCoverPhoto], 0)}
              />
            </div>
          ) : (
            <div className="aspect-[21/9] bg-gray-100 flex flex-col items-center justify-center">
              <Camera className="w-16 h-16 text-gray-300 mb-3" />
              <p className="text-gray-500 font-medium">No Cover Photo</p>
              <p className="text-sm text-gray-400">No images uploaded for this listing</p>
            </div>
          )}
          {displayCoverPhoto && (
            <div className="absolute bottom-4 right-4 px-3 py-1.5 bg-black/70 text-white text-sm font-medium rounded-lg flex items-center gap-2">
              <Camera className="w-4 h-4" />
              {totalPhotos} Photos
            </div>
          )}
        </div>

        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <Camera className="w-6 h-6 text-gray-400" />
            Photo Gallery — {totalPhotos} Total
          </h2>

          {totalPhotos === 0 ? (
            <div className="text-center p-12 bg-gray-50 rounded-xl border border-gray-200 border-dashed">
              <Camera className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">No photos available</p>
              <p className="text-sm text-gray-400 mt-1">This listing has no uploaded images.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {PHOTO_CATEGORY_GROUPS.map((group) => {
                const categories = PHOTO_CATEGORIES[group.key as keyof typeof PHOTO_CATEGORIES]
                const groupPhotoCount = getCategoryPhotoCount(group.key)
                const isExpanded = expandedGroups[group.key]

                return (
                  <div key={group.key} className="border border-gray-200 rounded-lg overflow-hidden">
                    {/* Group Header */}
                    <button
                      onClick={() => toggleGroup(group.key)}
                      className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <h3 className="text-base font-semibold text-gray-900">{group.name}</h3>
                        <span className="px-2.5 py-0.5 bg-gray-200 text-gray-700 text-xs font-medium rounded-full">
                          {groupPhotoCount} / {group.count}
                        </span>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-gray-500" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-500" />
                      )}
                    </button>

                    {/* Group Content */}
                    {isExpanded && (
                      <div className="p-4 bg-white">
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                          {categories.map((category) => {
                            const photos = getPhotosForCategory(category.key)
                            const hasPhotos = photos.length > 0

                            return (
                              <div key={category.key} className="space-y-2">
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                  {category.label} {hasPhotos && `(${photos.length})`}
                                </p>
                                {hasPhotos ? (
                                  <div className="relative">
                                    <div
                                      className="aspect-[4/3] bg-gray-100 rounded-lg overflow-hidden border border-gray-200 cursor-pointer hover:border-purple-400 transition-colors group"
                                      onClick={() => openLightbox(photos, 0)}
                                    >
                                      <img
                                        src={photos[0]}
                                        alt={`${vehicleName} - ${category.label}`}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                      />
                                    </div>
                                    {photos.length > 1 && (
                                      <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/70 text-white text-xs font-medium rounded">
                                        +{photos.length - 1}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="aspect-[4/3] bg-gray-50 rounded-lg border border-gray-200 border-dashed flex items-center justify-center">
                                    <span className="text-gray-300 text-xs">No photos</span>
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Lightbox Modal */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4">
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>

          <div className="relative max-w-6xl w-full h-full flex items-center justify-center">
            {lightboxImages.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-4 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                >
                  <ChevronLeft className="w-6 h-6 text-white" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                >
                  <ChevronRight className="w-6 h-6 text-white" />
                </button>
              </>
            )}

            <img
              src={lightboxImages[lightboxIndex]}
              alt={`Photo ${lightboxIndex + 1}`}
              className="max-w-full max-h-full object-contain"
            />

            {lightboxImages.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-white/10 backdrop-blur-sm text-white text-sm font-medium rounded-lg">
                {lightboxIndex + 1} / {lightboxImages.length}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
