import { useEffect, useState } from 'react'
import { RefreshCw, Download, Trash2, Search, Filter } from 'lucide-react'

interface LogFile {
  name: string
  path: string
  size: number
  modified: number
  type: 'system' | 'application' | 'security'
}

interface LogStats {
  size: number
  lines: number
  lastModified: number
  errors: number
  warnings: number
}

export default function Logs() {
  const [logFiles, setLogFiles] = useState<LogFile[]>([])
  const [selectedLog, setSelectedLog] = useState<string | null>(null)
  const [logContent, setLogContent] = useState<string>('')
  const [logStats, setLogStats] = useState<LogStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterLevel, setFilterLevel] = useState<'ERROR' | 'WARNING' | 'INFO' | 'all'>('all')
  const [lines, setLines] = useState(100)
  const [autoRefresh, setAutoRefresh] = useState(true)

  const baseUrl = 'http://localhost:3000/api/v1/logs'

  const fetchLogFiles = async () => {
    try {
      const response = await fetch(`${baseUrl}/list`)
      if (response.ok) {
        const data = await response.json()
        setLogFiles(data.files)
        if (!selectedLog && data.files.length > 0) {
          setSelectedLog(data.files[0].name)
        }
      }
    } catch (error) {
      console.error('Failed to fetch log files:', error)
    }
  }

  const fetchLogContent = async (logName: string) => {
    if (!logName) return
    setLoading(true)
    try {
      let url = `${baseUrl}/${logName}?lines=${lines}`

      if (searchQuery) {
        url = `${baseUrl}/${logName}/search?q=${encodeURIComponent(searchQuery)}&lines=${lines}`
      } else if (filterLevel !== 'all') {
        url = `${baseUrl}/${logName}/filter?level=${filterLevel}&lines=${lines}`
      }

      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setLogContent(data.content)
      }
    } catch (error) {
      console.error('Failed to fetch log content:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchLogStats = async (logName: string) => {
    if (!logName) return
    try {
      const response = await fetch(`${baseUrl}/${logName}/stats`)
      if (response.ok) {
        const data = await response.json()
        setLogStats(data)
      }
    } catch (error) {
      console.error('Failed to fetch log stats:', error)
    }
  }

  useEffect(() => {
    fetchLogFiles()
  }, [])

  useEffect(() => {
    if (selectedLog) {
      fetchLogContent(selectedLog)
      fetchLogStats(selectedLog)
    }
  }, [selectedLog, searchQuery, filterLevel, lines])

  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      if (selectedLog) {
        fetchLogContent(selectedLog)
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [autoRefresh, selectedLog, searchQuery, filterLevel, lines])

  const handleClearLog = async () => {
    if (!selectedLog) return
    if (!window.confirm('Are you sure you want to clear this log?')) return

    try {
      const response = await fetch(`${baseUrl}/${selectedLog}/clear`, {
        method: 'POST',
        headers: { 'x-confirm': 'true' },
      })
      if (response.ok) {
        setLogContent('')
        await fetchLogStats(selectedLog)
      }
    } catch (error) {
      console.error('Failed to clear log:', error)
    }
  }

  const handleDownload = async () => {
    if (!selectedLog) return
    const format = 'txt'
    const url = `${baseUrl}/${selectedLog}/export?format=${format}`
    const a = document.createElement('a')
    a.href = url
    a.download = `${selectedLog}.${format}`
    a.click()
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString()
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in flex flex-col h-[calc(100vh-120px)]">
      <div>
        <h1 className="text-3xl font-bold">Logs</h1>
        <p className="text-muted-foreground">View and analyze system logs</p>
      </div>

      {/* Log files list and viewer */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4 overflow-hidden">
        {/* Sidebar with log files */}
        <div className="lg:col-span-1 flex flex-col border border-border rounded">
          <div className="p-3 border-b border-border bg-muted/20">
            <h3 className="font-semibold text-sm">Log Files</h3>
          </div>
          <div className="flex-1 overflow-y-auto space-y-1 p-2">
            {logFiles.map((file) => (
              <button
                key={file.name}
                onClick={() => setSelectedLog(file.name)}
                className={`w-full text-left px-3 py-2 rounded text-sm transition-all ${
                  selectedLog === file.name
                    ? 'bg-secondary text-secondary-foreground'
                    : 'hover:bg-muted/50 text-foreground/70'
                }`}
              >
                <p className="font-medium truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Main content */}
        <div className="lg:col-span-3 flex flex-col space-y-4 overflow-hidden">
          {selectedLog && logStats && (
            <div className="grid grid-cols-5 gap-2">
              <div className="card">
                <p className="text-xs text-muted-foreground">Size</p>
                <p className="text-sm font-semibold">{formatFileSize(logStats.size)}</p>
              </div>
              <div className="card">
                <p className="text-xs text-muted-foreground">Lines</p>
                <p className="text-sm font-semibold">{logStats.lines}</p>
              </div>
              <div className="card">
                <p className="text-xs text-muted-foreground">Errors</p>
                <p className="text-sm font-semibold text-red-400">{logStats.errors}</p>
              </div>
              <div className="card">
                <p className="text-xs text-muted-foreground">Warnings</p>
                <p className="text-sm font-semibold text-yellow-400">{logStats.warnings}</p>
              </div>
              <div className="card">
                <p className="text-xs text-muted-foreground">Modified</p>
                <p className="text-xs font-semibold">{new Date(logStats.lastModified).toLocaleTimeString()}</p>
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="space-y-3">
            <div className="flex gap-2 flex-wrap">
              <div className="flex-1 flex gap-2">
                <input
                  type="text"
                  placeholder="Search logs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-muted/30 border border-border rounded px-3 py-2 text-sm"
                />
                <select
                  value={filterLevel}
                  onChange={(e) => setFilterLevel(e.target.value as any)}
                  className="bg-muted/30 border border-border rounded px-3 py-2 text-sm"
                >
                  <option value="all">All Levels</option>
                  <option value="ERROR">Errors</option>
                  <option value="WARNING">Warnings</option>
                  <option value="INFO">Info</option>
                </select>
              </div>

              <select
                value={lines}
                onChange={(e) => setLines(parseInt(e.target.value))}
                className="bg-muted/30 border border-border rounded px-3 py-2 text-sm"
              >
                <option value={50}>50 lines</option>
                <option value={100}>100 lines</option>
                <option value={500}>500 lines</option>
                <option value={1000}>1000 lines</option>
              </select>

              <label className="flex items-center gap-2 px-3 py-2 bg-muted/30 border border-border rounded text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="w-4 h-4"
                />
                Auto-refresh
              </label>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => fetchLogContent(selectedLog!)}
                className="btn btn-ghost flex items-center gap-2 text-sm"
              >
                <RefreshCw size={14} />
                Refresh
              </button>
              <button
                onClick={handleDownload}
                className="btn btn-ghost flex items-center gap-2 text-sm"
              >
                <Download size={14} />
                Export
              </button>
              <button
                onClick={handleClearLog}
                className="btn btn-ghost text-red-400 flex items-center gap-2 text-sm"
              >
                <Trash2 size={14} />
                Clear
              </button>
            </div>
          </div>

          {/* Log content */}
          <div className="flex-1 bg-black/50 border border-border rounded overflow-hidden flex flex-col">
            <div className="flex-1 overflow-y-auto p-4 font-mono text-xs text-green-400 space-y-1">
              {logContent ? (
                logContent.split('\n').map((line, i) => (
                  <div
                    key={i}
                    className={`whitespace-pre-wrap break-words ${
                      line.includes('ERROR') || line.includes('error')
                        ? 'text-red-400'
                        : line.includes('WARN') || line.includes('warn')
                          ? 'text-yellow-400'
                          : 'text-green-400'
                    }`}
                  >
                    {line}
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground">{loading ? 'Loading...' : 'No logs to display'}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
