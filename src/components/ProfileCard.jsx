import { useState } from 'react'
import { Camera, Mail, Phone, Building2, Briefcase } from 'lucide-react'
import Button from './Button'
import Card from './Card'

export default function ProfileCard({ profile, onSave }) {
  const [isEditing, setIsEditing] = useState(false)
  const [form, setForm] = useState(profile)

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = () => {
    onSave?.(form)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setForm(profile)
    setIsEditing(false)
  }

  const fields = [
    { key: 'name', label: 'Full Name', icon: null, type: 'text' },
    { key: 'email', label: 'Email', icon: Mail, type: 'email' },
    { key: 'phone', label: 'Phone', icon: Phone, type: 'tel' },
    { key: 'businessName', label: 'Business Name', icon: Building2, type: 'text' },
    { key: 'businessType', label: 'Business Type', icon: Briefcase, type: 'text' },
  ]

  return (
    <Card className="p-6 sm:p-8">
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-8">
        <div className="relative group">
          <div className="h-24 w-24 rounded-2xl gradient-bg flex items-center justify-center text-white text-3xl font-bold">
            {form.avatar}
          </div>
          {isEditing && (
            <button className="absolute inset-0 rounded-2xl bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="h-6 w-6 text-white" />
            </button>
          )}
        </div>
        <div className="text-center sm:text-left">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{form.name}</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{form.email}</p>
          <span className="inline-flex mt-2 px-3 py-1 rounded-full text-xs font-medium bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400">
            {form.plan} Plan
          </span>
        </div>
      </div>

      <div className="space-y-5">
        {fields.map(({ key, label, icon: Icon, type }) => (
          <div key={key}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              {label}
            </label>
            {isEditing ? (
              <div className="relative">
                {Icon && (
                  <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                )}
                <input
                  type={type}
                  value={form[key]}
                  onChange={(e) => handleChange(key, e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all ${
                    Icon ? 'pl-10' : ''
                  }`}
                />
              </div>
            ) : (
              <p className="text-sm text-gray-900 dark:text-white px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                {form[key]}
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 mt-8 pt-6 border-t border-gray-100 dark:border-gray-700">
        {isEditing ? (
          <>
            <Button onClick={handleSave}>Save Changes</Button>
            <Button variant="secondary" onClick={handleCancel}>Cancel</Button>
          </>
        ) : (
          <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
        )}
      </div>
    </Card>
  )
}
