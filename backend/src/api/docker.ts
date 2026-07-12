import { Router, Request, Response } from 'express';
import { dockerService } from '../services/DockerService.js';

const router = Router();

// Check if Docker is available
router.get('/available', async (req: Request, res: Response) => {
  try {
    const available = await dockerService.isDockerAvailable();
    res.json({ available });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Get Docker info
router.get('/info', async (req: Request, res: Response) => {
  try {
    const info = await dockerService.getDockerInfo();
    res.json(info);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// List containers
router.get('/containers', async (req: Request, res: Response) => {
  try {
    const all = req.query.all === 'true';
    const containers = await dockerService.listContainers(all);
    res.json({ containers });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// List images
router.get('/images', async (req: Request, res: Response) => {
  try {
    const images = await dockerService.listImages();
    res.json({ images });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Start container
router.post('/containers/:id/start', async (req: Request, res: Response) => {
  try {
    const success = await dockerService.startContainer(req.params.id);
    if (!success) {
      return res.status(500).json({ error: 'Failed to start container' });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Stop container
router.post('/containers/:id/stop', async (req: Request, res: Response) => {
  try {
    const success = await dockerService.stopContainer(req.params.id);
    if (!success) {
      return res.status(500).json({ error: 'Failed to stop container' });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Restart container
router.post('/containers/:id/restart', async (req: Request, res: Response) => {
  try {
    const success = await dockerService.restartContainer(req.params.id);
    if (!success) {
      return res.status(500).json({ error: 'Failed to restart container' });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Remove container
router.post('/containers/:id/remove', async (req: Request, res: Response) => {
  try {
    const force = req.body.force === true;
    const success = await dockerService.removeContainer(req.params.id, force);
    if (!success) {
      return res.status(500).json({ error: 'Failed to remove container' });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Get container logs
router.get('/containers/:id/logs', async (req: Request, res: Response) => {
  try {
    const lines = req.query.lines ? parseInt(req.query.lines as string) : 100;
    const logs = await dockerService.getContainerLogs(req.params.id, lines);
    res.json({ logs });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Get container stats
router.get('/containers/:id/stats', async (req: Request, res: Response) => {
  try {
    const stats = await dockerService.getContainerStats(req.params.id);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Pull image
router.post('/images/pull', async (req: Request, res: Response) => {
  try {
    const { image } = req.body;
    if (!image) {
      return res.status(400).json({ error: 'image is required' });
    }
    const success = await dockerService.pullImage(image);
    if (!success) {
      return res.status(500).json({ error: 'Failed to pull image' });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Remove image
router.post('/images/:id/remove', async (req: Request, res: Response) => {
  try {
    const force = req.body.force === true;
    const success = await dockerService.removeImage(req.params.id, force);
    if (!success) {
      return res.status(500).json({ error: 'Failed to remove image' });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
