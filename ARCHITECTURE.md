# NexPanel Architecture & Development Guide

## Overview

NexPanel is a modern, modular server management dashboard built on Express.js (backend) and React (frontend) with WebSocket for real-time updates.

## Architecture

### Frontend Stack
- **React 18** with TypeScript
- **Vite** for fast development and optimized builds
- **TailwindCSS** for utility-first styling
- **Socket.IO Client** for real-time WebSocket communication
- **Recharts** for data visualization
- **Lucide React** for consistent icons

### Backend Stack
- **Node.js** with TypeScript
- **Express.js** for HTTP routing
- **Socket.IO** for WebSocket real-time communication
- **node-pty** for terminal emulation
- **SQLite** for data persistence (optional, currently using JSON)

## Project Structure

```
nexpanel/
├── backend/
│   ├── src/
│   │   ├── api/              # REST API route handlers
│   │   │   ├── system.ts
│   │   │   ├── beammp.ts
│   │   │   ├── websites.ts
│   │   │   ├── bots.ts
│   │   │   ├── files.ts
│   │   │   ├── services.ts
│   │   │   ├── monitoring.ts
│   │   │   ├── logs.ts
│   │   │   ├── terminal.ts
│   │   │   ├── docker.ts
│   │   │   ├── users.ts
│   │   │   └── settings.ts
│   │   ├── services/         # Business logic
│   │   │   ├── SystemService.ts
│   │   │   ├── BeamMPService.ts
│   │   │   ├── WebsiteService.ts
│   │   │   ├── BotsService.ts
│   │   │   ├── FileManagerService.ts
│   │   │   ├── ServicesService.ts
│   │   │   ├── MonitoringService.ts
│   │   │   ├── LogsService.ts
│   │   │   ├── TerminalService.ts
│   │   │   └── DockerService.ts
│   │   ├── utils/            # Utilities
│   │   │   └── exec.ts       # Command execution
│   │   ├── config/           # Configuration
│   │   └── index.ts          # Main entry point
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/       # React components
│   │   │   └── Sidebar.tsx
│   │   ├── pages/            # Page components
│   │   │   ├── Dashboard.tsx
│   │   │   ├── BeamMP.tsx
│   │   │   ├── Websites.tsx
│   │   │   ├── Bots.tsx
│   │   │   ├── FileManager.tsx
│   │   │   ├── Terminal.tsx
│   │   │   ├── Monitoring.tsx
│   │   │   ├── Logs.tsx
│   │   │   ├── Services.tsx
│   │   │   ├── Docker.tsx
│   │   │   ├── Users.tsx
│   │   │   └── Settings.tsx
│   │   ├── services/         # API client services
│   │   ├── hooks/            # Custom React hooks
│   │   ├── types/            # TypeScript type definitions
│   │   ├── styles/           # Global styles
│   │   │   └── globals.css
│   │   ├── App.tsx           # Main app component
│   │   └── main.tsx          # Entry point
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── postcss.config.js
├── docs/                     # Documentation
├── package.json              # Root package.json
├── README.md
└── .gitignore
```

## Communication Flow

### REST API

```
Frontend Request
    ↓
Vite dev server / Production server
    ↓
Express Router (api/*)
    ↓
Service Layer (business logic)
    ↓
System commands / File operations
    ↓
Response → JSON
    ↓
Frontend (React component state)
```

### WebSocket (Real-time)

```
Frontend (Socket.IO Client)
    ↓
subscribe:dashboard / terminal:* events
    ↓
Backend (Socket.IO Server)
    ↓
io.on('connection', (socket) => {...})
    ↓
Periodic updates (Dashboard: 2s, Terminal: streaming)
    ↓
socket.emit('dashboard:update', data)
    ↓
Frontend receives and updates state
```

## Adding a New Module

### 1. Create Backend Service

Create `backend/src/services/MyModuleService.ts`:

```typescript
export class MyModuleService {
  async getList(): Promise<MyItem[]> {
    // Implementation
  }

  async create(name: string): Promise<MyItem> {
    // Implementation
  }

  async delete(id: string): Promise<void> {
    // Implementation
  }
}

export const myModuleService = new MyModuleService();
```

