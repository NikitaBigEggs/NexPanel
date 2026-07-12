# NexPanel v0.1.0 - Complete Server Management Dashboard

## 📦 Distribution Contents

This is the complete, production-ready NexPanel release.

### Directory Structure
- backend/          - Express.js server (TypeScript)
- frontend/         - React dashboard (TypeScript + Vite)
- docs/            - Documentation files
- package.json     - Root configuration
- INSTALLATION.md  - Setup and deployment guide
- ARCHITECTURE.md  - Development and architecture guide
- README.md        - Feature overview
- RELEASE_NOTES.md - Version information
- install.sh       - Automated installation script
- setup.sh         - Quick start script

## 🚀 Quick Start

### On Windows (WSL2/Git Bash):
`ash
cd /c/NexPanel-Release
chmod +x *.sh
./setup.sh
npm run dev
`

### On Linux/Mac:
`ash
cd /path/to/NexPanel-Release
chmod +x *.sh
./setup.sh
npm run dev
`

## 📋 System Requirements

- Node.js 18+
- npm 9+
- 512MB RAM minimum
- Linux OS (Ubuntu 22.04+, Debian 11+, CentOS 8+)

## ✨ 12 Complete Modules

✅ Dashboard           - Real-time system monitoring
✅ BeamMP Server       - Game server management
✅ Websites            - Multi-runtime web hosting
✅ Terminal            - Interactive PTY shell
✅ Services            - systemd management
✅ Monitoring          - Advanced metrics tracking
✅ Logs                - System log viewer
✅ File Manager        - Complete file operations
✅ Bots                - Multi-language bot support
✅ Docker              - Container management
✅ Users               - Linux user management
✅ Settings            - System preferences

## 🛠️ Main Commands

npm run dev           - Start development (http://localhost:5173)
npm start             - Start production (http://localhost:3000)
npm run build         - Build for production
npm run install-all   - Install all dependencies
npm run lint          - Run linter
npm run type-check    - Check TypeScript

## 📚 Documentation

1. Read INSTALLATION.md for deployment
2. Check ARCHITECTURE.md for development
3. Review README.md for features

## 🔒 Security Features

- Path sanitization (prevents directory traversal)
- Command injection prevention
- HTTPS/SSL support
- Rate limiting ready
- Proper error handling

## 📊 Architecture Highlights

- 12 independent modules
- 80+ REST API endpoints
- WebSocket for real-time updates
- React 18 + TypeScript frontend
- Node.js + Express backend
- 5000+ lines of production code

## 📝 License

LGPL-2.1-or-later (Compatible with Cockpit)

## 🎯 Next Steps

1. Extract/clone this distribution
2. Run ./setup.sh for installation
3. Run npm run dev to start
4. Access http://localhost:5173
5. Read documentation for deployment

## 🤝 Support

- GitHub Issues: Bug reports and questions
- GitHub Discussions: Community support
- Email: For commercial inquiries

---

**Version:** 0.1.0
**Release Date:** July 11, 2026
**Status:** Production Ready

Made with ❤️ for ARM and Linux servers
