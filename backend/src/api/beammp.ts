import { Router, Request, Response } from 'express';
import { beammpService } from '../services/BeamMPService.js';

const router = Router();

// Server lifecycle endpoints
router.post('/start', async (req: Request, res: Response) => {
  try {
    if (beammpService.isRunning()) {
      return res.status(400).json({ error: 'Server is already running' });
    }
    await beammpService.start();
    res.json({ success: true, message: 'Server started' });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/stop', async (req: Request, res: Response) => {
  try {
    if (!beammpService.isRunning()) {
      return res.status(400).json({ error: 'Server is not running' });
    }
    await beammpService.stop();
    res.json({ success: true, message: 'Server stopped' });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/restart', async (req: Request, res: Response) => {
  try {
    await beammpService.restart();
    res.json({ success: true, message: 'Server restarted' });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/kill', async (req: Request, res: Response) => {
  try {
    await beammpService.kill();
    res.json({ success: true, message: 'Server killed' });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Console and logs
router.get('/console', (req: Request, res: Response) => {
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
  const logs = beammpService.getConsoleLogs(limit);
  res.json({ logs });
});

router.post('/console/clear', (req: Request, res: Response) => {
  beammpService.clearConsoleLogs();
  res.json({ success: true });
});

// Stats
router.get('/stats', (req: Request, res: Response) => {
  const stats = beammpService.getStats();
  res.json(stats);
});

// Players
router.get('/players', (req: Request, res: Response) => {
  const players = beammpService.getPlayers();
  res.json({ players });
});

router.post('/players/:playerId/kick', (req: Request, res: Response) => {
  try {
    beammpService.kickPlayer(req.params.playerId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/players/:playerId/ban', (req: Request, res: Response) => {
  try {
    beammpService.banPlayer(req.params.playerId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Whitelist and bans
router.get('/whitelist', (req: Request, res: Response) => {
  const config = beammpService.getConfig();
  res.json({ whitelist: config.whitelist });
});

router.post('/whitelist/add', (req: Request, res: Response) => {
  try {
    const { playerName } = req.body;
    if (!playerName) {
      return res.status(400).json({ error: 'playerName is required' });
    }
    beammpService.addToWhitelist(playerName);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/whitelist/remove', (req: Request, res: Response) => {
  try {
    const { playerName } = req.body;
    if (!playerName) {
      return res.status(400).json({ error: 'playerName is required' });
    }
    beammpService.removeFromWhitelist(playerName);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/banned', (req: Request, res: Response) => {
  const config = beammpService.getConfig();
  res.json({ banned: config.banned });
});

router.post('/banned/remove', (req: Request, res: Response) => {
  try {
    const { playerName } = req.body;
    if (!playerName) {
      return res.status(400).json({ error: 'playerName is required' });
    }
    beammpService.unbanPlayer(playerName);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Configuration
router.get('/config', (req: Request, res: Response) => {
  const config = beammpService.getConfig();
  res.json(config);
});

router.post('/config', (req: Request, res: Response) => {
  try {
    const newConfig = req.body;
    beammpService.setConfig(newConfig);
    res.json({ success: true, config: beammpService.getConfig() });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Auto-restart and auto-start
router.post('/auto-restart', (req: Request, res: Response) => {
  const { enabled } = req.body;
  beammpService.setAutoRestart(enabled);
  res.json({ success: true, autoRestart: enabled });
});

router.post('/auto-start', (req: Request, res: Response) => {
  const { enabled } = req.body;
  beammpService.setAutoStart(enabled);
  res.json({ success: true, autoStart: enabled });
});

export default router;
