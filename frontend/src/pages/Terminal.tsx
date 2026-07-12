import { useEffect, useRef, useState } from 'react'
import { Plus, X, Copy, Settings } from 'lucide-react'
import { io, Socket } from 'socket.io-client'

interface TerminalSession {
  id: string
  pid: number
  createdAt: number
  lastActivity: number
  cols: number
  rows: number
  shell: string
}

export default function Terminal() {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [sessions, setSessions] = useState<TerminalSession[]>([])
  const [activeSessions, setActiveSessions] = useState<Map<string, string>>(new Map()) // sessionId -> output
  const [selectedSession, setSelectedSession] = useState<string | null>(null)
  const outputRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [commandHistory, setCommandHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)

  useEffect(() => {
    const newSocket = io('http://localhost:3000', {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    })

    newSocket.on('connect', () => {
      console.log('Connected to terminal WebSocket')
      setSocket(newSocket)
    })

    newSocket.on('disconnect', () => {
      console.log('Disconnected from terminal')
    })

    return () => {
      if (newSocket.connected) {
        newSocket.disconnect()
      }
    }
  }, [])

  const createSession = async () => {
    if (!socket) return

    socket.emit('terminal:create', { cols: 120, rows: 40 }, (response: any) => {
      if (response.success) {
        const session = response.session
        setSessions([...sessions, session])
        setSelectedSession(session.id)
        setActiveSessions(new Map(activeSessions).set(session.id, ''))
      }
    })
  }

  const closeSession = (sessionId: string) => {
    if (!socket) return

    socket.emit('terminal:close', { sessionId }, () => {
      setSessions(sessions.filter((s) => s.id !== sessionId))
      setActiveSessions(new Map(activeSessions.set(sessionId, '')))
      if (selectedSession === sessionId) {
        setSelectedSession(sessions.length > 1 ? sessions[0].id : null)
      }
    })
  }

  const executeCommand = (command: string) => {
    if (!socket || !selectedSession) return

    const text = command + '\n'
    socket.emit('terminal:write', { sessionId: selectedSession, text })

    // Add to output
    const output = activeSessions.get(selectedSession) || ''
    setActiveSessions(new Map(activeSessions).set(selectedSession, output + `$ ${command}\n`))

    // Add to history
    if (command.trim()) {
      setCommandHistory([...commandHistory, command])
      setHistoryIndex(-1)
    }

    // Clear input
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const command = inputRef.current?.value || ''
      executeCommand(command)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      const newIndex = historyIndex + 1
      if (newIndex < commandHistory.length) {
        setHistoryIndex(newIndex)
        if (inputRef.current) {
          inputRef.current.value = commandHistory[commandHistory.length - newIndex - 1]
        }
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1
        setHistoryIndex(newIndex)
        if (inputRef.current) {
          inputRef.current.value = commandHistory[commandHistory.length - newIndex - 1]
        }
      } else if (historyIndex === 0) {
        setHistoryIndex(-1)
        if (inputRef.current) {
          inputRef.current.value = ''
        }
      }
    }
  }

  const scrollToBottom = () => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [activeSessions, selectedSession])

  const currentOutput = selectedSession ? activeSessions.get(selectedSession) || '' : ''

  return (
    <div className="p-6 space-y-6 animate-fade-in flex flex-col h-[calc(100vh-120px)]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Terminal</h1>
          <p className="text-muted-foreground">Interactive shell access</p>
        </div>
        <button onClick={createSession} className="btn btn-primary flex items-center gap-2">
          <Plus size={16} />
          New Tab
        </button>
      </div>

      {/* Session tabs */}
      {sessions.length > 0 && (
        <div className="flex gap-1 border-b border-border overflow-x-auto pb-2">
          {sessions.map((session) => (
            <button
              key={session.id}
              onClick={() => setSelectedSession(session.id)}
              className={`px-3 py-1 rounded text-sm whitespace-nowrap flex items-center gap-2 transition-all ${
                selectedSession === session.id
                  ? 'bg-secondary text-secondary-foreground'
                  : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'
              }`}
            >
              <span>bash</span>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  closeSession(session.id)
                }}
                className="hover:bg-white/20 p-0.5 rounded"
              >
                <X size={14} />
              </button>
            </button>
          ))}
        </div>
      )}

      {/* Terminal output */}
      {selectedSession ? (
        <div className="flex-1 flex flex-col bg-black/50 rounded border border-border overflow-hidden">
          {/* Output area */}
          <div
            ref={outputRef}
            className="flex-1 overflow-y-auto p-4 font-mono text-sm text-green-400 space-y-1"
            style={{ backgroundColor: '#0a0e27' }}
          >
            {currentOutput ? (
              currentOutput.split('\n').map((line, i) => (
                <div key={i} className="whitespace-pre-wrap break-words">
                  {line}
                </div>
              ))
            ) : (
              <p className="text-muted-foreground">Ready for input...</p>
            )}
          </div>

          {/* Input area */}
          <div className="border-t border-border bg-black/50 p-3 space-y-2">
            <div className="flex items-center gap-2 font-mono text-sm text-green-400">
              <span>$</span>
              <input
                ref={inputRef}
                type="text"
                onKeyDown={handleInputKeyDown}
                className="flex-1 bg-transparent outline-none text-green-400"
                placeholder="Enter command..."
                spellCheck="false"
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-center">
          <div>
            <p className="text-muted-foreground mb-4">No terminal session active</p>
            <button onClick={createSession} className="btn btn-primary">
              Create Session
            </button>
          </div>
        </div>
      )}

      {/* Quick commands */}
      {selectedSession && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Quick commands:</p>
          <div className="flex flex-wrap gap-2">
            {['ls -la', 'pwd', 'whoami', 'df -h', 'free -h', 'top -b -n 1 | head -20'].map((cmd) => (
              <button
                key={cmd}
                onClick={() => executeCommand(cmd)}
                className="btn btn-ghost text-xs"
              >
                {cmd}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