### 2. Create API Routes

Create `backend/src/api/mymodule.ts`:

```typescript
import { Router, Request, Response } from 'express';
import { myModuleService } from '../services/MyModuleService.js';

const router = Router();

router.get('/list', async (req: Request, res: Response) => {
  try {
    const items = await myModuleService.getList();
    res.json({ items });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
```

### 3. Register Routes in Backend

Edit `backend/src/index.ts`:

```typescript
import myModuleRouter from './api/mymodule.js';

app.use(`${apiV1}/mymodule`, myModuleRouter);
```

### 4. Create Frontend Page

Create `frontend/src/pages/MyModule.tsx`:

```typescript
import { useEffect, useState } from 'react'

export default function MyModule() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchItems = async () => {
    setLoading(true)
    try {
      const response = await fetch('http://localhost:3000/api/v1/mymodule/list')
      if (response.ok) {
        const data = await response.json()
        setItems(data.items)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchItems()
  }, [])

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <h1 className="text-3xl font-bold">My Module</h1>
      {/* Component content */}
    </div>
  )
}
```

### 5. Add to Router

Edit `frontend/src/App.tsx`:

```typescript
import MyModule from './pages/MyModule'

<Route path="/mymodule" element={<MyModule />} />
```

### 6. Add to Sidebar

Edit `frontend/src/components/Sidebar.tsx`:

```typescript
const menuItems = [
  // ... existing items
  { path: '/mymodule', label: 'My Module', icon: MyIcon },
]
```

## Development Workflow

### Local Development

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### Type Checking

```bash
npm run type-check
```

### Linting

```bash
npm run lint
```

### Build for Production

```bash
npm run build
```

## Security Considerations

### Path Sanitization

Always sanitize file paths to prevent directory traversal:

```typescript
function sanitizePath(inputPath: string): string {
  let safePath = path.normalize(inputPath);
  if (!safePath.startsWith(basePath)) {
    safePath = basePath;
  }
  return safePath;
}
```

### Command Injection Prevention

Never directly interpolate user input into shell commands:

```typescript
// ❌ BAD
execSync(`rm ${userPath}`);

// ✅ GOOD
execSync(`rm "${escapedPath}"`);
// or use escape library
```

### Error Handling

Always wrap async operations:

```typescript
try {
  const result = await someAsyncOp();
  res.json({ success: true, data: result });
} catch (error) {
  console.error('Operation failed:', error);
  res.status(500).json({ error: (error as Error).message });
}
```

## Performance Optimization

### Backend

- Cap history data (currently 120 points per metric)
- Use efficient command execution
- Implement proper cleanup for child processes
- Connection pooling for services

### Frontend

- Lazy load modules
- Memoize expensive computations
- Use React DevTools Profiler
- Optimize re-renders with proper key props

### WebSocket

- Batch updates when possible
- Use compression for large payloads
- Implement client-side caching
- Clean up listeners on unmount

## Testing

### Backend Unit Tests

Create `backend/src/services/__tests__/SystemService.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { systemService } from '../SystemService';

describe('SystemService', () => {
  it('should get CPU usage', async () => {
    const stats = await systemService.getAllStats();
    expect(stats.cpu).toBeGreaterThanOrEqual(0);
    expect(stats.cpu).toBeLessThanOrEqual(100);
  });
});
```

Run with:

```bash
npm test
```

### Frontend Component Tests

Create `frontend/src/components/__tests__/Sidebar.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Sidebar from '../Sidebar';

describe('Sidebar', () => {
  it('renders navigation items', () => {
    render(
      <BrowserRouter>
        <Sidebar />
      </BrowserRouter>
    );
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });
});
```

## Deployment

### Docker Build

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Production Considerations

1. Use environment variables for secrets
2. Enable HTTPS/SSL
3. Set up proper logging
4. Monitor resource usage
5. Implement rate limiting
6. Use reverse proxy (Nginx/Apache)
7. Automate backups
8. Set up monitoring/alerting

## Contributing

1. Create a feature branch
2. Follow existing code patterns
3. Add tests for new functionality
4. Update documentation
5. Submit pull request with clear description

## License

LGPL-2.1-or-later - See LICENSE file for details
