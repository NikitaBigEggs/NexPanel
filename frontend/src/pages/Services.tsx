import { useEffect, useState } from 'react'
import { Play, Square, RotateCcw, Power, PowerOff, FileText, RefreshCw } from 'lucide-react'

interface Service {
  name: string
  displayName: string
  description: string
  status: 'active' | 'inactive' | 'failed' | 'unknown'
  enabled: boolean
  autoStart: boolean
  uptime: number
  mainPid?: number
  restarts: number
}

interface SystemStatus {
  runningServices: number
  failedServices: number
  totalServices: number
}

export default function Services() {
  const [services, setServices] = useState<Service[]>([])
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    runningServices: 0,
    failedServices: 0,
    totalServices: 0,
  })
  const [loading, setLoading] = useState(false)
  const [selectedService, setSelectedService] = useState<string | null>(null)
  const [serviceLogs, setServiceLogs] = useState<string>('')
  const [filter, setFilter] = useState<'all' | 'active' | 'failed' | 'inactive'>('all')

  const baseUrl = 'http://localhost:3000/api/v1/services'

  const fetchServices = async () => {
    try {
      const response = await fetch(`${baseUrl}/list`)
      if (response.ok) {
        const data = await response.json()
        setServices(data.services)
      }
    } catch (error) {
      console.error('Failed to fetch services:', error)
    }
  }

  const fetchSystemStatus = async () => {
    try {
      const response = await fetch(`${baseUrl}/system/status`)
      if (response.ok) {
        const data = await response.json()
        setSystemStatus(data)
      }
    } catch (error) {
      console.error('Failed to fetch system status:', error)
    }
  }

  useEffect(() => {
    fetchServices()
    fetchSystemStatus()
    const interval = setInterval(() => {
      fetchServices()
      fetchSystemStatus()
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (selectedService) {
      const fetchLogs = async () => {
        try {
          const response = await fetch(`${baseUrl}/${selectedService}/logs?lines=50`)
          if (response.ok) {
            const data = await response.json()
            setServiceLogs(data.logs)
          }
        } catch (error) {
          console.error('Failed to fetch logs:', error)
        }
      }
      fetchLogs()
    }
  }, [selectedService])

  const handleStart = async (serviceName: string) => {
    setLoading(true)
    try {
      const response = await fetch(`${baseUrl}/${serviceName}/start`, { method: 'POST' })
      if (response.ok) {
        await fetchServices()
      }
    } finally {
      setLoading(false)
    }
  }

  const handleStop = async (serviceName: string) => {
    setLoading(true)
    try {
      const response = await fetch(`${baseUrl}/${serviceName}/stop`, { method: 'POST' })
      if (response.ok) {
        await fetchServices()
      }
    } finally {
      setLoading(false)
    }
  }

  const handleRestart = async (serviceName: string) => {
    setLoading(true)
    try {
      const response = await fetch(`${baseUrl}/${serviceName}/restart`, { method: 'POST' })
      if (response.ok) {
        await fetchServices()
      }
    } finally {
      setLoading(false)
    }
  }

  const handleEnable = async (serviceName: string) => {
    setLoading(true)
    try {
      const response = await fetch(`${baseUrl}/${serviceName}/enable`, { method: 'POST' })
      if (response.ok) {
        await fetchServices()
      }
    } finally {
      setLoading(false)
    }
  }

  const handleDisable = async (serviceName: string) => {
    setLoading(true)
    try {
      const response = await fetch(`${baseUrl}/${serviceName}/disable`, { method: 'POST' })
      if (response.ok) {
        await fetchServices()
      }
    } finally {
      setLoading(false)
    }
  }

  const StatusBadge = ({ status }: { status: string }) => {
    const colors = {
      active: 'bg-green-500/20 text-green-400',
      inactive: 'bg-gray-500/20 text-gray-400',
      failed: 'bg-red-500/20 text-red-400',
      unknown: 'bg-yellow-500/20 text-yellow-400',
    }
    return (
      <span className={`px-2 py-1 rounded text-xs font-semibold ${colors[status as keyof typeof colors]}`}>
        {status.toUpperCase()}
      </span>
    )
  }

  const filteredServices = services.filter((service) => {
    if (filter === 'all') return true
    return service.status === filter
  })

  const formatUptime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`
    return `${Math.floor(seconds / 86400)}d`
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold">Services</h1>
        <p className="text-muted-foreground">Manage system services and daemons</p>
      </div>

      {/* System status */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card">
          <p className="text-sm text-muted-foreground mb-2">Running Services</p>
          <p className="text-2xl font-bold text-green-400">{systemStatus.runningServices}</p>
        </div>
        <div className="card">
          <p className="text-sm text-muted-foreground mb-2">Failed Services</p>
          <p className="text-2xl font-bold text-red-400">{systemStatus.failedServices}</p>
        </div>
        <div className="card">
          <p className="text-sm text-muted-foreground mb-2">Total Services</p>
          <p className="text-2xl font-bold">{systemStatus.totalServices}</p>
        </div>
      </div>

      {/* Filter buttons */}
      <div className="flex gap-2">
        {(['all', 'active', 'failed', 'inactive'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`btn text-sm ${
              filter === f ? 'btn-primary' : 'btn-ghost'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Services list */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3 max-h-96 overflow-y-auto">
          {filteredServices.length === 0 ? (
            <div className="card text-center py-8">
              <p className="text-muted-foreground">No services found</p>
            </div>
          ) : (
            filteredServices.map((service) => (
              <div
                key={service.name}
                onClick={() => setSelectedService(service.name)}
                className={`card cursor-pointer transition-all ${
                  selectedService === service.name ? 'border-secondary' : 'border-border'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm">{service.name}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-1">{service.description}</p>
                  </div>
                  <StatusBadge status={service.status} />
                </div>

                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="text-xs text-muted-foreground flex gap-4">
                    <span>PID: {service.mainPid || '-'}</span>
                    <span>Uptime: {formatUptime(service.uptime)}</span>
                    <span>Restarts: {service.restarts}</span>
                  </div>
                </div>

                <div className="flex gap-1 flex-wrap">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleStart(service.name)
                    }}
                    disabled={service.status === 'active' || loading}
                    className="btn btn-ghost text-xs disabled:opacity-50"
                    title="Start"
                  >
                    <Play size={12} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleStop(service.name)
                    }}
                    disabled={service.status !== 'active' || loading}
                    className="btn btn-ghost text-xs disabled:opacity-50"
                    title="Stop"
                  >
                    <Square size={12} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleRestart(service.name)
                    }}
                    disabled={loading}
                    className="btn btn-ghost text-xs disabled:opacity-50"
                    title="Restart"
                  >
                    <RotateCcw size={12} />
                  </button>
                  {service.enabled ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDisable(service.name)
                      }}
                      disabled={loading}
                      className="btn btn-ghost text-yellow-400 text-xs"
                      title="Disable auto-start"
                    >
                      <PowerOff size={12} />
                    </button>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleEnable(service.name)
                      }}
                      disabled={loading}
                      className="btn btn-ghost text-green-400 text-xs"
                      title="Enable auto-start"
                    >
                      <Power size={12} />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Service logs */}
        {selectedService && (
          <div className="card flex flex-col">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <FileText size={16} />
              Logs - {selectedService}
            </h3>
            <div className="flex-1 bg-black/50 font-mono text-xs text-green-400 p-2 rounded overflow-y-auto max-h-80">
              {serviceLogs ? (
                serviceLogs.split('\n').map((line, i) => (
                  <div key={i} className="whitespace-pre-wrap break-words">
                    {line}
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground">Loading logs...</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
