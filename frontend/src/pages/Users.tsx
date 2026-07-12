import { useEffect, useState } from 'react'
import { Plus, Trash2, Lock, Edit2 } from 'lucide-react'

interface User {
  username: string
  uid: string
  gid?: string
  name: string
  home?: string
  shell?: string
}

export default function Users() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [newUser, setNewUser] = useState({
    username: '',
    shell: '/bin/bash',
  })

  const baseUrl = 'http://localhost:3000/api/v1/users'

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${baseUrl}/list`)
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users)
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleCreate = async () => {
    if (!newUser.username) return
    setLoading(true)
    try {
      const response = await fetch(`${baseUrl}/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      })
      if (response.ok) {
        await fetchUsers()
        setShowCreate(false)
        setNewUser({ username: '', shell: '/bin/bash' })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (username: string) => {
    if (!confirm(`Delete user ${username}?`)) return
    setLoading(true)
    try {
      const response = await fetch(`${baseUrl}/${username}/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ removeHome: true }),
      })
      if (response.ok) {
        await fetchUsers()
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Users</h1>
          <p className="text-muted-foreground">Manage system users and permissions</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn btn-primary flex items-center gap-2">
          <Plus size={16} />
          New User
        </button>
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="card w-96">
            <h2 className="text-xl font-bold mb-4">Create New User</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground">Username</label>
                <input
                  type="text"
                  value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                  className="w-full bg-muted/30 border border-border rounded px-3 py-2 mt-1"
                  placeholder="newuser"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Shell</label>
                <select
                  value={newUser.shell}
                  onChange={(e) => setNewUser({ ...newUser, shell: e.target.value })}
                  className="w-full bg-muted/30 border border-border rounded px-3 py-2 mt-1"
                >
                  <option value="/bin/bash">Bash</option>
                  <option value="/bin/sh">Sh</option>
                  <option value="/usr/bin/zsh">Zsh</option>
                  <option value="/usr/bin/fish">Fish</option>
                  <option value="/usr/sbin/nologin">No Login</option>
                </select>
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

      <div className="grid gap-3">
        {users.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-muted-foreground">No users found</p>
          </div>
        ) : (
          users.map((user) => (
            <div key={user.username} className="card flex items-center justify-between">
              <div className="flex-1">
                <h3 className="font-semibold">{user.username}</h3>
                <p className="text-sm text-muted-foreground">
                  {user.name} • UID: {user.uid} • {user.shell || '/bin/nologin'}
                </p>
              </div>
              <div className="flex gap-2">
                <button className="btn btn-ghost text-yellow-400 text-xs">
                  <Lock size={14} />
                </button>
                <button
                  onClick={() => handleDelete(user.username)}
                  disabled={loading}
                  className="btn btn-ghost text-red-400 text-xs"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
