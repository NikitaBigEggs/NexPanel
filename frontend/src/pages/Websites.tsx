import { useEffect, useState } from 'react'
import { Plus, Play, Square, RotateCcw, Trash2, Terminal, Settings } from 'lucide-react'

interface Website {
  id: string
  name: string
  runtime: 'nodejs' | 'php' | 'python' | 'static'
  port: number
  status: 'running' | 'stopped' | 'error'
  uptime: number
  entryPoint?: string
  autoStart: boolean
  createdAt: number
}

export default function Websites() {
  const [websites, setWebsites] = useState<Website[]>([])
  const [loading, setLoading] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [newSite, setNewSite] = useState({
    name: '',
    runtime: 'nodejs' as const,
    port: 3001,
    entryPoint: '',
  })
  const [selectedTab, setSelectedTab] = useState<string | null>(null)
  const [consoleLogs, setConsoleLogs] = useState<string[]>([])

  const baseUrl = 'http://localhost:3000/api/v1/websites'

  const fetchWebsites = async () => {
    try {
      const response = await fetch(`${baseUrl}/list`)
      if (response.ok) {
        const data = await response.json()
        setWebsites(data.websites)
      }
    } catch (error) {
      console.error('Failed to fetch websites:', error)
    }
  }

  useEffect(() => {
    fetchWebsites()
    const interval = setInterval(fetchWebsites, 2000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (selectedTab) {
      const fetchLogs = async () => {
        try {
          const response = await fetch(`${baseUrl}/${selectedTab}/console?limit=100`)
          if (response.ok) {
            const data = await response.json()
            setConsoleLogs(data.logs)
          }
        } catch (error) {
          console.error('Failed to fetch logs:', error)
        }
      }
      fetchLogs()
      const interval = setInterval(fetchLogs, 1000)
      return () => clearInterval(interval)
    }
  }, [selectedTab])

  const handleCreate = async () => {
    if (!newSite.name || !newSite.port) {
      alert('Please fill in all required fields')
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`${baseUrl}/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSite),
      })
      if (response.ok) {
        await fetchWebsites()
        setShowCreate(false)
        setNewSite({ name: '', runtime: 'nodejs', port: 3001, entryPoint: '' })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleStart = async (websiteId: string) => {
    setLoading(true)
    try {
      const response = await fetch(`${baseUrl}/${websiteId}/start`, { method: 'POST' })
      if (response.ok) {
        await fetchWebsites()
      }
    } finally {
      setLoading(false)
    }
  }

  const handleStop = async (websiteId: string) => {
    setLoading(true)
    try {
      const response = await fetch(`${baseUrl}/${websiteId}/stop`, { method: 'POST' })
      if (response.ok) {
        await fetchWebsites()
      }
    } finally {
      setLoading(false)
    }
  }

  const handleRestart = async (websiteId: string) => {
    setLoading(true)
    try {
      const response = await fetch(`${baseUrl}/${websiteId}/restart`, { method: 'POST' })
      if (response.ok) {
        await fetchWebsites()
      }
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (websiteId: string) => {
    if (confirm('Are you sure you want to delete this website?')) {
      setLoading(true)
      try {
        const response = await fetch(`${baseUrl}/${websiteId}/delete`, { method: 'POST' })
        if (response.ok) {
          await fetchWebsites()
          if (selectedTab === websiteId) {
            setSelectedTab(null)
          }
        }
      } finally {
        setLoading(false)
      }
    }
  }

  const StatusBadge = ({ status }: { status: string }) => {
    const colors = {
      running: 'bg-green-500/20 text-green-400',
      stopped: 'bg-gray-500/20 text-gray-400',
      error: 'bg-red-500/20 text-red-400',
    }
    return (
      <span className={`px-2 py-1 rounded text-xs font-semibold ${colors[status as keyof typeof colors]}`}>
        {status.toUpperCase()}
      </span>
    )
  }

  const RuntimeBadge = ({ runtime }: { runtime: string }) => {
    const colors: Record<string, string> = {
      nodejs: 'bg-yellow-500/20 text-yellow-400',
      php: 'bg-purple-500/20 text-purple-400',
      python: 'bg-blue-500/20 text-blue-400',
      static: 'bg-gray-500/20 text-gray-400',
    }
    return (
      <span className={`px-2 py-1 rounded text-xs font-semibold ${colors[runtime]}`}>{runtime.toUpperCase()}</span>
    )
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Websites</h1>
          <p className="text-muted-foreground">Manage your websites and web applications</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn btn-primary flex items-center gap-2">
          <Plus size={16} />
          New Website
        </button>
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="card w-96 max-h-96 overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Create New Website</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground">Site Name</label>
                <input
                  type="text"
                  value={newSite.name}
                  onChange={(e) => setNewSite({ ...newSite, name: e.target.value })}
                  className="w-full bg-muted/30 border border-border rounded px-3 py-2 mt-1"
                  placeholder="My Website"
                />
              </div>

              <div>
                <label className="text-sm text-muted-foreground">Runtime</label>
                <select
                  value={newSite.runtime}
                  onChange={(e) => setNewSite({ ...newSite, runtime: e.target.value as any })}
                  className="w-full bg-muted/30 border border-border rounded px-3 py-2 mt-1"
                >
                  <option value="nodejs">Node.js</option>
                  <option value="php">PHP</option>
                  <option value="python">Python</option>
                  <option value="static">Static HTML</option>
                </select>
              </div>

              <div>
                <label className="text-sm text-muted-foreground">Port</label>
                <input
                  type="number"
                  value={newSite.port}
                  onChange={(e) => setNewSite({ ...newSite, port: parseInt(e.target.value) })}
                  className="w-full bg-muted/30 border border-border rounded px-3 py-2 mt-1"
                  placeholder="3001"
                />
              </div>

              <div>
                <label className="text-sm text-muted-foreground">Entry Point (optional)</label>
                <input
                  type="text"
                  value={newSite.entryPoint}
                  onChange={(e) => setNewSite({ ...newSite, entryPoint: e.target.value })}
                  className="w-full bg-muted/30 border border-border rounded px-3 py-2 mt-1"
                  placeholder="main.js"
                />
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <button onClick={() => setShowCreate(false)} className="btn btn-ghost">
                  Cancel
                </button>
                <button onClick={handleCreate} disabled={loading} className="btn btn-primary">
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Websites list */}
      <div className="space-y-4">
        {websites.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-muted-foreground mb-4">No websites yet</p>
            <button onClick={() => setShowCreate(true)} className="btn btn-primary">
              Create First Website
            </button>
          </div>
        ) : (
          websites.map((site) => (
            <div key={site.id} className="card">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-lg">{site.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {site.runtime.toUpperCase()} • Port {site.port}
                  </p>
                </div>
                <div className="flex gap-2">
                  <StatusBadge status={site.status} />
                  <RuntimeBadge runtime={site.runtime} />
                </div>
              </div>

              <div className="flex gap-2 flex-wrap mb-4">
                <button
                  onClick={() => handleStart(site.id)}
                  disabled={site.status === 'running' || loading}
                  className="btn btn-primary disabled:opacity-50 text-sm"
                  title="Start"
                >
                  <Play size={14} />
                </button>
                <button
                  onClick={() => handleStop(site.id)}
                  disabled={site.status !== 'running' || loading}
                  className="btn btn-primary disabled:opacity-50 text-sm"
                  title="Stop"
                >
                  <Square size={14} />
                </button>
                <button
                  onClick={() => handleRestart(site.id)}
                  disabled={loading}
                  className="btn btn-primary disabled:opacity-50 text-sm"
                  title="Restart"
                >
                  <RotateCcw size={14} />
                </button>
                <button
                  onClick={() => setSelectedTab(site.id)}
                  className="btn btn-ghost text-sm"
                  title="View Console"
                >
                  <Terminal size={14} />
                </button>
                <button onClick={() => handleDelete(site.id)} disabled={loading} className="btn btn-ghost text-red-400 text-sm">
                  <Trash2 size={14} />
                </button>
              </div>

              {selectedTab === site.id && (
                <div className="bg-black/50 font-mono text-xs rounded p-3 max-h-64 overflow-y-auto">
                  {consoleLogs.length === 0 ? (
                    <p className="text-muted-foreground">No output yet...</p>
                  ) : (
                    consoleLogs.map((log, i) => (
                      <p key={i} className={`${log.includes('ERROR') ? 'text-red-400' : 'text-green-400'}`}>
                        {log}
                      </p>
                    ))
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
