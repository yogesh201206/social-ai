import * as Icons from 'lucide-react'
import { platforms, platformIcons, platformColors } from '../data/postsData'

export default function PlatformSelector({ value, onChange, multiple = false }) {
  const selected = multiple ? (value || []) : value

  const isSelected = (platform) =>
    multiple ? selected.includes(platform) : selected === platform

  const handleSelect = (platform) => {
    if (multiple) {
      const current = value || []
      onChange?.(
        current.includes(platform)
          ? current.filter((p) => p !== platform)
          : [...current, platform]
      )
    } else {
      onChange?.(platform)
    }
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {platforms.map((platform) => {
        const Icon = Icons[platformIcons[platform]] || Icons.Globe
        const gradient = platformColors[platform]
        const active = isSelected(platform)

        return (
          <button
            key={platform}
            type="button"
            onClick={() => handleSelect(platform)}
            className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 hover:scale-[1.02] ${
              active
                ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 shadow-md shadow-brand-500/10'
                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center`}>
              <Icon className="h-5 w-5 text-white" />
            </div>
            <span className={`text-xs font-medium ${active ? 'text-brand-600 dark:text-brand-400' : 'text-gray-700 dark:text-gray-300'}`}>
              {platform}
            </span>
            {active && (
              <div className="absolute top-2 right-2 h-4 w-4 rounded-full gradient-bg flex items-center justify-center">
                <Icons.Check className="h-2.5 w-2.5 text-white" />
              </div>
            )}
          </button>
        )
      })}
    </div>
  )
}
