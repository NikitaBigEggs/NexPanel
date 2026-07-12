import { spawn, ChildProcess } from 'child_process';
import { existsSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'fs';
import path from 'path';
import { execAsync } from '../utils/exec.js';
import fs from 'fs';

export type WebsiteRuntime = 'nodejs' | 'php' | 'python' | 'static';

export interface Website {
  id: string;
  name: string;
  runtime: WebsiteRuntime;
  port: number;
  directory: string;
  status: 'running' | 'stopped' | 'error';
  uptime: number;
  entryPoint?: string; // main.js, index.php, app.py, index.html
  environment?: Record<string, string>;
  autoStart: boolean;
  createdAt: number;
}

export interface WebsiteStats {
  cpu: number;
  ram: number;
  requests: number;
  uptime: number;
}

export class WebsiteService {
  private websites: Map<string, Website> = new Map();
  private processes: Map<string, ChildProcess> = new Map();
  private consoleLogs: Map<string, string[]> = new Map();
  private baseDir: string;
  private maxConsoleLogs = 500;
  private startTimes: Map<string, number> = new Map();

  constructor(basePath: string = '/opt/nexpanel/websites') {
    this.baseDir = basePath;
    if (!existsSync(basePath)) {
      mkdirSync(basePath, { recursive: true });
    }
    this.loadWebsitesFromDisk();
  }

  private loadWebsitesFromDisk(): void {
    try {
      if (existsSync(this.baseDir)) {
       const entries = fs.readdirSync(this.baseDir, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.isDirectory()) {
            const configPath = path.join(this.baseDir, entry.name, 'config.json');
            if (existsSync(configPath)) {
              const config = JSON.parse(readFileSync(configPath, 'utf-8'));
              this.websites.set(config.id, config);
              this.consoleLogs.set(config.id, []);
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to load websites from disk:', error);
    }
  }

  private saveWebsiteToDisk(website: Website): void {
    const websiteDir = path.join(this.baseDir, website.id);
    if (!existsSync(websiteDir)) {
      mkdirSync(websiteDir, { recursive: true });
    }
    const configPath = path.join(websiteDir, 'config.json');
    writeFileSync(configPath, JSON.stringify(website, null, 2));
  }

  private addLog(websiteId: string, message: string): void {
    if (!this.consoleLogs.has(websiteId)) {
      this.consoleLogs.set(websiteId, []);
    }
    const logs = this.consoleLogs.get(websiteId)!;
    logs.push(`[${new Date().toISOString()}] ${message}`);
    if (logs.length > this.maxConsoleLogs) {
      logs.shift();
    }
  }

  async createWebsite(
    name: string,
    runtime: WebsiteRuntime,
    port: number,
    entryPoint?: string
  ): Promise<Website> {
    const id = `web_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const websiteDir = path.join(this.baseDir, id, 'app');

    mkdirSync(websiteDir, { recursive: true });

    const website: Website = {
      id,
      name,
      runtime,
      port,
      directory: websiteDir,
      status: 'stopped',
      uptime: 0,
      entryPoint: entryPoint || this.getDefaultEntryPoint(runtime),
      environment: {},
      autoStart: false,
      createdAt: Date.now(),
    };

    // Create initial project structure
    if (runtime === 'nodejs') {
      this.createNodeProject(websiteDir);
    } else if (runtime === 'php') {
      this.createPhpProject(websiteDir);
    } else if (runtime === 'python') {
      this.createPythonProject(websiteDir);
    } else if (runtime === 'static') {
      this.createStaticProject(websiteDir);
    }

    this.websites.set(id, website);
    this.consoleLogs.set(id, []);
    this.saveWebsiteToDisk(website);
    this.addLog(id, `Website created: ${name} (${runtime})`);

    return website;
  }

  private getDefaultEntryPoint(runtime: WebsiteRuntime): string {
    const defaults: Record<WebsiteRuntime, string> = {
      nodejs: 'main.js',
      php: 'index.php',
      python: 'app.py',
      static: 'index.html',
    };
    return defaults[runtime];
  }

  private createNodeProject(dir: string): void {
    const packageJson = {
      name: 'nexpanel-site',
      version: '1.0.0',
      type: 'module',
      scripts: { start: 'node main.js' },
      dependencies: { express: '^4.18.2' },
    };
    writeFileSync(path.join(dir, 'package.json'), JSON.stringify(packageJson, null, 2));

    const mainJs = `import express from 'express';
const app = express();
const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('Hello from NexPanel!'));
app.listen(PORT, () => console.log(\`Server running on port \${PORT}\`));
`;
    writeFileSync(path.join(dir, 'main.js'), mainJs);
  }

  private createPhpProject(dir: string): void {
    const indexPhp = `<?php
echo "Hello from NexPanel PHP!";
phpinfo();
?>`;
    writeFileSync(path.join(dir, 'index.php'), indexPhp);
  }

  private createPythonProject(dir: string): void {
    const appPy = `from flask import Flask
app = Flask(__name__)

@app.route('/')
def hello():
    return 'Hello from NexPanel Python!'

if __name__ == '__main__':
    app.run(host='0.0.0.0', debug=False)
`;
    writeFileSync(path.join(dir, 'app.py'), appPy);
  }

  private createStaticProject(dir: string): void {
    const indexHtml = `<!DOCTYPE html>
<html>
<head>
    <title>NexPanel Site</title>
    <style>
        body { font-family: Arial; text-align: center; padding: 50px; }
        h1 { color: #d60000; }
    </style>
</head>
<body>
    <h1>Welcome to NexPanel</h1>
    <p>Your static website is running!</p>
</body>
</html>`;
    writeFileSync(path.join(dir, 'index.html'), indexHtml);
  }

  async startWebsite(websiteId: string): Promise<void> {
    const website = this.websites.get(websiteId);
    if (!website) throw new Error('Website not found');
    if (website.status === 'running') throw new Error('Website is already running');

    try {
      let childProcess: ChildProcess;

      if (website.runtime === 'nodejs') {
        await execAsync(`cd ${website.directory} && npm install 2>/dev/null || true`);
        childProcess = spawn('node', [website.entryPoint!], {
          cwd: website.directory,
          env: { ...process.env, PORT: website.port.toString(), ...website.environment },
        });
      } else if (website.runtime === 'php') {
        childProcess = spawn('php', ['-S', `localhost:${website.port}`], {
          cwd: website.directory,
        });
      } else if (website.runtime === 'python') {
        childProcess = spawn('python3', [website.entryPoint!], {
          cwd: website.directory,
          env: { ...process.env, FLASK_ENV: 'production', PORT: website.port.toString() },
        });
      } else {
        // Static: use simple HTTP server
        childProcess = spawn('python3', ['-m', 'http.server', website.port.toString()], {
          cwd: website.directory,
        });
      }

      this.processes.set(websiteId, childProcess);
      this.startTimes.set(websiteId, Date.now());
      website.status = 'running';

      childProcess.stdout?.on('data', (data) => {
        this.addLog(websiteId, data.toString());
      });

      childProcess.stderr?.on('data', (data) => {
        this.addLog(websiteId, `[ERROR] ${data.toString()}`);
      });

      childProcess.on('exit', () => {
        this.processes.delete(websiteId);
        this.startTimes.delete(websiteId);
        website.status = 'stopped';
        this.addLog(websiteId, 'Website process exited');
      });

      this.saveWebsiteToDisk(website);
      this.addLog(websiteId, `Website started on port ${website.port}`);
    } catch (error) {
      website.status = 'error';
      this.addLog(websiteId, `[ERROR] Failed to start: ${(error as Error).message}`);
      throw error;
    }
  }

  async stopWebsite(websiteId: string): Promise<void> {
    const website = this.websites.get(websiteId);
    if (!website) throw new Error('Website not found');

    const process = this.processes.get(websiteId);
    if (process) {
      process.kill('SIGTERM');
      await new Promise((resolve) => setTimeout(resolve, 1000));
      if (!process.killed) {
        process.kill('SIGKILL');
      }
    }

    website.status = 'stopped';
    this.processes.delete(websiteId);
    this.startTimes.delete(websiteId);
    this.saveWebsiteToDisk(website);
    this.addLog(websiteId, 'Website stopped');
  }

  async restartWebsite(websiteId: string): Promise<void> {
    await this.stopWebsite(websiteId);
    await new Promise((resolve) => setTimeout(resolve, 500));
    await this.startWebsite(websiteId);
  }

  async deleteWebsite(websiteId: string): Promise<void> {
    const website = this.websites.get(websiteId);
    if (!website) throw new Error('Website not found');

    if (website.status === 'running') {
      await this.stopWebsite(websiteId);
    }

    const websiteDir = path.join(this.baseDir, websiteId);
    if (existsSync(websiteDir)) {
      rmSync(websiteDir, { recursive: true });
    }

    this.websites.delete(websiteId);
    this.consoleLogs.delete(websiteId);
    this.addLog(websiteId, 'Website deleted');
  }

  getWebsites(): Website[] {
    return Array.from(this.websites.values());
  }

  getWebsite(websiteId: string): Website | undefined {
    return this.websites.get(websiteId);
  }

  updateWebsite(websiteId: string, updates: Partial<Website>): void {
    const website = this.websites.get(websiteId);
    if (!website) throw new Error('Website not found');

    Object.assign(website, updates);
    this.saveWebsiteToDisk(website);
  }

  getConsoleLogs(websiteId: string, limit: number = 100): string[] {
    const logs = this.consoleLogs.get(websiteId) || [];
    return logs.slice(-limit);
  }

  clearConsoleLogs(websiteId: string): void {
    this.consoleLogs.set(websiteId, []);
  }

  getStats(websiteId: string): WebsiteStats {
    const website = this.websites.get(websiteId);
    if (!website) throw new Error('Website not found');

    const startTime = this.startTimes.get(websiteId);
    const uptime = startTime ? Math.floor((Date.now() - startTime) / 1000) : 0;

    return {
      cpu: 0, // Would need process monitoring
      ram: 0, // Would need process monitoring
      requests: 0, // Would need HTTP tracking
      uptime,
    };
  }

  setAutoStart(websiteId: string, enabled: boolean): void {
    const website = this.websites.get(websiteId);
    if (!website) throw new Error('Website not found');
    website.autoStart = enabled;
    this.saveWebsiteToDisk(website);
  }

  changePort(websiteId: string, newPort: number): void {
    const website = this.websites.get(websiteId);
    if (!website) throw new Error('Website not found');
    if (website.status === 'running') throw new Error('Stop the website before changing port');
    website.port = newPort;
    this.saveWebsiteToDisk(website);
  }
}

export const websiteService = new WebsiteService();
