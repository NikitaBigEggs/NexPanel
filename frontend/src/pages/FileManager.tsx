import { useEffect, useState } from 'react'
import { Plus, FolderPlus, Upload, Download, Trash2, Edit2, Copy, Move, Archive, Search, ChevronRight, File, Folder } from 'lucide-react'

interface FileInfo {
  name: string
  path: string
  isDirectory: boolean
  size: number
  modified: number
  permissions: string
  owner: string
  type: string
}

interface DirectoryListing {
  current: string
  parent: string | null
  files: FileInfo[]
}

export default function FileManager() {
  const [currentPath, setCurrentPath] = useState('/home')
  const [listing, setListing] = useState<DirectoryListing | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<string[]>([])
  const [editingFile, setEditingFile] = useState<string | null>(null)
  const [fileContent, setFileContent] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createType, setCreateType] = useState<'file' | 'folder'>('file')
  const [newName, setNewName] = useState('')

  const baseUrl = 'http://localhost:3000/api/v1/files'

  const fetchListing = async (path: string) => {
    setLoading(true)
    try {
      const response = await fetch(`${baseUrl}/list?path=${encodeURIComponent(path)}`)
      if (response.ok) {
        const data = await response.json()
        setListing(data)
        setCurrentPath(data.current)
        setSelectedFiles([])
      }
    } catch (error) {
      console.error('Failed to fetch listing:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchListing(currentPath)
  }, [])

  const handleNavigate = (path: string) => {
    fetchListing(path)
  }

  const handleSelectFile = (path: string, multiSelect: boolean = false) => {
    if (multiSelect) {
      setSelectedFiles((prev) =>
        prev.includes(path) ? prev.filter((p) => p !== path) : [...prev, path]
      )
    } else {
      setSelectedFiles([path])
    }
  }

  const handleEditFile = async (file: FileInfo) => {
    try {
      const response = await fetch(`${baseUrl}/read?path=${encodeURIComponent(file.path)}`)
      if (response.ok) {
        const data = await response.json()
        setFileContent(data.content)
        setEditingFile(file.path)
      }
    } catch (error) {
      console.error('Failed to read file:', error)
    }
  }

  const handleSaveFile = async () => {
    if (!editingFile) return
    try {
      const response = await fetch(`${baseUrl}/write`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: editingFile, content: fileContent }),
      })
      if (response.ok) {
        setEditingFile(null)
        setFileContent('')
      }
    } catch (error) {
      console.error('Failed to save file:', error)
    }
  }

  const handleDelete = async () => {
    if (selectedFiles.length === 0 || !window.confirm('Delete selected files?')) return
    try {
      for (const path of selectedFiles) {
        await fetch(`${baseUrl}/delete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path }),
        })
      }
      await fetchListing(currentPath)
    } catch (error) {
      console.error('Failed to delete:', error)
    }
  }

  const handleCreate = async () => {
    if (!newName) return
    try {
      if (createType === 'file') {
        await fetch(`${baseUrl}/create-file`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dir: currentPath, name: newName }),
        })
      } else {
        await fetch(`${baseUrl}/create-dir`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dir: currentPath, name: newName }),
        })
      }
      await fetchListing(currentPath)
      setShowCreateModal(false)
      setNewName('')
    } catch (error) {
      console.error('Failed to create:', error)
    }
  }

  const handleSearch = async () => {
    if (!searchQuery) return
    try {
      const response = await fetch(`${baseUrl}/search?dir=${encodeURIComponent(currentPath)}&q=${encodeURIComponent(searchQuery)}`)
      if (response.ok) {
        const data = await response.json()
        setListing({
          current: currentPath,
          parent: listing?.parent || null,
          files: data.results,
        })
      }
    } catch (error) {
      console.error('Failed to search:', error)
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleDateString() + ' ' + new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in flex flex-col h-[calc(100vh-120px)]">
      <div>
        <h1 className="text-3xl font-bold">File Manager</h1>
        <p className="text-muted-foreground">Browse and manage your files</p>
      </div>

      {/* Create modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="card w-96">
            <h2 className="text-xl font-bold mb-4">Create {createType === 'file' ? 'File' : 'Folder'}</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground">Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-muted/30 border border-border rounded px-3 py-2 mt-1"
                  placeholder={createType === 'file' ? 'filename.txt' : 'foldername'}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') handleCreate()
                  }}
                  autoFocus
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setShowCreateModal(false)} className="btn btn-ghost">
                  Cancel
                </button>
                <button onClick={handleCreate} className="btn btn-primary">
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* File editor modal */}
      {editingFile && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="card w-full max-w-4xl h-3/4 flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-xl font-bold">{editingFile.split('/').pop()}</h2>
              <button onClick={() => setEditingFile(null)} className="btn btn-ghost text-xs">
                Close
              </button>
            </div>
            <textarea
              value={fileContent}
              onChange={(e) => setFileContent(e.target.value)}
              className="flex-1 bg-black/50 p-4 font-mono text-sm border-0 outline-none text-green-400"
            />
            <div className="flex gap-2 justify-end p-4 border-t border-border">
              <button onClick={() => setEditingFile(null)} className="btn btn-ghost text-sm">
                Cancel
              </button>
              <button onClick={handleSaveFile} className="btn btn-primary text-sm">
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navigation bar */}
      <div className="space-y-3">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1 text-sm text-muted-foreground overflow-x-auto pb-2">
          <button
            onClick={() => handleNavigate('/home')}
            className="hover:text-foreground transition-colors whitespace-nowrap"
          >
            /home
          </button>
          {currentPath.split('/').slice(2).map((part, i, arr) => {
            const pathTo = '/home/' + arr.slice(0, i + 1).join('/')
            return (
              <div key={i} className="flex items-center gap-1">
                <ChevronRight size={14} />
                <button
                  onClick={() => handleNavigate(pathTo)}
                  className="hover:text-foreground transition-colors whitespace-nowrap"
                >
                  {part}
                </button>
              </div>
            )
          })}
        </div>

        {/* Search and controls */}
        <div className="flex gap-2 flex-wrap">
          <div className="flex-1 flex gap-2 min-w-64">
            <input
              type="text"
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') handleSearch()
              }}
              className="flex-1 bg-muted/30 border border-border rounded px-3 py-2 text-sm"
            />
            <button onClick={handleSearch} className="btn btn-ghost text-sm">
              <Search size={16} />
            </button>
          </div>

          <button
            onClick={() => {
              setCreateType('file')
              setShowCreateModal(true)
            }}
            className="btn btn-primary text-sm flex items-center gap-1"
          >
            <Plus size={14} />
            File
          </button>
          <button
            onClick={() => {
              setCreateType('folder')
              setShowCreateModal(true)
            }}
            className="btn btn-primary text-sm flex items-center gap-1"
          >
            <FolderPlus size={14} />
            Folder
          </button>
          <button
            onClick={handleDelete}
            disabled={selectedFiles.length === 0}
            className="btn btn-ghost text-red-400 text-sm disabled:opacity-50 flex items-center gap-1"
          >
            <Trash2 size={14} />
            Delete
          </button>
        </div>
      </div>

      {/* File listing */}
      <div className="flex-1 card overflow-y-auto">
        {loading ? (
          <p className="text-muted-foreground text-center py-8">Loading...</p>
        ) : listing?.files.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No files in this directory</p>
        ) : (
          <div className="space-y-1">
            {listing?.files.map((file) => (
              <div
                key={file.path}
                onClick={() => (file.isDirectory ? handleNavigate(file.path) : handleSelectFile(file.path))}
                className={`flex items-center gap-3 p-3 rounded cursor-pointer transition-all ${
                  selectedFiles.includes(file.path)
                    ? 'bg-secondary text-secondary-foreground'
                    : 'hover:bg-muted/50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedFiles.includes(file.path)}
                  onChange={(e) => {
                    e.stopPropagation()
                    handleSelectFile(file.path, false)
                  }}
                  className="w-4 h-4 cursor-pointer"
                />
                {file.isDirectory ? <Folder size={18} className="text-blue-400" /> : <File size={18} />}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate text-sm">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(file.modified)} • {formatFileSize(file.size)} • {file.permissions}
                  </p>
                </div>
                {!file.isDirectory && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleEditFile(file)
                    }}
                    className="btn btn-ghost text-xs hover:bg-muted"
                  >
                    <Edit2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
