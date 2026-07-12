import { Router, Request, Response } from 'express';
import { terminalService } from '../services/TerminalService.js';

const router = Router();

// Create new terminal session
router.post('/create', (req: Request, res: Response) => {
  try {
    const { cols = 120, rows = 40 } = req.body;
    const session = terminalService.createSession(cols, rows);
    res.json({ success: true, session });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// List all sessions
router.get('/sessions', (req: Request, res: Response) => {
  try {
    const sessions = terminalService.listSessions();
    res.json({ sessions });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Get session details
router.get('/sessions/:sessionId', (req: Request, res: Response) => {
  try {
    const session = terminalService.getSession(req.params.sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    res.json(session);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Get session logs
router.get('/sessions/:sessionId/logs', (req: Request, res: Response) => {
  try {
    const lines = req.query.lines ? parseInt(req.query.lines as string) : 100;
    const logs = terminalService.getLogs(req.params.sessionId, lines);
    res.json({ logs });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Close session
router.post('/sessions/:sessionId/close', (req: Request, res: Response) => {
  try {
    terminalService.kill(req.params.sessionId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Resize terminal
router.post('/sessions/:sessionId/resize', (req: Request, res: Response) => {
  try {
    const { cols, rows } = req.body;
    if (!cols || !rows) {
      return res.status(400).json({ error: 'cols and rows are required' });
    }
    terminalService.resize(req.params.sessionId, cols, rows);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
