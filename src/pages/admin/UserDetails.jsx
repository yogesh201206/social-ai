import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Building2, MapPin, FileText, Sparkles, Megaphone, CheckCircle2, XCircle, AlertOctagon, Trash2, Calendar, Phone, Mail, User, ShieldCheck } from 'lucide-react'
import Card from '../../components/Card'
import Button from '../../components/Button'
import { useAdmin } from '../../context/AdminContext'
import AdminConfirmationModal from '../../components/admin/AdminConfirmationModal'
import AdminGuard from '../../components/admin/AdminGuard'

const statusBadges = {
  Active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
  Inactive: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700',
  Suspended: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800',
}

export default function UserDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getUser, updateUserStatus, deleteUser } = useAdmin()

  const user = getUser(id)
  const [activeTab, setActiveTab] = useState('posts')

  // Modal state
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    action: '',
    title: '',
    message: '',
    type: 'warning',
    confirmText: 'Confirm',
  })

  if (!user) {
    return (
      <AdminGuard>
        <div className="py-20 text-center animate-fade-in">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">User Not Found</h2>
          <p className="text-sm text-gray-500 mt-2 mb-6">The requested user ID standard record does not exist.</p>
          <Link to="/admin/users">
            <Button variant="primary">
              <ArrowLeft className="h-4 w-4" />
              Back to Users Management
            </Button>
          </Link>
        </div>
      </AdminGuard>
    )
  }

  const openActionModal = (action) => {
    if (action === 'Activate') {
      setModalConfig({
        isOpen: true,
        action: 'Activate',
        title: `Activate ${user.name}?`,
        message: 'This will restore active subscription privileges and system access.',
        type: 'success',
        confirmText: 'Activate User',
      })
    } else if (action === 'Deactivate') {
      setModalConfig({
        isOpen: true,
        action: 'Deactivate',
        title: `Deactivate ${user.name}?`,
        message: 'Deactivating will restrict posting and AI generation for this account.',
        type: 'warning',
        confirmText: 'Deactivate User',
      })
    } else if (action === 'Suspend') {
      setModalConfig({
        isOpen: true,
        action: 'Suspend',
        title: `Suspend ${user.name}?`,
        message: 'Suspending will completely lock account login and automated posting.',
        type: 'danger',
        confirmText: 'Suspend Account',
      })
    } else if (action === 'Delete') {
      setModalConfig({
        isOpen: true,
        action: 'Delete',
        title: `Delete ${user.name} Permanently?`,
        message: 'All associated restaurants, posts, and analytics data will be purged. This action cannot be reversed.',
        type: 'danger',
        confirmText: 'Delete User Account',
      })
    }
  }

  const handleConfirmAction = () => {
    if (modalConfig.action === 'Delete') {
      deleteUser(user.id)
      navigate('/admin/users')
    } else {
      updateUserStatus(
        user.id,
        modalConfig.action === 'Activate'
          ? 'Active'
          : modalConfig.action === 'Deactivate'
          ? 'Inactive'
          : 'Suspended'
      )
    }
    setModalConfig((prev) => ({ ...prev, isOpen: false }))
  }

  return (
    <AdminGuard>
      <div className="space-y-8 animate-fade-in pb-12">
        {/* Back Link & Header */}
        <div>
          <Link
            to="/admin/users"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 mb-3 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Users Management
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl gradient-bg flex items-center justify-center text-white font-bold text-2xl shadow-md">
                {user.name.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white">{user.name}</h2>
                  <span className={`px-3 py-0.5 rounded-full text-xs font-semibold border ${statusBadges[user.status]}`}>
                    {user.status}
                  </span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  {user.email} · {user.businessName}
                </p>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              {user.status !== 'Active' && (
                <Button variant="secondary" size="sm" onClick={() => openActionModal('Activate')}>
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Activate User
                </Button>
              )}
              {user.status === 'Active' && (
                <Button variant="secondary" size="sm" onClick={() => openActionModal('Deactivate')}>
                  <XCircle className="h-4 w-4 text-amber-600" />
                  Deactivate User
                </Button>
              )}
              {user.status !== 'Suspended' && (
                <Button variant="secondary" size="sm" onClick={() => openActionModal('Suspend')}>
                  <AlertOctagon className="h-4 w-4 text-red-600" />
                  Suspend User
                </Button>
              )}
              <Button variant="danger" size="sm" onClick={() => openActionModal('Delete')}>
                <Trash2 className="h-4 w-4" />
                Delete User
              </Button>
            </div>
          </div>
        </div>

        {/* STEP 4: User Profile Overview Card */}
        <Card className="p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 border-b border-gray-100 dark:border-gray-800 pb-3">
            User Profile Information
          </h3>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 text-sm">
            <div>
              <span className="text-xs text-gray-400 uppercase font-semibold flex items-center gap-1">
                <User className="h-3.5 w-3.5" /> Full Name
              </span>
              <p className="font-bold text-gray-900 dark:text-white mt-1">{user.name}</p>
            </div>

            <div>
              <span className="text-xs text-gray-400 uppercase font-semibold flex items-center gap-1">
                <Mail className="h-3.5 w-3.5" /> Email Address
              </span>
              <p className="font-bold text-gray-900 dark:text-white mt-1">{user.email}</p>
            </div>

            <div>
              <span className="text-xs text-gray-400 uppercase font-semibold flex items-center gap-1">
                <Phone className="h-3.5 w-3.5" /> Phone Number
              </span>
              <p className="font-bold text-gray-900 dark:text-white mt-1">{user.phone}</p>
            </div>

            <div>
              <span className="text-xs text-gray-400 uppercase font-semibold flex items-center gap-1">
                <Building2 className="h-3.5 w-3.5" /> Business Name
              </span>
              <p className="font-bold text-gray-900 dark:text-white mt-1">{user.businessName}</p>
            </div>

            <div>
              <span className="text-xs text-gray-400 uppercase font-semibold flex items-center gap-1">
                <Building2 className="h-3.5 w-3.5" /> Business Type
              </span>
              <p className="font-bold text-gray-900 dark:text-white mt-1">{user.businessType}</p>
            </div>

            <div>
              <span className="text-xs text-gray-400 uppercase font-semibold flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5" /> Subscription Plan
              </span>
              <p className="font-bold text-brand-600 dark:text-brand-400 mt-1">{user.plan} Plan</p>
            </div>

            <div>
              <span className="text-xs text-gray-400 uppercase font-semibold flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" /> Joined Date
              </span>
              <p className="font-bold text-gray-900 dark:text-white mt-1">{user.joinedDate}</p>
            </div>

            <div>
              <span className="text-xs text-gray-400 uppercase font-semibold flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> Current Status
              </span>
              <p className="font-bold text-gray-900 dark:text-white mt-1">{user.status}</p>
            </div>
          </div>
        </Card>

        {/* STEP 4: Statistics Cards (5 Cards) */}
        <div>
          <h3 className="text-base font-bold text-gray-900 dark:text-white mb-3">User Usage Metrics</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <Card className="p-5 text-center">
              <div className="h-10 w-10 mx-auto rounded-xl bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 flex items-center justify-center mb-2">
                <Building2 className="h-5 w-5" />
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Restaurants</span>
              <p className="text-2xl font-black text-gray-900 dark:text-white mt-0.5">{user.restaurantsCount}</p>
            </Card>

            <Card className="p-5 text-center">
              <div className="h-10 w-10 mx-auto rounded-xl bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-2">
                <MapPin className="h-5 w-5" />
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Branches</span>
              <p className="text-2xl font-black text-gray-900 dark:text-white mt-0.5">{user.branchesCount}</p>
            </Card>

            <Card className="p-5 text-center">
              <div className="h-10 w-10 mx-auto rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-2">
                <FileText className="h-5 w-5" />
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Total Posts</span>
              <p className="text-2xl font-black text-gray-900 dark:text-white mt-0.5">{user.postsCount}</p>
            </Card>

            <Card className="p-5 text-center">
              <div className="h-10 w-10 mx-auto rounded-xl bg-pink-50 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 flex items-center justify-center mb-2">
                <Sparkles className="h-5 w-5" />
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">AI Generations</span>
              <p className="text-2xl font-black text-gray-900 dark:text-white mt-0.5">{user.aiGenerationsCount}</p>
            </Card>

            <Card className="p-5 text-center col-span-2 sm:col-span-1">
              <div className="h-10 w-10 mx-auto rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-2">
                <Megaphone className="h-5 w-5" />
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Campaigns</span>
              <p className="text-2xl font-black text-gray-900 dark:text-white mt-0.5">{user.campaignsCount}</p>
            </Card>
          </div>
        </div>

        {/* STEP 4: Recent Activity Sections */}
        <Card className="p-6">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-4 mb-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Recent Account Activity</h3>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('posts')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors ${
                  activeTab === 'posts'
                    ? 'bg-brand-600 text-white shadow-md'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                }`}
              >
                Recent Posts ({user.recentPosts?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab('ai')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors ${
                  activeTab === 'ai'
                    ? 'bg-pink-600 text-white shadow-md'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                }`}
              >
                AI Generations ({user.recentAIGenerations?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab('campaigns')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors ${
                  activeTab === 'campaigns'
                    ? 'bg-amber-600 text-white shadow-md'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                }`}
              >
                Campaigns ({user.recentCampaigns?.length || 0})
              </button>
            </div>
          </div>

          {/* Posts Tab */}
          {activeTab === 'posts' && (
            <div className="space-y-3">
              {user.recentPosts?.map((post) => (
                <div
                  key={post.id}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-brand-600 dark:text-brand-400" />
                    <div>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{post.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Platform: {post.platform} · Date: {post.date}
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 text-xs rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-semibold">
                    {post.status}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* AI Generations Tab */}
          {activeTab === 'ai' && (
            <div className="space-y-3">
              {user.recentAIGenerations?.map((gen) => (
                <div
                  key={gen.id}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800"
                >
                  <div className="flex items-center gap-3">
                    <Sparkles className="h-5 w-5 text-pink-600 dark:text-pink-400" />
                    <div>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">"{gen.prompt}"</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Type: {gen.type} · Generated: {gen.date}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Campaigns Tab */}
          {activeTab === 'campaigns' && (
            <div className="space-y-3">
              {user.recentCampaigns?.map((cmp) => (
                <div
                  key={cmp.id}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800"
                >
                  <div className="flex items-center gap-3">
                    <Megaphone className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    <div>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{cmp.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Recipients: {cmp.sentCount.toLocaleString()} emails
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 text-xs rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-semibold">
                    {cmp.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Confirmation Modal */}
        <AdminConfirmationModal
          isOpen={modalConfig.isOpen}
          onClose={() => setModalConfig((prev) => ({ ...prev, isOpen: false }))}
          onConfirm={handleConfirmAction}
          title={modalConfig.title}
          message={modalConfig.message}
          type={modalConfig.type}
          confirmText={modalConfig.confirmText}
        />
      </div>
    </AdminGuard>
  )
}
