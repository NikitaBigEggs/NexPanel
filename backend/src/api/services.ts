import { Router, Request, Response } from 'express';
import { servicesService } from '../services/ServicesService.js';

const router = Router();

// List all services
router.get('/list', async (req: Request, res: Response) => {
  try {
    const services = await servicesService.listServices();
    res.json({ services });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Get specific service
router.get('/:serviceName', async (req: Request, res: Response) => {
  try {
    const service = await servicesService.getService(req.params.serviceName);
    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }
    res.json(service);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Start service
router.post('/:serviceName/start', async (req: Request, res: Response) => {
  try {
    const success = await servicesService.startService(req.params.serviceName);
    if (!success) {
      return res.status(500).json({ error: 'Failed to start service' });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Stop service
router.post('/:serviceName/stop', async (req: Request, res: Response) => {
  try {
    const success = await servicesService.stopService(req.params.serviceName);
    if (!success) {
      return res.status(500).json({ error: 'Failed to stop service' });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Restart service
router.post('/:serviceName/restart', async (req: Request, res: Response) => {
  try {
    const success = await servicesService.restartService(req.params.serviceName);
    if (!success) {
      return res.status(500).json({ error: 'Failed to restart service' });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Enable service (auto-start)
router.post('/:serviceName/enable', async (req: Request, res: Response) => {
  try {
    const success = await servicesService.enableService(req.params.serviceName);
    if (!success) {
      return res.status(500).json({ error: 'Failed to enable service' });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Disable service (disable auto-start)
router.post('/:serviceName/disable', async (req: Request, res: Response) => {
  try {
    const success = await servicesService.disableService(req.params.serviceName);
    if (!success) {
      return res.status(500).json({ error: 'Failed to disable service' });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Get service logs
router.get('/:serviceName/logs', async (req: Request, res: Response) => {
  try {
    const lines = req.query.lines ? parseInt(req.query.lines as string) : 50;
    const logs = await servicesService.getLogs(req.params.serviceName, lines);
    res.json({ logs });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Get system status
router.get('/system/status', async (req: Request, res: Response) => {
  try {
    const status = await servicesService.getSystemStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Reload systemd
router.post('/system/reload', async (req: Request, res: Response) => {
  try {
    const success = await servicesService.reloadSystemd();
    if (!success) {
      return res.status(500).json({ error: 'Failed to reload systemd' });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
