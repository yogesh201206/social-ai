import { useState, useRef, useCallback } from 'react'
import { Upload, X, Video, AlertCircle, Play, CheckCircle } from 'lucide-react'
import postService from '../services/postService'

const ACCEPTED_TYPES = ['video/mp4', 'video/quicktime', 'video/webm']
const ACCEPTED_EXTENSIONS = '.mp4,.mov,.webm'
const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB

export default function VideoUploadBox({ value, onChange, className = '' }) {
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(null)
  const [error, setError] = useState(null)
  const inputRef = useRef(null)

  const validateFile = (file) => {
    if (!file) return 'No file selected'
    
    // Check type or extension
    const name = file.name.toLowerCase()
    const isSupported = ACCEPTED_TYPES.includes(file.type) ||
      name.endsWith('.mp4') || name.endsWith('.mov') || name.endsWith('.webm')

    if (!isSupported) {
      return 'Unsupported video format. Allowed: MP4, MOV, WEBM.'
    }
    if (file.size > MAX_FILE_SIZE) {
      return `Video file exceeds allowed size (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum size is 100MB.`
    }
    return null
  }

  const handleFile = async (file) => {
    setError(null)
    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      return
    }

    const localPreview = URL.createObjectURL(file)
    setUploading(true)
    setUploadProgress(20)

    try {
      // Create local file preview immediately
      onChange?.({
        file,
        preview: localPreview,
        fileName: file.name,
        size: file.size,
        isVideo: true,
      })

      // Upload to backend media storage (default temp / youtube)
      setUploadProgress(50)
      const res = await postService.uploadMedia(file, 'temp', 'youtube')
      setUploadProgress(100)

      onChange?.({
        file,
        preview: res.url || localPreview,
        mediaUrl: res.url,
        mediaPath: res.mediaPath,
        mediaType: res.contentType || 'video/mp4',
        fileName: res.fileName || file.name,
        originalFileName: res.originalFileName || file.name,
        size: res.size || file.size,
        isVideo: true,
      })
      setTimeout(() => setUploadProgress(null), 500)
    } catch (err) {
      console.warn('Backend media upload error (falling back to local preview):', err.message)
      // Keep local preview if offline/backend dev mode
      onChange?.({
        file,
        preview: localPreview,
        mediaUrl: localPreview,
        mediaPath: null,
        mediaType: file.type || 'video/mp4',
        fileName: file.name,
        originalFileName: file.name,
        size: file.size,
        isVideo: true,
      })
      setTimeout(() => setUploadProgress(null), 500)
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) handleFile(file)
    },
    []
  )

  const handleRemove = () => {
    onChange?.(null)
    setError(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  if (value?.preview) {
    return (
      <div className={`relative rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 group bg-black/90 ${className}`}>
        <video
          src={value.preview}
          controls
          className="w-full aspect-video object-contain bg-black rounded-xl"
        />

        <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-black/70 text-white text-xs font-medium flex items-center gap-1.5">
          <Video className="h-3.5 w-3.5 text-red-500" />
          <span>{value.fileName || 'VIDEO'}</span>
          {value.size && (
            <span className="text-gray-400">({(value.size / 1024 / 1024).toFixed(1)}MB)</span>
          )}
        </div>

        <button
          type="button"
          onClick={handleRemove}
          className="absolute top-3 right-3 h-8 w-8 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-black/90 hover:scale-110 transition-all duration-200 opacity-0 group-hover:opacity-100"
          title="Remove video"
        >
          <X className="h-4 w-4" />
        </button>

        {uploadProgress !== null && (
          <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
            <div className="flex items-center justify-between text-xs text-white mb-1.5">
              <span>Saving video to storage...</span>
              <span>{Math.min(uploadProgress, 100)}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/30 overflow-hidden">
              <div
                className="h-full rounded-full bg-red-500 transition-all duration-200"
                style={{ width: `${Math.min(uploadProgress, 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
      onDragLeave={() => { setIsDragging(false); setError(null) }}
      onDrop={handleDrop}
      onClick={() => { if (!error) inputRef.current?.click() }}
      className={`relative cursor-pointer rounded-2xl border-2 border-dashed transition-all duration-200 ${
        isDragging
          ? 'border-red-500 bg-red-50 dark:bg-red-900/20 scale-[1.01]'
          : error
          ? 'border-red-400 dark:border-red-500 bg-red-50 dark:bg-red-900/10'
          : 'border-gray-300 dark:border-gray-600 hover:border-red-400 dark:hover:border-red-500 bg-gray-50 dark:bg-gray-800/50'
      } ${className}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_EXTENSIONS}
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.[0]) handleFile(e.target.files[0])
        }}
      />
      <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
        <div className={`h-14 w-14 rounded-2xl flex items-center justify-center mb-4 transition-all duration-200 ${
          error
            ? 'bg-red-100 dark:bg-red-900/30'
            : isDragging
            ? 'bg-red-100 dark:bg-red-900/30'
            : 'bg-red-50 dark:bg-red-900/20'
        }`}>
          {isDragging ? (
            <Upload className="h-7 w-7 text-red-600 dark:text-red-400 animate-bounce" />
          ) : error ? (
            <AlertCircle className="h-7 w-7 text-red-600 dark:text-red-400" />
          ) : (
            <Video className="h-7 w-7 text-red-600 dark:text-red-400" />
          )}
        </div>
        <p className="text-sm font-medium text-gray-900 dark:text-white">
          {error ? 'Upload failed' : isDragging ? 'Drop your video file here' : 'Upload Video *'}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {error ? 'Try again with a supported video' : 'Drag and drop or click to choose video (MP4, MOV, WEBM)'}
        </p>

        {error && (
          <p className="text-xs text-red-500 dark:text-red-400 mt-3 max-w-xs bg-red-50 dark:bg-red-900/20 px-3 py-1.5 rounded-lg">
            {error}
          </p>
        )}

        <div className="flex items-center gap-3 mt-4">
          <div className="flex -space-x-1">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">MP4</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400">MOV</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">WEBM</span>
          </div>
          <span className="text-xs text-gray-400 dark:text-gray-500">up to 100MB</span>
        </div>
      </div>

      {uploadProgress !== null && (
        <div className="absolute inset-x-6 bottom-6">
          <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-1.5">
            <span>Uploading video...</span>
            <span>{Math.min(uploadProgress, 100)}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
            <div
              className="h-full rounded-full bg-red-500 transition-all duration-200"
              style={{ width: `${Math.min(uploadProgress, 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
