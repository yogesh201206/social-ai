import { Sparkles } from 'lucide-react'

export default function LoadingAI({ message = 'AI is creating your content...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 animate-fade-in">
      <div className="relative">
        <div className="h-16 w-16 rounded-2xl gradient-bg flex items-center justify-center shadow-lg shadow-brand-500/30">
          <Sparkles className="h-8 w-8 text-white animate-pulse" />
        </div>
        <div className="absolute inset-0 rounded-2xl gradient-bg opacity-40 animate-ping" />
      </div>
      <p className="mt-6 text-sm font-medium text-gray-900 dark:text-white">{message}</p>
      <div className="flex gap-1.5 mt-4">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-2 w-2 rounded-full bg-brand-500 animate-bounce"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>
      <div className="mt-6 w-48 h-1 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
        <div className="h-full rounded-full gradient-bg animate-[slideInLeft_1.5s_ease-in-out_infinite_alternate]" style={{ width: '60%' }} />
      </div>
    </div>
  )
}

export function TypingIndicator() {
  return (
    <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-gray-100 dark:bg-gray-800 w-fit">
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-2 w-2 rounded-full bg-gray-400 dark:bg-gray-500 animate-bounce"
            style={{ animationDelay: `${i * 120}ms` }}
          />
        ))}
      </div>
      <span className="text-xs text-gray-500 dark:text-gray-400">AI is typing...</span>
    </div>
  )
}
