import { useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import PostPreview, { PostPreviewGrid } from '../../components/PostPreview'
import PlatformSelector from '../../components/PlatformSelector'
import Button from '../../components/Button'
import { useState } from 'react'

export default function PostPreviewPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const post = location.state?.post

  const [selectedPlatform, setSelectedPlatform] = useState(post?.platform || 'Instagram')
  const [viewMode, setViewMode] = useState('single')

  if (!post) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
        <p className="text-gray-500 dark:text-gray-400 mb-4">No post data to preview.</p>
        <Button onClick={() => navigate('/dashboard/posts/create')}>Create a Post</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Post Preview</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              See how your post will look across social platforms.
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('single')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              viewMode === 'single'
                ? 'gradient-bg text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
            }`}
          >
            Single View
          </button>
          <button
            onClick={() => setViewMode('all')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              viewMode === 'all'
                ? 'gradient-bg text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
            }`}
          >
            All Platforms
          </button>
        </div>
      </div>

      {viewMode === 'single' && (
        <div className="glass rounded-2xl p-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
            Preview Platform
          </label>
          <PlatformSelector
            value={selectedPlatform}
            onChange={setSelectedPlatform}
          />
        </div>
      )}

      <div className="py-4">
        {viewMode === 'single' ? (
          <PostPreview post={post} platform={selectedPlatform} />
        ) : (
          <PostPreviewGrid post={post} />
        )}
      </div>
    </div>
  )
}
