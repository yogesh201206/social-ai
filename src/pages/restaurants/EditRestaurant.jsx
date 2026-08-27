import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useRestaurants } from '../../context/RestaurantContext'
import { restaurantCategories } from '../../data/dashboardData'
import Button from '../../components/Button'
import Card from '../../components/Card'

export default function EditRestaurant() {
  const { id } = useParams()
  const navigate = useNavigate()

  const { getRestaurant, updateRestaurant } = useRestaurants()

  const restaurant = getRestaurant(id)

  const [form, setForm] = useState({
    name: '',
    description: '',
    category: '',
    phone: '',
    email: '',
    address: '',
  })

  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (restaurant) {
      setForm({
        name: restaurant.name || '',
        description: restaurant.description || '',
        category: restaurant.category || '',
        phone: restaurant.phone || '',
        email: restaurant.email || '',
        address: restaurant.address || restaurant.location || '',
      })
    }
  }, [restaurant])

  const handleChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      setSaving(true)

      await updateRestaurant(id, form)

      navigate(`/dashboard/restaurants/${id}`)
    } catch (error) {
      console.error('Failed to update restaurant:', error)
      alert('Failed to update restaurant')
    } finally {
      setSaving(false)
    }
  }

  if (!restaurant) {
    return (
      <div className="max-w-3xl mx-auto">
        <Card className="p-8 text-center">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Restaurant not found
          </h2>

          <p className="text-gray-500 mt-2">
            The restaurant you are trying to edit does not exist.
          </p>

          <Link to="/dashboard/restaurants">
            <Button className="mt-4">
              Back to Restaurants
            </Button>
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">

      {/* Header */}
      <div className="flex items-center gap-4">

        <Link
          to={`/dashboard/restaurants/${id}`}
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>

        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Edit Restaurant
          </h2>

          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Update your restaurant information.
          </p>
        </div>

      </div>

      <form onSubmit={handleSubmit}>

        <Card className="p-6 sm:p-8 space-y-6">

          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Restaurant Information
          </h3>

          {/* Restaurant Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Restaurant Name *
            </label>

            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Category *
            </label>

            <select
              required
              value={form.category}
              onChange={(e) => handleChange('category', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">Select category</option>

              {restaurantCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Description
            </label>

            <textarea
              rows={4}
              value={form.description}
              onChange={(e) => handleChange('description', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500 resize-none"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Phone
            </label>

            <input
              type="text"
              value={form.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Email
            </label>

            <input
              type="email"
              value={form.email}
              onChange={(e) => handleChange('email', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Address
            </label>

            <input
              type="text"
              value={form.address}
              onChange={(e) => handleChange('address', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

        </Card>

        {/* Buttons */}
        <div className="flex items-center gap-3 mt-6">

          <Button
            type="submit"
            loading={saving}
          >
            Save Changes
          </Button>

          <Link to={`/dashboard/restaurants/${id}`}>
            <Button type="button" variant="secondary">
              Cancel
            </Button>
          </Link>

        </div>

      </form>
    </div>
  )
}
