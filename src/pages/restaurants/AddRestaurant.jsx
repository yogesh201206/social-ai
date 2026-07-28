import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Trash2, Upload, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useRestaurants } from '../../context/RestaurantContext'
import { restaurantCategories } from '../../data/dashboardData'
import Button from '../../components/Button'
import Card from '../../components/Card'

const emptyBranch = { name: '', city: '', address: '' }

export default function AddRestaurant() {
  const navigate = useNavigate()
  const { addRestaurant } = useRestaurants()
  const [form, setForm] = useState({
    name: '',
    description: '',
    category: '',
    logo: null,
    logoPreview: null,
  })
  const [branches, setBranches] = useState([{ ...emptyBranch }])
  const [saving, setSaving] = useState(false)

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      const preview = URL.createObjectURL(file)
      setForm((prev) => ({ ...prev, logo: file, logoPreview: preview }))
    }
  }

  const updateBranch = (index, field, value) => {
    setBranches((prev) =>
      prev.map((b, i) => (i === index ? { ...b, [field]: value } : b))
    )
  }

  const addBranch = () => {
    setBranches((prev) => [...prev, { ...emptyBranch }])
  }

  const removeBranch = (index) => {
    if (branches.length > 1) {
      setBranches((prev) => prev.filter((_, i) => i !== index))
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setSaving(true)

    const validBranches = branches
      .filter((b) => b.name && b.city)
      .map((b, i) => ({ ...b, id: `new-b${Date.now()}-${i}` }))

    const restaurant = {
      name: form.name,
      description: form.description,
      category: form.category,
      logo: form.logoPreview || `https://ui-avatars.com/api/?name=${encodeURIComponent(form.name)}&background=4f46e5&color=fff&size=100`,
      branches: validBranches,
    }

    setTimeout(() => {
      const created = addRestaurant(restaurant)
      setSaving(false)
      navigate(`/dashboard/restaurants/${created.id}`)
    }, 800)
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Link
          to="/dashboard/restaurants"
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Add Restaurant</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Create a new restaurant with one or more branches.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="p-6 sm:p-8 space-y-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Restaurant Information</h3>

          <div className="flex flex-col sm:flex-row gap-6">
            <div className="flex-shrink-0">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Logo
              </label>
              <label className="flex flex-col items-center justify-center h-28 w-28 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-600 cursor-pointer hover:border-brand-500 transition-colors overflow-hidden">
                {form.logoPreview ? (
                  <img src={form.logoPreview} alt="Logo preview" className="h-full w-full object-cover" />
                ) : (
                  <div className="text-center p-4">
                    <Upload className="h-6 w-6 text-gray-400 mx-auto mb-1" />
                    <span className="text-xs text-gray-400">Upload</span>
                  </div>
                )}
                <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
              </label>
            </div>

            <div className="flex-1 space-y-4">
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
                  placeholder="e.g. Casa Bella"
                />
              </div>
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
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500 resize-none"
              placeholder="Brief description of your restaurant..."
            />
          </div>
        </Card>

        <Card className="p-6 sm:p-8 mt-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Branches</h3>
            <Button type="button" variant="outline" size="sm" onClick={addBranch}>
              <Plus className="h-4 w-4" />
              Add Branch
            </Button>
          </div>

          <div className="space-y-4">
            {branches.map((branch, index) => (
              <div
                key={index}
                className="p-4 rounded-xl border border-gray-200 dark:border-gray-600 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Branch {index + 1}
                  </span>
                  {branches.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeBranch(index)}
                      className="p-1 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={branch.name}
                    onChange={(e) => updateBranch(index, 'name', e.target.value)}
                    className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="Branch name"
                  />
                  <input
                    type="text"
                    value={branch.city}
                    onChange={(e) => updateBranch(index, 'city', e.target.value)}
                    className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="City"
                  />
                </div>
                <input
                  type="text"
                  value={branch.address}
                  onChange={(e) => updateBranch(index, 'address', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="Full address"
                />
              </div>
            ))}
          </div>
        </Card>

        <div className="flex items-center gap-3 mt-6">
          <Button type="submit" loading={saving}>
            Create Restaurant
          </Button>
          <Link to="/dashboard/restaurants">
            <Button type="button" variant="secondary">Cancel</Button>
          </Link>
        </div>
      </form>
    </div>
  )
}
