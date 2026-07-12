import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import BeamMP from './pages/BeamMP'
import Websites from './pages/Websites'
import Bots from './pages/Bots'
import FileManager from './pages/FileManager'
import Terminal from './pages/Terminal'
import Monitoring from './pages/Monitoring'
import Logs from './pages/Logs'
import Services from './pages/Services'
import Docker from './pages/Docker'
import Users from './pages/Users'
import Settings from './pages/Settings'

export default function App() {
  return (
    <Router>
      <div className="flex h-screen bg-background">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/beammp" element={<BeamMP />} />
            <Route path="/websites" element={<Websites />} />
            <Route path="/bots" element={<Bots />} />
            <Route path="/files" element={<FileManager />} />
            <Route path="/terminal" element={<Terminal />} />
            <Route path="/monitoring" element={<Monitoring />} />
            <Route path="/logs" element={<Logs />} />
            <Route path="/services" element={<Services />} />
            <Route path="/docker" element={<Docker />} />
            <Route path="/users" element={<Users />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}
