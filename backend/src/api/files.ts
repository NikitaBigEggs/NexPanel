import { Router, Request, Response } from 'express';
import { fileManagerService } from '../services/FileManagerService.js';

const router = Router();

// List directory contents
router.get('/list', async (req: Request, res: Response) => {
  try {
    const dirPath = req.query.path as string | undefined;
    const listing = await fileManagerService.listDirectory(dirPath);
    res.json(listing);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Get file info
router.get('/info', async (req: Request, res: Response) => {
  try {
    const filePath = req.query.path as string;
    if (!filePath) {
      return res.status(400).json({ error: 'path is required' });
    }
    // Return by listing parent directory
    const listing = await fileManagerService.listDirectory(filePath);
    res.json(listing);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Read file content
router.get('/read', async (req: Request, res: Response) => {
  try {
    const filePath = req.query.path as string;
    if (!filePath) {
      return res.status(400).json({ error: 'path is required' });
    }
    const content = await fileManagerService.readFile(filePath);
    res.json({ content });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Write file content
router.post('/write', async (req: Request, res: Response) => {
  try {
    const { path: filePath, content } = req.body;
    if (!filePath || content === undefined) {
      return res.status(400).json({ error: 'path and content are required' });
    }
    await fileManagerService.writeFile(filePath, content);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Create file
router.post('/create-file', async (req: Request, res: Response) => {
  try {
    const { dir, name, content = '' } = req.body;
    if (!dir || !name) {
      return res.status(400).json({ error: 'dir and name are required' });
    }
    const file = await fileManagerService.createFile(dir, name, content);
    res.json({ success: true, file });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Create directory
router.post('/create-dir', async (req: Request, res: Response) => {
  try {
    const { dir, name } = req.body;
    if (!dir || !name) {
      return res.status(400).json({ error: 'dir and name are required' });
    }
    const newDir = await fileManagerService.createDirectory(dir, name);
    res.json({ success: true, dir: newDir });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Delete file or directory
router.post('/delete', async (req: Request, res: Response) => {
  try {
    const { path: filePath } = req.body;
    if (!filePath) {
      return res.status(400).json({ error: 'path is required' });
    }
    await fileManagerService.deleteFile(filePath);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Rename file or directory
router.post('/rename', async (req: Request, res: Response) => {
  try {
    const { path: filePath, newName } = req.body;
    if (!filePath || !newName) {
      return res.status(400).json({ error: 'path and newName are required' });
    }
    const renamed = await fileManagerService.renameFile(filePath, newName);
    res.json({ success: true, file: renamed });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Copy file or directory
router.post('/copy', async (req: Request, res: Response) => {
  try {
    const { source, dest, name } = req.body;
    if (!source || !dest) {
      return res.status(400).json({ error: 'source and dest are required' });
    }
    const copied = await fileManagerService.copyFile(source, dest, name);
    res.json({ success: true, file: copied });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Move file or directory
router.post('/move', async (req: Request, res: Response) => {
  try {
    const { source, dest } = req.body;
    if (!source || !dest) {
      return res.status(400).json({ error: 'source and dest are required' });
    }
    const moved = await fileManagerService.moveFile(source, dest);
    res.json({ success: true, file: moved });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Search files
router.get('/search', async (req: Request, res: Response) => {
  try {
    const dir = req.query.dir as string | undefined;
    const query = req.query.q as string;
    if (!query) {
      return res.status(400).json({ error: 'q parameter is required' });
    }
    const results = await fileManagerService.searchFiles(dir || '/home', query);
    res.json({ results });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Create archive
router.post('/archive', async (req: Request, res: Response) => {
  try {
    const { files, name, format = 'zip' } = req.body;
    if (!files || !Array.isArray(files) || !name) {
      return res.status(400).json({ error: 'files array and name are required' });
    }
    const archivePath = await fileManagerService.createArchive(files, name, format);
    res.json({ success: true, path: archivePath });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Extract archive
router.post('/extract', async (req: Request, res: Response) => {
  try {
    const { archive, dest } = req.body;
    if (!archive || !dest) {
      return res.status(400).json({ error: 'archive and dest are required' });
    }
    await fileManagerService.extractArchive(archive, dest);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
