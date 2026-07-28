import * as Icons from 'lucide-react'

export default function SuggestionCard({ title, description, icon, onClick }) {
  const Icon = Icons[icon] || Icons.Lightbulb

  return (
    <button
      type="button"
      onClick={onClick}
      className="glass rounded-2xl p-5 text-left hover:shadow-lg hover:shadow-brand-500/10 transition-all duration-300 hover:-translate-y-0.5 group w-full"
    >
      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-brand-100 to-accent-100 dark:from-brand-900/40 dark:to-accent-900/40 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
        <Icon className="h-5 w-5 text-brand-600 dark:text-brand-400" />
      </div>
      <h4 className="font-semibold text-sm text-gray-900 dark:text-white">{title}</h4>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{description}</p>
      <span className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 dark:text-brand-400 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
        Try this idea
        <Icons.ArrowRight className="h-3 w-3" />
      </span>
    </button>
  )
}
