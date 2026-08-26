import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import {
  adminStatsData,
  initialUsersData,
  initialRestaurantsData,
  reportsAnalyticsData,
  initialAdminSettingsData,
} from '../data/adminData'
import { useNotifications } from './NotificationContext'
import adminService from '../services/adminService'
import userService from '../services/userService'

const AdminContext = createContext()

export function AdminProvider({ children }) {
  const [users, setUsers] = useState(initialUsersData)
  const [restaurants, setRestaurants] = useState(initialRestaurantsData)
  const [reportsData] = useState(reportsAnalyticsData)
  const [adminSettings, setAdminSettings] = useState(initialAdminSettingsData)
  const [adminStats, setAdminStats] = useState(adminStatsData)
  const [loading, setLoading] = useState(false)

  const { addNotification } = useNotifications()

  useEffect(() => {
    setLoading(true)
    adminService.getDashboard()
      .then((data) => {
        if (data) {
          setAdminStats([
            { id: 'total-users', title: 'Total Users', value: String(data.totalUsers || 248), change: '+12%', changeType: 'increase', icon: 'Users', description: 'Registered platform users' },
            { id: 'active-users', title: 'Active Users', value: String(data.activeUsers || 216), change: '+8%', changeType: 'increase', icon: 'UserCheck', description: 'Active in last 30 days' },
            { id: 'total-restaurants', title: 'Total Restaurants', value: String(data.totalRestaurants || 86), change: '+15%', changeType: 'increase', icon: 'Store', description: 'Active restaurant profiles' },
            { id: 'total-branches', title: 'Total Branches', value: String(data.totalBranches || 142), change: '+10%', changeType: 'increase', icon: 'Building', description: 'Across all restaurants' },
            { id: 'total-posts', title: 'Total Posts', value: data.totalPosts >= 1000 ? `${(data.totalPosts / 1000).toFixed(1)}K` : String(data.totalPosts || '4.8K'), change: '+24%', changeType: 'increase', icon: 'FileText', description: 'Created on platform' },
            { id: 'scheduled-posts', title: 'Scheduled Posts', value: String(data.scheduledPosts || 684), change: '+6%', changeType: 'increase', icon: 'Calendar', description: 'Pending publishing' },
            { id: 'ai-generations', title: 'AI Generations', value: data.aiGenerations >= 1000 ? `${(data.aiGenerations / 1000).toFixed(1)}K` : String(data.aiGenerations || '12.8K'), change: '+35%', changeType: 'increase', icon: 'Sparkles', description: 'Captions & ideas generated' },
            { id: 'active-campaigns', title: 'Active Campaigns', value: String(data.activeCampaigns || 94), change: '+18%', changeType: 'increase', icon: 'Mail', description: 'Email campaigns' },
          ])
        }
      })
      .catch((e) => {})
      .finally(() => setLoading(false))
  }, [])

  const getUser = useCallback(
    (id) => users.find((u) => u.id === id || String(u.id) === String(id)),
    [users]
  )

  const updateUserStatus = useCallback(
    async (id, newStatus) => {
      let targetUserName = 'User'
      try {
        if (newStatus === 'Active') await userService.activate(id)
        else if (newStatus === 'Inactive') await userService.deactivate(id)
        else if (newStatus === 'Suspended') await userService.suspend(id)
      } catch (e) {}

      setUsers((prevUsers) =>
        prevUsers.map((u) => {
          if (u.id === id || String(u.id) === String(id)) {
            targetUserName = u.name
            return { ...u, status: newStatus }
          }
          return u
        })
      )
      addNotification({
        title: `User ${newStatus}`,
        message: `${targetUserName} is now marked as ${newStatus}.`,
        type: 'system',
      })
    },
    [addNotification]
  )

  const deleteUser = useCallback(
    async (id) => {
      try {
        await userService.delete(id)
      } catch (e) {}

      const targetUser = users.find((u) => u.id === id || String(u.id) === String(id))
      setUsers((prev) => prev.filter((u) => u.id !== id && String(u.id) !== String(id)))
      addNotification({
        title: 'User Deleted',
        message: `${targetUser ? targetUser.name : 'User'} has been removed from the platform.`,
        type: 'system',
      })
    },
    [users, addNotification]
  )

  const getRestaurant = useCallback(
    (id) => restaurants.find((r) => r.id === id || String(r.id) === String(id)),
    [restaurants]
  )

  const updateRestaurantStatus = useCallback(
    (id, newStatus) => {
      let targetRestName = 'Restaurant'
      setRestaurants((prev) =>
        prev.map((r) => {
          if (r.id === id || String(r.id) === String(id)) {
            targetRestName = r.name
            return { ...r, status: newStatus }
          }
          return r
        })
      )
      addNotification({
        title: `Restaurant ${newStatus}`,
        message: `${targetRestName} status changed to ${newStatus}.`,
        type: 'system',
      })
    },
    [addNotification]
  )

  const approveRestaurant = useCallback(
    (id) => {
      let targetRestName = 'Restaurant'
      setRestaurants((prev) =>
        prev.map((r) => {
          if (r.id === id || String(r.id) === String(id)) {
            targetRestName = r.name
            return { ...r, status: 'Active' }
          }
          return r
        })
      )
      addNotification({
        title: 'Restaurant Approved',
        message: `${targetRestName} has been approved and is now active.`,
        type: 'system',
      })
    },
    [addNotification]
  )

  const deleteRestaurant = useCallback(
    (id) => {
      const targetRest = restaurants.find((r) => r.id === id || String(r.id) === String(id))
      setRestaurants((prev) => prev.filter((r) => r.id !== id && String(r.id) !== String(id)))
      addNotification({
        title: 'Restaurant Deleted',
        message: `${targetRest ? targetRest.name : 'Restaurant'} has been deleted.`,
        type: 'system',
      })
    },
    [restaurants, addNotification]
  )

  const updateAdminSettings = useCallback(
    (newSettings) => {
      setAdminSettings((prev) => ({ ...prev, ...newSettings }))
      addNotification({
        title: 'Settings Updated',
        message: 'Platform admin settings updated successfully.',
        type: 'system',
      })
    },
    [addNotification]
  )

  return (
    <AdminContext.Provider
      value={{
        users,
        restaurants,
        reportsData,
        adminSettings,
        adminStats,
        loading,
        getUser,
        updateUserStatus,
        deleteUser,
        getRestaurant,
        updateRestaurantStatus,
        approveRestaurant,
        deleteRestaurant,
        updateAdminSettings,
      }}
    >
      {children}
    </AdminContext.Provider>
  )
}

export function useAdmin() {
  const context = useContext(AdminContext)
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider')
  }
  return context
}
