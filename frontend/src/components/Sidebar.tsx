import { useLocation, Link } from 'react-router-dom'
import {
  LayoutDashboard,
  Gamepad2,
  Globe,
  Code2,
  Files,
  Terminal as TerminalIcon,
  Activity,
  FileText,
  Settings as SettingsIcon,
  Users,
  Container,
  Wrench,
} from 'lucide-react'
import clsx from 'clsx'

const menuItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/beammp', label: 'BeamMP Server', icon: Gamepad2 },
  { path: '/websites', label: 'Websites', icon: Globe },
  { path: '/bots', label: 'Bots', icon: Code2 },
  { path: '/files', label: 'File Manager', icon: Files },
  { path: '/terminal', label: 'Terminal', icon: TerminalIcon },
  { path: '/monitoring', label: 'Monitoring', icon: Activity },
  { path: '/logs', label: 'Logs', icon: FileText },
  { path: '/services', label: 'Services', icon: Wrench },
  { path: '/docker', label: 'Container', icon: Container },
  { path: '/users', label: 'Users', icon: Users },
  { path: '/settings', label: 'Settings', icon: SettingsIcon },
]

export default function Sidebar() {
  const location = useLocation()

  return (
    <aside className="w-64 border-r border-border bg-muted/20 backdrop-blur-md p-4 flex flex-col">
      <div className="mb-8">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-secondary to-secondary/60 bg-clip-text text-transparent">
          NexPanel
        </h1>
        <p className="text-xs text-muted-foreground mt-1">ARM Server Dashboard</p>
      </div>

      <nav className="flex-1 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.path
          return (
            <Link
              key={item.path}
              to={item.path}
              className={clsx(
                'flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200',
                isActive
                  ? 'bg-secondary text-secondary-foreground'
                  : 'text-foreground/70 hover:bg-muted/50'
              )}
            >
              <Icon size={18} />
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-border pt-4">
        <div className="text-xs text-muted-foreground text-center">
          <p>v0.1.0</p>
          <p>Running on localhost</p>
        </div>
      </div>
    </aside>
  )
}
