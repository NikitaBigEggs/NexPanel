# NexPanel Installation & Setup Guide

## System Requirements

- **OS:** Linux (Ubuntu 22.04+, Debian 11+, CentOS 8+)
- **Architecture:** ARM64 or x86_64
- **Node.js:** 18.0.0 or higher
- **npm:** 9.0.0 or higher
- **RAM:** Minimum 512MB (1GB recommended)
- **Storage:** 500MB free space

## Quick Start

### 1. Install Node.js (if not already installed)

**Ubuntu/Debian:**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs npm
```

**CentOS/RHEL:**
```bash
sudo yum install nodejs npm
```

**ARM (using NodeSource):**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 2. Install Dependencies

```bash
cd /opt/nexpanel  # or your installation directory

# Install all dependencies
npm run install-all
```

This installs dependencies for both backend and frontend.

### 3. Build Project

```bash
npm run build
```

Builds TypeScript and optimizes the frontend for production.

### 4. Start NexPanel

#### Development Mode (with hot reload)
```bash
npm run dev
```

#### Production Mode
```bash
npm start
```

Access the dashboard at: **http://localhost:5173** (dev) or **http://localhost:3000** (prod)

## Configuration

### Backend Environment Variables

Edit `backend/.env`:

```env
PORT=3000
FRONTEND_URL=http://localhost:5173
NODE_ENV=production
LOG_LEVEL=info
DATABASE_URL=sqlite:./nexpanel.db
```

### Frontend Configuration

Edit `frontend/vite.config.ts` to change API proxy:

```typescript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:3000',
      changeOrigin: true,
    },
  },
}
```

## Module Guide

### Dashboard
- Real-time system metrics (CPU, RAM, Disk, Temperature)
- Network monitoring
- Process tracking
- Live charts with historical data

**Access:** `/`

### BeamMP Server
- Game server management
- Player administration (kick, ban)
- Server configuration editing
- Console access and logging

**Access:** `/beammp`

### Websites
- Multi-runtime hosting (Node.js, PHP, Python, Static)
- Lifecycle management (start/stop/restart)
- Port configuration
- Real-time console output

**Access:** `/websites`

### Terminal
- Interactive PTY shell
- Multiple tabs support
- Command history
- Full bash capabilities

**Access:** `/terminal`

### Services
- systemd service management
- Service status monitoring
- Start/stop/restart/enable/disable
- Service logging

**Access:** `/services`

### Monitoring
- Advanced metrics with history
- Top processes tracking
- Time-range filters
- Performance statistics

**Access:** `/monitoring`

### Logs
- System log viewing
- Search and filtering
- Real-time tail
- Export capabilities

**Access:** `/logs`

### File Manager
- Directory browsing
- File operations (create/delete/rename/move/copy)
- Inline editor
- Archive support

**Access:** `/files`

### Bots
- Multi-language support (Node.js, Python, Java, Go, Rust)
- Bot lifecycle management
- Environment variables
- Auto-restart and auto-start

**Access:** `/bots`

### Docker
- Container management
- Image operations
- Log streaming
- Stats monitoring

**Access:** `/docker`

### Users
- Linux user management
- User creation/deletion
- Shell configuration
- Permission management

**Access:** `/users`

### Settings
- Theme customization
- Language selection
- Backup management
- System information

**Access:** `/settings`

## Running as a Service

### Using systemd

Create `/etc/systemd/system/nexpanel.service`:

```ini
[Unit]
Description=NexPanel Server Dashboard
After=network.target

[Service]
Type=simple
User=nexpanel
WorkingDirectory=/opt/nexpanel
ExecStart=/usr/bin/node /opt/nexpanel/backend/dist/index.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Then run:

```bash
sudo systemctl daemon-reload
sudo systemctl enable nexpanel
sudo systemctl start nexpanel
sudo systemctl status nexpanel
```

### Using PM2

```bash
# Install PM2 globally
sudo npm install -g pm2

# Start NexPanel
pm2 start "npm start" --name nexpanel

# Setup auto-start on boot
pm2 startup
pm2 save
```

## Reverse Proxy Setup

### Nginx

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Apache

```apache
<VirtualHost *:80>
    ServerName your-domain.com
    
    ProxyPreserveHost On
    ProxyPass / http://localhost:3000/
    ProxyPassReverse / http://localhost:3000/
    
    RewriteEngine On
    RewriteCond %{HTTP:Upgrade} websocket [NC]
    RewriteCond %{HTTP:Connection} upgrade [NC]
    RewriteRule ^/?(.*) "ws://localhost:3000/$1" [P,L]
</VirtualHost>
```

## SSL/HTTPS Setup

### Let's Encrypt with Certbot

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot certonly --nginx -d your-domain.com
```

Then configure Nginx to use the certificates.

## Troubleshooting

### Port Already in Use

If port 3000 is already in use:

```bash
# Find process using the port
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or change the port in .env
PORT=8000
```

### High Memory Usage

NexPanel monitors history with a 120-point cap per metric. If memory is still high:

1. Reduce polling intervals in `frontend/src/pages/*.tsx`
2. Disable unnecessary modules in sidebar
3. Increase system swap space

### WebSocket Connection Issues

If WebSocket fails to connect:

1. Check frontend URL in `backend/.env`
2. Verify reverse proxy allows WebSocket upgrade headers
3. Check firewall rules for port 3000

### Docker Module Not Working

Docker commands require root or sudo group membership:

```bash
sudo usermod -aG docker $USER
newgrp docker
```

### File Manager Permissions

File manager operates with the user running NexPanel. To access system files:

```bash
sudo chmod 755 /etc /var/log  # if needed
```

## Performance Tuning

### Increase File Descriptors

```bash
ulimit -n 65536
```

Add to `/etc/security/limits.conf` for persistence:

```
nexpanel soft nofile 65536
nexpanel hard nofile 65536
```

### Enable Swap (if not enough RAM)

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

## Backup & Recovery

### Backup Configuration

```bash
tar czf nexpanel-backup-$(date +%Y%m%d).tar.gz \
  /opt/nexpanel/backend/.env \
  /opt/nexpanel/nexpanel.db
```

### Restore Configuration

```bash
tar xzf nexpanel-backup-*.tar.gz -C /
systemctl restart nexpanel
```

## Updating NexPanel

```bash
cd /opt/nexpanel
git pull origin main
npm run install-all
npm run build
systemctl restart nexpanel
```

## Security Best Practices

1. **Always use HTTPS** in production
2. **Change default passwords** for system users
3. **Restrict access** with firewall rules
4. **Keep system updated:**
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```
5. **Monitor logs regularly:**
   ```bash
   journalctl -u nexpanel -f
   ```
6. **Use strong SSH keys** instead of passwords
7. **Enable 2FA** in Settings module when available

## Support & Documentation

- **GitHub:** https://github.com/yourusername/nexpanel
- **Issues:** https://github.com/yourusername/nexpanel/issues
- **Documentation:** `/docs` directory
- **License:** LGPL-2.1-or-later

## Contact

For support, issues, or feature requests, open an issue on GitHub or contact the development team.
