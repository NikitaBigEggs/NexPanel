# NexPanel - Modern ARM Server Dashboard

> A production-ready web dashboard for managing ARM and Linux servers, built as a modern replacement for Cockpit

[![License](https://img.shields.io/badge/license-LGPL--2.1--or--later-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node.js-18%2B-green.svg)](https://nodejs.org)
[![React](https://img.shields.io/badge/react-18-blue.svg)](https://react.dev)

## 🎯 Features

NexPanel provides a beautiful, modern interface for complete server management:

### Core Modules

- **Dashboard** - Real-time system metrics with live charts
- **BeamMP Server** - Complete game server management
- **Websites** - Host multiple web apps (Node.js, PHP, Python, Static HTML)
- **Terminal** - Interactive shell with multiple tabs
- **Services** - systemd service management
- **Monitoring** - Advanced metrics tracking with history
- **Logs** - System log viewing and filtering
- **File Manager** - Complete file operations with editor
- **Bots** - Multi-language bot management (Node.js, Python, Java, Go, Rust)
- **Docker** - Container and image management
- **Users** - Linux user and permission management
- **Settings** - Preferences and system configuration

### Design

- 🌙 Dark mode by default with glassmorphism
- ⚡ Real-time updates via WebSocket
- 📊 Beautiful data visualizations
- 📱 Responsive design (desktop/tablet/mobile)
- ⌨️ Keyboard shortcuts and quick commands
- 🎨 Modern UI matching industry standards

## 🚀 Quick Start

### Prerequisites

- Linux OS (Ubuntu 22.04+, Debian 11+, CentOS 8+)
- Node.js 18+ and npm 9+
- 512MB RAM minimum (1GB recommended)

### Installation

```bash
# Clone or download NexPanel
git clone https://github.com/yourusername/nexpanel.git
cd nexpanel

# Run installation script
chmod +x install.sh
./install.sh

# Start development server
npm run dev
```

### Access

- Development: http://localhost:5173
- Production: http://localhost:3000

See [INSTALLATION.md](INSTALLATION.md) for detailed setup instructions.

## 📋 Architecture

### Technology Stack

**Frontend:**
- React 18 + TypeScript
- Vite for fast development
- TailwindCSS for styling
- Socket.IO for real-time updates
- Recharts for data visualization

**Backend:**
- Node.js + Express
- WebSocket via Socket.IO
- node-pty for terminal emulation
- Linux command integration

### Project Structure

```
nexpanel/
├── backend/          # Express server + services
├── frontend/         # React dashboard
├── docs/            # Documentation
└── package.json     # Root configuration
```

For detailed architecture, see [ARCHITECTURE.md](ARCHITECTURE.md).

## 🛠️ Development

### Commands

```bash
# Install dependencies
npm run install-all

# Start development (both frontend + backend)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Type checking
npm run type-check

# Linting
npm run lint
```

### Adding New Modules

See [ARCHITECTURE.md](ARCHITECTURE.md) for step-by-step guide to create new management modules.

## 📊 Module Status

| Module | Status | Features |
|--------|--------|----------|
| Dashboard | ✅ Complete | Live metrics, charts, uptime |
| BeamMP | ✅ Complete | Server control, player management |
| Websites | ✅ Complete | Multi-runtime hosting |
| Terminal | ✅ Complete | PTY shell, multiple tabs |
| Services | ✅ Complete | systemd management |
| Monitoring | ✅ Complete | Advanced metrics, history |
| Logs | ✅ Complete | Search, filter, export |
| File Manager | ✅ Complete | Full file operations |
| Bots | ✅ Complete | Multi-language support |
| Docker | ✅ Complete | Container management |
| Users | ✅ Complete | User management |
| Settings | ✅ Complete | Preferences & config |

## 🔒 Security

- Path sanitization prevents directory traversal
- Command injection prevention
- Proper error handling and validation
- HTTPS/SSL support
- Rate limiting ready

See [INSTALLATION.md](INSTALLATION.md) for security best practices.

## 📈 Performance

- Efficient resource monitoring
- WebSocket for real-time updates
- Connection pooling
- History capping (120 points per metric)
- Optimized React renders

## 🐳 Docker Support

```bash
# Build Docker image
docker build -t nexpanel .

# Run container
docker run -p 3000:3000 nexpanel
```

## 🚀 Deployment

### Systemd Service

See [INSTALLATION.md](INSTALLATION.md) for systemd service setup.

### Reverse Proxy

Nginx/Apache reverse proxy examples included in documentation.

### Production Checklist

- [ ] Use HTTPS/SSL
- [ ] Set environment variables
- [ ] Configure reverse proxy
- [ ] Enable logging
- [ ] Set up monitoring
- [ ] Automatic backups configured
- [ ] Firewall rules in place

## 📚 Documentation

- [Installation Guide](INSTALLATION.md) - Setup and deployment
- [Architecture Guide](ARCHITECTURE.md) - System design and development
- [README](README.md) - Feature overview

## 🤝 Contributing

We welcome contributions! Please:

1. Fork the repository
2. Create a feature branch
3. Follow existing code patterns
4. Add tests for new functionality
5. Submit a pull request

## 📝 License

NexPanel is licensed under LGPL-2.1-or-later, making it compatible with Cockpit.

See [LICENSE](LICENSE) for full license text.

## 🙋 Support

- **Issues:** https://github.com/yourusername/nexpanel/issues
- **Discussions:** https://github.com/yourusername/nexpanel/discussions
- **Documentation:** See `/docs` directory

## 🎉 Credits

NexPanel is inspired by:
- Cockpit (original base)
- CasaOS (modern design approach)
- Pterodactyl (game server management)
- Proxmox (infrastructure dashboard)

## 📊 Stats

- **12 Core Modules** - Fully functional
- **80+ API Endpoints** - REST + WebSocket
- **5000+ Lines** of TypeScript code
- **Production Ready** - No MVP shortcuts
- **Modular Architecture** - Easy to extend

## 🌟 Show Your Support

If you find NexPanel useful, please consider:
- ⭐ Starring the repository
- 🐛 Reporting bugs
- 💡 Suggesting improvements
- 🤝 Contributing code

---

Made with ❤️ for ARM and Linux servers
