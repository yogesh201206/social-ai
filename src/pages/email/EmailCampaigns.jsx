import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Mail, Eye, Edit, Copy, Trash2, Plus, Building2, MapPin, Users, Calendar, Filter, MoreVertical, CheckCircle, Clock, AlertCircle
} from 'lucide-react'
import Button from '../../components/Button'
import Card from '../../components/Card'
import SearchBar from '../../components/SearchBar'
import StatusBadge from '../../components/StatusBadge'
import { useEmailMarketing } from '../../context/EmailMarketingContext'
import { useRestaurants } from '../../context/RestaurantContext'

export default function EmailCampaigns() {
  const navigate = useNavigate()
  const { campaigns, deleteCampaign, duplicateCampaign, filterCampaigns } = useEmailMarketing()
  const { restaurants } = useRestaurants()

  const [search, setSearch] = useState('')
  const [selectedRestaurant, setSelectedRestaurant] = useState('')
  const [selectedBranch, setSelectedBranch] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [deleteId, setDeleteId] = useState(null)

  // Get branches for selected restaurant
  const availableBranches = useMemo(() => {
    if (!selectedRestaurant) {
      return restaurants.flatMap((r) => r.branches || [])
    }
    const r = restaurants.find((res) => res.id === selectedRestaurant)
    return r ? r.branches || [] : []
  }, [selectedRestaurant, restaurants])

  const filteredCampaigns = useMemo(() => {
    return filterCampaigns({
      search,
      restaurantId: selectedRestaurant,
      branchId: selectedBranch,
      status: selectedStatus,
    })
  }, [search, selectedRestaurant, selectedBranch, selectedStatus, filterCampaigns])

  const handleDeleteConfirm = () => {
    if (deleteId) {
      deleteCampaign(deleteId)
      setDeleteId(null)
    }
  }

  const handleDuplicate = (id) => {
    const newCamp = duplicateCampaign(id)
    if (newCamp) {
      navigate(`/dashboard/email-marketing/${newCamp.id}/edit`)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <Card className="p-4 sm:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Email Campaigns List</h3>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              Manage all drafts, scheduled, and sent campaigns.
            </p>
          </div>
          <Link to="/dashboard/email-marketing/create">
            <Button variant="primary" size="md" className="w-full md:w-auto">
              <Plus className="h-4 w-4" />
              Create Campaign
            </Button>
          </Link>
        </div>

        {/* Search & Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <SearchBar
            placeholder="Search campaigns or subject..."
            onSearch={setSearch}
            className="w-full"
          />

          {/* Restaurant Filter */}
          <div className="relative">
            <select
              value={selectedRestaurant}
              onChange={(e) => {
                setSelectedRestaurant(e.target.value)
                setSelectedBranch('')
              }}
              className="w-full pl-3 pr-8 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-sm text-gray-900 dark:text-white border-0 outline-none focus:ring-2 focus:ring-brand-500/50 appearance-none cursor-pointer"
            >
              <option value="">All Restaurants</option>
              {restaurants.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
            <Building2 className="absolute right-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>

          {/* Branch Filter */}
          <div className="relative">
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="w-full pl-3 pr-8 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-sm text-gray-900 dark:text-white border-0 outline-none focus:ring-2 focus:ring-brand-500/50 appearance-none cursor-pointer"
            >
              <option value="">All Branches</option>
              {availableBranches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.city})
                </option>
              ))}
            </select>
            <MapPin className="absolute right-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full pl-3 pr-8 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-sm text-gray-900 dark:text-white border-0 outline-none focus:ring-2 focus:ring-brand-500/50 appearance-none cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="Draft">Draft</option>
              <option value="Scheduled">Scheduled</option>
              <option value="Sent">Sent</option>
              <option value="Paused">Paused</option>
            </select>
            <Filter className="absolute right-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </Card>

      {/* Campaigns Table / Cards */}
      {filteredCampaigns.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="h-16 w-16 mx-auto rounded-full bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 dark:text-brand-400 mb-4">
            <Mail className="h-8 w-8" />
          </div>
          <h4 className="text-lg font-bold text-gray-900 dark:text-white">No Email Campaigns Found</h4>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-md mx-auto">
            No campaigns match your current search or filter criteria. Create your first campaign now!
          </p>
          <div className="mt-6">
            <Link to="/dashboard/email-marketing/create">
              <Button variant="primary">
                <Plus className="h-4 w-4" />
                Create Email Campaign
              </Button>
            </Link>
          </div>
        </Card>
      ) : (
        <Card className="overflow-hidden border-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
              <thead className="bg-gray-50 dark:bg-gray-800/80 text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-4">Campaign & Subject</th>
                  <th className="px-6 py-4">Restaurant / Branch</th>
                  <th className="px-6 py-4">Audience</th>
                  <th className="px-6 py-4">Recipients</th>
                  <th className="px-6 py-4">Date & Time</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {filteredCampaigns.map((camp) => (
                  <tr
                    key={camp.id}
                    className="hover:bg-gray-50/80 dark:hover:bg-gray-800/50 transition-colors group"
                  >
                    <td className="px-6 py-4 min-w-[240px]">
                      <Link
                        to={`/dashboard/email-marketing/${camp.id}`}
                        className="font-semibold text-gray-900 dark:text-white hover:text-brand-600 dark:hover:text-brand-400 transition-colors line-clamp-1"
                      >
                        {camp.name}
                      </Link>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1 flex items-center gap-1">
                        <Mail className="h-3 w-3 text-gray-400 shrink-0" />
                        {camp.subject}
                      </p>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900 dark:text-white flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5 text-brand-500 shrink-0" />
                        {camp.restaurantName}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3 w-3 text-gray-400 shrink-0" />
                        {camp.branchName}
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                        <Users className="h-3 w-3" />
                        {camp.audience}
                      </span>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900 dark:text-white">
                      {camp.recipients ? camp.recipients.toLocaleString() : '0'}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-1 font-medium text-gray-800 dark:text-gray-200">
                        <Calendar className="h-3.5 w-3.5 text-gray-400" />
                        {camp.scheduledDate || camp.sentDate || camp.createdDate}
                      </div>
                      {camp.scheduledTime && (
                        <div className="flex items-center gap-1 text-gray-400 mt-0.5">
                          <Clock className="h-3 w-3" />
                          {camp.scheduledTime}
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={camp.status} />
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          to={`/dashboard/email-marketing/${camp.id}`}
                          title="View Details & Analytics"
                          className="p-2 rounded-lg text-gray-500 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/30 transition-colors"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        <Link
                          to={`/dashboard/email-marketing/${camp.id}/edit`}
                          title="Edit Campaign"
                          className="p-2 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => handleDuplicate(camp.id)}
                          title="Duplicate Campaign"
                          className="p-2 rounded-lg text-gray-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-colors"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteId(camp.id)}
                          title="Delete Campaign"
                          className="p-2 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="glass rounded-2xl p-6 max-w-md w-full shadow-2xl border border-gray-200 dark:border-gray-700 animate-slide-up">
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400 mb-4">
              <div className="p-3 rounded-full bg-red-100 dark:bg-red-900/30">
                <AlertCircle className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Delete Campaign?</h3>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Are you sure you want to delete this email campaign? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3">
              <Button variant="secondary" onClick={() => setDeleteId(null)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={handleDeleteConfirm}>
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
