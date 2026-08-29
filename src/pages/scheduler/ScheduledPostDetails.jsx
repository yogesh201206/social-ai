import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft, Calendar, Clock, Globe, Building2, MapPin, Pencil, XCircle, Trash2,
} from 'lucide-react'
import * as Icons from 'lucide-react'
import Button from '../../components/Button'
import Card from '../../components/Card'
import StatusBadge from '../../components/StatusBadge'
import EmptyState from '../../components/EmptyState'
import { useScheduler } from '../../context/SchedulerContext'
import { platformIcons, platformColors } from '../../data/postsData'
import { schedulerTimezones } from '../../data/schedulerData'

export default function ScheduledPostDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getScheduledPost, cancelScheduledPost, deleteScheduledPost } = useScheduler()

  const post = getScheduledPost(id)

  if (!post) {
    return (
      <EmptyState
        icon="Calendar"
        title="Post not found"
        description="This scheduled post may have been deleted or does not exist."
        actionLabel="Back to Scheduler"
        onAction={() => navigate('/dashboard/scheduler')}
      />
    )
  }

  const timezoneLabel = schedulerTimezones.find((tz) => tz.value === post.timezone)?.label || post.timezone

  const handleCancel = async () => {
    if (window.confirm('Cancel this scheduled post?')) {
      try {
        await cancelScheduledPost(id)
        navigate('/dashboard/scheduler')
      } catch (err) {
        alert(err.message || 'Failed to cancel scheduled post')
      }
    }
  }

  const handleDelete = async () => {
    if (window.confirm('Permanently delete this post? This action cannot be undone.')) {
      try {
        await deleteScheduledPost(id)
        navigate('/dashboard/scheduler')
      } catch (err) {
        alert(err.message || 'Failed to delete post')
      }
    }
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => navigate('/dashboard/scheduler')}
          className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{post.title}</h2>
            <StatusBadge status={post.status} />
          </div>
          <p className="text-gray-500 dark:text-gray-400 mt-0.5">
            Scheduled post details
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="overflow-hidden">
          <img src={post.image} alt={post.title} className="w-full aspect-video object-cover" />
          {post.video && (
            <div className="p-3 bg-gray-50 dark:bg-gray-800 text-sm text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-700">
              Video attachment included (placeholder)
            </div>
          )}
        </Card>

        <div className="space-y-4">
          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Caption</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{post.caption}</p>
            {post.hashtags?.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {post.hashtags.map((tag) => (
                  <span key={tag} className="text-xs px-2.5 py-1 rounded-full bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5 text-brand-500" />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Restaurant</p>
                <p className="font-medium text-gray-900 dark:text-white">{post.restaurantName}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-brand-500" />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Branch</p>
                <p className="font-medium text-gray-900 dark:text-white">{post.branchName}, {post.branchCity}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-brand-500" />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Scheduled Date</p>
                <p className="font-medium text-gray-900 dark:text-white">{post.scheduledDateDisplay || post.scheduledDate}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-brand-500" />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Scheduled Time</p>
                <p className="font-medium text-gray-900 dark:text-white">{post.scheduledTime}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Globe className="h-5 w-5 text-brand-500" />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Timezone</p>
                <p className="font-medium text-gray-900 dark:text-white">{timezoneLabel}</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <Card className="p-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Selected Platforms</h3>
        <div className="flex flex-wrap gap-3">
          {post.platforms.map((platform) => {
            const Icon = Icons[platformIcons[platform]] || Icons.Globe
            const gradient = platformColors[platform] || 'from-gray-500 to-gray-600'
            return (
              <div
                key={platform}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-br ${gradient} text-white shadow-sm`}
              >
                <Icon className="h-4 w-4" />
                <span className="text-sm font-medium">{platform}</span>
              </div>
            )
          })}
        </div>
      </Card>

      <div className="flex flex-col sm:flex-row gap-3">
        {post.status !== 'Cancelled' && post.status !== 'Published' && (
          <Link to={`/dashboard/scheduler/create?edit=${post.id}`} className="sm:flex-1">
            <Button variant="outline" className="w-full">
              <Pencil className="h-4 w-4" /> Edit Schedule
            </Button>
          </Link>
        )}
        {post.status === 'Scheduled' && (
          <Button variant="secondary" onClick={handleCancel} className="sm:flex-1">
            <XCircle className="h-4 w-4" /> Cancel Schedule
          </Button>
        )}
        <Button variant="danger" onClick={handleDelete} className="sm:flex-1">
          <Trash2 className="h-4 w-4" /> Delete
        </Button>
      </div>
    </div>
  )
}
