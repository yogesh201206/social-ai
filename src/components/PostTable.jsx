import { Link } from 'react-router-dom'
import StatusBadge from './StatusBadge'

export default function PostTable({ posts, showMetrics = false }) {
  if (!posts.length) return null

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
            <th className="pb-3 font-medium">Post</th>
            <th className="pb-3 font-medium hidden sm:table-cell">Platform</th>
            <th className="pb-3 font-medium hidden md:table-cell">Restaurant</th>
            <th className="pb-3 font-medium">Date</th>
            <th className="pb-3 font-medium">Status</th>
            {showMetrics && (
              <>
                <th className="pb-3 font-medium hidden lg:table-cell">Likes</th>
                <th className="pb-3 font-medium hidden lg:table-cell">Comments</th>
                <th className="pb-3 font-medium hidden xl:table-cell">Shares</th>
              </>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
          {posts.map((post) => (
            <tr key={post.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
              <td className="py-3">
                <Link
                  to={`/dashboard/posts/${post.id}`}
                  className="flex items-center gap-3 group"
                >
                  <img
                    src={post.image}
                    alt=""
                    className="h-10 w-10 rounded-lg object-cover flex-shrink-0"
                  />
                  <span className="font-medium text-gray-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors truncate max-w-[160px]">
                    {post.title}
                  </span>
                </Link>
              </td>
              <td className="py-3 text-gray-500 dark:text-gray-400 hidden sm:table-cell">{post.platform}</td>
              <td className="py-3 text-gray-500 dark:text-gray-400 hidden md:table-cell">{post.restaurantName}</td>
              <td className="py-3 text-gray-500 dark:text-gray-400">
                {post.status?.toLowerCase() === 'scheduled'
                  ? `${post.scheduledDate || ''} ${post.scheduledTime ? `at ${post.scheduledTime}` : ''}`.trim() || post.createdAt
                  : (post.publishedAt || post.createdAt)}
              </td>
              <td className="py-3">
                <StatusBadge status={post.status} />
              </td>
              {showMetrics && (
                <>
                  <td className="py-3 text-gray-500 dark:text-gray-400 hidden lg:table-cell">
                    {post.likes != null ? post.likes.toLocaleString() : (post.metrics?.likes != null ? post.metrics.likes.toLocaleString() : '—')}
                  </td>
                  <td className="py-3 text-gray-500 dark:text-gray-400 hidden lg:table-cell">
                    {post.comments != null ? post.comments.toLocaleString() : (post.metrics?.comments != null ? post.metrics.comments.toLocaleString() : '—')}
                  </td>
                  <td className="py-3 text-gray-500 dark:text-gray-400 hidden xl:table-cell">
                    {post.shares != null ? post.shares.toLocaleString() : (post.metrics?.shares != null ? post.metrics.shares.toLocaleString() : '—')}
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
