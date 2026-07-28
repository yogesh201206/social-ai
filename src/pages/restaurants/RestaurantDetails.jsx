import { Link, useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, MapPin, Pencil, Calendar, Building2 } from 'lucide-react'
import { useRestaurants } from '../../context/RestaurantContext'
import Card from '../../components/Card'
import Button from '../../components/Button'
import EmptyState from '../../components/EmptyState'

export default function RestaurantDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getRestaurant } = useRestaurants()
  const restaurant = getRestaurant(id)

  if (!restaurant) {
    return (
      <EmptyState
        icon="Building2"
        title="Restaurant not found"
        description="The restaurant you're looking for doesn't exist or has been removed."
        actionLabel="Back to Restaurants"
        onAction={() => navigate('/dashboard/restaurants')}
      />
    )
  }

  const citiesGrouped = restaurant.branches.reduce((acc, branch) => {
    if (!acc[branch.city]) acc[branch.city] = []
    acc[branch.city].push(branch)
    return acc
  }, {})

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            to="/dashboard/restaurants"
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl overflow-hidden flex-shrink-0 bg-gray-100 dark:bg-gray-700">
              <img
                src={restaurant.logo}
                alt={restaurant.name}
                className="h-full w-full object-cover"
              />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{restaurant.name}</h2>
              <span className="inline-flex mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400">
                {restaurant.category}
              </span>
            </div>
          </div>
        </div>
        <Link to={`/dashboard/restaurants/${id}/edit`}>
          <Button variant="secondary">
            <Pencil className="h-4 w-4" />
            Edit
          </Button>
        </Link>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <Card className="p-4 text-center">
          <Building2 className="h-5 w-5 text-brand-600 dark:text-brand-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{restaurant.branchCount}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Branches</p>
        </Card>
        <Card className="p-4 text-center">
          <MapPin className="h-5 w-5 text-purple-600 dark:text-purple-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {Object.keys(citiesGrouped).length}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Cities</p>
        </Card>
        <Card className="p-4 text-center">
          <Calendar className="h-5 w-5 text-indigo-600 dark:text-indigo-400 mx-auto mb-2" />
          <p className="text-sm font-bold text-gray-900 dark:text-white">{restaurant.createdAt}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Created</p>
        </Card>
      </div>

      <Card className="p-6 sm:p-8">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Restaurant Information
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
          {restaurant.description}
        </p>
        <div className="mt-4 flex items-center gap-2">
          <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
            restaurant.status === 'Active'
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400'
          }`}>
            {restaurant.status}
          </span>
        </div>
      </Card>

      <Card className="p-6 sm:p-8">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Branches</h3>

        <div className="space-y-6">
          <div className="font-mono text-sm">
            <div className="flex items-center gap-2 text-gray-900 dark:text-white font-semibold mb-3">
              <Building2 className="h-4 w-4 text-brand-600" />
              {restaurant.name}
            </div>

            {restaurant.branches.map((branch, index) => (
              <div key={branch.id} className="ml-4 relative">
                {index < restaurant.branches.length - 1 && (
                  <div className="absolute left-0 top-6 bottom-0 w-px bg-gray-200 dark:bg-gray-700" />
                )}
                <div className="flex items-start gap-3 py-2">
                  <span className="text-gray-400 font-mono select-none">
                    {index === restaurant.branches.length - 1 ? '└' : '├'}
                  </span>
                  <div className="flex-1 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-brand-600 dark:text-brand-400 flex-shrink-0" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {branch.city}
                      </span>
                      <span className="text-xs text-gray-400">— {branch.name}</span>
                    </div>
                    {branch.address && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-6">
                        {branch.address}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  )
}
