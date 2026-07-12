import { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { Activity, Cpu, HardDrive, Thermometer, TrendingUp } from 'lucide-react'

interface MetricsSnapshot {
  timestamp: number
  cpu: number
  ram: number
  swap: number
  disk: number
  temperature: number
  processes: Array<{
    pid: number
    name: string
    cpu: number
    memory: number
    state: string
  }>
}

interface HistoryData {
  cpu: Array<{ time: number; value: number }>
  ram: Array<{ time: number; value: number }>
  swap: Array<{ time: number; value: number }>
  disk: Array<{ time: number; value: number }>
  temperature: Array<{ time: number; value: number }>
  network: Array<{ time: number; bytesIn: number; bytesOut: number }>
}

interface Stats {
  cpu: { current: number; avg: number; max: number; min: number }
  ram: { current: number; avg: number; max: number; min: number }
  temp: { current: number; avg: number; max: number; min: number }
}

export default function Monitoring() {
  const [metrics, setMetrics] = useState<MetricsSnapshot | null>(null)
  const [history, setHistory] = useState<HistoryData | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [timeRange, setTimeRange] = useState<60 | 120 | 240>(120) // minutes

  const baseUrl = 'http://localhost:3000/api/v1/monitoring'

  const fetchMetrics = async () => {
    try {
      const response = await fetch(`${baseUrl}/metrics`)
      if (response.ok) {
        const data = await response.json()
        setMetrics(data)
      }
    } catch (error) {
      console.error('Failed to fetch metrics:', error)
    }
  }

  const fetchHistory = async () => {
    try {
      const response = await fetch(`${baseUrl}/history/${timeRange / 60}`)
      if (response.ok) {
        const data = await response.json()
        setHistory(data)
      }
    } catch (error) {
      console.error('Failed to fetch history:', error)
    }
  }

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

  useEffect(() => {
    fetchMetrics()
    fetchHistory()
    fetchStats()

    const interval = setInterval(() => {
      fetchMetrics()
      fetchStats()
    }, 2000)

    return () => clearInterval(interval)
  }, [timeRange])

  const formatTimestamp = (timestamp: number): string => {
    return new Date(timestamp).toLocaleTimeString()
  }

  const StatBox = ({ icon: Icon, label, value, unit = '', avg = 0, max = 0 }: any) => (
    <div className="card">
      <div className="flex items-center gap-2 mb-2">
        <Icon size={18} className="text-secondary" />
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
      <p className="text-2xl font-bold">{value.toFixed(1)}{unit}</p>
      <p className="text-xs text-muted-foreground mt-1">Avg: {avg.toFixed(1)} | Max: {max.toFixed(1)}</p>
    </div>
  )

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold">Monitoring</h1>
        <p className="text-muted-foreground">Advanced system metrics and performance analysis</p>
      </div>

      {/* Time range selector */}
      <div className="flex gap-2">
        {[60, 120, 240].map((range) => (
          <button
            key={range}
            onClick={() => setTimeRange(range as 60 | 120 | 240)}
            className={`btn text-sm ${timeRange === range ? 'btn-primary' : 'btn-ghost'}`}
          >
            {range === 60 ? '1h' : range === 120 ? '2h' : '4h'}
          </button>
        ))}
      </div>

      {/* Current metrics cards */}
      {metrics && stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatBox
            icon={Cpu}
            label="CPU Usage"
            value={metrics.cpu}
            unit="%"
            avg={stats.cpu.avg}
            max={stats.cpu.max}
          />
          <StatBox
            icon={Activity}
            label="RAM Usage"
            value={metrics.ram}
            unit="%"
            avg={stats.ram.avg}
            max={stats.ram.max}
          />
          <StatBox
            icon={HardDrive}
            label="Disk Usage"
            value={metrics.disk}
            unit="%"
          />
          <StatBox
            icon={Thermometer}
            label="Temperature"
            value={metrics.temperature}
            unit="°C"
            avg={stats.temp.avg}
            max={stats.temp.max}
          />
        </div>
      )}

      {/* Detailed metrics */}
      {metrics && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="card">
            <p className="text-sm text-muted-foreground mb-2">Swap Usage</p>
            <p className="text-2xl font-bold">{metrics.swap.toFixed(1)}%</p>
          </div>
          <div className="card">
            <p className="text-sm text-muted-foreground mb-2">Processes</p>
            <p className="text-2xl font-bold">{metrics.processes.length}</p>
          </div>
          <div className="card">
            <p className="text-sm text-muted-foreground mb-2">Last Update</p>
            <p className="text-sm font-semibold">{formatTimestamp(metrics.timestamp)}</p>
          </div>
        </div>
      )}

      {/* Charts */}
      {history && (
        <div className="space-y-4">
          {/* CPU and RAM */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="card">
              <h3 className="font-semibold mb-4">CPU Usage</h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={history.cpu}>
                  <CartesianGrid stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="time" stroke="rgba(255,255,255,0.5)" style={{ fontSize: '12px' }} />
                  <YAxis stroke="rgba(255,255,255,0.5)" style={{ fontSize: '12px' }} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(30, 30, 30, 0.9)',
                      border: '1px solid rgba(255,255,255,0.1)',
                    }}
                  />
                  <Line type="monotone" dataKey="value" stroke="#d60000" dot={false} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="card">
              <h3 className="font-semibold mb-4">Memory Usage</h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={history.ram}>
                  <CartesianGrid stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="time" stroke="rgba(255,255,255,0.5)" style={{ fontSize: '12px' }} />
                  <YAxis stroke="rgba(255,255,255,0.5)" style={{ fontSize: '12px' }} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(30, 30, 30, 0.9)',
                      border: '1px solid rgba(255,255,255,0.1)',
                    }}
                  />
                  <Line type="monotone" dataKey="value" stroke="#00d6a8" dot={false} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Swap and Disk */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="card">
              <h3 className="font-semibold mb-4">Swap Usage</h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={history.swap}>
                  <CartesianGrid stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="time" stroke="rgba(255,255,255,0.5)" style={{ fontSize: '12px' }} />
                  <YAxis stroke="rgba(255,255,255,0.5)" style={{ fontSize: '12px' }} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(30, 30, 30, 0.9)',
                      border: '1px solid rgba(255,255,255,0.1)',
                    }}
                  />
                  <Line type="monotone" dataKey="value" stroke="#ffd60a" dot={false} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="card">
              <h3 className="font-semibold mb-4">Disk Usage</h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={history.disk}>
                  <CartesianGrid stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="time" stroke="rgba(255,255,255,0.5)" style={{ fontSize: '12px' }} />
                  <YAxis stroke="rgba(255,255,255,0.5)" style={{ fontSize: '12px' }} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(30, 30, 30, 0.9)',
                      border: '1px solid rgba(255,255,255,0.1)',
                    }}
                  />
                  <Line type="monotone" dataKey="value" stroke="#a100f2" dot={false} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Temperature */}
          <div className="card">
            <h3 className="font-semibold mb-4">Temperature Trend</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={history.temperature}>
                <CartesianGrid stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="time" stroke="rgba(255,255,255,0.5)" style={{ fontSize: '12px' }} />
                <YAxis stroke="rgba(255,255,255,0.5)" style={{ fontSize: '12px' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(30, 30, 30, 0.9)',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                />
                <Line type="monotone" dataKey="value" stroke="#ff6b6b" dot={false} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Top processes */}
      {metrics && (
        <div className="card">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <TrendingUp size={18} />
            Top Processes by CPU Usage
          </h3>
          <div className="max-h-64 overflow-y-auto space-y-2">
            {metrics.processes.map((proc) => (
              <div key={proc.pid} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div className="flex-1">
                  <p className="text-sm font-medium truncate">{proc.name}</p>
                  <p className="text-xs text-muted-foreground">PID: {proc.pid}</p>
                </div>
                <div className="flex gap-4 text-right text-sm">
                  <div>
                    <p className="font-semibold text-secondary">{proc.cpu.toFixed(1)}%</p>
                    <p className="text-xs text-muted-foreground">CPU</p>
                  </div>
                  <div>
                    <p className="font-semibold text-secondary">{proc.memory.toFixed(1)}%</p>
                    <p className="text-xs text-muted-foreground">MEM</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
