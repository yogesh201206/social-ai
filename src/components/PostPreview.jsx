import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, ThumbsUp, Repeat2, Send, Play } from 'lucide-react'
import * as Icons from 'lucide-react'
import { platformIcons } from '../data/postsData'

function InstagramPreview({ post }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden max-w-sm mx-auto shadow-xl">
      <div className="flex items-center gap-3 p-3 border-b border-gray-100 dark:border-gray-800">
        <img src={post.restaurantLogo} alt="" className="h-9 w-9 rounded-full object-cover ring-2 ring-pink-500/30" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{post.restaurantName}</p>
          <p className="text-xs text-gray-500">Sponsored</p>
        </div>
        <MoreHorizontal className="h-5 w-5 text-gray-400" />
      </div>
      <img src={post.image} alt="" className="w-full aspect-square object-cover" />
      <div className="p-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-4">
            <Heart className="h-6 w-6 text-gray-900 dark:text-white" />
            <MessageCircle className="h-6 w-6 text-gray-900 dark:text-white" />
            <Send className="h-6 w-6 text-gray-900 dark:text-white" />
          </div>
          <Bookmark className="h-6 w-6 text-gray-900 dark:text-white" />
        </div>
        <p className="text-sm text-gray-900 dark:text-white">
          <span className="font-semibold">{post.restaurantName}</span>{' '}
          {post.caption}
        </p>
        {post.hashtags?.length > 0 && (
          <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">{post.hashtags.join(' ')}</p>
        )}
        {post.cta && (
          <button className="mt-3 w-full py-2 rounded-lg bg-blue-500 text-white text-sm font-medium">
            {post.cta}
          </button>
        )}
      </div>
    </div>
  )
}

function FacebookPreview({ post }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden max-w-md mx-auto shadow-xl">
      <div className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <img src={post.restaurantLogo} alt="" className="h-10 w-10 rounded-full object-cover" />
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">{post.restaurantName}</p>
            <p className="text-xs text-gray-500">Just now · 🌐</p>
          </div>
        </div>
        <p className="text-sm text-gray-900 dark:text-white mb-2">{post.caption}</p>
        {post.hashtags?.length > 0 && (
          <p className="text-sm text-blue-600 dark:text-blue-400 mb-3">{post.hashtags.join(' ')}</p>
        )}
      </div>
      <img src={post.image} alt="" className="w-full aspect-[4/3] object-cover" />
      <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-around text-gray-500">
          <button className="flex items-center gap-2 text-sm hover:text-blue-600 transition-colors">
            <ThumbsUp className="h-5 w-5" /> Like
          </button>
          <button className="flex items-center gap-2 text-sm hover:text-blue-600 transition-colors">
            <MessageCircle className="h-5 w-5" /> Comment
          </button>
          <button className="flex items-center gap-2 text-sm hover:text-blue-600 transition-colors">
            <Share2 className="h-5 w-5" /> Share
          </button>
        </div>
      </div>
    </div>
  )
}

function TwitterPreview({ post }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden max-w-md mx-auto shadow-xl p-4">
      <div className="flex gap-3">
        <img src={post.restaurantLogo} alt="" className="h-10 w-10 rounded-full object-cover flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 flex-wrap">
            <span className="font-bold text-gray-900 dark:text-white text-sm">{post.restaurantName}</span>
            <span className="text-gray-500 text-sm">@{post.restaurantName.replace(/\s/g, '').toLowerCase()}</span>
            <span className="text-gray-500 text-sm">· 1m</span>
          </div>
          <p className="text-sm text-gray-900 dark:text-white mt-1">{post.caption}</p>
          {post.hashtags?.length > 0 && (
            <p className="text-sm text-blue-500 mt-1">{post.hashtags.join(' ')}</p>
          )}
          <img src={post.image} alt="" className="w-full rounded-xl mt-3 aspect-video object-cover" />
          <div className="flex items-center justify-between mt-3 max-w-xs text-gray-500">
            <MessageCircle className="h-4 w-4" />
            <Repeat2 className="h-4 w-4" />
            <Heart className="h-4 w-4" />
            <Share2 className="h-4 w-4" />
          </div>
        </div>
      </div>
    </div>
  )
}

