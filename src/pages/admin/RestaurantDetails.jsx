import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Building2, MapPin, Phone, Mail, FileText, Calendar, Sparkles, Megaphone, TrendingUp, CheckCircle2, XCircle, Trash2 } from 'lucide-react'
import Card from '../../components/Card'
import Button from '../../components/Button'
import { useAdmin } from '../../context/AdminContext'
import AdminConfirmationModal from '../../components/admin/AdminConfirmationModal'
import AdminGuard from '../../components/admin/AdminGuard'

const statusBadges = {
  Active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
  Inactive: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700',
  Pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800 font-semibold',
}

export default function RestaurantDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getRestaurant, updateRestaurantStatus, approveRestaurant, deleteRestaurant } = useAdmin()

  const restaurant = getRestaurant(id)

  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    action: '',
    title: '',
    message: '',
    type: 'warning',
    confirmText: 'Confirm',
  })

  if (!restaurant) {
    return (
      <AdminGuard>
        <div className="py-20 text-center animate-fade-in">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Restaurant Not Found</h2>
          <p className="text-sm text-gray-500 mt-2 mb-6">The requested restaurant standard record does not exist.</p>
          <Link to="/admin/restaurants">
            <Button variant="primary">
              <ArrowLeft className="h-4 w-4" />
              Back to Restaurant Management
            </Button>
          </Link>
        </div>
      </AdminGuard>
    )
  }

  const openActionModal = (action) => {
    if (action === 'Approve') {
      setModalConfig({
        isOpen: true,
        action: 'Approve',
        title: `Approve ${restaurant.name}?`,
        message: `This will activate ${restaurant.name} and grant owner access.`,
        type: 'success',
        confirmText: 'Approve Restaurant',
      })
    } else if (action === 'Deactivate') {
      setModalConfig({
        isOpen: true,
        action: 'Deactivate',
        title: `Deactivate ${restaurant.name}?`,
        message: 'This will temporarily disable active campaigns and scheduled publishing for this restaurant.',
        type: 'warning',
        confirmText: 'Deactivate',
      })
    } else if (action === 'Activate') {
      setModalConfig({
        isOpen: true,
        action: 'Activate',
        title: `Activate ${restaurant.name}?`,
        message: 'Restores active publishing and scheduling status for this restaurant.',
        type: 'success',
        confirmText: 'Activate',
      })
    } else if (action === 'Delete') {
      setModalConfig({
        isOpen: true,
        action: 'Delete',
        title: `Delete ${restaurant.name} Permanently?`,
        message: 'This will remove the restaurant entity and all associated location data permanently.',
        type: 'danger',
        confirmText: 'Delete Restaurant',
      })
    }
  }

  const handleConfirmAction = () => {
    if (modalConfig.action === 'Approve') {
      approveRestaurant(restaurant.id)
    } else if (modalConfig.action === 'Delete') {
      deleteRestaurant(restaurant.id)
      navigate('/admin/restaurants')
    } else {
      updateRestaurantStatus(restaurant.id, modalConfig.action === 'Activate' ? 'Active' : 'Inactive')
    }
    setModalConfig((prev) => ({ ...prev, isOpen: false }))
  }

  return (
    <AdminGuard>
      <div className="space-y-8 animate-fade-in pb-12">
        {/* Back Button & Title Header */}
        <div>
          <Link
            to="/admin/restaurants"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 mb-3 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Restaurant Management
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-2xl shadow-md">
                <Building2 className="h-7 w-7" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white">{restaurant.name}</h2>
                  <span className={`px-3 py-0.5 rounded-full text-xs font-semibold border ${statusBadges[restaurant.status]}`}>
                    {restaurant.status}
                  </span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  Owner: {restaurant.owner} ({restaurant.ownerEmail}) · Category: {restaurant.category}
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-2">
              {restaurant.status === 'Pending' && (
                <Button variant="primary" size="sm" onClick={() => openActionModal('Approve')}>
                  <CheckCircle2 className="h-4 w-4" />
                  Approve Restaurant
                </Button>
              )}
              {restaurant.status === 'Active' && (
                <Button variant="secondary" size="sm" onClick={() => openActionModal('Deactivate')}>
                  <XCircle className="h-4 w-4 text-amber-600" />
                  Deactivate
                </Button>
              )}
              {restaurant.status === 'Inactive' && (
                <Button variant="secondary" size="sm" onClick={() => openActionModal('Activate')}>
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Activate
                </Button>
              )}
              <Button variant="danger" size="sm" onClick={() => openActionModal('Delete')}>
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </div>
          </div>
        </div>

        {/* STEP 6: Restaurant Information */}
        <Card className="p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 border-b border-gray-100 dark:border-gray-800 pb-3">
            Restaurant Information
          </h3>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 text-sm">
            <div>
              <span className="text-xs text-gray-400 uppercase font-semibold block">Restaurant Name</span>
              <p className="font-bold text-gray-900 dark:text-white mt-1">{restaurant.name}</p>
            </div>

            <div>
              <span className="text-xs text-gray-400 uppercase font-semibold block">Owner / Manager</span>
              <p className="font-bold text-gray-900 dark:text-white mt-1">{restaurant.owner}</p>
            </div>

            <div>
              <span className="text-xs text-gray-400 uppercase font-semibold block">Owner Email</span>
              <p className="font-bold text-gray-900 dark:text-white mt-1">{restaurant.ownerEmail}</p>
            </div>

            <div>
              <span className="text-xs text-gray-400 uppercase font-semibold block">Cuisine / Category</span>
              <p className="font-bold text-purple-600 dark:text-purple-400 mt-1">{restaurant.category}</p>
            </div>

            <div>
              <span className="text-xs text-gray-400 uppercase font-semibold block">Business Type</span>
              <p className="font-bold text-gray-900 dark:text-white mt-1">{restaurant.businessType}</p>
            </div>

            <div>
              <span className="text-xs text-gray-400 uppercase font-semibold block">Primary Contact Phone</span>
              <p className="font-bold text-gray-900 dark:text-white mt-1">{restaurant.contact}</p>
            </div>

            <div className="sm:col-span-2">
              <span className="text-xs text-gray-400 uppercase font-semibold block">Headquarters Address</span>
              <p className="font-bold text-gray-900 dark:text-white mt-1">{restaurant.address}</p>
            </div>

            <div>
              <span className="text-xs text-gray-400 uppercase font-semibold block">Date Onboarded</span>
              <p className="font-bold text-gray-900 dark:text-white mt-1">{restaurant.createdDate}</p>
            </div>
          </div>
        </Card>

        {/* STEP 6: Performance Metrics */}
        <div>
          <h3 className="text-base font-bold text-gray-900 dark:text-white mb-3">Restaurant Performance</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <Card className="p-5 text-center">
              <div className="h-10 w-10 mx-auto rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-2">
                <FileText className="h-5 w-5" />
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Published Posts</span>
              <p className="text-2xl font-black text-gray-900 dark:text-white mt-0.5">
                {restaurant.performance?.posts || restaurant.postsCount}
              </p>
            </Card>

            <Card className="p-5 text-center">
              <div className="h-10 w-10 mx-auto rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-2">
                <Calendar className="h-5 w-5" />
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Scheduled Posts</span>
              <p className="text-2xl font-black text-gray-900 dark:text-white mt-0.5">
                {restaurant.performance?.scheduledPosts || 14}
              </p>
            </Card>

            <Card className="p-5 text-center">
              <div className="h-10 w-10 mx-auto rounded-xl bg-pink-50 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 flex items-center justify-center mb-2">
                <Sparkles className="h-5 w-5" />
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">AI Generations</span>
              <p className="text-2xl font-black text-gray-900 dark:text-white mt-0.5">
                {restaurant.performance?.aiGenerations || 320}
              </p>
            </Card>

            <Card className="p-5 text-center">
              <div className="h-10 w-10 mx-auto rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-2">
                <Megaphone className="h-5 w-5" />
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Active Campaigns</span>
              <p className="text-2xl font-black text-gray-900 dark:text-white mt-0.5">
                {restaurant.performance?.campaigns || 6}
              </p>
            </Card>

            <Card className="p-5 text-center col-span-2 sm:col-span-1">
              <div className="h-10 w-10 mx-auto rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2">
                <TrendingUp className="h-5 w-5" />
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Audience Reach</span>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                {restaurant.performance?.reach || '120K'}
              </p>
            </Card>
          </div>
        </div>

        {/* STEP 6: Branch Information Table */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Branch Locations</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">All registered physical branches for {restaurant.name}</p>
            </div>
            <span className="text-xs font-semibold px-3 py-1 rounded-xl bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
              {restaurant.branches?.length || 0} Locations
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-semibold border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-4 py-3">Branch Name</th>
                  <th className="px-4 py-3">Address & Location</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {restaurant.branches?.map((branch, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40">
                    <td className="px-4 py-3 font-bold text-gray-900 dark:text-white">
                      {branch.name}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                      {branch.location}
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">
                      {branch.contact}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                        {branch.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
