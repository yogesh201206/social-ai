import { Link } from 'react-router-dom'
import { Eye, Pencil, Trash2, MapPin } from 'lucide-react'
import Button from './Button'

export default function RestaurantCard({ restaurant, onDelete }) {
  return (
    <div className="glass rounded-2xl p-6 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group">
      <div className="flex items-start gap-4">
        <div className="h-14 w-14 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100 dark:bg-gray-700">
          {restaurant.logo ? (
            <img
              src={restaurant.logo}
              alt={restaurant.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full gradient-bg flex items-center justify-center text-white font-bold text-lg">
              {restaurant.name.charAt(0)}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
            {restaurant.name}
          </h3>
          <span className="inline-flex mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400">
            {restaurant.category}
          </span>
          <div className="flex items-center gap-1.5 mt-2 text-sm text-gray-500 dark:text-gray-400">
            <MapPin className="h-4 w-4" />
            <span>{restaurant.branchCount} {restaurant.branchCount === 1 ? 'Branch' : 'Branches'}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-5 pt-4 border-t border-gray-100 dark:border-gray-700">
        <Link to={`/dashboard/restaurants/${restaurant.id}`} className="flex-1">
          <Button variant="primary" size="sm" className="w-full">
            <Eye className="h-4 w-4" />
            View
          </Button>
        </Link>
        <Link to={`/dashboard/restaurants/${restaurant.id}/edit`} className="flex-1">
          <Button variant="secondary" size="sm" className="w-full">
            <Pencil className="h-4 w-4" />
            Edit
          </Button>
        </Link>
        <Button
          variant="ghost"
          size="sm"
          className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
          onClick={() => onDelete?.(restaurant.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
