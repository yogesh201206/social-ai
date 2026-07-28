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

function TikTokPreview({ post }) {
  return (
    <div className="relative bg-black rounded-2xl overflow-hidden max-w-[280px] mx-auto shadow-xl aspect-[9/16]">
      <img src={post.image} alt="" className="w-full h-full object-cover opacity-80" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <div className="flex items-center gap-2 mb-2">
          <img src={post.restaurantLogo} alt="" className="h-8 w-8 rounded-full object-cover border border-white" />
          <span className="text-white text-sm font-semibold">@{post.restaurantName.replace(/\s/g, '').toLowerCase()}</span>
        </div>
        <p className="text-white text-xs line-clamp-3">{post.caption}</p>
        {post.hashtags?.length > 0 && (
          <p className="text-white/80 text-xs mt-1">{post.hashtags.slice(0, 3).join(' ')}</p>
        )}
      </div>
      <div className="absolute right-3 bottom-20 flex flex-col items-center gap-4">
        <div className="flex flex-col items-center">
          <Heart className="h-6 w-6 text-white" />
          <span className="text-white text-xs mt-1">2.4K</span>
        </div>
        <div className="flex flex-col items-center">
          <MessageCircle className="h-6 w-6 text-white" />
          <span className="text-white text-xs mt-1">128</span>
        </div>
        <Share2 className="h-6 w-6 text-white" />
      </div>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="h-14 w-14 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
          <Play className="h-7 w-7 text-white fill-white" />
        </div>
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
          <p className="text-sm text-blue-600 dark:text-blue-400 mb-3">{post.hashtags.join(' ')}</p>
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
  TikTok: TikTokPreview,
  YouTube: YouTubePreview,
}

export default function PostPreview({ post, platform }) {
  const activePlatform = platform || post.platform
  const PreviewComponent = previewComponents[activePlatform] || InstagramPreview
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
  const platforms = ['Instagram', 'Facebook', 'Twitter(X)', 'TikTok', 'YouTube']

  return (
    <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-8">
      {platforms.map((platform) => (
        <PostPreview key={platform} post={post} platform={platform} />
      ))}
    </div>
  )
}
