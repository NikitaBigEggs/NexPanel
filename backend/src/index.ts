import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';



// API Routes
import systemRouter from './api/system.js';
import websitesRouter from './api/websites.js';
import beammpRouter from './api/beammp.js';
import filesRouter from './api/files.js';
import servicesRouter from './api/services.js';
import monitoringRouter from './api/monitoring.js';
import usersRouter from './api/users.js';
import settingsRouter from './api/settings.js';
import terminalRouter from './api/terminal.js';
import dockerRouter from './api/docker.js';
import logsRouter from './api/logs.js';
import botsRouter from './api/bots.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app: Express = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API v1 routes
const apiV1 = '/api/v1';

app.get(`${apiV1}/modules`, (req: Request, res: Response) => {
  res.json({
    modules: [
      'dashboard',
      'beammp',
      'websites',
      'bots',
      'filemanager',
      'terminal',
      'monitoring',
      'logs',
      'services',
      'docker',
      'users',
      'settings',
    ],
  });
});

app.use(`${apiV1}/system`, systemRouter);
app.use(`${apiV1}/websites`, websitesRouter);
app.use(`${apiV1}/beammp`, beammpRouter);
app.use(`${apiV1}/files`, filesRouter);
app.use(`${apiV1}/services`, servicesRouter);
app.use(`${apiV1}/monitoring`, monitoringRouter);
app.use(`${apiV1}/users`, usersRouter);
app.use(`${apiV1}/settings`, settingsRouter);
app.use(`${apiV1}/terminal`, terminalRouter);
app.use(`${apiV1}/docker`, dockerRouter);
app.use(`${apiV1}/logs`, logsRouter);
app.use(`${apiV1}/bots`, botsRouter);

// Frontend static files
app.use(express.static(path.join(__dirname, "../../frontend/dist")));

app.get("*", (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, "../../frontend/dist/index.html"));
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Not Found' });
});

// Error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// WebSocket connection and real-time updates
import { systemService } from './services/SystemService.js';
import { terminalService } from './services/TerminalService.js';

let statsInterval: NodeJS.Timeout | null = null;
const terminalSessions: Map<string, string> = new Map(); // socket.id -> terminal session id

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  // Dashboard updates
  socket.on('subscribe:dashboard', async () => {
    console.log(`Client ${socket.id} subscribed to dashboard`);
    const stats = await systemService.getAllStats();
    socket.emit('dashboard:update', stats);

    if (!statsInterval) {
      statsInterval = setInterval(async () => {
        const latestStats = await systemService.getAllStats();
        io.emit('dashboard:update', latestStats);
      }, 2000);
    }
  });

  socket.on('unsubscribe:dashboard', () => {
    console.log(`Client ${socket.id} unsubscribed from dashboard`);
    if (statsInterval && io.engine.clientsCount === 0) {
      clearInterval(statsInterval);
      statsInterval = null;
    }
  });

  // Terminal management
  socket.on('terminal:create', (data: any, callback) => {
    try {
      const { cols = 120, rows = 40 } = data;
      const session = terminalService.createSession(cols, rows);
      terminalSessions.set(socket.id, session.id);
      callback({ success: true, session });
    } catch (error) {
      callback({ error: (error as Error).message });
    }
  });

  socket.on('terminal:write', (data: any) => {
    try {
      const { sessionId, text } = data;
      terminalService.write(sessionId, text);
    } catch (error) {
      console.error('Terminal write error:', error);
    }
  });

  socket.on('terminal:resize', (data: any) => {
    try {
      const { sessionId, cols, rows } = data;
      terminalService.resize(sessionId, cols, rows);
    } catch (error) {
      console.error('Terminal resize error:', error);
    }
  });

  socket.on('terminal:close', (data: any, callback) => {
    try {
      const { sessionId } = data;
      terminalService.kill(sessionId);
      terminalSessions.delete(socket.id);
      callback({ success: true });
    } catch (error) {
      callback({ error: (error as Error).message });
    }
  });

  // Terminal data forwarding (PTY output to client)
  const terminalDataInterval = setInterval(() => {
    const sessionId = terminalSessions.get(socket.id);
    if (sessionId) {
      const session = terminalService.getSession(sessionId);
      if (!session) {
        clearInterval(terminalDataInterval);
        terminalSessions.delete(socket.id);
      }
    }
  }, 100);

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
    const sessionId = terminalSessions.get(socket.id);
    if (sessionId) {
      terminalService.kill(sessionId);
      terminalSessions.delete(socket.id);
    }
    clearInterval(terminalDataInterval);

    if (statsInterval && io.engine.clientsCount === 0) {
      clearInterval(statsInterval);
      statsInterval = null;
    }
  });
});

httpServer.listen(PORT, () => {
  console.log(`🚀 NexPanel server running on port ${PORT}`);
  console.log(`📊 WebSocket ready for real-time updates`);
});

export { app, io };
