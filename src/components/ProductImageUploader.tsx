'use client'

import { useState, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { apiFetch } from '@/lib/api-fetch'
import { Loader2, Upload, X, Star, GripVertical, ImageIcon } from 'lucide-react'

interface ProductImage {
  id: number
  url: string
  alt?: string | null
  isPrimary: boolean
  sortOrder: number
  width?: number
  height?: number
  fileSize?: number
  createdAt: string
}

interface ProductImageUploaderProps {
  productId: number
  onImagesChange?: (images: ProductImage[]) => void
}

export function ProductImageUploader({ productId, onImagesChange }: ProductImageUploaderProps) {
  const [images, setImages] = useState<ProductImage[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)

  // Fetch existing images
  const fetchImages = useCallback(async () => {
    if (!productId) return
    setLoading(true)
    try {
      const res = await apiFetch(`/api/products/${productId}/images`)
      const data = await res.json()
      if (data.images) {
        setImages(data.images)
        onImagesChange?.(data.images)
      }
    } catch (err) {
      console.error('Failed to fetch images:', err)
    } finally {
      setLoading(false)
    }
  }, [productId, onImagesChange])

  useEffect(() => {
    fetchImages()
  }, [fetchImages])

  // Handle file upload
  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    
    setUploading(true)
    try {
      const formData = new FormData()
      Array.from(files).forEach(file => {
        formData.append('images', file)
      })
      formData.append('isPrimary', images.length === 0 ? 'true' : 'false')

      const res = await apiFetch(`/api/products/${productId}/images`, {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()
      if (data.success) {
        await fetchImages()
      } else {
        alert(data.error || 'Upload failed')
      }
    } catch (err) {
      console.error('Upload failed:', err)
      alert('Failed to upload images')
    } finally {
      setUploading(false)
    }
  }

  // Delete image
  const handleDelete = async (imageId: number) => {
    if (!confirm('Delete this image?')) return
    
    try {
      const res = await apiFetch(`/api/products/${productId}/images?imageId=${imageId}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        await fetchImages()
      }
    } catch (err) {
      console.error('Delete failed:', err)
    }
  }

  // Set primary image
  const setPrimary = async (imageId: number) => {
    try {
      const res = await apiFetch(`/api/products/${productId}/images`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageId, isPrimary: true }),
      })
      if (res.ok) {
        await fetchImages()
      }
    } catch (err) {
      console.error('Failed to set primary:', err)
    }
  }

  // Drag and drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    handleUpload(e.dataTransfer.files)
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return ''
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8 text-gray-500">
        <Loader2 className="animate-spin mr-2" size={20} />
        Loading images...
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          id="product-images"
          multiple
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={(e) => handleUpload(e.target.files)}
        />
        <label htmlFor="product-images" className="cursor-pointer">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
              {uploading ? (
                <Loader2 className="text-green-600 animate-spin" size={24} />
              ) : (
                <Upload className="text-green-600" size={24} />
              )}
            </div>
            <p className="text-sm font-medium text-gray-700">
              {uploading ? 'Uploading...' : 'Drop images here or click to upload'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Supports: JPG, PNG, WebP, GIF (max 5MB each, up to 10 images)
            </p>
          </div>
        </label>
      </div>

      {/* Images Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {images.map((image, index) => (
            <div
              key={image.id}
              className={`relative group rounded-lg overflow-hidden border-2 transition-all ${
                image.isPrimary ? 'border-yellow-400 ring-2 ring-yellow-100' : 'border-gray-200'
              }`}
            >
              {/* Image */}
              <div className="aspect-square bg-gray-100">
                <img
                  src={image.url}
                  alt={image.alt || ''}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Primary Badge */}
              {image.isPrimary && (
                <div className="absolute top-2 left-2 bg-yellow-400 text-white text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
                  <Star size={12} fill="currentColor" />
                  MAIN
                </div>
              )}

              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                {!image.isPrimary && (
                  <button
                    onClick={() => setPrimary(image.id)}
                    className="p-2 bg-white rounded-full hover:bg-yellow-100 text-yellow-600"
                    title="Set as primary"
                  >
                    <Star size={18} />
                  </button>
                )}
                <button
                  onClick={() => handleDelete(image.id)}
                  className="p-2 bg-white rounded-full hover:bg-red-100 text-red-600"
                  title="Delete"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Info */}
              <div className="p-2 bg-white">
                <p className="text-xs text-gray-500 truncate">
                  {image.width && image.height ? `${image.width}x${image.height}` : ''}
                  {image.fileSize && ` • ${formatFileSize(image.fileSize)}`}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {images.length === 0 && !uploading && (
        <div className="text-center py-8 text-gray-400">
          <ImageIcon className="mx-auto mb-2" size={48} />
          <p>No images yet</p>
          <p className="text-sm">Upload product images to get started</p>
        </div>
      )}

      {/* Image Count */}
      <p className="text-xs text-gray-500 text-right">
        {images.length} / 10 images
      </p>
    </div>
  )
}
