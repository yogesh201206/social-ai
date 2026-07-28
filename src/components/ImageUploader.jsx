import { useState, useRef, useCallback } from 'react'
import { Upload, X, ImageIcon, AlertCircle } from 'lucide-react'

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const ACCEPTED_EXTENSIONS = '.jpg,.jpeg,.png,.webp'

export default function ImageUploader({ value, onChange, label = 'Upload Image', className = '' }) {
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState(null)
  const inputRef = useRef(null)

  const validateFile = (file) => {
    if (!file) return 'No file selected'
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return 'Please upload JPG, PNG, or WEBP images only.'
    }
    if (file.size > 10 * 1024 * 1024) {
      return 'File must be under 10MB.'
    }
    return null
  }

  const handleFile = useCallback(
    (file) => {
      setError(null)
      const validationError = validateFile(file)
      if (validationError) {
        setError(validationError)
        return
      }
      const reader = new FileReader()
      reader.onload = (e) => onChange?.({ file, preview: e.target.result })
      reader.readAsDataURL(file)
    },
    [onChange]
  )

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault()
      setIsDragging(false)
      handleFile(e.dataTransfer.files[0])
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
      <div className={`relative rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 group ${className}`}>
        <img src={value.preview} alt="Upload preview" className="w-full aspect-video object-cover" />
        <button
          type="button"
          onClick={handleRemove}
          className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
        <div className="absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-black/60 to-transparent">
          <p className="text-xs text-white/90 truncate">{value.file?.name || 'Uploaded image'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{label}</label>
      )}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`cursor-pointer rounded-xl border-2 border-dashed transition-all duration-200 ${
          isDragging
            ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
            : error
            ? 'border-red-400 bg-red-50 dark:bg-red-900/10'
            : 'border-gray-300 dark:border-gray-600 hover:border-brand-400 bg-gray-50 dark:bg-gray-800/50'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_EXTENSIONS}
          className="hidden"
          onChange={(e) => handleFile(e.target.files[0])}
        />
        <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
          <div className="h-10 w-10 rounded-xl bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center mb-3">
            {error ? (
              <AlertCircle className="h-5 w-5 text-red-500" />
            ) : (
              <ImageIcon className="h-5 w-5 text-brand-600 dark:text-brand-400" />
            )}
          </div>
          <p className="text-xs font-medium text-gray-900 dark:text-white">
            {isDragging ? 'Drop image here' : 'Drag & drop or click to upload'}
          </p>
          <p className="text-[10px] text-gray-500 mt-1">JPG, PNG, WEBP</p>
          {error && <p className="text-[10px] text-red-500 mt-2">{error}</p>}
        </div>
      </div>
    </div>
  )
}
