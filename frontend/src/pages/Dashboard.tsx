import { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Activity, Cpu, HardDrive, Network, Thermometer, Clock, Globe, Users } from 'lucide-react'
import { io, Socket } from 'socket.io-client'

interface SystemStats {
  cpu: number
  ram: number
  disk: number
  temperature: number
  uptime: number
  networkIn: number
  networkOut: number
  onlineUsers: number
  cpuUsageHistory: Array<{ time: string; value: number }>
  ramUsageHistory: Array<{ time: string; value: number }>
  timestamp: number
}

export default function Dashboard() {
  const [stats, setStats] = useState<SystemStats>({
    cpu: 0,
    ram: 0,
    disk: 0,
    temperature: 0,
    uptime: 0,
    networkIn: 0,
    networkOut: 0,
    onlineUsers: 0,
    cpuUsageHistory: [],
    ramUsageHistory: [],
    timestamp: Date.now(),
  })

  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    // Connect to WebSocket
    const newSocket = io('http://localhost:3000', {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    })

    newSocket.on('connect', () => {
      console.log('Connected to WebSocket')
      setIsConnected(true)
      newSocket.emit('subscribe:dashboard')
    })

    newSocket.on('dashboard:update', (data: SystemStats) => {
      setStats(data)
    })

    newSocket.on('disconnect', () => {
      console.log('Disconnected from WebSocket')
      setIsConnected(false)
    })

    newSocket.on('error', (error) => {
      console.error('WebSocket error:', error)
    })

    setSocket(newSocket)

    return () => {
      if (newSocket.connected) {
        newSocket.emit('unsubscribe:dashboard')
        newSocket.disconnect()
      }
    }
  }, [])

  // Fallback: fetch via REST API if WebSocket fails
  useEffect(() => {
    if (!isConnected) {
      const fetchStats = async () => {
        try {
          const response = await fetch('http://localhost:3000/api/v1/system/stats')
          if (response.ok) {
            const data = await response.json()
            setStats(data)
          }
        } catch (error) {
          console.error('Failed to fetch stats:', error)
        }
      }

      fetchStats()
      const interval = setInterval(fetchStats, 2000)
      return () => clearInterval(interval)
    }
  }, [isConnected])

  const StatCard = ({ icon: Icon, label, value, unit = '%', color = 'text-secondary' }: any) => (
    <div className="card group hover:shadow-lg transition-all duration-300">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-muted-foreground">{label}</p>
        <Icon size={20} className={`${color} group-hover:scale-110 transition-transform`} />
      </div>
      <p className="text-3xl font-bold">{value.toFixed(1)}{unit}</p>
      <div className="mt-2 h-1 bg-muted/50 rounded-full overflow-hidden">
        <div
          className={`h-full ${
            value > 80 ? 'bg-red-500' : value > 50 ? 'bg-yellow-500' : 'bg-secondary'
          } transition-all duration-300`}
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
    </div>
  )

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">System overview and real-time metrics</p>
        </div>
        <div className="flex items-center gap-2">
          <div
            className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}
          />
          <span className="text-sm text-muted-foreground">{isConnected ? 'Live' : 'Offline'}</span>
        </div>
      </div>

      {/* Main metrics grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Cpu} label="CPU Usage" value={stats.cpu} />
        <StatCard icon={Activity} label="RAM Usage" value={stats.ram} />
        <StatCard icon={HardDrive} label="Disk Usage" value={stats.disk} />
        <StatCard
          icon={Thermometer}
          label="Temperature"
          value={stats.temperature}
          unit="°C"
          color="text-orange-500"
        />
      </div>

      {/* System info cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <Clock size={18} className="text-secondary" />
            <h3 className="font-semibold">Uptime</h3>
          </div>
          <div>
            <p className="text-2xl font-bold">{stats.uptime}h</p>
            <p className="text-xs text-muted-foreground mt-1">Server running time</p>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <Users size={18} className="text-secondary" />
            <h3 className="font-semibold">Online Users</h3>
          </div>
          <div>
            <p className="text-2xl font-bold">{stats.onlineUsers}</p>
            <p className="text-xs text-muted-foreground mt-1">Active sessions</p>
          </div>
        </div>
      </div>

      {/* Network stats */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Network size={18} className="text-secondary" />
          <h3 className="font-semibold">Network</h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Bytes In</p>
            <p className="text-lg font-semibold">{(stats.networkIn / 1024 / 1024 / 1024).toFixed(2)} GB</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Bytes Out</p>
            <p className="text-lg font-semibold">{(stats.networkOut / 1024 / 1024 / 1024).toFixed(2)} GB</p>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card">
          <h3 className="font-semibold mb-4">CPU Usage Over Time</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={stats.cpuUsageHistory}>
              <CartesianGrid stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="time" stroke="rgba(255,255,255,0.5)" style={{ fontSize: '12px' }} />
              <YAxis stroke="rgba(255,255,255,0.5)" style={{ fontSize: '12px' }} domain={[0, 100]} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(30, 30, 30, 0.9)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                }}
              />
              <Line type="monotone" dataKey="value" stroke="#d60000" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="font-semibold mb-4">RAM Usage Over Time</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={stats.ramUsageHistory}>
              <CartesianGrid stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="time" stroke="rgba(255,255,255,0.5)" style={{ fontSize: '12px' }} />
              <YAxis stroke="rgba(255,255,255,0.5)" style={{ fontSize: '12px' }} domain={[0, 100]} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(30, 30, 30, 0.9)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                }}
              />
              <Line type="monotone" dataKey="value" stroke="#d60000" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Summary */}
      <div className="card bg-muted/20 border-muted text-center">
        <p className="text-sm text-muted-foreground">
          Last updated: {new Date(stats.timestamp).toLocaleTimeString()}
        </p>
      </div>
    </div>
  )
}
