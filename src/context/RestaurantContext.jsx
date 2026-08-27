import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { restaurants as initialRestaurants } from '../data/restaurantData'
import restaurantService from '../services/restaurantService'

const RestaurantContext = createContext()

export function RestaurantProvider({ children }) {
  const [restaurants, setRestaurants] = useState(initialRestaurants)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    restaurantService.getAll()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const formatted = data.map(r => ({
            id: String(r.id),
            name: r.name,
            category: r.category || 'Restaurant',
            location: r.address || 'Downtown',
            phone: r.phone || '',
            email: r.email || '',
            status: r.status || 'Active',
            branchCount: r.branches ? r.branches.length : 1,
            branches: r.branches || [],
            createdAt: r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently',
          }))
          setRestaurants(formatted)
        }
      })
      .catch((err) => {
        console.log('Using fallback mock data for restaurants:', err.message)
      })
      .finally(() => setLoading(false))
  }, [])

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
      branchCount: res.branches ? res.branches.length : 1,
      branches: res.branches || [],
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

  const deleteRestaurant = useCallback(async (id) => {
    try {
      await restaurantService.delete(id)
    } catch (e) {}
    setRestaurants((prev) => prev.filter((r) => String(r.id) !== String(id)))
  }, [])

  const getRestaurant = useCallback(
    (id) => restaurants.find((r) => String(r.id) === String(id)),
    [restaurants]
  )

  return (
    <RestaurantContext.Provider value={{ restaurants, loading, addRestaurant,updateRestaurant,
            deleteRestaurant, getRestaurant }}>
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
