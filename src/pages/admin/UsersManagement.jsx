import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Search, Filter, Eye, CheckCircle, XCircle, AlertOctagon, Trash2, Building2, UserPlus, Sparkles } from 'lucide-react'
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

const planBadges = {
  Starter: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  Professional: 'bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400 font-semibold',
  Enterprise: 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 font-bold',
  Trial: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
}

export default function UsersManagement() {
  const { users, updateUserStatus, deleteUser } = useAdmin()

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [planFilter, setPlanFilter] = useState('All')
  const [businessTypeFilter, setBusinessTypeFilter] = useState('All')

  // Modal State
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    userId: null,
    userName: '',
    action: '',
    title: '',
    message: '',
    type: 'warning',
    confirmText: 'Confirm',
  })

  // Extract unique business types for filter dropdown
  const businessTypesList = useMemo(() => {
    const types = new Set(users.map((u) => u.businessType).filter(Boolean))
    return ['All', ...Array.from(types)]
  }, [users])

  // Filtered Users list
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchSearch =
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.businessName.toLowerCase().includes(searchTerm.toLowerCase())

      const matchStatus = statusFilter === 'All' || u.status === statusFilter
      const matchPlan = planFilter === 'All' || u.plan === planFilter
      const matchType = businessTypeFilter === 'All' || u.businessType === businessTypeFilter

      return matchSearch && matchStatus && matchPlan && matchType
    })
  }, [users, searchTerm, statusFilter, planFilter, businessTypeFilter])

  const openActionModal = (user, action) => {
    if (action === 'Activate') {
      setModalConfig({
        isOpen: true,
        userId: user.id,
        userName: user.name,
        action: 'Activate',
        title: `Activate User: ${user.name}?`,
        message: `This will restore full access for ${user.name} (${user.email}).`,
        type: 'success',
        confirmText: 'Activate User',
      })
    } else if (action === 'Deactivate') {
      setModalConfig({
        isOpen: true,
        userId: user.id,
        userName: user.name,
        action: 'Deactivate',
        title: `Deactivate User: ${user.name}?`,
        message: `Deactivating will temporarily pause ${user.name}'s platform access.`,
        type: 'warning',
        confirmText: 'Deactivate User',
      })
    } else if (action === 'Suspend') {
      setModalConfig({
        isOpen: true,
        userId: user.id,
        userName: user.name,
        action: 'Suspend',
        title: `Suspend User: ${user.name}?`,
        message: `Suspending will lock ${user.name}'s account due to compliance or terms review.`,
        type: 'danger',
        confirmText: 'Suspend User',
      })
    } else if (action === 'Delete') {
      setModalConfig({
        isOpen: true,
        userId: user.id,
        userName: user.name,
        action: 'Delete',
        title: `Permanently Delete User: ${user.name}?`,
        message: `Warning: This action cannot be undone. All associated data for ${user.name} will be removed.`,
        type: 'danger',
        confirmText: 'Delete User Permanently',
      })
    }
  }

  const handleModalConfirm = () => {
    const { userId, action } = modalConfig
    if (action === 'Delete') {
      deleteUser(userId)
    } else {
      updateUserStatus(userId, action === 'Activate' ? 'Active' : action === 'Deactivate' ? 'Inactive' : 'Suspended')
    }
    setModalConfig((prev) => ({ ...prev, isOpen: false }))
  }

  return (
    <AdminGuard>
      <div className="space-y-6 animate-fade-in pb-12">
        {/* Page Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              User Management
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              View, search, filter, and manage registered platform accounts.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 border border-brand-200 dark:border-brand-800">
              Total Users: {users.length}
            </span>
          </div>
        </div>

        {/* STEP 13: Search & Filters Bar */}
        <Card className="p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, or business..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400 shrink-0 hidden sm:block" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Suspended">Suspended</option>
              </select>
            </div>

            {/* Plan Filter */}
            <div>
              <select
                value={planFilter}
                onChange={(e) => setPlanFilter(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="All">All Plans</option>
                <option value="Starter">Starter</option>
                <option value="Professional">Professional</option>
                <option value="Enterprise">Enterprise</option>
                <option value="Trial">Trial</option>
              </select>
            </div>

            {/* Business Type Filter */}
            <div>
              <select
                value={businessTypeFilter}
                onChange={(e) => setBusinessTypeFilter(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {businessTypesList.map((type) => (
                  <option key={type} value={type}>
                    {type === 'All' ? 'All Business Types' : type}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {(searchTerm || statusFilter !== 'All' || planFilter !== 'All' || businessTypeFilter !== 'All') && (
            <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs text-gray-500">
              <span>Showing {filteredUsers.length} of {users.length} users</span>
              <button
                onClick={() => {
                  setSearchTerm('')
                  setStatusFilter('All')
                  setPlanFilter('All')
                  setBusinessTypeFilter('All')
                }}
                className="text-brand-600 dark:text-brand-400 font-semibold hover:underline"
              >
                Reset All Filters
              </button>
            </div>
          )}
        </Card>

        {/* STEP 3: Users Table */}
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 dark:bg-gray-800/80 text-gray-500 dark:text-gray-400 font-semibold border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4 hidden md:table-cell">Business</th>
                  <th className="px-6 py-4 hidden lg:table-cell">Business Type</th>
                  <th className="px-6 py-4 text-center hidden sm:table-cell">Restaurants</th>
                  <th className="px-6 py-4 hidden xl:table-cell">Joined Date</th>
                  <th className="px-6 py-4">Plan</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                      <Sparkles className="h-10 w-10 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                      <p className="font-semibold text-base">No users found</p>
                      <p className="text-xs mt-1">Try adjusting your search criteria or active filters.</p>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr
                      key={user.id}
                      className="hover:bg-gray-50/70 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      {/* User Info */}
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white">{user.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                        </div>
                      </td>

                      {/* Business */}
                      <td className="px-6 py-4 font-medium text-gray-700 dark:text-gray-300 hidden md:table-cell">
                        {user.businessName}
                      </td>

                      {/* Business Type */}
                      <td className="px-6 py-4 text-gray-500 dark:text-gray-400 text-xs hidden lg:table-cell">
                        {user.businessType}
                      </td>

                      {/* Restaurants Count */}
                      <td className="px-6 py-4 text-center hidden sm:table-cell">
                        <span className="inline-flex items-center gap-1 font-semibold text-gray-700 dark:text-gray-300">
                          <Building2 className="h-3.5 w-3.5 text-gray-400" />
                          {user.restaurantsCount}
                        </span>
                      </td>

                      {/* Joined Date */}
                      <td className="px-6 py-4 text-xs text-gray-500 dark:text-gray-400 hidden xl:table-cell">
                        {user.joinedDate}
                      </td>

                      {/* Plan */}
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs ${planBadges[user.plan] || 'bg-gray-100 text-gray-700'}`}>
                          {user.plan}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold border ${statusBadges[user.status]}`}>
                          {user.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View Details */}
                          <Link
                            to={`/admin/users/${user.id}`}
                            className="p-1.5 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            title="View User Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>

                          {/* Action drop buttons */}
                          {user.status !== 'Active' && (
                            <button
                              onClick={() => openActionModal(user, 'Activate')}
                              className="p-1.5 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-colors"
                              title="Activate User"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                          )}

                          {user.status === 'Active' && (
                            <button
                              onClick={() => openActionModal(user, 'Deactivate')}
                              className="p-1.5 rounded-lg text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/30 transition-colors"
                              title="Deactivate User"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          )}

                          {user.status !== 'Suspended' && (
                            <button
                              onClick={() => openActionModal(user, 'Suspend')}
                              className="p-1.5 rounded-lg text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                              title="Suspend User"
                            >
                              <AlertOctagon className="h-4 w-4" />
                            </button>
                          )}

                          <button
                            onClick={() => openActionModal(user, 'Delete')}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                            title="Delete User"
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
