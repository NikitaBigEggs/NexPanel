import { Router, Request, Response } from 'express';
import { botsService } from '../services/BotsService.js';

const router = Router();

// List bots
router.get('/list', (req: Request, res: Response) => {
  try {
    const bots = botsService.getBots();
    res.json({ bots });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Get bot details
router.get('/:botId', (req: Request, res: Response) => {
  try {
    const bot = botsService.getBot(req.params.botId);
    if (!bot) {
      return res.status(404).json({ error: 'Bot not found' });
    }
    res.json(bot);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Create bot
router.post('/create', async (req: Request, res: Response) => {
  try {
    const { name, runtime, entryPoint } = req.body;
    if (!name || !runtime || !entryPoint) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const bot = await botsService.createBot(name, runtime, entryPoint);
    res.json({ success: true, bot });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Start bot
router.post('/:botId/start', async (req: Request, res: Response) => {
  try {
    await botsService.startBot(req.params.botId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Stop bot
router.post('/:botId/stop', async (req: Request, res: Response) => {
  try {
    await botsService.stopBot(req.params.botId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Restart bot
router.post('/:botId/restart', async (req: Request, res: Response) => {
  try {
    await botsService.restartBot(req.params.botId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Delete bot
router.post('/:botId/delete', async (req: Request, res: Response) => {
  try {
    await botsService.deleteBot(req.params.botId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Get console logs
router.get('/:botId/console', (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
    const logs = botsService.getConsoleLogs(req.params.botId, limit);
    res.json({ logs });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Clear console logs
router.post('/:botId/console/clear', (req: Request, res: Response) => {
  try {
    botsService.clearConsoleLogs(req.params.botId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Set environment variable
router.post('/:botId/env', (req: Request, res: Response) => {
  try {
    const { key, value } = req.body;
    if (!key || value === undefined) {
      return res.status(400).json({ error: 'key and value are required' });
    }
    botsService.setEnvironmentVariable(req.params.botId, key, value);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Remove environment variable
router.post('/:botId/env/remove', (req: Request, res: Response) => {
  try {
    const { key } = req.body;
    if (!key) {
      return res.status(400).json({ error: 'key is required' });
    }
    botsService.removeEnvironmentVariable(req.params.botId, key);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Set auto-restart
router.post('/:botId/auto-restart', (req: Request, res: Response) => {
  try {
    const { enabled } = req.body;
    botsService.setAutoRestart(req.params.botId, enabled);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Set auto-start
router.post('/:botId/auto-start', (req: Request, res: Response) => {
  try {
    const { enabled } = req.body;
    botsService.setAutoStart(req.params.botId, enabled);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
