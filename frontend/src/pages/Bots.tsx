import { useEffect, useState } from 'react'
import { Plus, Play, Square, RotateCcw, Trash2, Terminal } from 'lucide-react'

interface Bot {
  id: string
  name: string
  runtime: 'nodejs' | 'python' | 'java' | 'go' | 'rust'
  status: 'running' | 'stopped' | 'error'
  uptime: number
  entryPoint: string
  autoStart: boolean
  autoRestart: boolean
  environment: Record<string, string>
}

export default function Bots() {
  const [bots, setBots] = useState<Bot[]>([])
  const [loading, setLoading] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [selectedBot, setSelectedBot] = useState<string | null>(null)
  const [consoleLogs, setConsoleLogs] = useState<string[]>([])
  const [newBot, setNewBot] = useState({
    name: '',
    runtime: 'nodejs' as const,
    entryPoint: 'bot.js',
  })

  const baseUrl = 'http://localhost:3000/api/v1/bots'

  const fetchBots = async () => {
    try {
      const response = await fetch(`${baseUrl}/list`)
      if (response.ok) {
        const data = await response.json()
        setBots(data.bots)
      }
    } catch (error) {
      console.error('Failed to fetch bots:', error)
    }
  }

  useEffect(() => {
    fetchBots()
    const interval = setInterval(fetchBots, 2000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (selectedBot) {
      const fetchLogs = async () => {
        try {
          const response = await fetch(`${baseUrl}/${selectedBot}/console?limit=100`)
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
  }, [selectedBot])

  const handleCreate = async () => {
    if (!newBot.name || !newBot.entryPoint) {
      alert('Please fill in all required fields')
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`${baseUrl}/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBot),
      })
      if (response.ok) {
        await fetchBots()
        setShowCreate(false)
        setNewBot({ name: '', runtime: 'nodejs', entryPoint: 'bot.js' })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleStart = async (botId: string) => {
    setLoading(true)
    try {
      const response = await fetch(`${baseUrl}/${botId}/start`, { method: 'POST' })
      if (response.ok) {
        await fetchBots()
      }
    } finally {
      setLoading(false)
    }
  }

  const handleStop = async (botId: string) => {
    setLoading(true)
    try {
      const response = await fetch(`${baseUrl}/${botId}/stop`, { method: 'POST' })
      if (response.ok) {
        await fetchBots()
      }
    } finally {
      setLoading(false)
    }
  }

  const handleRestart = async (botId: string) => {
    setLoading(true)
    try {
      const response = await fetch(`${baseUrl}/${botId}/restart`, { method: 'POST' })
      if (response.ok) {
        await fetchBots()
      }
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (botId: string) => {
    if (confirm('Are you sure you want to delete this bot?')) {
      setLoading(true)
      try {
        const response = await fetch(`${baseUrl}/${botId}/delete`, { method: 'POST' })
        if (response.ok) {
          await fetchBots()
          if (selectedBot === botId) {
            setSelectedBot(null)
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
      python: 'bg-blue-500/20 text-blue-400',
      java: 'bg-red-500/20 text-red-400',
      go: 'bg-cyan-500/20 text-cyan-400',
      rust: 'bg-orange-500/20 text-orange-400',
    }
    return (
      <span className={`px-2 py-1 rounded text-xs font-semibold ${colors[runtime]}`}>{runtime.toUpperCase()}</span>
    )
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Bots</h1>
          <p className="text-muted-foreground">Manage your bots and automation scripts</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn btn-primary flex items-center gap-2">
          <Plus size={16} />
          New Bot
        </button>
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="card w-96">
            <h2 className="text-xl font-bold mb-4">Create New Bot</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground">Bot Name</label>
                <input
                  type="text"
                  value={newBot.name}
                  onChange={(e) => setNewBot({ ...newBot, name: e.target.value })}
                  className="w-full bg-muted/30 border border-border rounded px-3 py-2 mt-1"
                  placeholder="My Discord Bot"
                />
              </div>

              <div>
                <label className="text-sm text-muted-foreground">Runtime</label>
                <select
                  value={newBot.runtime}
                  onChange={(e) => setNewBot({ ...newBot, runtime: e.target.value as any })}
                  className="w-full bg-muted/30 border border-border rounded px-3 py-2 mt-1"
                >
                  <option value="nodejs">Node.js</option>
                  <option value="python">Python</option>
                  <option value="java">Java</option>
                  <option value="go">Go</option>
                  <option value="rust">Rust</option>
                </select>
              </div>

              <div>
                <label className="text-sm text-muted-foreground">Entry Point</label>
                <input
                  type="text"
                  value={newBot.entryPoint}
                  onChange={(e) => setNewBot({ ...newBot, entryPoint: e.target.value })}
                  className="w-full bg-muted/30 border border-border rounded px-3 py-2 mt-1"
                  placeholder="bot.js"
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

      {/* Bots list */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          {bots.length === 0 ? (
            <div className="card text-center py-12">
              <p className="text-muted-foreground mb-4">No bots yet</p>
              <button onClick={() => setShowCreate(true)} className="btn btn-primary">
                Create First Bot
              </button>
            </div>
          ) : (
            bots.map((bot) => (
              <div
                key={bot.id}
                onClick={() => setSelectedBot(bot.id)}
                className={`card cursor-pointer transition-all ${
                  selectedBot === bot.id ? 'border-secondary' : 'border-border'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-lg">{bot.name}</h3>
                    <p className="text-sm text-muted-foreground">{bot.entryPoint}</p>
                  </div>
                  <div className="flex gap-2">
                    <StatusBadge status={bot.status} />
                    <RuntimeBadge runtime={bot.runtime} />
                  </div>
                </div>

                <div className="flex gap-2 flex-wrap mb-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleStart(bot.id)
                    }}
                    disabled={bot.status === 'running' || loading}
                    className="btn btn-ghost text-xs disabled:opacity-50"
                  >
                    <Play size={14} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleStop(bot.id)
                    }}
                    disabled={bot.status !== 'running' || loading}
                    className="btn btn-ghost text-xs disabled:opacity-50"
                  >
                    <Square size={14} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleRestart(bot.id)
                    }}
                    disabled={loading}
                    className="btn btn-ghost text-xs disabled:opacity-50"
                  >
                    <RotateCcw size={14} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(bot.id)
                    }}
                    disabled={loading}
                    className="btn btn-ghost text-red-400 text-xs"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                <div className="text-xs text-muted-foreground">
                  Uptime: {Math.floor(bot.uptime / 3600)}h {Math.floor((bot.uptime % 3600) / 60)}m
                </div>
              </div>
            ))
          )}
        </div>

        {/* Bot console */}
        {selectedBot && (
          <div className="card flex flex-col">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Terminal size={16} />
              Console
            </h3>
            <div className="flex-1 bg-black/50 font-mono text-xs text-green-400 p-2 rounded overflow-y-auto max-h-80">
              {consoleLogs.length === 0 ? (
                <p className="text-muted-foreground">No output yet...</p>
              ) : (
                consoleLogs.map((log, i) => (
                  <div
                    key={i}
                    className={`whitespace-pre-wrap break-words ${
                      log.includes('ERROR') ? 'text-red-400' : 'text-green-400'
                    }`}
                  >
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
