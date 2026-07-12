import { execAsync } from '../utils/exec.js';
import {
  existsSync,
  statSync,
  readdirSync,
  mkdirSync,
  rmSync,
  renameSync,
  copyFileSync,
  readFileSync,
  writeFileSync,
  chmodSync,
} from 'fs';
import path from 'path';

export interface FileInfo {
  name: string;
  path: string;
  isDirectory: boolean;
  size: number;
  modified: number;
  permissions: string;
  owner: string;
  type: string;
}

export interface DirectoryListing {
  current: string;
  parent: string | null;
  files: FileInfo[];
}

export class FileManagerService {
  private basePath = '/home';
  private maxFileSize = 100 * 1024 * 1024; // 100MB

  constructor(basePath: string = '/home') {
    this.basePath = basePath;
  }

  sanitizePath(inputPath: string): string {
    // Prevent directory traversal
    let safePath = path.normalize(inputPath);
    if (!safePath.startsWith(this.basePath)) {
      safePath = this.basePath;
    }
    return safePath;
  }

  async listDirectory(dirPath: string = ''): Promise<DirectoryListing> {
    const currentPath = this.sanitizePath(dirPath || this.basePath);

    if (!existsSync(currentPath)) {
      throw new Error('Directory not found');
    }

    const files: FileInfo[] = [];
    const entries = readdirSync(currentPath, { withFileTypes: true });

    for (const entry of entries) {
      try {
        const fullPath = path.join(currentPath, entry.name);
        const stat = statSync(fullPath);
        const permissions = this.getPermissions(stat.mode);
        const owner = await this.getOwner(fullPath);

        files.push({
          name: entry.name,
          path: fullPath,
          isDirectory: entry.isDirectory(),
          size: stat.size,
          modified: stat.mtime.getTime(),
          permissions,
          owner,
          type: this.getFileType(entry.name),
        });
      } catch (error) {
        // Skip files we can't access
      }
    }

    const parent = currentPath === this.basePath ? null : path.dirname(currentPath);

    return {
      current: currentPath,
      parent,
      files: files.sort((a, b) => {
        // Directories first, then alphabetical
        if (a.isDirectory !== b.isDirectory) {
          return a.isDirectory ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      }),
    };
  }

  async createFile(dirPath: string, fileName: string, content: string = ''): Promise<FileInfo> {
    const dir = this.sanitizePath(dirPath);
    const filePath = path.join(dir, fileName);

    if (existsSync(filePath)) {
      throw new Error('File already exists');
    }

    writeFileSync(filePath, content);
    return this.getFileInfo(filePath);
  }

  async createDirectory(dirPath: string, dirName: string): Promise<FileInfo> {
    const dir = this.sanitizePath(dirPath);
    const newDirPath = path.join(dir, dirName);

    if (existsSync(newDirPath)) {
      throw new Error('Directory already exists');
    }

    mkdirSync(newDirPath, { recursive: true });
    return this.getFileInfo(newDirPath);
  }

  async deleteFile(filePath: string): Promise<void> {
    const safePath = this.sanitizePath(filePath);

    if (!existsSync(safePath)) {
      throw new Error('File not found');
    }

    rmSync(safePath, { recursive: true, force: true });
  }

  async renameFile(filePath: string, newName: string): Promise<FileInfo> {
    const safePath = this.sanitizePath(filePath);
    const dir = path.dirname(safePath);
    const newPath = path.join(dir, newName);

    if (!existsSync(safePath)) {
      throw new Error('File not found');
    }

    if (existsSync(newPath)) {
      throw new Error('Target name already exists');
    }

    renameSync(safePath, newPath);
    return this.getFileInfo(newPath);
  }

  async copyFile(sourcePath: string, destDir: string, newName?: string): Promise<FileInfo> {
    const source = this.sanitizePath(sourcePath);
    const dest = this.sanitizePath(destDir);

    if (!existsSync(source)) {
      throw new Error('Source file not found');
    }

    const fileName = newName || path.basename(source);
    const destPath = path.join(dest, fileName);

    if (existsSync(destPath)) {
      throw new Error('Destination file already exists');
    }

    if (statSync(source).isDirectory()) {
      this.copyDirectory(source, destPath);
    } else {
      copyFileSync(source, destPath);
    }

    return this.getFileInfo(destPath);
  }

  private copyDirectory(source: string, dest: string): void {
    mkdirSync(dest, { recursive: true });
    const entries = readdirSync(source, { withFileTypes: true });

    for (const entry of entries) {
      const sourcePath = path.join(source, entry.name);
      const destPath = path.join(dest, entry.name);

      if (entry.isDirectory()) {
        this.copyDirectory(sourcePath, destPath);
      } else {
        copyFileSync(sourcePath, destPath);
      }
    }
  }

  async moveFile(sourcePath: string, destDir: string): Promise<FileInfo> {
    const source = this.sanitizePath(sourcePath);
    const dest = this.sanitizePath(destDir);

    if (!existsSync(source)) {
      throw new Error('Source file not found');
    }

    const fileName = path.basename(source);
    const destPath = path.join(dest, fileName);

    if (existsSync(destPath)) {
      throw new Error('Destination file already exists');
    }

    renameSync(source, destPath);
    return this.getFileInfo(destPath);
  }

  async readFile(filePath: string): Promise<string> {
    const safePath = this.sanitizePath(filePath);

    if (!existsSync(safePath)) {
      throw new Error('File not found');
    }

    const stat = statSync(safePath);
    if (stat.size > this.maxFileSize) {
      throw new Error('File too large to read');
    }

    return readFileSync(safePath, 'utf-8');
  }

  async writeFile(filePath: string, content: string): Promise<void> {
    const safePath = this.sanitizePath(filePath);

    if (!existsSync(safePath)) {
      throw new Error('File not found');
    }

    writeFileSync(safePath, content, 'utf-8');
  }

  async searchFiles(dirPath: string, query: string): Promise<FileInfo[]> {
    const dir = this.sanitizePath(dirPath);
    const results: FileInfo[] = [];

    try {
      const { stdout } = await execAsync(`find "${dir}" -iname "*${query}*" -type f 2>/dev/null | head -100`, {
        timeout: 10000,
      });

      for (const filePath of stdout.trim().split('\n')) {
        if (filePath && existsSync(filePath)) {
          try {
            results.push(await this.getFileInfo(filePath));
          } catch {
            // Skip inaccessible files
          }
        }
      }
    } catch (error) {
      console.error('Search failed:', error);
    }

    return results;
  }

  async createArchive(filePaths: string[], archiveName: string, format: 'zip' | 'tar.gz' = 'zip'): Promise<string> {
    const validPaths = filePaths.map((p) => this.sanitizePath(p)).filter((p) => existsSync(p));

    if (validPaths.length === 0) {
      throw new Error('No valid files to archive');
    }

    const archivePath = path.join(this.basePath, archiveName);
    const fileList = validPaths.join(' ');

    if (format === 'zip') {
      await execAsync(`zip -r "${archivePath}" ${fileList}`, { timeout: 30000 });
    } else {
      await execAsync(`tar czf "${archivePath}" ${fileList}`, { timeout: 30000 });
    }

    return archivePath;
  }

  async extractArchive(archivePath: string, destDir: string): Promise<void> {
    const archive = this.sanitizePath(archivePath);
    const dest = this.sanitizePath(destDir);

    if (!existsSync(archive)) {
      throw new Error('Archive not found');
    }

    if (!existsSync(dest)) {
      mkdirSync(dest, { recursive: true });
    }

    if (archive.endsWith('.zip')) {
      await execAsync(`unzip -q "${archive}" -d "${dest}"`, { timeout: 30000 });
    } else if (archive.endsWith('.tar.gz') || archive.endsWith('.tgz')) {
      await execAsync(`tar xzf "${archive}" -C "${dest}"`, { timeout: 30000 });
    } else if (archive.endsWith('.tar')) {
      await execAsync(`tar xf "${archive}" -C "${dest}"`, { timeout: 30000 });
    } else {
      throw new Error('Unsupported archive format');
    }
  }

  private async getFileInfo(filePath: string): Promise<FileInfo> {
    const stat = statSync(filePath);
    const permissions = this.getPermissions(stat.mode);
    const owner = await this.getOwner(filePath);

    return {
      name: path.basename(filePath),
      path: filePath,
      isDirectory: stat.isDirectory(),
      size: stat.size,
      modified: stat.mtime.getTime(),
      permissions,
      owner,
      type: this.getFileType(path.basename(filePath)),
    };
  }

  private getPermissions(mode: number): string {
    return ((mode & parseInt('777', 8)).toString(8) as any).padStart(3, '0');
  }

  private async getOwner(filePath: string): Promise<string> {
    try {
      const { stdout } = await execAsync(`stat -c "%U" "${filePath}" 2>/dev/null || echo "unknown"`, {
        timeout: 5000,
      });
      return stdout.trim();
    } catch {
      return 'unknown';
    }
  }

  private getFileType(fileName: string): string {
    const ext = path.extname(fileName).toLowerCase();
    const typeMap: Record<string, string> = {
      '.txt': 'text',
      '.md': 'markdown',
      '.js': 'javascript',
      '.ts': 'typescript',
      '.json': 'json',
      '.py': 'python',
      '.sh': 'shell',
      '.html': 'html',
      '.css': 'css',
      '.jpg': 'image',
      '.png': 'image',
      '.pdf': 'pdf',
      '.zip': 'archive',
      '.tar': 'archive',
      '.gz': 'archive',
    };
    return typeMap[ext] || 'file';
  }
}

export const fileManagerService = new FileManagerService();
