import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useRestaurants } from '../../context/RestaurantContext'
import RestaurantCard from '../../components/RestaurantCard'
import { RestaurantCardSkeleton } from '../../components/Skeleton'
import EmptyState from '../../components/EmptyState'
import Button from '../../components/Button'
import SearchBar from '../../components/SearchBar'

export default function RestaurantList() {
  const navigate = useNavigate()
  const { restaurants, deleteRestaurant } = useRestaurants()
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500)
    return () => clearTimeout(timer)
  }, [])

  const filtered = restaurants.filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.category.toLowerCase().includes(search.toLowerCase())
  )

  const handleDelete = (id) => {
    deleteRestaurant(id)
    setShowDeleteConfirm(null)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Restaurants</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage your restaurant locations and branches.
          </p>
        </div>
        <Link to="/dashboard/restaurants/add">
          <Button>
            <Plus className="h-4 w-4" />
            Add Restaurant
          </Button>
        </Link>
      </div>

      <SearchBar
        placeholder="Search restaurants..."
        className="max-w-md"
        onSearch={setSearch}
      />

      {loading ? (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <RestaurantCardSkeleton key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="Building2"
          title={search ? 'No restaurants found' : 'No restaurants yet'}
          description={
            search
              ? 'Try adjusting your search terms.'
              : 'Add your first restaurant to start managing your social media.'
          }
          actionLabel={!search ? 'Add Restaurant' : undefined}
          onAction={!search ? () => navigate('/dashboard/restaurants/add') : undefined}
        />
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
          {filtered.map((restaurant) => (
            <RestaurantCard
              key={restaurant.id}
              restaurant={restaurant}
              onDelete={(id) => setShowDeleteConfirm(id)}
            />
          ))}
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowDeleteConfirm(null)} />
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full shadow-xl animate-fade-in">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Delete Restaurant?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              This action cannot be undone. All branch data will be removed.
            </p>
            <div className="flex gap-3 mt-6">
              <Button variant="danger" onClick={() => handleDelete(showDeleteConfirm)} className="flex-1">
                Delete
              </Button>
              <Button variant="secondary" onClick={() => setShowDeleteConfirm(null)} className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
