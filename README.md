# NexPanel - Modern ARM Server Dashboard

A modern, open-source server management dashboard based on Cockpit, designed for ARM systems and Linux servers. Built with React, TypeScript, Node.js, and Express.

## Features

- **Dashboard**: Real-time system metrics (CPU, RAM, Disk, Temperature, Network)
- **BeamMP Server**: Complete game server management
- **Websites**: Manage websites and web applications (Node.js, PHP, Python, Static)
- **Bots**: Bot and automation script management
- **File Manager**: Complete file operations with drag-and-drop
- **Terminal**: Integrated PTY terminal with multiple tabs
- **Monitoring**: Advanced system monitoring with historical data
- **Logs**: Real-time log viewing and management
- **Services**: systemd and custom service management
- **Docker**: Container and image management
- **Users**: System user management
- **Settings**: Configuration and preferences

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, TailwindCSS, Recharts
- **Backend**: Node.js, Express, Socket.IO, SQLite
- **Architecture**: Modular plugin system
- **UI Design**: Glassmorphism, Dark Mode, Modern animations

## Installation

### Prerequisites
- Node.js 18+
- npm or yarn
- Linux OS (Ubuntu 22.04, Debian, etc.)

### Setup

```bash
# Clone repository
git clone https://github.com/yourusername/nexpanel.git
cd nexpanel

# Install dependencies
npm run install-all

# Start development servers
npm run dev

# Build for production
npm run build
```

## Development

```bash
# Backend only
cd backend && npm run dev

# Frontend only
cd frontend && npm run dev

# Run both with concurrently
npm run dev
```

## Project Structure

```
nexpanel/
├── backend/
│   ├── src/
│   │   ├── api/          # API route handlers
│   │   ├── services/     # Business logic
│   │   ├── utils/        # Utilities
│   │   ├── config/       # Configuration
│   │   └── index.ts      # Main server entry
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── pages/        # Page components
│   │   ├── services/     # API services
│   │   ├── hooks/        # Custom hooks
│   │   ├── types/        # TypeScript types
│   │   ├── styles/       # Global styles
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
└── docs/                 # Documentation
```

## API Documentation

All API endpoints follow REST conventions at `/api/v1/`.

### System
- `GET /api/v1/system/stats` - Get all system statistics
- `GET /api/v1/system/cpu` - CPU usage
- `GET /api/v1/system/ram` - RAM usage
- `GET /api/v1/system/disk` - Disk usage
- `GET /api/v1/system/temperature` - System temperature

### Websites
- `GET /api/v1/websites/list` - List websites
- `POST /api/v1/websites/create` - Create website
- `POST /api/v1/websites/:id/start` - Start website
- `POST /api/v1/websites/:id/stop` - Stop website

### BeamMP
- `GET /api/v1/beammp/list` - List servers
- `POST /api/v1/beammp/create` - Create server
- `GET /api/v1/beammp/:id/players` - Get player list
- `GET /api/v1/beammp/:id/stats` - Get server stats

*See documentation for complete API reference.*

## Design

- **Color Scheme**: Dark mode with #d60000 accent
- **Border Radius**: 16px (1rem)
- **Effects**: Glassmorphism with backdrop blur
- **Icons**: Lucide React
- **Animations**: Smooth transitions and fade-in effects

## License

LGPL-2.1-or-later (compatible with Cockpit)

## Contributing

Contributions are welcome! Please read our contributing guidelines and submit pull requests to our repository.

## Support

For issues, questions, or feature requests, please open an issue on GitHub.
