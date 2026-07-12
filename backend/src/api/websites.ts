import { Router, Request, Response } from 'express';
import { websiteService } from '../services/WebsiteService.js';

const router = Router();

// List websites
router.get('/list', (req: Request, res: Response) => {
  try {
    const websites = websiteService.getWebsites();
    res.json({ websites });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Get website details
router.get('/:websiteId', (req: Request, res: Response) => {
  try {
    const website = websiteService.getWebsite(req.params.websiteId);
    if (!website) {
      return res.status(404).json({ error: 'Website not found' });
    }
    res.json(website);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Create website
router.post('/create', async (req: Request, res: Response) => {
  try {
    const { name, runtime, port, entryPoint } = req.body;
    if (!name || !runtime || !port) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const website = await websiteService.createWebsite(name, runtime, port, entryPoint);
    res.json({ success: true, website });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Start website
router.post('/:websiteId/start', async (req: Request, res: Response) => {
  try {
    await websiteService.startWebsite(req.params.websiteId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Stop website
router.post('/:websiteId/stop', async (req: Request, res: Response) => {
  try {
    await websiteService.stopWebsite(req.params.websiteId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Restart website
router.post('/:websiteId/restart', async (req: Request, res: Response) => {
  try {
    await websiteService.restartWebsite(req.params.websiteId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Delete website
router.post('/:websiteId/delete', async (req: Request, res: Response) => {
  try {
    await websiteService.deleteWebsite(req.params.websiteId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Get console logs
router.get('/:websiteId/console', (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
    const logs = websiteService.getConsoleLogs(req.params.websiteId, limit);
    res.json({ logs });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Clear console logs
router.post('/:websiteId/console/clear', (req: Request, res: Response) => {
  try {
    websiteService.clearConsoleLogs(req.params.websiteId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Get stats
router.get('/:websiteId/stats', (req: Request, res: Response) => {
  try {
    const stats = websiteService.getStats(req.params.websiteId);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Update website
router.post('/:websiteId/update', (req: Request, res: Response) => {
  try {
    websiteService.updateWebsite(req.params.websiteId, req.body);
    const updated = websiteService.getWebsite(req.params.websiteId);
    res.json({ success: true, website: updated });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Set auto-start
router.post('/:websiteId/auto-start', (req: Request, res: Response) => {
  try {
    const { enabled } = req.body;
    websiteService.setAutoStart(req.params.websiteId, enabled);
    res.json({ success: true, autoStart: enabled });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Change port
router.post('/:websiteId/port', (req: Request, res: Response) => {
  try {
    const { port } = req.body;
    if (!port) {
      return res.status(400).json({ error: 'Port is required' });
    }
    websiteService.changePort(req.params.websiteId, port);
    res.json({ success: true, port });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
