import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useAuth } from './AuthContext'
import restaurantService from '../services/restaurantService'

const RestaurantContext = createContext()

export function RestaurantProvider({ children }) {
  const { token } = useAuth()
  const [restaurants, setRestaurants] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchRestaurants = useCallback(async () => {
    setLoading(true)
    try {
      const data = await restaurantService.getAll()
      if (Array.isArray(data)) {
        const formatted = data.map(r => ({
          id: String(r.id),
          name: r.name,
          category: r.category || 'Restaurant',
          location: r.address || 'Downtown',
          phone: r.phone || '',
          email: r.email || '',
          status: r.status || 'Active',
          branchCount: r.branches ? r.branches.length : 0,
          branches: r.branches ? r.branches.map(b => ({
            id: String(b.id),
            name: b.branchName || b.name || '',
            branchName: b.branchName || b.name || '',
            city: b.city || '',
            address: b.address || '',
            phone: b.phone || '',
            status: b.status || 'ACTIVE'
          })) : [],
          createdAt: r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently',
        }))
        setRestaurants(formatted)
      }
    } catch (err) {
      console.warn('[RestaurantContext fetch error]:', err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRestaurants()
  }, [fetchRestaurants, token])

  const addRestaurant = useCallback(async (restaurant) => {
    try {
      const res = await restaurantService.create({
        name: restaurant.name,
        category: restaurant.category,
        businessType: restaurant.businessType || 'Fine Dining',
        description: restaurant.description || '',
        phone: restaurant.phone || '',
        email: restaurant.email || '',
        address: restaurant.address || restaurant.location || '',
      })
      const newR = {
        ...restaurant,
        id: String(res.id),
        branchCount: res.branches?.length || 1,
        createdAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        status: 'Active',
      }
      setRestaurants((prev) => [newR, ...prev])
      return newR
    } catch (err) {
      const newRestaurant = {
        ...restaurant,
        id: String(Date.now()),
        branchCount: restaurant.branches?.length || 0,
        createdAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        status: 'Active',
      }
      setRestaurants((prev) => [newRestaurant, ...prev])
      return newRestaurant
    }
  }, [])

  const updateRestaurant = useCallback(async (id, data) => {
  try {
    const res = await restaurantService.update(id, data)

    const rawBranches = res.branches || []
    const formattedBranches = rawBranches.map(b => ({
      id: String(b.id),
      name: b.branchName || b.name || '',
      branchName: b.branchName || b.name || '',
      city: b.city || '',
      address: b.address || '',
      phone: b.phone || '',
      status: b.status || 'ACTIVE'
    }))

    const updatedRestaurant = {
      id: String(res.id),
      name: res.name,
      category: res.category || 'Restaurant',
      location: res.address || 'Downtown',
      address: res.address || '',
      phone: res.phone || '',
      email: res.email || '',
      description: res.description || '',
      status: res.status || 'Active',
      branchCount: formattedBranches.length,
      branches: formattedBranches,
      createdAt: res.createdAt
        ? new Date(res.createdAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })
        : 'Recently',
    }

    setRestaurants((prev) =>
      prev.map((r) =>
        String(r.id) === String(id) ? updatedRestaurant : r
      )
    )

    return updatedRestaurant
  } catch (error) {
    console.error('Update restaurant failed:', error)
    throw error
  }
}, [])

const addBranch = useCallback(async (restaurantId, branch) => {
  const branchName = branch.branchName || branch.name || ''

  const res = await restaurantService.addBranch(restaurantId, {
    branchName,
    city: branch.city || '',
    address: branch.address || '',
    phone: branch.phone || '',
  })

  const newBranch = {
    id: String(res.id),
    name: res.branchName || res.name || branchName,
    branchName: res.branchName || res.name || branchName,
    city: res.city || branch.city || '',
    address: res.address || branch.address || '',
    phone: res.phone || branch.phone || '',
    status: res.status || 'ACTIVE',
  }

  setRestaurants((prev) =>
    prev.map((restaurant) =>
      String(restaurant.id) === String(restaurantId)
        ? {
            ...restaurant,
            branches: [...(restaurant.branches || []), newBranch],
            branchCount: (restaurant.branches?.length || 0) + 1,
          }
        : restaurant
    )
  )

  return newBranch
}, [])

const updateBranch = useCallback(async (branchId, branch) => {
  const res = await restaurantService.updateBranch(branchId, {
    branchName: branch.branchName || branch.name || '',
    city: branch.city || '',
    address: branch.address || '',
    phone: branch.phone || '',
  })

  const updatedBranch = {
    id: String(res.id || branchId),
    name: res.branchName || res.name || branch.name || '',
    branchName: res.branchName || res.name || branch.name || '',
    city: res.city || branch.city || '',
    address: res.address || branch.address || '',
    phone: res.phone || branch.phone || '',
    status: res.status || branch.status || 'ACTIVE',
  }

  setRestaurants((prev) =>
    prev.map((restaurant) => ({
      ...restaurant,
      branches: (restaurant.branches || []).map((b) =>
        String(b.id) === String(branchId)
          ? updatedBranch
          : b
      ),
    }))
  )

  return updatedBranch
}, [])

const deleteBranch = useCallback(async (branchId) => {
  await restaurantService.deleteBranch(branchId)

  setRestaurants((prev) =>
    prev.map((restaurant) => {
      const remainingBranches = (restaurant.branches || []).filter(
        (branch) => String(branch.id) !== String(branchId)
      )

      return {
        ...restaurant,
        branches: remainingBranches,
        branchCount: remainingBranches.length,
      }
    })
  )
}, [])

const deleteRestaurant = useCallback(async (id) => {
  try {
    await restaurantService.delete(id)

    setRestaurants((prev) =>
      prev.filter((r) => String(r.id) !== String(id))
    )

    return true
  } catch (error) {
    console.error('Delete restaurant failed:', error)
    throw error
  }
}, [])

  const getRestaurant = useCallback(
    (id) => restaurants.find((r) => String(r.id) === String(id)),
    [restaurants]
  )

  return (
<RestaurantContext.Provider
  value={{
    restaurants,
    loading,
    fetchRestaurants,
    refreshRestaurants: fetchRestaurants,
    addRestaurant,
    updateRestaurant,
    addBranch,
    updateBranch,
    deleteBranch,
    deleteRestaurant,
    getRestaurant,
  }}
>
  {children}
</RestaurantContext.Provider>
  )
}

export function useRestaurants() {
  const context = useContext(RestaurantContext)
  if (!context) {
    throw new Error('useRestaurants must be used within RestaurantProvider')
  }
  return context
}
