import { useState } from 'react'
import { Save, ShieldCheck, Bell, Sliders, Lock, CheckCircle2, RefreshCw } from 'lucide-react'
import Card from '../../components/Card'
import Button from '../../components/Button'
import { useAdmin } from '../../context/AdminContext'
import AdminGuard from '../../components/admin/AdminGuard'

export default function AdminSettings() {
  const { adminSettings, updateAdminSettings } = useAdmin()

  const [formData, setFormData] = useState(adminSettings)
  const [saving, setSaving] = useState(false)

  const handleToggle = (key) => {
    setFormData((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setSaving(true)
    setTimeout(() => {
      updateAdminSettings(formData)
      setSaving(false)
    }, 400)
  }

  return (
    <AdminGuard>
      <form onSubmit={handleSubmit} className="space-y-8 animate-fade-in pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              Admin Settings
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Configure global platform controls, notification rules, security policies, and system preferences.
            </p>
          </div>

          <Button type="submit" variant="primary" loading={saving}>
            <Save className="h-4 w-4" />
            Save Changes
          </Button>
        </div>

        {/* STEP 8: Section 1 – Platform Settings */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6 pb-3 border-b border-gray-100 dark:border-gray-800">
            <div className="p-2 rounded-xl bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400">
              <Sliders className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Platform Settings</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Controls for user & restaurant onboarding availability</p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Allow New User Registration Toggle */}
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-bold text-gray-900 dark:text-white">Allow New User Registration</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Enable or pause public sign-ups for new accounts.</p>
              </div>
              <button
                type="button"
                onClick={() => handleToggle('allowNewUserRegistration')}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  formData.allowNewUserRegistration ? 'bg-brand-600' : 'bg-gray-300 dark:bg-gray-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    formData.allowNewUserRegistration ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Allow New Restaurant Registration Toggle */}
            <div className="flex items-center justify-between py-2 border-t border-gray-100 dark:border-gray-800 pt-4">
              <div>
                <p className="text-sm font-bold text-gray-900 dark:text-white">Allow New Restaurant Registration</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Allow users to onboard and connect new restaurant locations.</p>
              </div>
              <button
                type="button"
                onClick={() => handleToggle('allowNewRestaurantRegistration')}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  formData.allowNewRestaurantRegistration ? 'bg-brand-600' : 'bg-gray-300 dark:bg-gray-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    formData.allowNewRestaurantRegistration ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* System Maintenance Mode Toggle */}
            <div className="flex items-center justify-between py-2 border-t border-gray-100 dark:border-gray-800 pt-4">
              <div>
                <p className="text-sm font-bold text-gray-900 dark:text-white">System Maintenance Mode</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Put the platform into maintenance view for scheduled updates.</p>
              </div>
              <button
                type="button"
                onClick={() => handleToggle('systemMaintenanceMode')}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  formData.systemMaintenanceMode ? 'bg-red-600' : 'bg-gray-300 dark:bg-gray-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    formData.systemMaintenanceMode ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Default User Plan Dropdown */}
            <div className="border-t border-gray-100 dark:border-gray-800 pt-4 max-w-sm">
              <label className="block text-sm font-bold text-gray-900 dark:text-white mb-1">
                Default Signup Plan
              </label>
              <select
                name="defaultUserPlan"
                value={formData.defaultUserPlan}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
              >
                <option value="Starter">Starter (Free Trial)</option>
                <option value="Professional">Professional</option>
                <option value="Enterprise">Enterprise</option>
              </select>
            </div>
          </div>
        </Card>

        {/* STEP 8: Section 2 – Notification Settings */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6 pb-3 border-b border-gray-100 dark:border-gray-800">
            <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Notification Settings</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Automated system emails and alert dispatch rules</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-bold text-gray-900 dark:text-white">System Email Notifications</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Send automatic email notifications to admins on system events.</p>
              </div>
              <button
                type="button"
                onClick={() => handleToggle('emailNotifications')}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  formData.emailNotifications ? 'bg-purple-600' : 'bg-gray-300 dark:bg-gray-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    formData.emailNotifications ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="border-t border-gray-100 dark:border-gray-800 pt-4 max-w-lg">
              <label className="block text-sm font-bold text-gray-900 dark:text-white mb-1">
                Admin Alert Recipient Emails
              </label>
              <input
                type="text"
                name="adminAlertEmails"
                value={formData.adminAlertEmails}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
              />
              <p className="text-[11px] text-gray-400 mt-1">Comma-separated list of administrator emails</p>
            </div>
          </div>
        </Card>

        {/* STEP 8: Section 3 – Security Settings */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6 pb-3 border-b border-gray-100 dark:border-gray-800">
            <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Security Settings</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Two-factor authentication and session limits</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-bold text-gray-900 dark:text-white">Enforce 2FA for Administrators</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Require two-factor verification on all admin logins.</p>
              </div>
              <button
                type="button"
                onClick={() => handleToggle('require2FAForAdmins')}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  formData.require2FAForAdmins ? 'bg-emerald-600' : 'bg-gray-300 dark:bg-gray-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    formData.require2FAForAdmins ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 border-t border-gray-100 dark:border-gray-800 pt-4">
              <div>
                <label className="block text-sm font-bold text-gray-900 dark:text-white mb-1">
                  Max Login Attempts
                </label>
                <input
                  type="number"
                  name="maxLoginAttempts"
                  value={formData.maxLoginAttempts}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 dark:text-white mb-1">
                  Session Timeout (Minutes)
                </label>
                <input
                  type="number"
                  name="sessionTimeoutMinutes"
                  value={formData.sessionTimeoutMinutes}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* STEP 8: Section 4 – System Preferences */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6 pb-3 border-b border-gray-100 dark:border-gray-800">
            <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">System Preferences</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Content moderation and platform default currency</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-bold text-gray-900 dark:text-white">AI Content Auto-Moderation</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Automatically filter profane or non-brand compliant AI generated text.</p>
              </div>
              <button
                type="button"
                onClick={() => handleToggle('autoContentModeration')}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  formData.autoContentModeration ? 'bg-amber-600' : 'bg-gray-300 dark:bg-gray-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    formData.autoContentModeration ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 border-t border-gray-100 dark:border-gray-800 pt-4">
              <div>
                <label className="block text-sm font-bold text-gray-900 dark:text-white mb-1">
                  Platform Default Currency
                </label>
                <select
                  name="platformCurrency"
                  value={formData.platformCurrency}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
                >
                  <option value="USD ($)">USD ($)</option>
                  <option value="EUR (€)">EUR (€)</option>
                  <option value="GBP (£)">GBP (£)</option>
                  <option value="INR (₹)">INR (₹)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 dark:text-white mb-1">
                  Official Support Email
                </label>
                <input
                  type="email"
                  name="supportEmail"
                  value={formData.supportEmail}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
                />
              </div>
            </div>
          </div>
        </Card>

        <div className="flex justify-end pt-2">
          <Button type="submit" variant="primary" size="lg" loading={saving}>
            <Save className="h-5 w-5" />
            Save Admin Settings
          </Button>
        </div>
      </form>
    </AdminGuard>
  )
}
