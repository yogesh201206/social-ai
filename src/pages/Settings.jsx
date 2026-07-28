import SettingsPanel from '../components/SettingsPanel'

export default function Settings() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Manage your account preferences and application settings.
        </p>
      </div>
      <SettingsPanel />
    </div>
  )
}
