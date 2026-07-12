import { Router, Request, Response } from 'express';
import { execAsync } from '../utils/exec.js';

const router = Router();

// List users
router.get('/list', async (req: Request, res: Response) => {
  try {
    const { stdout } = await execAsync('getent passwd | grep -E ":/bin/(bash|sh)" | cut -d: -f1,3,5', {
      timeout: 10000,
    });

    const users = stdout
      .trim()
      .split('\n')
      .map((line) => {
        const parts = line.split(':');
        return { username: parts[0], uid: parts[1], name: parts[2] || parts[0] };
      });

    res.json({ users });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Get user info
router.get('/:username', async (req: Request, res: Response) => {
  try {
    const { stdout } = await execAsync(`getent passwd ${req.params.username}`, { timeout: 5000 });

    if (!stdout) {
      return res.status(404).json({ error: 'User not found' });
    }

    const parts = stdout.trim().split(':');
    res.json({
      username: parts[0],
      uid: parts[2],
      gid: parts[3],
      name: parts[4],
      home: parts[5],
      shell: parts[6],
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Create user
router.post('/create', async (req: Request, res: Response) => {
  try {
    const { username, shell = '/bin/bash', home } = req.body;
    if (!username) {
      return res.status(400).json({ error: 'username is required' });
    }

    const homeDir = home || `/home/${username}`;
    await execAsync(`useradd -m -s ${shell} -d ${homeDir} ${username}`, { timeout: 10000 });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Delete user
router.post('/:username/delete', async (req: Request, res: Response) => {
  try {
    const { removeHome = false } = req.body;
    const flag = removeHome ? '-r' : '';
    await execAsync(`userdel ${flag} ${req.params.username}`, { timeout: 10000 });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Change password
router.post('/:username/password', async (req: Request, res: Response) => {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ error: 'password is required' });
    }

    await execAsync(`echo "${req.params.username}:${password}" | chpasswd`, { timeout: 10000 });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Change shell
router.post('/:username/shell', async (req: Request, res: Response) => {
  try {
    const { shell } = req.body;
    if (!shell) {
      return res.status(400).json({ error: 'shell is required' });
    }

    await execAsync(`usermod -s ${shell} ${req.params.username}`, { timeout: 10000 });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
