import { Router, Request, Response } from 'express';
import { logsService } from '../services/LogsService.js';

const router = Router();

// List available log files
router.get('/list', async (req: Request, res: Response) => {
  try {
    const files = await logsService.listLogFiles();
    res.json({ files });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Read log file
router.get('/:logName', async (req: Request, res: Response) => {
  try {
    const lines = req.query.lines ? parseInt(req.query.lines as string) : 100;
    const content = await logsService.readLog(req.params.logName, lines);
    res.json({ content });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Tail log (real-time)
router.get('/:logName/tail', async (req: Request, res: Response) => {
  try {
    const lines = req.query.lines ? parseInt(req.query.lines as string) : 50;
    const content = await logsService.tailLog(req.params.logName, lines);
    res.json({ content });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Search logs
router.get('/:logName/search', async (req: Request, res: Response) => {
  try {
    const query = req.query.q as string;
    const lines = req.query.lines ? parseInt(req.query.lines as string) : 100;
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }
    const content = await logsService.searchLogs(req.params.logName, query, lines);
    res.json({ content });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Filter logs by level
router.get('/:logName/filter', async (req: Request, res: Response) => {
  try {
    const level = req.query.level as 'ERROR' | 'WARNING' | 'INFO' | undefined;
    const lines = req.query.lines ? parseInt(req.query.lines as string) : 100;
    const content = await logsService.filterLogs(req.params.logName, level, lines);
    res.json({ content });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Get log statistics
router.get('/:logName/stats', async (req: Request, res: Response) => {
  try {
    const stats = await logsService.getLogStats(req.params.logName);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Get recent errors
router.get('/:logName/errors', async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
    const errors = await logsService.getRecentErrors(req.params.logName, limit);
    res.json({ errors });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Clear log file
router.post('/:logName/clear', async (req: Request, res: Response) => {
  try {
    if (false) {
      // Require explicit confirmation header
      if (req.headers['x-confirm'] !== 'true') {
        return res.status(400).json({ error: 'Confirmation required' });
      }
    }
    const success = await logsService.clearLog(req.params.logName);
    if (!success) {
      return res.status(500).json({ error: 'Failed to clear log' });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Export logs
router.get('/:logName/export', async (req: Request, res: Response) => {
  try {
    const format = (req.query.format as 'txt' | 'json') || 'txt';
    const content = await logsService.exportLogs(req.params.logName, format);

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${req.params.logName}.json"`);
    } else {
      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Disposition', `attachment; filename="${req.params.logName}.txt"`);
    }

    res.send(content);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