function LinkedInPreview({ post }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden max-w-md mx-auto shadow-xl">
      <div className="p-4 flex items-center gap-3 border-b border-gray-100 dark:border-gray-800">
        <img src={post.restaurantLogo} alt="" className="h-11 w-11 rounded-lg object-cover ring-1 ring-blue-500/20" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{post.restaurantName}</p>
          <p className="text-xs text-gray-500 truncate">Hospitality & Food Services · 1h · 🌐</p>
        </div>
        <MoreHorizontal className="h-5 w-5 text-gray-400" />
      </div>
      <div className="p-4">
        <p className="text-sm text-gray-900 dark:text-white whitespace-pre-line mb-3">{post.caption}</p>
        {post.hashtags?.length > 0 && (
          <p className="text-sm text-blue-600 dark:text-blue-400 mb-3">{Array.isArray(post.hashtags) ? post.hashtags.join(' ') : post.hashtags}</p>
        )}
      </div>
      {post.image && (
        <img src={post.image} alt="" className="w-full aspect-video object-cover" />
      )}
      <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-gray-500 text-xs">
        <button className="flex items-center gap-1.5 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium">
          <ThumbsUp className="h-4 w-4" /> Like
        </button>
        <button className="flex items-center gap-1.5 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium">
          <MessageCircle className="h-4 w-4" /> Comment
        </button>
        <button className="flex items-center gap-1.5 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium">
          <Repeat2 className="h-4 w-4" /> Repost
        </button>
        <button className="flex items-center gap-1.5 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium">
          <Send className="h-4 w-4" /> Send
        </button>
      </div>
    </div>
  )
}

function YouTubePreview({ post }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden max-w-md mx-auto shadow-xl">
      <div className="p-4 flex items-center gap-3 border-b border-gray-100 dark:border-gray-800">
        <img src={post.restaurantLogo} alt="" className="h-10 w-10 rounded-full object-cover" />
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">{post.restaurantName}</p>
          <p className="text-xs text-gray-500">Community post · 1 hour ago</p>
        </div>
      </div>
      <div className="p-4">
        <p className="text-sm text-gray-900 dark:text-white mb-3">{post.caption}</p>
        {post.hashtags?.length > 0 && (
          <p className="text-sm text-blue-600 dark:text-blue-400 mb-3">{Array.isArray(post.hashtags) ? post.hashtags.join(' ') : post.hashtags}</p>
        )}
        <img src={post.image} alt="" className="w-full rounded-xl aspect-video object-cover" />
        {post.cta && (
          <button className="mt-3 px-4 py-2 rounded-full bg-red-600 text-white text-sm font-medium">
            {post.cta}
          </button>
        )}
      </div>
      <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800 flex items-center gap-6 text-gray-500 text-sm">
        <button className="flex items-center gap-1.5 hover:text-gray-700 dark:hover:text-gray-300">
          <ThumbsUp className="h-4 w-4" /> Like
        </button>
        <button className="flex items-center gap-1.5 hover:text-gray-700 dark:hover:text-gray-300">
          <MessageCircle className="h-4 w-4" /> Comment
        </button>
        <button className="flex items-center gap-1.5 hover:text-gray-700 dark:hover:text-gray-300">
          <Share2 className="h-4 w-4" /> Share
        </button>
      </div>
    </div>
  )
}

const previewComponents = {
  Instagram: InstagramPreview,
  Facebook: FacebookPreview,
  'Twitter(X)': TwitterPreview,
  LinkedIn: LinkedInPreview,
  YouTube: YouTubePreview,
}

export default function PostPreview({ post, platform }) {
  const activePlatform = platform || post.platform
  const PreviewComponent = previewComponents[activePlatform] || LinkedInPreview
  const PlatformIcon = Icons[platformIcons[activePlatform]] || Icons.Globe

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 justify-center">
        <PlatformIcon className="h-5 w-5 text-gray-500" />
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{activePlatform} Preview</span>
      </div>
      <PreviewComponent post={post} />
    </div>
  )
}

export function PostPreviewGrid({ post }) {
  const platforms = ['Instagram', 'Facebook', 'Twitter(X)', 'LinkedIn', 'YouTube']

  return (
    <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-8">
      {platforms.map((platform) => (
        <PostPreview key={platform} post={post} platform={platform} />
      ))}
    </div>
  )
}
