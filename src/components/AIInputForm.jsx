import * as Icons from 'lucide-react'
import { contentTypes } from '../data/suggestions'
import ImageUploader from './ImageUploader'

const defaultValues = {
  restaurantName: 'Spice Garden',
  category: 'South Indian Restaurant',
  audience: 'Food Lovers',
  location: 'Madurai',
  contentType: 'caption',
}

export default function AIInputForm({
  values = defaultValues,
  onChange,
  image,
  onImageChange,
  onGenerate,
  loading = false,
}) {
  const update = (field, val) => onChange?.({ ...values, [field]: val })

  return (
    <div className="glass rounded-2xl p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl gradient-bg flex items-center justify-center">
          <Icons.Sparkles className="h-5 w-5 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">Input Details</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">Tell AI about your restaurant</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Restaurant Name
          </label>
          <input
            type="text"
            value={values.restaurantName}
            onChange={(e) => update('restaurantName', e.target.value)}
            placeholder="Spice Garden"
            className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-brand-500/50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Food Category
          </label>
          <input
            type="text"
            value={values.category}
            onChange={(e) => update('category', e.target.value)}
            placeholder="South Indian Restaurant"
            className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-brand-500/50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Target Audience
          </label>
          <input
            type="text"
            value={values.audience}
            onChange={(e) => update('audience', e.target.value)}
            placeholder="Food Lovers"
            className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-brand-500/50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Location
          </label>
          <input
            type="text"
            value={values.location}
            onChange={(e) => update('location', e.target.value)}
            placeholder="Madurai"
            className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-brand-500/50"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Content Type
        </label>
        <div className="grid grid-cols-2 gap-2">
          {contentTypes.map(({ id, label, icon }) => {
            const Icon = Icons[icon] || Icons.FileText
            const active = values.contentType === id
            return (
              <button
                key={id}
                type="button"
                onClick={() => update('contentType', id)}
                className={`flex items-center gap-2 p-3 rounded-xl text-left text-xs font-medium transition-all ${
                  active
                    ? 'gradient-bg text-white shadow-md shadow-brand-500/20'
                    : 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                }`}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span className="line-clamp-2">{label}</span>
              </button>
            )
          })}
        </div>
      </div>

      <ImageUploader value={image} onChange={onImageChange} label="Upload Image (Optional)" />

      {image?.preview && (
        <p className="text-xs text-brand-600 dark:text-brand-400 flex items-center gap-1.5">
          <Icons.Scan className="h-3.5 w-3.5" />
          AI will analyze your image to enhance generated content
        </p>
      )}

      <div className="grid grid-cols-2 gap-2 pt-2">
        <button
          type="button"
          disabled={loading}
          onClick={() => onGenerate?.('caption')}
          className="px-3 py-2.5 rounded-xl text-xs font-semibold bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors disabled:opacity-50"
        >
          Generate Caption
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() => onGenerate?.('hashtags')}
          className="px-3 py-2.5 rounded-xl text-xs font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors disabled:opacity-50"
        >
          Generate Hashtags
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() => onGenerate?.('postIdea')}
          className="px-3 py-2.5 rounded-xl text-xs font-semibold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors disabled:opacity-50"
        >
          Generate Post Idea
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() => onGenerate?.('marketing')}
          className="px-3 py-2.5 rounded-xl text-xs font-semibold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors disabled:opacity-50"
        >
          Generate Marketing
        </button>
      </div>

      <button
        type="button"
        disabled={loading}
        onClick={() => onGenerate?.('full')}
        className="w-full py-3 rounded-xl gradient-bg text-white text-sm font-semibold shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
      >
        <Icons.Wand2 className="h-4 w-4" />
        Generate All Content
      </button>
    </div>
  )
}
