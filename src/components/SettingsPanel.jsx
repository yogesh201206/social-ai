import { useState, useEffect } from 'react'
import { Moon, Sun, Bell, Shield, Palette, Link2, CheckCircle, XCircle, AlertTriangle, Loader2, Facebook } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { useRestaurants } from '../context/RestaurantContext'
import socialAccountService from '../services/socialAccountService'
import Card from './Card'
import Button from './Button'

const tabs = [
  { id: 'general', label: 'General', icon: Palette },
  { id: 'social', label: 'Social Accounts', icon: Link2 },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'appearance', label: 'Appearance', icon: Moon },
]

export default function SettingsPanel() {
  const { darkMode, toggleDarkMode } = useTheme()
  const { restaurants } = useRestaurants()
  const [activeTab, setActiveTab] = useState('general')
  const [socialAccounts, setSocialAccounts] = useState([])
  const [socialLoading, setSocialLoading] = useState(false)
  const [socialError, setSocialError] = useState(null)
  const [connectingPlatform, setConnectingPlatform] = useState(null)
  const [selectedRestaurantId, setSelectedRestaurantId] = useState(null)

  // Multi-page Facebook Page selection state
  const [showPageSelectionModal, setShowPageSelectionModal] = useState(false)
  const [pageSelectionToken, setPageSelectionToken] = useState(null)
  const [candidatePages, setCandidatePages] = useState([])
  const [selectedPageId, setSelectedPageId] = useState('')
  const [pageSelectionLoading, setPageSelectionLoading] = useState(false)
  const [pageSelectionSaving, setPageSelectionSaving] = useState(false)

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

  // Auto-switch to social tab if redirected from OAuth callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const connected = params.get('connected')
    const error = params.get('error')
    const selectPage = params.get('select_page')
    const selectionToken = params.get('selection_token')

    if (connected || error || selectPage) {
      setActiveTab('social')
      if (error) {
        setSocialError(`Connection cancelled or failed: ${error}`)
      }
      if (selectPage === 'FACEBOOK' && selectionToken) {
        setPageSelectionToken(selectionToken)
        setShowPageSelectionModal(true)
        loadCandidatePages(selectionToken)
      }
    }
  }, [])

  const loadCandidatePages = async (token) => {
    setPageSelectionLoading(true)
    setSocialError(null)
    try {
      const pages = await socialAccountService.getFacebookPages(token)
      setCandidatePages(Array.isArray(pages) ? pages : [])
      if (Array.isArray(pages) && pages.length > 0) {
        setSelectedPageId(pages[0].id)
      }
    } catch (err) {
      setSocialError(err.message || 'Failed to load Facebook Pages for selection')
      setShowPageSelectionModal(false)
    } finally {
      setPageSelectionLoading(false)
    }
  }

  const handleConfirmPageSelection = async () => {
    if (!pageSelectionToken || !selectedPageId) return
    setPageSelectionSaving(true)
    try {
      const connectedAccount = await socialAccountService.selectFacebookPage(pageSelectionToken, selectedPageId)
      setSocialAccounts(prev => {
        const filtered = prev.filter(a => a.platform !== 'FACEBOOK')
        return [...filtered, connectedAccount]
      })
      setShowPageSelectionModal(false)
      // Clean query params from URL
      window.history.replaceState({}, document.title, window.location.pathname)
    } catch (err) {
      setSocialError(err.message || 'Failed to connect selected Facebook Page')
    } finally {
      setPageSelectionSaving(false)
    }
  }

  // Load social accounts when tab is opened
  useEffect(() => {
    if (activeTab === 'social') {
      loadSocialAccounts()
    }
  }, [activeTab])

  const loadSocialAccounts = async () => {
    setSocialLoading(true)
    setSocialError(null)
    try {
      const data = await socialAccountService.getAccounts()
      setSocialAccounts(Array.isArray(data) ? data : [])
    } catch (err) {
      setSocialError(err.message || 'Failed to load social accounts')
    } finally {
      setSocialLoading(false)
    }
  }

  const handleConnect = async (platform) => {
    const restaurantId = selectedRestaurantId || restaurants[0]?.id
    if (!restaurantId) {
      setSocialError('Please select a restaurant first.')
      return
    }
    setConnectingPlatform(platform)
    setSocialError(null)
    try {
      const result = await socialAccountService.initiateConnect(platform, restaurantId)
      if (result?.redirectUrl) {
        window.location.href = result.redirectUrl
      }
    } catch (err) {
      setSocialError(err.message || 'Failed to initiate connection')
      setConnectingPlatform(null)
    }
  }

  const handleDisconnect = async (accountId) => {
    try {
      await socialAccountService.disconnect(accountId)
      setSocialAccounts(prev => prev.filter(a => a.id !== accountId))
    } catch (err) {
      setSocialError(err.message || 'Failed to disconnect account')
    }
  }

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

        {activeTab === 'social' && (
          <div className="animate-fade-in">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Connected Social Accounts</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
              Connect your restaurant&apos;s Facebook Page, LinkedIn, or YouTube account to publish posts directly from SocialFlow AI.
            </p>

            {/* Restaurant selector */}
            {restaurants.length > 0 && (
              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Select Restaurant
                </label>
                <select
                  value={selectedRestaurantId || restaurants[0]?.id || ''}
                  onChange={(e) => setSelectedRestaurantId(Number(e.target.value))}
                  className="w-full sm:w-64 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500"
                >
                  {restaurants.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
            )}

            {socialError && (
              <div className="mb-4 px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700 dark:text-amber-400">{socialError}</p>
              </div>
            )}

            {socialLoading ? (
              <div className="flex items-center gap-3 py-8 text-gray-400">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm">Loading connected accounts...</span>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Active platforms — Real OAuth connection */}
                {[
                  { p: 'FACEBOOK', label: 'Facebook', color: 'from-blue-600 to-blue-700' },
                  { p: 'LINKEDIN', label: 'LinkedIn', color: 'from-blue-500 to-blue-700' },
                  { p: 'YOUTUBE', label: 'YouTube', color: 'from-red-600 to-red-700' },
                ].map(({ p, label, color }) => {
                  const account = socialAccounts.find(a => a.platform === p)
                  return (
                    <div key={p} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800/50">
                      <div className="flex items-center gap-3">
                        <div className={`h-9 w-9 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center`}>
                          <Link2 className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
                          {account?.isConnected ? (
                            <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                              <CheckCircle className="h-3 w-3" />
                              {account.accountName || 'Connected'}
                              {account.tokenExpired && ' · Token expired'}
                            </p>
                          ) : (
                            <p className="text-xs text-gray-400">Not connected</p>
                          )}
                        </div>
                      </div>
                      {account?.isConnected ? (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleConnect(p)}
                            title="Reconnect"
                          >
                            Reconnect
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDisconnect(account.id)}
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            Disconnect
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          loading={connectingPlatform === p}
                          onClick={() => handleConnect(p)}
                        >
                          Connect
                        </Button>
                      )}
                    </div>
                  )
                })}

                {/* Coming Soon platform — Instagram (Next in line) */}
                {[
                  { p: 'INSTAGRAM', label: 'Instagram', color: 'from-pink-500 to-purple-500' },
                ].map(({ p, label, color }) => (
                  <div key={p} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 dark:border-gray-700/60 bg-gray-50/60 dark:bg-gray-800/30">
                    <div className="flex items-center gap-3">
                      <div className={`h-9 w-9 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center opacity-60`}>
                        <Link2 className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</p>
                          <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-200 dark:border-amber-700/50">
                            Coming Soon
                          </span>
                        </div>
                        <p className="text-xs text-gray-400">Integration not enabled yet</p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      disabled
                      className="opacity-40 cursor-not-allowed pointer-events-none"
                    >
                      Connect
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Facebook Multiple Page Selection Modal */}
            {showPageSelectionModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-scale-up">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white">
                      <Facebook className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">Select Facebook Page</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Choose which Facebook Page you want to connect to this restaurant.
                      </p>
                    </div>
                  </div>

                  {pageSelectionLoading ? (
                    <div className="flex items-center justify-center py-8 text-gray-400 gap-2">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span className="text-sm">Fetching managed Facebook Pages...</span>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto py-2">
                      {candidatePages.map((page) => (
                        <label
                          key={page.id}
                          className={`flex items-center justify-between p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                            selectedPageId === page.id
                              ? 'border-brand-500 bg-brand-50/70 dark:bg-brand-900/20'
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="radio"
                              name="facebookPage"
                              value={page.id}
                              checked={selectedPageId === page.id}
                              onChange={() => setSelectedPageId(page.id)}
                              className="text-brand-600 focus:ring-brand-500"
                            />
                            <div>
                              <p className="text-sm font-semibold text-gray-900 dark:text-white">{page.name}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{page.category || 'Facebook Page'}</p>
                            </div>
                          </div>
                          <span className="text-[11px] font-mono text-gray-400">ID: {page.id}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <Button
                      variant="secondary"
                      className="flex-1"
                      onClick={() => setShowPageSelectionModal(false)}
                      disabled={pageSelectionSaving}
                    >
                      Cancel
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={handleConfirmPageSelection}
                      disabled={pageSelectionSaving || !selectedPageId || pageSelectionLoading}
                      loading={pageSelectionSaving}
                    >
                      Connect Page
                    </Button>
                  </div>
                </div>
              </div>
            )}
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
