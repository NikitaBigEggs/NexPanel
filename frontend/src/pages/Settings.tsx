import { useEffect, useState } from 'react'
import { Moon, Sun, Bell, Lock, Download, Upload, RotateCcw } from 'lucide-react'

interface Settings {
  theme: 'dark' | 'light'
  language: string
  notifications: boolean
  autoBackup: boolean
  backupInterval: number
}

export default function Settings() {
  const [settings, setSettings] = useState<Settings>({
    theme: 'dark',
    language: 'en',
    notifications: true,
    autoBackup: false,
    backupInterval: 24,
  })
  const [version, setVersion] = useState('0.1.0')
  const [loading, setLoading] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const baseUrl = 'http://localhost:3000/api/v1/settings'

  const fetchSettings = async () => {
    try {
      const response = await fetch(`${baseUrl}/get`)
      if (response.ok) {
        const data = await response.json()
        setSettings(data)
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error)
    }
  }

  const fetchVersion = async () => {
    try {
      const response = await fetch(`${baseUrl}/version`)
      if (response.ok) {
        const data = await response.json()
        setVersion(data.version)
      }
    } catch (error) {
      console.error('Failed to fetch version:', error)
    }
  }

  useEffect(() => {
    fetchSettings()
    fetchVersion()
  }, [])

  const handleSave = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${baseUrl}/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      if (response.ok) {
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 3000)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleThemeChange = (theme: 'dark' | 'light') => {
    setSettings({ ...settings, theme })
    document.documentElement.classList.toggle('light', theme === 'light')
  }

  const handleBackup = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${baseUrl}/backup`, {
        method: 'POST',
      })
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `nexpanel-backup-${new Date().toISOString().split('T')[0]}.tar.gz`
        a.click()
      }
    } finally {
      setLoading(false)
    }
  }

  const handleResetToDefaults = async () => {
    if (!window.confirm('Reset all settings to defaults?')) return

    setLoading(true)
    try {
      const response = await fetch(`${baseUrl}/reset`, { method: 'POST' })
      if (response.ok) {
        await fetchSettings()
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Configure NexPanel preferences</p>
      </div>

      {/* Success message */}
      {saveSuccess && (
        <div className="bg-green-500/20 border border-green-500/50 text-green-400 px-4 py-3 rounded text-sm">
          Settings saved successfully!
        </div>
      )}

      {/* Main settings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Theme */}
        <div className="card space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            {settings.theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
            Appearance
          </h2>

          <div>
            <label className="text-sm text-muted-foreground block mb-2">Theme</label>
            <div className="flex gap-2">
              <button
                onClick={() => handleThemeChange('dark')}
                className={`flex-1 py-2 rounded text-sm font-medium transition-all ${
                  settings.theme === 'dark'
                    ? 'bg-secondary text-secondary-foreground'
                    : 'bg-muted/30 hover:bg-muted/50'
                }`}
              >
                <Moon size={16} className="inline mr-2" />
                Dark Mode
              </button>
              <button
                onClick={() => handleThemeChange('light')}
                className={`flex-1 py-2 rounded text-sm font-medium transition-all ${
                  settings.theme === 'light'
                    ? 'bg-secondary text-secondary-foreground'
                    : 'bg-muted/30 hover:bg-muted/50'
                }`}
              >
                <Sun size={16} className="inline mr-2" />
                Light Mode
              </button>
            </div>
          </div>

          <div>
            <label className="text-sm text-muted-foreground block mb-2">Language</label>
            <select
              value={settings.language}
              onChange={(e) => setSettings({ ...settings, language: e.target.value })}
              className="w-full bg-muted/30 border border-border rounded px-3 py-2 text-sm"
            >
              <option value="en">English</option>
              <option value="es">Español</option>
              <option value="fr">Français</option>
              <option value="de">Deutsch</option>
              <option value="ru">Русский</option>
              <option value="zh">中文</option>
            </select>
          </div>
        </div>

        {/* Notifications */}
        <div className="card space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Bell size={20} />
            Notifications
          </h2>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.notifications}
              onChange={(e) => setSettings({ ...settings, notifications: e.target.checked })}
              className="w-4 h-4"
            />
            <span className="text-sm">Enable notifications</span>
          </label>

          <p className="text-xs text-muted-foreground">
            Get alerts for important system events like high CPU usage or disk space warnings
          </p>
        </div>

        {/* Backup */}
        <div className="card space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Download size={20} />
            Backup & Restore
          </h2>

          <div>
            <label className="text-sm text-muted-foreground block mb-2">Auto Backup</label>
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <input
                  type="checkbox"
                  id="autoBackup"
                  checked={settings.autoBackup}
                  onChange={(e) => setSettings({ ...settings, autoBackup: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="autoBackup" className="text-sm ml-2 cursor-pointer">
                  Enable automatic backups
                </label>
              </div>
            </div>

            {settings.autoBackup && (
              <div className="mt-2">
                <label className="text-xs text-muted-foreground block mb-1">Interval (hours)</label>
                <input
                  type="number"
                  min="1"
                  max="168"
                  value={settings.backupInterval}
                  onChange={(e) => setSettings({ ...settings, backupInterval: parseInt(e.target.value) })}
                  className="w-full bg-muted/30 border border-border rounded px-2 py-1 text-sm"
                />
              </div>
            )}
          </div>

          <button onClick={handleBackup} disabled={loading} className="btn btn-primary w-full text-sm flex items-center justify-center gap-2">
            <Download size={14} />
            Create Backup Now
          </button>
        </div>

        {/* Security */}
        <div className="card space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Lock size={20} />
            Security
          </h2>

          <button className="w-full bg-muted/30 hover:bg-muted/50 px-4 py-2 rounded text-sm font-medium transition-all">
            Change Password
          </button>

          <button className="w-full bg-muted/30 hover:bg-muted/50 px-4 py-2 rounded text-sm font-medium transition-all">
            Manage SSH Keys
          </button>

          <button className="w-full bg-muted/30 hover:bg-muted/50 px-4 py-2 rounded text-sm font-medium transition-all">
            Enable Two-Factor Auth
          </button>
        </div>
      </div>

      {/* System Info */}
      <div className="card space-y-4">
        <h2 className="text-lg font-semibold">System Information</h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">NexPanel Version</p>
            <p className="text-lg font-semibold">{version}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">License</p>
            <p className="text-lg font-semibold">LGPL-2.1</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Platform</p>
            <p className="text-lg font-semibold">Linux</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Architecture</p>
            <p className="text-lg font-semibold">ARM64/x86_64</p>
          </div>
        </div>

        <a href="https://github.com/yourusername/nexpanel" target="_blank" rel="noopener noreferrer" className="text-secondary hover:underline text-sm">
          View on GitHub →
        </a>
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-end">
        <button
          onClick={handleResetToDefaults}
          disabled={loading}
          className="btn btn-ghost text-red-400 disabled:opacity-50 flex items-center gap-2"
        >
          <RotateCcw size={16} />
          Reset to Defaults
        </button>
        <button onClick={handleSave} disabled={loading} className="btn btn-primary flex items-center gap-2 disabled:opacity-50">
          Save Changes
        </button>
      </div>
    </div>
  )
}
