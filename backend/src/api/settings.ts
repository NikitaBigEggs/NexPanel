import { Router, Request, Response } from 'express';

const router = Router();

const defaultSettings = {
  theme: 'dark' as const,
  language: 'en',
  notifications: true,
  autoBackup: false,
  backupInterval: 24,
};

let currentSettings = { ...defaultSettings };

router.get('/get', (req: Request, res: Response) => {
  res.json(currentSettings);
});

router.post('/save', (req: Request, res: Response) => {
  try {
    currentSettings = { ...currentSettings, ...req.body };
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/version', (req: Request, res: Response) => {
  res.json({ version: '0.1.0' });
});

router.post('/backup', (req: Request, res: Response) => {
  res.json({ success: true, message: 'Backup created' });
});

router.post('/reset', (req: Request, res: Response) => {
  currentSettings = { ...defaultSettings };
  res.json({ success: true });
});

export default router;

