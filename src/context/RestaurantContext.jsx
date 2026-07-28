import { createContext, useContext, useState, useCallback } from 'react'
import { restaurants as initialRestaurants } from '../data/restaurantData'

const RestaurantContext = createContext()

export function RestaurantProvider({ children }) {
  const [restaurants, setRestaurants] = useState(initialRestaurants)

  const addRestaurant = useCallback((restaurant) => {
    const newRestaurant = {
      ...restaurant,
      id: String(Date.now()),
      branchCount: restaurant.branches?.length || 0,
      createdAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      status: 'Active',
    }
    setRestaurants((prev) => [newRestaurant, ...prev])
    return newRestaurant
  }, [])

  const deleteRestaurant = useCallback((id) => {
    setRestaurants((prev) => prev.filter((r) => r.id !== id))
  }, [])

  const getRestaurant = useCallback(
    (id) => restaurants.find((r) => r.id === id),
    [restaurants]
  )

  return (
    <RestaurantContext.Provider value={{ restaurants, addRestaurant, deleteRestaurant, getRestaurant }}>
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
