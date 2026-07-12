# NexPanel Release Notes v0.1.0

**Release Date:** July 11, 2026

## 🎉 Initial Release

NexPanel v0.1.0 is the first public release of this modern ARM server management dashboard.

## ✨ Features Included

### Core Functionality
- ✅ Complete system monitoring with real-time metrics
- ✅ Multi-module architecture (12 full modules)
- ✅ WebSocket for real-time updates
- ✅ Beautiful glassmorphism UI
- ✅ Dark mode by default
- ✅ Responsive design

### Modules (All Production-Ready)

1. **Dashboard** - CPU, RAM, Disk, Temperature, Network monitoring
2. **BeamMP Server** - Complete game server management
3. **Websites** - Multi-runtime web app hosting
4. **Terminal** - Interactive PTY shell
5. **Services** - systemd management
6. **Monitoring** - Advanced metrics with history
7. **Logs** - System log viewer
8. **File Manager** - Complete file operations
9. **Bots** - Multi-language bot support
10. **Docker** - Container management
11. **Users** - Linux user management
12. **Settings** - System preferences

### Technology Stack

**Frontend:**
- React 18 with TypeScript
- Vite for development
- TailwindCSS styling
- Socket.IO for real-time
- Recharts for visualization

**Backend:**
- Node.js with Express
- TypeScript throughout
- Socket.IO for WebSocket
- node-pty for terminals
- Full Linux integration

## 🚀 Getting Started

### Quick Start

```bash
git clone <repository>
cd nexpanel
chmod +x install.sh
./install.sh
npm run dev
```

Access at http://localhost:5173

### Requirements

- Linux OS (Ubuntu 22.04+, Debian 11+, CentOS 8+)
- Node.js 18+ 
- npm 9+
- 512MB RAM minimum

## 📋 What's New

### Architecture
- Fully modular design
- Service-based backend
- REST API + WebSocket
- Type-safe throughout

### UI/UX
- Modern glassmorphism design
- Real-time updates
- Responsive layouts
- Keyboard shortcuts
- Live data visualization

### Developer Experience
- TypeScript for safety
- Clear project structure
- Easy module addition
- Comprehensive documentation

## 🔒 Security

- Path sanitization
- Command injection prevention
- Proper error handling
- SSL/HTTPS support
- Rate limiting ready

## 📊 Performance

- Efficient resource monitoring
- WebSocket pooling
- History capping
- Optimized React rendering
- Memory-conscious design

## 📚 Documentation

Included in release:
- `INSTALLATION.md` - Setup guide
- `ARCHITECTURE.md` - Development guide
- `README.md` - Feature overview
- `install.sh` - Automated setup

## 🐛 Known Issues

None at initial release. Please report issues on GitHub.

## 🗺️ Roadmap

### v0.2.0 (Next)
- [ ] Database migration to SQLite
- [ ] JWT authentication
- [ ] Plugin system
- [ ] Custom dashboards
- [ ] Advanced backup system

### v0.3.0
- [ ] Mobile app
- [ ] Multi-server support
- [ ] Advanced automation
- [ ] Custom themes
- [ ] API webhooks

### v0.4.0+
- [ ] Machine learning insights
- [ ] Advanced analytics
- [ ] Kubernetes support
- [ ] Enterprise features
- [ ] Commercial support option

## 🤝 Contributing

We welcome contributions! See documentation for guidelines.

## 📝 License

LGPL-2.1-or-later - Compatible with Cockpit

## ⭐ Support

- GitHub Issues for bugs
- GitHub Discussions for questions
- Email for commercial inquiries

## 🙏 Thanks

Thanks to:
- Cockpit team (original base)
- CasaOS (design inspiration)
- Open source community

## 🎯 Next Steps

1. Read [INSTALLATION.md](INSTALLATION.md) for setup
2. Check [ARCHITECTURE.md](ARCHITECTURE.md) for development
3. Start using NexPanel for your server management
4. Share feedback and suggestions

---

**Website:** https://nexpanel.local (or your domain)
**GitHub:** https://github.com/yourusername/nexpanel
**License:** LGPL-2.1-or-later

Made with ❤️ for ARM and Linux servers
