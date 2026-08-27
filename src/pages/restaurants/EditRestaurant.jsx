import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import { useRestaurants } from '../../context/RestaurantContext'
import { restaurantCategories } from '../../data/dashboardData'
import Button from '../../components/Button'
import Card from '../../components/Card'

export default function EditRestaurant() {
  const { id } = useParams()
  const navigate = useNavigate()

  const {
  getRestaurant,
  updateRestaurant,
  addBranch,
  updateBranch: saveBranchUpdate
} = useRestaurants()

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
  const [branches, setBranches] = useState([])
  const [savingBranchIndex, setSavingBranchIndex] = useState(null)
  const [branchError, setBranchError] = useState(null)

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

      setBranches(restaurant.branches || [])
    }
  }, [restaurant])

  const handleChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSaveBranch = async (index) => {
    const branchToSave = branches[index]
    const bName = branchToSave.name || branchToSave.branchName || ''
    if (!bName.trim()) {
      alert('Branch Name is required')
      return
    }

    try {
      setSavingBranchIndex(index)
      setBranchError(null)

      const savedBranch = await addBranch(id, {
        name: bName,
        city: branchToSave.city || '',
        address: branchToSave.address || '',
        phone: branchToSave.phone || '',
      })

      setBranches((prev) =>
        prev.map((item, i) => (i === index ? savedBranch : item))
      )
    } catch (err) {
      console.error('Failed to save branch:', err)
      const errMsg = err.message || 'Failed to save branch to backend'
      setBranchError(errMsg)
      alert(`Failed to save branch: ${errMsg}`)
    } finally {
      setSavingBranchIndex(null)
    }
  }

const handleSubmit = async (e) => {
  e.preventDefault()

  try {
    setSaving(true)

    // Restaurant details update
    await updateRestaurant(id, form)

    // Branches update/create
    for (const branch of branches) {

      if (String(branch.id || '').startsWith('new-')) {
        await addBranch(id, branch)
      } else if (branch.id) {
        await saveBranchUpdate(branch.id, branch)
      }

    }

    navigate(`/dashboard/restaurants/${id}`)
  } catch (error) {
    console.error('Failed to update restaurant/branches:', error)
    alert('Failed to save changes')
  } finally {
    setSaving(false)
  }
}

  const handleAddBranch = () => {
    setBranchError(null)
    setBranches((prev) => [
      ...prev,
      {
        id: null,
        name: '',
        branchName: '',
        city: '',
        address: '',
        phone: '',
        isNew: true,
      },
    ])
  }

  const updateBranch = (index, field, value) => {
    setBranches((prev) =>
      prev.map((branch, i) =>
        i === index
          ? { ...branch, [field]: value }
          : branch
      )
    )
  }

  const removeBranch = async (index) => {
    const branch = branches[index]

    if (branch.id && !branch.isNew) {
      console.log('Branch to delete:', branch.id)
    }

    setBranches((prev) =>
      prev.filter((_, i) => i !== index)
    )
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

        <Card className="p-6 sm:p-8 mt-6 space-y-6">

  <div className="flex items-center justify-between">
    <div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        Branches
      </h3>

      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
        Manage your restaurant branches.
      </p>
    </div>

    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleAddBranch}
    >
      <Plus className="h-4 w-4" />
      Add Branch
    </Button>
  </div>

  {branchError && (
    <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400">
      {branchError}
    </div>
  )}

  <div className="space-y-4">

    {branches.length === 0 && (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        No branches added yet.
      </div>
    )}

    {branches.map((branch, index) => (
      <div
        key={branch.id || `draft-${index}`}
        className={`p-4 rounded-xl border space-y-3 ${
          branch.isNew
            ? 'border-brand-300 dark:border-brand-600 bg-brand-50/20 dark:bg-brand-900/10'
            : 'border-gray-200 dark:border-gray-600'
        }`}
      >

        <div className="flex items-center justify-between">

          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
            Branch {index + 1}
            {branch.isNew ? (
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                Unsaved Draft
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                Saved (ID: {branch.id})
              </span>
            )}
          </span>

          <button
            type="button"
            onClick={() => removeBranch(index)}
            className="p-1 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            <Trash2 className="h-4 w-4" />
          </button>

        </div>

        <div className="grid sm:grid-cols-2 gap-3">

          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Branch Name *
            </label>
            <input
              type="text"
              value={branch.name || branch.branchName || ''}
              onChange={(e) => {
                updateBranch(index, 'name', e.target.value)
                updateBranch(index, 'branchName', e.target.value)
              }}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="Branch Name"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              City
            </label>
            <input
              type="text"
              value={branch.city || ''}
              onChange={(e) =>
                updateBranch(index, 'city', e.target.value)
              }
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="City"
            />
          </div>

        </div>

        <div className="grid sm:grid-cols-2 gap-3">

          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Address
            </label>
            <input
              type="text"
              value={branch.address || ''}
              onChange={(e) =>
                updateBranch(index, 'address', e.target.value)
              }
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="Full address"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Phone
            </label>
            <input
              type="text"
              value={branch.phone || ''}
              onChange={(e) =>
                updateBranch(index, 'phone', e.target.value)
              }
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="Phone number"
            />
          </div>

        </div>

        {branch.isNew && (
          <div className="flex justify-end pt-2">
            <Button
              type="button"
              size="sm"
              loading={savingBranchIndex === index}
              onClick={() => handleSaveBranch(index)}
            >
              Save Branch
            </Button>
          </div>
        )}

      </div>
    ))}

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
