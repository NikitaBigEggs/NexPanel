import { useEffect, useState } from 'react'
import { Play, Square, RotateCcw, X, Users, Zap, Clock, Activity, Settings } from 'lucide-react'
import { io, Socket } from 'socket.io-client'

interface ServerStats {
  status: 'running' | 'stopped' | 'crashed'
  uptime: number
  cpu: number
  ram: number
  players: number
  tps: number
}

interface Player {
  id: string
  name: string
  joinTime: number
  vehicles: number
}

interface ServerConfig {
  name: string
  port: number
  maxPlayers: number
  description: string
  tags: string[]
  private: boolean
  whitelist: string[]
  banned: string[]
}

export default function BeamMP() {
  const [stats, setStats] = useState<ServerStats>({
    status: 'stopped',
    uptime: 0,
    cpu: 0,
    ram: 0,
    players: 0,
    tps: 60,
  })

  const [config, setConfig] = useState<ServerConfig>({
    name: 'BeamMP Server',
    port: 30814,
    maxPlayers: 32,
    description: 'A BeamMP Server',
    tags: [],
    private: false,
    whitelist: [],
    banned: [],
  })

  const [players, setPlayers] = useState<Player[]>([])
  const [consoleLogs, setConsoleLogs] = useState<string[]>([])
  const [autoRestart, setAutoRestart] = useState(false)
  const [autoStart, setAutoStart] = useState(false)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'console' | 'players' | 'config' | 'settings'>('console')

  const baseUrl = 'http://localhost:3000/api/v1/beammp'

  const fetchStats = async () => {
    try {
      const response = await fetch(`${baseUrl}/stats`)
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }

  const fetchPlayers = async () => {
    try {
      const response = await fetch(`${baseUrl}/players`)
      if (response.ok) {
        const data = await response.json()
        setPlayers(data.players)
      }
    } catch (error) {
      console.error('Failed to fetch players:', error)
    }
  }

  const fetchConfig = async () => {
    try {
      const response = await fetch(`${baseUrl}/config`)
      if (response.ok) {
        const data = await response.json()
        setConfig(data)
      }
    } catch (error) {
      console.error('Failed to fetch config:', error)
    }
  }

  const fetchConsoleLogs = async () => {
    try {
      const response = await fetch(`${baseUrl}/console?limit=100`)
      if (response.ok) {
        const data = await response.json()
        setConsoleLogs(data.logs)
      }
    } catch (error) {
      console.error('Failed to fetch console logs:', error)
    }
  }

  useEffect(() => {
    fetchStats()
    fetchPlayers()
    fetchConfig()
    fetchConsoleLogs()

    const interval = setInterval(() => {
      fetchStats()
      if (activeTab === 'players') fetchPlayers()
      if (activeTab === 'console') fetchConsoleLogs()
    }, 2000)

    return () => clearInterval(interval)
  }, [activeTab])

  const handleStart = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${baseUrl}/start`, { method: 'POST' })
      if (response.ok) {
        await fetchStats()
      }
    } finally {
      setLoading(false)
    }
  }

  const handleStop = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${baseUrl}/stop`, { method: 'POST' })
      if (response.ok) {
        await fetchStats()
      }
    } finally {
      setLoading(false)
    }
  }

  const handleRestart = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${baseUrl}/restart`, { method: 'POST' })
      if (response.ok) {
        await fetchStats()
      }
    } finally {
      setLoading(false)
    }
  }

  const handleKill = async () => {
    if (confirm('Are you sure you want to force kill the server?')) {
      setLoading(true)
      try {
        const response = await fetch(`${baseUrl}/kill`, { method: 'POST' })
        if (response.ok) {
          await fetchStats()
        }
      } finally {
        setLoading(false)
      }
    }
  }

  const handleKickPlayer = async (playerId: string) => {
    try {
      const response = await fetch(`${baseUrl}/players/${playerId}/kick`, { method: 'POST' })
      if (response.ok) {
        await fetchPlayers()
      }
    } catch (error) {
      console.error('Failed to kick player:', error)
    }
  }

  const handleBanPlayer = async (playerId: string) => {
    if (confirm('Are you sure you want to ban this player?')) {
      try {
        const response = await fetch(`${baseUrl}/players/${playerId}/ban`, { method: 'POST' })
        if (response.ok) {
          await fetchPlayers()
        }
      } catch (error) {
        console.error('Failed to ban player:', error)
      }
    }
  }

  const StatusBadge = ({ status }: { status: string }) => {
    const colors = {
      running: 'bg-green-500/20 text-green-400 border-green-500/50',
      stopped: 'bg-red-500/20 text-red-400 border-red-500/50',
      crashed: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
    }
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${colors[status as keyof typeof colors]}`}>
        {status.toUpperCase()}
      </span>
    )
  }

  const StatBox = ({ icon: Icon, label, value, unit = '' }: any) => (
    <div className="card">
      <div className="flex items-center gap-2 mb-2">
        <Icon size={16} className="text-secondary" />
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
      <p className="text-xl font-bold">{value}{unit}</p>
    </div>
  )

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold">BeamMP Server</h1>
        <p className="text-muted-foreground">Manage your BeamMP game server instance</p>
      </div>

      {/* Server controls */}
      <div className="card bg-muted/20">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Server Status</p>
              <StatusBadge status={stats.status} />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleStart}
              disabled={stats.status === 'running' || loading}
              className="btn btn-primary disabled:opacity-50"
              title="Start server"
            >
              <Play size={16} />
            </button>
            <button
              onClick={handleStop}
              disabled={stats.status !== 'running' || loading}
              className="btn btn-primary disabled:opacity-50"
              title="Stop server"
            >
              <Square size={16} />
            </button>
            <button
              onClick={handleRestart}
              disabled={loading}
              className="btn btn-primary disabled:opacity-50"
              title="Restart server"
            >
              <RotateCcw size={16} />
            </button>
            <button
              onClick={handleKill}
              disabled={loading}
              className="btn bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
              title="Force kill server"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatBox icon={Clock} label="Uptime" value={stats.uptime} unit="h" />
        <StatBox icon={Users} label="Players" value={stats.players} unit={`/${config.maxPlayers}`} />
        <StatBox icon={Zap} label="TPS" value={stats.tps.toFixed(1)} />
        <StatBox icon={Activity} label="RAM" value={stats.ram.toFixed(1)} unit="%" />
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <div className="flex gap-1">
          {(['console', 'players', 'config', 'settings'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-all ${
                activeTab === tab
                  ? 'border-secondary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Console tab */}
      {activeTab === 'console' && (
        <div className="card bg-black/50 font-mono text-sm">
          <div className="max-h-96 overflow-y-auto space-y-1">
            {consoleLogs.length === 0 ? (
              <p className="text-muted-foreground">No console output yet...</p>
            ) : (
              consoleLogs.map((log, i) => (
                <p key={i} className={`${log.includes('ERROR') ? 'text-red-400' : 'text-green-400'}`}>
                  {log}
                </p>
              ))
            )}
          </div>
        </div>
      )}

      {/* Players tab */}
      {activeTab === 'players' && (
        <div className="space-y-4">
          <div className="grid gap-2">
            {players.length === 0 ? (
              <p className="text-muted-foreground">No players connected</p>
            ) : (
              players.map((player) => (
                <div key={player.id} className="card flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{player.name}</p>
                    <p className="text-xs text-muted-foreground">{player.vehicles} vehicle(s)</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleKickPlayer(player.id)}
                      className="btn btn-ghost text-yellow-400 hover:bg-yellow-500/20"
                    >
                      Kick
                    </button>
                    <button
                      onClick={() => handleBanPlayer(player.id)}
                      className="btn btn-ghost text-red-400 hover:bg-red-500/20"
                    >
                      Ban
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="card">
            <h3 className="font-semibold mb-3">Whitelist ({config.whitelist.length})</h3>
            <div className="flex flex-wrap gap-2">
              {config.whitelist.map((name) => (
                <span key={name} className="px-2 py-1 bg-secondary/20 text-secondary rounded text-xs">
                  {name}
                </span>
              ))}
            </div>
          </div>

          <div className="card">
            <h3 className="font-semibold mb-3">Banned ({config.banned.length})</h3>
            <div className="flex flex-wrap gap-2">
              {config.banned.map((name) => (
                <span key={name} className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs">
                  {name}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Config tab */}
      {activeTab === 'config' && (
        <div className="card space-y-4">
          <div>
            <label className="text-sm text-muted-foreground">Server Name</label>
            <input
              type="text"
              value={config.name}
              onChange={(e) => setConfig({ ...config, name: e.target.value })}
              className="w-full bg-muted/30 border border-border rounded px-3 py-2 mt-1"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-muted-foreground">Port</label>
              <input
                type="number"
                value={config.port}
                onChange={(e) => setConfig({ ...config, port: parseInt(e.target.value) })}
                className="w-full bg-muted/30 border border-border rounded px-3 py-2 mt-1"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Max Players</label>
              <input
                type="number"
                value={config.maxPlayers}
                onChange={(e) => setConfig({ ...config, maxPlayers: parseInt(e.target.value) })}
                className="w-full bg-muted/30 border border-border rounded px-3 py-2 mt-1"
              />
            </div>
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Description</label>
            <textarea
              value={config.description}
              onChange={(e) => setConfig({ ...config, description: e.target.value })}
              className="w-full bg-muted/30 border border-border rounded px-3 py-2 mt-1 h-24"
            />
          </div>
        </div>
      )}

      {/* Settings tab */}
      {activeTab === 'settings' && (
        <div className="space-y-4">
          <div className="card flex items-center justify-between">
            <div>
              <p className="font-semibold">Auto-Restart</p>
              <p className="text-xs text-muted-foreground">Restart server on crash</p>
            </div>
            <input
              type="checkbox"
              checked={autoRestart}
              onChange={(e) => setAutoRestart(e.target.checked)}
              className="w-5 h-5"
            />
          </div>
          <div className="card flex items-center justify-between">
            <div>
              <p className="font-semibold">Auto-Start</p>
              <p className="text-xs text-muted-foreground">Start server on boot</p>
            </div>
            <input
              type="checkbox"
              checked={autoStart}
              onChange={(e) => setAutoStart(e.target.checked)}
              className="w-5 h-5"
            />
          </div>
        </div>
      )}
    </div>
  )
}
