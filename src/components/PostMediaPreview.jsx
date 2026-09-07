import { useState, useEffect } from 'react'
import { ImageOff } from 'lucide-react'
import { resolvePostMediaUrl, isPostVideo } from '../utils/mediaUtils'

/**
 * Universal Post Media Preview component.
 * Handles:
 * - Proper browser URL resolution (handling relative API paths, storage paths, absolute URLs)
 * - Rendering <img src={...} /> for images
 * - Rendering <video src={...} controls /> for videos (never inside an <img>)
 * - Media type detection via mediaType first, extension second
 * - Graceful broken image/video fallback with "Media preview unavailable" placeholder
 */
export default function PostMediaPreview({
  post,
  src,
  mediaType,
  alt = '',
  className = 'w-full h-full object-cover',
  containerClassName = '',
  showControls = true,
  fallbackText = 'Media preview unavailable',
}) {
  const [hasError, setHasError] = useState(false)

  // Resolve media URL from post object or direct src string
  const resolvedUrl = src ? resolvePostMediaUrl(src) : resolvePostMediaUrl(post)
  const isVideo = isPostVideo(post || { mediaType, mediaPath: src, imageUrl: src })

  // Reset error state when post / URL changes
  useEffect(() => {
    setHasError(false)
  }, [resolvedUrl])

  if (!resolvedUrl || hasError) {
    return (
      <div
        className={`w-full h-full min-h-[140px] flex flex-col items-center justify-center gap-2 p-4 bg-gray-100 dark:bg-gray-800/90 text-gray-400 dark:text-gray-500 select-none ${containerClassName}`}
        aria-label="Media preview unavailable"
      >
        <ImageOff className="h-7 w-7 opacity-50 stroke-[1.5]" />
        <span className="text-xs font-medium text-center text-gray-500 dark:text-gray-400">
          {fallbackText}
        </span>
      </div>
    )
  }

  if (isVideo) {
    return (
      <video
        src={resolvedUrl}
        controls={showControls}
        preload="metadata"
        playsInline
        onError={() => setHasError(true)}
        className={className}
      />
    )
  }

  return (
    <img
      src={resolvedUrl}
      alt={alt || post?.title || 'Media preview'}
      loading="lazy"
      onError={() => setHasError(true)}
      className={className}
    />
  )
}
