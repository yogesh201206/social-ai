import { useState, useRef, useCallback } from 'react'
import { Upload, X, ImageIcon, AlertCircle, FileImage } from 'lucide-react'

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const ACCEPTED_EXTENSIONS = '.jpg,.jpeg,.png,.webp'
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

const fileTypeLabels = {
  'image/jpeg': 'JPG',
  'image/png': 'PNG',
  'image/webp': 'WEBP',
}

export default function UploadBox({ value, onChange, className = '' }) {
  const [isDragging, setIsDragging] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(null)
  const [error, setError] = useState(null)
  const inputRef = useRef(null)

  const validateFile = (file) => {
    if (!file) return 'No file selected'
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return `Invalid file type. Please upload JPG, PNG, or WEBP images only.`
    }
    if (file.size > MAX_FILE_SIZE) {
      return `File is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum size is 10MB.`
    }
    return null
  }

  const simulateUpload = useCallback((file) => {
    setUploadProgress(0)
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setTimeout(() => setUploadProgress(null), 400)
          return 100
        }
        return prev + 12
      })
    }, 80)

    const reader = new FileReader()
    reader.onload = (e) => onChange?.({ file, preview: e.target.result })
    reader.onerror = () => setError('Failed to read file. Please try again.')
    reader.readAsDataURL(file)
  }, [onChange])

  const handleFile = useCallback(
    (file) => {
      setError(null)
      const validationError = validateFile(file)
      if (validationError) {
        setError(validationError)
        return
      }
      simulateUpload(file)
    },
    [simulateUpload]
  )

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      handleFile(file)
    },
    [handleFile]
  )

  const handleRemove = () => {
    onChange?.(null)
    setError(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  if (value?.preview) {
    return (
      <div className={`relative rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 group ${className}`}>
        <img src={value.preview} alt="Upload preview" className="w-full aspect-video object-cover" />
        
        {/* File type badge */}
        {value.file?.type && (
          <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-black/60 text-white text-xs font-medium">
            {fileTypeLabels[value.file.type] || 'IMAGE'}
          </div>
        )}

        <button
          type="button"
          onClick={handleRemove}
          className="absolute top-3 right-3 h-8 w-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 hover:scale-110 transition-all duration-200 opacity-0 group-hover:opacity-100"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Quick remove overlay on hover */}
        <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button
            type="button"
            onClick={handleRemove}
            className="w-full py-1.5 rounded-lg bg-white/20 backdrop-blur text-white text-xs font-medium hover:bg-white/30 transition-colors"
          >
            Remove Image
          </button>
        </div>

        {uploadProgress !== null && (
          <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
            <div className="flex items-center justify-between text-xs text-white mb-1.5">
              <span>Uploading...</span>
              <span>{Math.min(uploadProgress, 100)}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/30 overflow-hidden">
              <div
                className="h-full rounded-full bg-brand-500 transition-all duration-200"
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
          ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 scale-[1.01]'
          : error
          ? 'border-red-400 dark:border-red-500 bg-red-50 dark:bg-red-900/10'
          : 'border-gray-300 dark:border-gray-600 hover:border-brand-400 dark:hover:border-brand-500 bg-gray-50 dark:bg-gray-800/50'
      } ${className}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_EXTENSIONS}
        className="hidden"
        onChange={(e) => handleFile(e.target.files[0])}
      />
      <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
        <div className={`h-14 w-14 rounded-2xl flex items-center justify-center mb-4 transition-all duration-200 ${
          error
            ? 'bg-red-100 dark:bg-red-900/30'
            : isDragging
            ? 'bg-brand-100 dark:bg-brand-900/30'
            : 'bg-brand-100 dark:bg-brand-900/30'
        }`}>
          {isDragging ? (
            <Upload className={`h-7 w-7 animate-bounce ${error ? 'text-red-600 dark:text-red-400' : 'text-brand-600 dark:text-brand-400'}`} />
          ) : error ? (
            <AlertCircle className="h-7 w-7 text-red-600 dark:text-red-400" />
          ) : (
            <ImageIcon className="h-7 w-7 text-brand-600 dark:text-brand-400" />
          )}
        </div>
        <p className="text-sm font-medium text-gray-900 dark:text-white">
          {error ? 'Upload failed' : isDragging ? 'Drop your image here' : 'Drag and drop your image here'}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {error ? 'Try again with a supported file' : 'or click to browse'}
        </p>
        
        {error && (
          <p className="text-xs text-red-500 dark:text-red-400 mt-3 max-w-xs bg-red-50 dark:bg-red-900/20 px-3 py-1.5 rounded-lg">
            {error}
          </p>
        )}

        <div className="flex items-center gap-3 mt-4">
          <div className="flex -space-x-1">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">JPG</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400">PNG</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">WEBP</span>
          </div>
          <span className="text-xs text-gray-400 dark:text-gray-500">up to 10MB</span>
        </div>
      </div>

      {uploadProgress !== null && (
        <div className="absolute inset-x-6 bottom-6">
          <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-1.5">
            <span>Uploading...</span>
            <span>{Math.min(uploadProgress, 100)}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
            <div
              className="h-full rounded-full gradient-bg transition-all duration-200"
              style={{ width: `${Math.min(uploadProgress, 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

