import { Search, X } from 'lucide-react'
import { useState } from 'react'

export default function SearchBar({ placeholder = 'Search...', className = '', onSearch }) {
  const [query, setQuery] = useState('')

  const handleChange = (e) => {
    setQuery(e.target.value)
    onSearch?.(e.target.value)
  }

  const handleClear = () => {
    setQuery('')
    onSearch?.('')
  }

  return (
    <div className={`relative flex items-center ${className}`}>
      <Search className="absolute left-3 h-4 w-4 text-gray-400 pointer-events-none" />
      <input
        type="text"
        value={query}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full pl-10 pr-9 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-brand-500/50 transition-all"
      />
      {query && (
        <button
          onClick={handleClear}
          className="absolute right-3 p-0.5 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  )
}
