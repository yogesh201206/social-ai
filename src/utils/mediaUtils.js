/**
 * Media URL resolution and type detection utility for SocialFlow.
 * Resolves backend storage paths, API relative endpoints, and external media into browser-accessible URLs.
 */

/**
 * Strips any trailing /api path segment and trailing slashes from a URL string,
 * returning only the pure backend origin (scheme + host + port).
 *
 * Examples:
 *   http://localhost:8080          -> http://localhost:8080
 *   http://localhost:8080/         -> http://localhost:8080
 *   http://localhost:8080/api      -> http://localhost:8080
 *   http://localhost:8080/api/     -> http://localhost:8080
 *
 * @param {string} url
 * @returns {string}
 */
function normalizeToOrigin(url) {
  return url.trim().replace(/\/api\/?$/i, '').replace(/\/+$/, '')
}

/**
 * Returns the pure backend origin (no path) from Vite environment config.
 * Prefers VITE_API_URL, falls back to VITE_API_BASE_URL, then 'http://localhost:8080'.
 * Both env vars are normalised through normalizeToOrigin() so that a value like
 * "http://localhost:8080/api" is correctly reduced to "http://localhost:8080".
 */
export function getBackendOrigin() {
  const viteApiUrl = import.meta.env.VITE_API_URL
  if (viteApiUrl && typeof viteApiUrl === 'string' && viteApiUrl.trim()) {
    return normalizeToOrigin(viteApiUrl)
  }

  const viteBaseUrl = import.meta.env.VITE_API_BASE_URL
  if (viteBaseUrl && typeof viteBaseUrl === 'string' && viteBaseUrl.trim()) {
    return normalizeToOrigin(viteBaseUrl)
  }

  return 'http://localhost:8080'
}

/**
 * Resolves a raw media string (path or URL) into a valid browser-accessible URL.
 * 
 * Rules:
 * 1. If URL starts with http://, https://, or data:, return it unchanged.
 * 2. If it starts with /api/media/files/{filename} or /api/media/{filename}, prepend backend API origin.
 * 3. If only a mediaPath exists (e.g. uploads/temp/..., uploads/scheduled/..., or bare filename),
 *    extract the filename and build `${API_ORIGIN}/api/media/files/${filename}`.
 */
export function resolveMediaUrl(mediaPathOrUrl) {
  if (!mediaPathOrUrl || typeof mediaPathOrUrl !== 'string') {
    return ''
  }

  const trimmed = mediaPathOrUrl.trim()
  if (!trimmed) return ''

  // Rule 1: Starts with http://, https://, or data: -> return unchanged
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:')
  ) {
    return trimmed
  }

  const origin = getBackendOrigin()

  /** @type {string} */
  let resolvedMediaUrl = ''

  // Rule 2: Backend returned /api/media/... or api/media/...
  if (trimmed.startsWith('/api/media/')) {
    resolvedMediaUrl = `${origin}${trimmed}`
  } else if (trimmed.startsWith('api/media/')) {
    resolvedMediaUrl = `${origin}/${trimmed}`
  } else {
    // Rule 3: Storage path like uploads/temp/... or uploads/scheduled/... or filename
    // Extract filename safely (handling both Unix and Windows separators, ignoring query/hash)
    const clean = trimmed.split('?')[0].split('#')[0]
    const filename = clean.split(/[/\\]/).filter(Boolean).pop()
    if (filename) {
      resolvedMediaUrl = `${origin}/api/media/files/${filename}`
    }
  }

  // Development-only diagnostic log — stripped by Vite/Rollup in production builds
  if (import.meta.env.DEV && resolvedMediaUrl) {
    console.log('[mediaUtils] resolvedMediaUrl:', resolvedMediaUrl)
  }

  return resolvedMediaUrl
}

/**
 * Resolves the browser-accessible media URL from a post object or media string.
 * Inspects post.imageUrl, post.mediaPath, and post.image.
 */
export function resolvePostMediaUrl(post) {
  if (!post) return ''
  if (typeof post === 'string') return resolveMediaUrl(post)

  // 1. If post.imageUrl exists and is a valid URL or API path
  if (post.imageUrl && typeof post.imageUrl === 'string' && post.imageUrl.trim()) {
    const resolved = resolveMediaUrl(post.imageUrl)
    if (resolved) return resolved
  }

  // 2. If post.mediaPath exists (e.g. uploads/temp/... or uploads/scheduled/...)
  if (post.mediaPath && typeof post.mediaPath === 'string' && post.mediaPath.trim()) {
    const resolved = resolveMediaUrl(post.mediaPath)
    if (resolved) return resolved
  }

  // 3. Fallback to post.image if available
  if (post.image && typeof post.image === 'string' && post.image.trim()) {
    const resolved = resolveMediaUrl(post.image)
    if (resolved) return resolved
  }

  return ''
}

/**
 * Detects whether the media is a video based on mediaType first, then file extension.
 * 
 * @param {string} [mediaType] MIME type (e.g. 'video/mp4', 'image/jpeg')
 * @param {string} [pathOrUrl] URL or filesystem path to check extension
 * @returns {boolean} true if media is video, false otherwise
 */
export function isVideoMedia(mediaType, pathOrUrl) {
  // Check mediaType first
  if (mediaType && typeof mediaType === 'string') {
    const lowerType = mediaType.toLowerCase().trim()
    if (
      lowerType.startsWith('video/') ||
      lowerType.includes('mp4') ||
      lowerType.includes('webm') ||
      lowerType.includes('quicktime') ||
      lowerType.includes('mov') ||
      lowerType.includes('mkv')
    ) {
      return true
    }
    if (
      lowerType.startsWith('image/') ||
      lowerType.includes('jpeg') ||
      lowerType.includes('jpg') ||
      lowerType.includes('png') ||
      lowerType.includes('gif') ||
      lowerType.includes('webp') ||
      lowerType.includes('svg')
    ) {
      return false
    }
  }

  // Fallback by extension only if mediaType is missing
  if (pathOrUrl && typeof pathOrUrl === 'string') {
    const clean = pathOrUrl.split('?')[0].split('#')[0].toLowerCase().trim()
    if (
      clean.endsWith('.mp4') ||
      clean.endsWith('.mov') ||
      clean.endsWith('.webm') ||
      clean.endsWith('.mkv') ||
      clean.endsWith('.avi') ||
      clean.endsWith('.m4v') ||
      clean.startsWith('data:video/')
    ) {
      return true
    }
  }

  return false
}

/**
 * Checks if a post represents a video post.
 */
export function isPostVideo(post) {
  if (!post) return false
  const candidatePath = post.mediaPath || post.imageUrl || post.image || post.originalFileName || ''
  if (isVideoMedia(post.mediaType, candidatePath)) {
    return true
  }
  // YouTube fallback: YouTube posts are videos unless explicitly tagged as image
  if (post.platform === 'YouTube') {
    const isExplicitImage = post.mediaType && post.mediaType.toLowerCase().startsWith('image/')
    if (!isExplicitImage) return true
  }
  return false
}
