import { Router, Request, Response } from 'express';
import { systemService } from '../services/SystemService.js';

const router = Router();

// Comprehensive stats endpoint
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const stats = await systemService.getAllStats();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch system stats' });
  }
});

// Individual metric endpoints
router.get('/cpu', async (req: Request, res: Response) => {
  try {
    const stats = await systemService.getAllStats();
    res.json({ cpu: stats.cpu });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch CPU usage' });
  }
});

router.get('/ram', (req: Request, res: Response) => {
  try {
    const ram = systemService.getRamUsage();
    res.json(ram);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch RAM usage' });
  }
});

router.get('/disk', async (req: Request, res: Response) => {
  try {
    const disk = await systemService.getDiskUsage();
    res.json(disk);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch disk usage' });
  }
});

router.get('/temperature', async (req: Request, res: Response) => {
  try {
    const temperature = await systemService.getTemperature();
    res.json({ temperature });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch temperature' });
  }
});

router.get('/uptime', (req: Request, res: Response) => {
  try {
    const uptime = systemService.getUptimeHours();
    res.json({ uptime });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch uptime' });
  }
});

router.get('/network', async (req: Request, res: Response) => {
  try {
    const network = await systemService.getNetworkStats();
    res.json(network);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch network stats' });
  }
});

router.get('/users', async (req: Request, res: Response) => {
  try {
    const stats = await systemService.getAllStats();
    res.json({ onlineUsers: stats.onlineUsers });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch online users' });
  }
});

export default router;
