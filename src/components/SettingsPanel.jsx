import { useState } from 'react'
import { Moon, Sun, Bell, Shield, Palette } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import Card from './Card'
import Button from './Button'

const tabs = [
  { id: 'general', label: 'General', icon: Palette },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'appearance', label: 'Appearance', icon: Moon },
]

export default function SettingsPanel() {
  const { darkMode, toggleDarkMode } = useTheme()
  const [activeTab, setActiveTab] = useState('general')
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    marketingEmails: false,
    weeklyReports: true,
    campaignAlerts: true,
  })
  const [passwordForm, setPasswordForm] = useState({
    current: '',
    new: '',
    confirm: '',
  })

  const toggleSetting = (key) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const Toggle = ({ enabled, onChange, label, description }) => (
    <div className="flex items-center justify-between py-4 border-b border-gray-100 dark:border-gray-700 last:border-0">
      <div>
        <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
        {description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>
        )}
      </div>
      <button
        onClick={onChange}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          enabled ? 'bg-brand-600' : 'bg-gray-300 dark:bg-gray-600'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            enabled ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  )

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <Card className="lg:w-64 p-2 flex-shrink-0">
        <nav className="flex lg:flex-col gap-1 overflow-x-auto">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === id
                  ? 'gradient-bg text-white shadow-lg shadow-brand-500/25'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </nav>
      </Card>

      <Card className="flex-1 p-6 sm:p-8">
        {activeTab === 'general' && (
          <div className="animate-fade-in">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">General Settings</h3>
            <div className="space-y-1">
              <div className="py-4 border-b border-gray-100 dark:border-gray-700">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Language</label>
                <select className="w-full sm:w-64 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500">
                  <option>English (US)</option>
                  <option>English (UK)</option>
                  <option>Spanish</option>
                  <option>French</option>
                </select>
              </div>
              <div className="py-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Timezone</label>
                <select className="w-full sm:w-64 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500">
                  <option>Asia/Kolkata (IST)</option>
                  <option>America/New_York (EST)</option>
                  <option>Europe/London (GMT)</option>
                  <option>America/Los_Angeles (PST)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="animate-fade-in">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Notification Preferences</h3>
            <Toggle
              enabled={settings.emailNotifications}
              onChange={() => toggleSetting('emailNotifications')}
              label="Enable Email Notifications"
              description="Receive email updates about your account activity"
            />
            <Toggle
              enabled={settings.pushNotifications}
              onChange={() => toggleSetting('pushNotifications')}
              label="Enable Push Notifications"
              description="Get real-time push notifications in your browser"
            />
            <Toggle
              enabled={settings.campaignAlerts}
              onChange={() => toggleSetting('campaignAlerts')}
              label="Campaign Alerts"
              description="Notifications when campaigns start or end"
            />
            <Toggle
              enabled={settings.weeklyReports}
              onChange={() => toggleSetting('weeklyReports')}
              label="Weekly Reports"
              description="Receive weekly analytics summary via email"
            />
            <Toggle
              enabled={settings.marketingEmails}
              onChange={() => toggleSetting('marketingEmails')}
              label="Marketing Emails"
              description="Product updates, tips, and promotional content"
            />
          </div>
        )}

        {activeTab === 'security' && (
          <div className="animate-fade-in">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Change Password</h3>
            <div className="space-y-4 max-w-md">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Current Password
                </label>
                <input
                  type="password"
                  value={passwordForm.current}
                  onChange={(e) => setPasswordForm((p) => ({ ...p, current: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="Enter current password"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  New Password
                </label>
                <input
                  type="password"
                  value={passwordForm.new}
                  onChange={(e) => setPasswordForm((p) => ({ ...p, new: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="Enter new password"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={passwordForm.confirm}
                  onChange={(e) => setPasswordForm((p) => ({ ...p, confirm: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="Confirm new password"
                />
              </div>
              <Button className="mt-2">
                <Shield className="h-4 w-4" />
                Update Password
              </Button>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-700">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Two-Factor Authentication</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                Add an extra layer of security to your account.
              </p>
              <Button variant="outline" size="sm">Enable 2FA</Button>
            </div>
          </div>
        )}

        {activeTab === 'appearance' && (
          <div className="animate-fade-in">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Appearance</h3>
            <div className="flex items-center justify-between py-4">
              <div className="flex items-center gap-3">
                {darkMode ? (
                  <Moon className="h-5 w-5 text-gray-500" />
                ) : (
                  <Sun className="h-5 w-5 text-gray-500" />
                )}
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Dark Mode</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {darkMode ? 'Dark theme is enabled' : 'Light theme is enabled'}
                  </p>
                </div>
              </div>
              <button
                onClick={toggleDarkMode}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  darkMode ? 'bg-brand-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    darkMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4 max-w-md">
              <button
                onClick={() => darkMode && toggleDarkMode()}
                className={`p-4 rounded-xl border-2 transition-all ${
                  !darkMode ? 'border-brand-600 bg-brand-50 dark:bg-brand-900/20' : 'border-gray-200 dark:border-gray-600'
                }`}
              >
                <Sun className="h-6 w-6 text-amber-500 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-900 dark:text-white">Light</p>
              </button>
              <button
                onClick={() => !darkMode && toggleDarkMode()}
                className={`p-4 rounded-xl border-2 transition-all ${
                  darkMode ? 'border-brand-600 bg-brand-900/20' : 'border-gray-200 dark:border-gray-600'
                }`}
              >
                <Moon className="h-6 w-6 text-indigo-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-900 dark:text-white">Dark</p>
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
