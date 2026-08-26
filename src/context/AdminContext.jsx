import { createContext, useContext, useState, useCallback } from 'react'
import {
  adminStatsData,
  initialUsersData,
  initialRestaurantsData,
  reportsAnalyticsData,
  initialAdminSettingsData,
} from '../data/adminData'
import { useNotifications } from './NotificationContext'

const AdminContext = createContext()

export function AdminProvider({ children }) {
  const [users, setUsers] = useState(initialUsersData)
  const [restaurants, setRestaurants] = useState(initialRestaurantsData)
  const [reportsData] = useState(reportsAnalyticsData)
  const [adminSettings, setAdminSettings] = useState(initialAdminSettingsData)
  const [adminStats] = useState(adminStatsData)

  const { addNotification } = useNotifications()

  // User Actions
  const getUser = useCallback(
    (id) => users.find((u) => u.id === id || String(u.id) === String(id)),
    [users]
  )

  const updateUserStatus = useCallback(
    (id, newStatus) => {
      let targetUserName = 'User'
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
    (id) => {
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

  // Restaurant Actions
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

  // Admin Settings Action
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
