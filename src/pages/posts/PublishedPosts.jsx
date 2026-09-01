import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Heart, MessageCircle, Share2, Eye } from 'lucide-react'
import { usePosts } from '../../context/PostContext'
import PostsNav from '../../components/PostsNav'
import StatusBadge from '../../components/StatusBadge'
import EmptyState from '../../components/EmptyState'
import { PostCardSkeleton } from '../../components/Skeleton'

export default function PublishedPosts() {
  const { getPostsByStatus } = usePosts()
  const published = getPostsByStatus('Published')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Published Posts</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Track performance of your live social media posts.
        </p>
      </div>

      <PostsNav />

      {loading ? (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <PostCardSkeleton key={i} />
          ))}
        </div>
      ) : published.length === 0 ? (
        <EmptyState
          icon="CheckCircle"
          title="No published posts"
          description="Once your posts go live, they'll appear here with performance metrics."
        />
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
          {published.map((post) => (
            <article
              key={post.id}
              className="glass rounded-2xl overflow-hidden group hover:shadow-lg hover:shadow-brand-500/10 transition-all duration-300 hover:-translate-y-1"
            >
              <div className="relative aspect-[16/10] overflow-hidden">
                <img
                  src={post.image}
                  alt={post.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3">
                  <StatusBadge status={post.status} />
                </div>
              </div>

              <div className="p-5">
                <h3 className="font-semibold text-gray-900 dark:text-white truncate">{post.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{post.caption}</p>

                <div className="flex items-center justify-between mt-3 text-xs text-gray-500 dark:text-gray-400">
                  <span>{post.platform}</span>
                  <span>Published {post.publishedAt}</span>
                </div>

                {/* Platform-specific real metrics */}
                {post.status === 'Published' && (
                  <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
                    {post.platform === 'YouTube' ? (
                      <>
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1 text-purple-500">
                            <Eye className="h-3.5 w-3.5" />
                            <span className="text-sm font-semibold text-gray-900 dark:text-white">
                              {post.views != null ? post.views.toLocaleString() : '—'}
                            </span>
                          </div>
                          <span className="text-[11px] text-gray-400">Views</span>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1 text-pink-500">
                            <Heart className="h-3.5 w-3.5" />
                            <span className="text-sm font-semibold text-gray-900 dark:text-white">
                              {post.likes != null ? post.likes.toLocaleString() : '—'}
                            </span>
                          </div>
                          <span className="text-[11px] text-gray-400">Likes</span>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1 text-blue-500">
                            <MessageCircle className="h-3.5 w-3.5" />
                            <span className="text-sm font-semibold text-gray-900 dark:text-white">
                              {post.comments != null ? post.comments.toLocaleString() : '—'}
                            </span>
                          </div>
                          <span className="text-[11px] text-gray-400">Comments</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1 text-pink-500">
                            <Heart className="h-3.5 w-3.5" />
                            <span className="text-sm font-semibold text-gray-900 dark:text-white">
                              {post.likes != null ? post.likes.toLocaleString() : '—'}
                            </span>
                          </div>
                          <span className="text-[11px] text-gray-400">Likes</span>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1 text-blue-500">
                            <MessageCircle className="h-3.5 w-3.5" />
                            <span className="text-sm font-semibold text-gray-900 dark:text-white">
                              {post.comments != null ? post.comments.toLocaleString() : '—'}
                            </span>
                          </div>
                          <span className="text-[11px] text-gray-400">{post.platform === 'Twitter' ? 'Replies' : 'Comments'}</span>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1 text-green-500">
                            <Share2 className="h-3.5 w-3.5" />
                            <span className="text-sm font-semibold text-gray-900 dark:text-white">
                              {post.shares != null ? post.shares.toLocaleString() : '—'}
                            </span>
                          </div>
                          <span className="text-[11px] text-gray-400">{post.platform === 'Twitter' ? 'Reposts' : 'Shares'}</span>
                        </div>
                      </>
                    )}
                  </div>
                )}

                <Link
                  to={`/dashboard/posts/${post.id}`}
                  className="mt-4 w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-brand-50 dark:hover:bg-brand-900/20 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                >
                  <Eye className="h-3.5 w-3.5" />
                  View Details
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
