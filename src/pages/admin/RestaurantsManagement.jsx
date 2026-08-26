import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Search, Filter, Eye, CheckCircle2, XCircle, Trash2, Building2, MapPin, FileText, Sparkles } from 'lucide-react'
import Card from '../../components/Card'
import { useAdmin } from '../../context/AdminContext'
import AdminConfirmationModal from '../../components/admin/AdminConfirmationModal'
import AdminGuard from '../../components/admin/AdminGuard'

const statusBadges = {
  Active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
  Inactive: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700',
  Pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800 font-semibold',
}

export default function RestaurantsManagement() {
  const { restaurants, updateRestaurantStatus, approveRestaurant, deleteRestaurant } = useAdmin()

  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')

  // Modal State
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    restaurantId: null,
    restaurantName: '',
    action: '',
    title: '',
    message: '',
    type: 'warning',
    confirmText: 'Confirm',
  })

  // Categories dropdown list
  const categoryList = useMemo(() => {
    const categories = new Set(restaurants.map((r) => r.category).filter(Boolean))
    return ['All', ...Array.from(categories)]
  }, [restaurants])

  // Filtered list
  const filteredRestaurants = useMemo(() => {
    return restaurants.filter((r) => {
      const matchSearch =
        r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.owner.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.location.toLowerCase().includes(searchTerm.toLowerCase())

      const matchCategory = categoryFilter === 'All' || r.category === categoryFilter
      const matchStatus = statusFilter === 'All' || r.status === statusFilter

      return matchSearch && matchCategory && matchStatus
    })
  }, [restaurants, searchTerm, categoryFilter, statusFilter])

  const openActionModal = (restaurant, action) => {
    if (action === 'Approve') {
      setModalConfig({
        isOpen: true,
        restaurantId: restaurant.id,
        restaurantName: restaurant.name,
        action: 'Approve',
        title: `Approve Restaurant: ${restaurant.name}?`,
        message: `This will approve ${restaurant.name} and enable full publishing features for ${restaurant.owner}.`,
        type: 'success',
        confirmText: 'Approve Restaurant',
      })
    } else if (action === 'Deactivate') {
      setModalConfig({
        isOpen: true,
        restaurantId: restaurant.id,
        restaurantName: restaurant.name,
        action: 'Deactivate',
        title: `Deactivate Restaurant: ${restaurant.name}?`,
        message: `Deactivating will temporarily disable content publishing for ${restaurant.name}.`,
        type: 'warning',
        confirmText: 'Deactivate Restaurant',
      })
    } else if (action === 'Activate') {
      setModalConfig({
        isOpen: true,
        restaurantId: restaurant.id,
        restaurantName: restaurant.name,
        action: 'Activate',
        title: `Activate Restaurant: ${restaurant.name}?`,
        message: `Restores active status for ${restaurant.name}.`,
        type: 'success',
        confirmText: 'Activate Restaurant',
      })
    } else if (action === 'Delete') {
      setModalConfig({
        isOpen: true,
        restaurantId: restaurant.id,
        restaurantName: restaurant.name,
        action: 'Delete',
        title: `Permanently Delete Restaurant: ${restaurant.name}?`,
        message: `Warning: This action cannot be undone. All linked branches and posts for ${restaurant.name} will be removed.`,
        type: 'danger',
        confirmText: 'Delete Restaurant',
      })
    }
  }

  const handleModalConfirm = () => {
    const { restaurantId, action } = modalConfig
    if (action === 'Approve') {
      approveRestaurant(restaurantId)
    } else if (action === 'Delete') {
      deleteRestaurant(restaurantId)
    } else {
      updateRestaurantStatus(restaurantId, action === 'Activate' ? 'Active' : 'Inactive')
    }
    setModalConfig((prev) => ({ ...prev, isOpen: false }))
  }

  return (
    <AdminGuard>
      <div className="space-y-6 animate-fade-in pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              Restaurant Management
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              View, approve, deactivate, and monitor registered restaurant entities.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800">
              Total Restaurants: {restaurants.length}
            </span>
          </div>
        </div>

        {/* STEP 13: Search & Filters Bar */}
        <Card className="p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by restaurant, owner, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400 shrink-0 hidden sm:block" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {categoryList.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat === 'All' ? 'All Categories' : cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Pending">Pending</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          {(searchTerm || categoryFilter !== 'All' || statusFilter !== 'All') && (
            <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs text-gray-500">
              <span>Showing {filteredRestaurants.length} of {restaurants.length} restaurants</span>
              <button
                onClick={() => {
                  setSearchTerm('')
                  setCategoryFilter('All')
                  setStatusFilter('All')
                }}
                className="text-brand-600 dark:text-brand-400 font-semibold hover:underline"
              >
                Reset Filters
              </button>
            </div>
          )}
        </Card>

        {/* STEP 5: Restaurants Table */}
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 dark:bg-gray-800/80 text-gray-500 dark:text-gray-400 font-semibold border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-4">Restaurant</th>
                  <th className="px-6 py-4 hidden md:table-cell">Owner</th>
                  <th className="px-6 py-4 hidden lg:table-cell">Category</th>
                  <th className="px-6 py-4 text-center hidden sm:table-cell">Branches</th>
                  <th className="px-6 py-4 hidden xl:table-cell">Location</th>
                  <th className="px-6 py-4 text-center hidden md:table-cell">Posts</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filteredRestaurants.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                      <Sparkles className="h-10 w-10 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                      <p className="font-semibold text-base">No restaurants found</p>
                      <p className="text-xs mt-1">Try adjusting search keywords or category filters.</p>
                    </td>
                  </tr>
                ) : (
                  filteredRestaurants.map((rest) => (
                    <tr
                      key={rest.id}
                      className="hover:bg-gray-50/70 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      {/* Name & Date */}
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white">{rest.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Created: {rest.createdDate}</p>
                        </div>
                      </td>

                      {/* Owner */}
                      <td className="px-6 py-4 font-medium text-gray-700 dark:text-gray-300 hidden md:table-cell">
                        {rest.owner}
                      </td>

                      {/* Category */}
                      <td className="px-6 py-4 text-gray-500 dark:text-gray-400 text-xs hidden lg:table-cell">
                        <span className="inline-flex px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 font-semibold text-gray-700 dark:text-gray-300">
                          {rest.category}
                        </span>
                      </td>

                      {/* Branches */}
                      <td className="px-6 py-4 text-center hidden sm:table-cell">
                        <span className="inline-flex items-center gap-1 font-semibold text-gray-700 dark:text-gray-300">
                          <MapPin className="h-3.5 w-3.5 text-gray-400" />
                          {rest.branchesCount}
                        </span>
                      </td>

                      {/* Location */}
                      <td className="px-6 py-4 text-xs text-gray-500 dark:text-gray-400 hidden xl:table-cell">
                        {rest.location}
                      </td>

                      {/* Posts */}
                      <td className="px-6 py-4 text-center font-semibold text-gray-700 dark:text-gray-300 hidden md:table-cell">
                        {rest.postsCount}
                      </td>

                      {/* Status Badge */}
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs border ${statusBadges[rest.status]}`}>
                          {rest.status}
                        </span>
                      </td>

                      {/* Action buttons */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            to={`/admin/restaurants/${rest.id}`}
                            className="p-1.5 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            title="View Restaurant Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>

                          {rest.status === 'Pending' && (
                            <button
                              onClick={() => openActionModal(rest, 'Approve')}
                              className="px-2 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 hover:bg-emerald-100 transition-colors"
                              title="Approve Restaurant"
                            >
                              Approve
                            </button>
                          )}

                          {rest.status === 'Active' && (
                            <button
                              onClick={() => openActionModal(rest, 'Deactivate')}
                              className="p-1.5 rounded-lg text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/30 transition-colors"
                              title="Deactivate Restaurant"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          )}

                          {rest.status === 'Inactive' && (
                            <button
                              onClick={() => openActionModal(rest, 'Activate')}
                              className="p-1.5 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-colors"
                              title="Activate Restaurant"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </button>
                          )}

                          <button
                            onClick={() => openActionModal(rest, 'Delete')}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                            title="Delete Restaurant"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* STEP 14: Confirmation Modal */}
        <AdminConfirmationModal
          isOpen={modalConfig.isOpen}
          onClose={() => setModalConfig((prev) => ({ ...prev, isOpen: false }))}
          onConfirm={handleModalConfirm}
          title={modalConfig.title}
          message={modalConfig.message}
          type={modalConfig.type}
          confirmText={modalConfig.confirmText}
        />
      </div>
    </AdminGuard>
  )
}
