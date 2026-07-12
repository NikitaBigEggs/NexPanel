import { useEffect, useState } from 'react'
import { Play, Square, RotateCcw, Trash2, Download, Upload, Activity } from 'lucide-react'

interface Container {
  id: string
  name: string
  image: string
  status: string
  state: 'running' | 'exited' | 'paused'
  ports: string[]
  created: number
  uptime: number
  cpu?: number
  memory?: number
}

interface DockerImage {
  id: string
  repository: string
  tag: string
  size: number
  created: number
}

export default function Docker() {
  const [available, setAvailable] = useState(false)
  const [containers, setContainers] = useState<Container[]>([])
  const [images, setImages] = useState<DockerImage[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'containers' | 'images'>('containers')
  const [selectedContainer, setSelectedContainer] = useState<string | null>(null)
  const [containerLogs, setContainerLogs] = useState<string>('')
  const [newImageName, setNewImageName] = useState('')

  const baseUrl = 'http://localhost:3000/api/v1/docker'

  const checkDockerAvailable = async () => {
    try {
      const response = await fetch(`${baseUrl}/available`)
      if (response.ok) {
        const data = await response.json()
        setAvailable(data.available)
      }
    } catch (error) {
      setAvailable(false)
    }
  }

  const fetchContainers = async () => {
    try {
      const response = await fetch(`${baseUrl}/containers?all=true`)
      if (response.ok) {
        const data = await response.json()
        setContainers(data.containers)
      }
    } catch (error) {
      console.error('Failed to fetch containers:', error)
    }
  }

  const fetchImages = async () => {
    try {
      const response = await fetch(`${baseUrl}/images`)
      if (response.ok) {
        const data = await response.json()
        setImages(data.images)
      }
    } catch (error) {
      console.error('Failed to fetch images:', error)
    }
  }

  useEffect(() => {
    checkDockerAvailable()
  }, [])

  useEffect(() => {
    if (!available) return

    if (activeTab === 'containers') {
      fetchContainers()
      const interval = setInterval(fetchContainers, 3000)
      return () => clearInterval(interval)
    } else {
      fetchImages()
    }
  }, [activeTab, available])

  useEffect(() => {
    if (selectedContainer && activeTab === 'containers') {
      const fetchLogs = async () => {
        try {
          const response = await fetch(`${baseUrl}/containers/${selectedContainer}/logs?lines=50`)
          if (response.ok) {
            const data = await response.json()
            setContainerLogs(data.logs)
          }
        } catch (error) {
          console.error('Failed to fetch logs:', error)
        }
      }
      fetchLogs()
      const interval = setInterval(fetchLogs, 2000)
      return () => clearInterval(interval)
    }
  }, [selectedContainer, activeTab])

  const handleStart = async (containerId: string) => {
    setLoading(true)
    try {
      const response = await fetch(`${baseUrl}/containers/${containerId}/start`, { method: 'POST' })
      if (response.ok) {
        await fetchContainers()
      }
    } finally {
      setLoading(false)
    }
  }

  const handleStop = async (containerId: string) => {
    setLoading(true)
    try {
      const response = await fetch(`${baseUrl}/containers/${containerId}/stop`, { method: 'POST' })
      if (response.ok) {
        await fetchContainers()
      }
    } finally {
      setLoading(false)
    }
  }

  const handleRemove = async (containerId: string) => {
    if (!confirm('Remove this container?')) return
    setLoading(true)
    try {
      const response = await fetch(`${baseUrl}/containers/${containerId}/remove`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force: true }),
      })
      if (response.ok) {
        await fetchContainers()
        if (selectedContainer === containerId) {
          setSelectedContainer(null)
        }
      }
    } finally {
      setLoading(false)
    }
  }

  const handlePullImage = async () => {
    if (!newImageName) return
    setLoading(true)
    try {
      const response = await fetch(`${baseUrl}/images/pull`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: newImageName }),
      })
      if (response.ok) {
        await fetchImages()
        setNewImageName('')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveImage = async (imageId: string) => {
    if (!confirm('Remove this image?')) return
    setLoading(true)
    try {
      const response = await fetch(`${baseUrl}/images/${imageId}/remove`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force: true }),
      })
      if (response.ok) {
        await fetchImages()
      }
    } finally {
      setLoading(false)
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  const StateColor = ({ state }: { state: string }) => {
    const colors = {
      running: 'text-green-400',
      exited: 'text-gray-400',
      paused: 'text-yellow-400',
    }
    return <span className={colors[state as keyof typeof colors] || 'text-gray-400'}>{state}</span>
  }

  if (!available) {
    return (
      <div className="p-6 space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold">Docker</h1>
          <p className="text-muted-foreground">Docker container and image management</p>
        </div>
        <div className="card text-center py-12">
          <p className="text-muted-foreground mb-4">Docker is not installed or not available</p>
          <p className="text-sm text-muted-foreground">Install Docker to use this feature</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold">Docker</h1>
        <p className="text-muted-foreground">Manage containers and images</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-border flex gap-2">
        <button
          onClick={() => setActiveTab('containers')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-all ${
            activeTab === 'containers'
              ? 'border-secondary text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Containers ({containers.length})
        </button>
        <button
          onClick={() => setActiveTab('images')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-all ${
            activeTab === 'images'
              ? 'border-secondary text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Images ({images.length})
        </button>
      </div>

      {/* Containers tab */}
      {activeTab === 'containers' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-3">
            {containers.length === 0 ? (
              <div className="card text-center py-8">
                <p className="text-muted-foreground">No containers</p>
              </div>
            ) : (
              containers.map((container) => (
                <div
                  key={container.id}
                  onClick={() => setSelectedContainer(container.id)}
                  className={`card cursor-pointer transition-all ${
                    selectedContainer === container.id ? 'border-secondary' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold">{container.name}</h3>
                      <p className="text-sm text-muted-foreground">{container.image}</p>
                    </div>
                    <StateColor state={container.state} />
                  </div>
                  <div className="flex gap-2 mb-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleStart(container.id)
                      }}
                      disabled={container.state === 'running' || loading}
                      className="btn btn-ghost text-xs disabled:opacity-50"
                    >
                      <Play size={14} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleStop(container.id)
                      }}
                      disabled={container.state !== 'running' || loading}
                      className="btn btn-ghost text-xs disabled:opacity-50"
                    >
                      <Square size={14} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRemove(container.id)
                      }}
                      disabled={loading}
                      className="btn btn-ghost text-red-400 text-xs"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">{container.status}</p>
                </div>
              ))
            )}
          </div>

          {selectedContainer && (
            <div className="card flex flex-col">
              <h3 className="font-semibold mb-2">Logs</h3>
              <div className="flex-1 bg-black/50 font-mono text-xs text-green-400 p-2 rounded overflow-y-auto max-h-96">
                {containerLogs ? (
                  containerLogs.split('\n').map((line, i) => (
                    <div key={i} className="whitespace-pre-wrap break-words">
                      {line}
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground">No logs...</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Images tab */}
      {activeTab === 'images' && (
        <div className="space-y-4">
          <div className="card">
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                placeholder="ubuntu:22.04"
                value={newImageName}
                onChange={(e) => setNewImageName(e.target.value)}
                className="flex-1 bg-muted/30 border border-border rounded px-3 py-2 text-sm"
              />
              <button onClick={handlePullImage} disabled={!newImageName || loading} className="btn btn-primary text-sm">
                <Download size={14} />
                Pull
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {images.length === 0 ? (
              <div className="card text-center py-8">
                <p className="text-muted-foreground">No images</p>
              </div>
            ) : (
              images.map((image) => (
                <div key={image.id} className="card flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm">
                      {image.repository}:{image.tag}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {image.id} • {formatFileSize(image.size)} • {new Date(image.created).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemoveImage(image.id)}
                    disabled={loading}
                    className="btn btn-ghost text-red-400 text-xs"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
