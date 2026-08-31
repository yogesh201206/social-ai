import { useState } from 'react'
import { Copy, RefreshCw, Save, FilePlus, Check, Clock, Hash, Megaphone, MessageSquare } from 'lucide-react'
import Button from './Button'

export default function AIResultCard({
  result,
  onRegenerate,
  onSaveDraft,
  onCreatePost,
  loading = false,
}) {
  const [copied, setCopied] = useState(null)

  if (!result) {
    return (
      <div className="glass rounded-2xl p-6 h-full min-h-[400px] flex flex-col items-center justify-center text-center">
        <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-brand-100 to-accent-100 dark:from-brand-900/30 dark:to-accent-900/30 flex items-center justify-center mb-4">
          <MessageSquare className="h-8 w-8 text-brand-500" />
        </div>
        <h3 className="font-semibold text-gray-900 dark:text-white">AI Generated Results</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-xs">
          Fill in your restaurant details and click generate to see AI-powered content here.
        </p>
      </div>
    )
  }

  const copyText = async (text, key) => {
    await navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  // Support both real API response (generatedContent) and legacy mock fields (caption)
  const displayText = result.generatedContent || result.caption || ''
  const fullText = displayText

  return (
    <div className="glass rounded-2xl p-6 space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">Generated Content</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {result.contentType && `${result.contentType} · `}
            {result.model ? `Model: ${result.model.split('/').pop()}` : 'AI Generated'}
          </p>
        </div>
        <span className="text-[10px] text-gray-400">{result.generatedAt || 'Just now'}</span>
      </div>

      {/* Real API response — show generatedContent in full */}
      {displayText && (
        <section className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              <MessageSquare className="h-4 w-4 text-brand-500" />
              {result.contentType || 'Generated Content'}
            </div>
            <button
              type="button"
              onClick={() => copyText(displayText, 'caption')}
              className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              {copied === 'caption' ? (
                <Check className="h-3.5 w-3.5 text-green-500" />
              ) : (
                <Copy className="h-3.5 w-3.5 text-gray-400" />
              )}
            </button>
          </div>
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
            {displayText}
          </p>
        </section>
      )}

      {result.hashtags?.length > 0 && (
        <section className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              <Hash className="h-4 w-4 text-brand-500" />
              Hashtags
            </div>
            <button
              type="button"
              onClick={() => copyText(result.hashtags.join(' '), 'hashtags')}
              className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              {copied === 'hashtags' ? (
                <Check className="h-3.5 w-3.5 text-green-500" />
              ) : (
                <Copy className="h-3.5 w-3.5 text-gray-400" />
              )}
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {result.hashtags.map((tag) => (
              <span
                key={tag}
                className="px-2.5 py-1 rounded-lg text-xs font-medium bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300"
              >
                {tag}
              </span>
            ))}
          </div>
        </section>
      )}

      {result.cta && (
        <section className="p-4 rounded-xl bg-gradient-to-r from-brand-50 to-accent-50 dark:from-brand-900/20 dark:to-accent-900/20 border border-brand-100 dark:border-brand-800/30">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <Megaphone className="h-4 w-4 text-brand-500" />
            Call To Action
          </div>
          <p className="text-sm text-gray-700 dark:text-gray-300">{result.cta}</p>
        </section>
      )}

      {result.bestPostingTime && (
        <section className="flex items-center gap-3 p-4 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/30">
          <Clock className="h-5 w-5 text-indigo-500 flex-shrink-0" />
          <div>
            <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400">Best time to post</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">{result.bestPostingTime}</p>
          </div>
        </section>
      )}

      <div className="flex flex-wrap gap-2 pt-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => copyText(fullText, 'all')}
        >
          {copied === 'all' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          Copy All
        </Button>
        <Button variant="outline" size="sm" onClick={onRegenerate} loading={loading}>
          <RefreshCw className="h-3.5 w-3.5" />
          Regenerate
        </Button>
        <Button variant="secondary" size="sm" onClick={onSaveDraft}>
          <Save className="h-3.5 w-3.5" />
          Save As Draft
        </Button>
        <Button size="sm" onClick={onCreatePost}>
          <FilePlus className="h-3.5 w-3.5" />
          Create Post
        </Button>
      </div>
    </div>
  )
}
