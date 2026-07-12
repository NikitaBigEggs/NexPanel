import { Router, Request, Response } from 'express';
import { monitoringService } from '../services/MonitoringService.js';

const router = Router();

// Get all current metrics
router.get('/metrics', async (req: Request, res: Response) => {
  try {
    const metrics = await monitoringService.getAllMetrics();
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Get metrics history
router.get('/history', (req: Request, res: Response) => {
  try {
    const history = monitoringService.getHistory();
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Get history for specific time range
router.get('/history/:minutes', (req: Request, res: Response) => {
  try {
    const minutes = parseInt(req.params.minutes);
    const history = monitoringService.getHistorySince(minutes);
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Get top processes
router.get('/processes', async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const metrics = await monitoringService.getAllMetrics();
    res.json({ processes: metrics.processes.slice(0, limit) });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Get statistics
router.get('/stats', (req: Request, res: Response) => {
  try {
    const stats = monitoringService.getStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
