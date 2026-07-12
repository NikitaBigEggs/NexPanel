import { spawn, ChildProcess } from 'child_process';
import { existsSync, mkdirSync, writeFileSync, readFileSync, rmSync, readdirSync } from 'fs';
import path from 'path';
import { execAsync } from '../utils/exec.js';

export type BotRuntime = 'nodejs' | 'python' | 'java' | 'go' | 'rust';

export interface Bot {
  id: string;
  name: string;
  runtime: BotRuntime;
  directory: string;
  status: 'running' | 'stopped' | 'error';
  uptime: number;
  entryPoint: string;
  autoStart: boolean;
  autoRestart: boolean;
  environment: Record<string, string>;
  createdAt: number;
  cpu?: number;
  memory?: number;
}

export class BotsService {
  private bots: Map<string, Bot> = new Map();
  private processes: Map<string, ChildProcess> = new Map();
  private consoleLogs: Map<string, string[]> = new Map();
  private baseDir: string;
  private maxConsoleLogs = 500;
  private startTimes: Map<string, number> = new Map();

  constructor(basePath: string = '/opt/nexpanel/bots') {
    this.baseDir = basePath;
    if (!existsSync(basePath)) {
      mkdirSync(basePath, { recursive: true });
    }
    this.loadBotsFromDisk();
  }

  private loadBotsFromDisk(): void {
    try {
      if (existsSync(this.baseDir)) {
        const entries = readdirSync(this.baseDir, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.isDirectory()) {
            const configPath = path.join(this.baseDir, entry.name, 'config.json');
            if (existsSync(configPath)) {
              const config = JSON.parse(readFileSync(configPath, 'utf-8'));
              this.bots.set(config.id, config);
              this.consoleLogs.set(config.id, []);
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to load bots from disk:', error);
    }
  }

  private saveBotToDisk(bot: Bot): void {
    const botDir = path.join(this.baseDir, bot.id);
    if (!existsSync(botDir)) {
      mkdirSync(botDir, { recursive: true });
    }
    const configPath = path.join(botDir, 'config.json');
    writeFileSync(configPath, JSON.stringify(bot, null, 2));
  }

  private addLog(botId: string, message: string): void {
    if (!this.consoleLogs.has(botId)) {
      this.consoleLogs.set(botId, []);
    }
    const logs = this.consoleLogs.get(botId)!;
    logs.push(`[${new Date().toISOString()}] ${message}`);
    if (logs.length > this.maxConsoleLogs) {
      logs.shift();
    }
  }

  async createBot(name: string, runtime: BotRuntime, entryPoint: string): Promise<Bot> {
    const id = `bot_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const botDir = path.join(this.baseDir, id);

    mkdirSync(botDir, { recursive: true });

    const bot: Bot = {
      id,
      name,
      runtime,
      directory: botDir,
      status: 'stopped',
      uptime: 0,
      entryPoint,
      autoStart: false,
      autoRestart: false,
      environment: {},
      createdAt: Date.now(),
    };

    // Create initial structure
    this.createBotTemplate(botDir, runtime);

    this.bots.set(id, bot);
    this.consoleLogs.set(id, []);
    this.saveBotToDisk(bot);
    this.addLog(id, `Bot created: ${name} (${runtime})`);

    return bot;
  }

  private createBotTemplate(dir: string, runtime: BotRuntime): void {
    if (runtime === 'nodejs') {
      const packageJson = {
        name: 'nexpanel-bot',
        version: '1.0.0',
        type: 'module',
        scripts: { start: 'node bot.js' },
        dependencies: { 'discord.js': '^14.0.0' },
      };
      writeFileSync(path.join(dir, 'package.json'), JSON.stringify(packageJson, null, 2));
      writeFileSync(path.join(dir, 'bot.js'), 'console.log("Bot started");');
    } else if (runtime === 'python') {
      writeFileSync(path.join(dir, 'requirements.txt'), 'discord.py==2.3.0\n');
      writeFileSync(path.join(dir, 'bot.py'), 'print("Bot started")\n');
    } else if (runtime === 'java') {
      writeFileSync(path.join(dir, 'Bot.java'), 'public class Bot { public static void main(String[] args) { System.out.println("Bot started"); } }\n');
    } else if (runtime === 'go') {
      writeFileSync(path.join(dir, 'main.go'), 'package main\nimport "fmt"\nfunc main() { fmt.Println("Bot started") }\n');
    } else if (runtime === 'rust') {
      writeFileSync(path.join(dir, 'Cargo.toml'), '[package]\nname = "bot"\nversion = "0.1.0"\n');
      writeFileSync(path.join(dir, 'main.rs'), 'fn main() { println!("Bot started"); }\n');
    }
  }

  async startBot(botId: string): Promise<void> {
    const bot = this.bots.get(botId);
    if (!bot) throw new Error('Bot not found');
    if (bot.status === 'running') throw new Error('Bot is already running');

    try {
      let childProcess: ChildProcess;

      if (bot.runtime === 'nodejs') {
        await execAsync(`cd ${bot.directory} && npm install 2>/dev/null || true`);
        childProcess = spawn('node', [bot.entryPoint], {
          cwd: bot.directory,
          env: { ...process.env, ...bot.environment },
        });
      } else if (bot.runtime === 'python') {
        childProcess = spawn('python3', [bot.entryPoint], {
          cwd: bot.directory,
          env: { ...process.env, PYTHONUNBUFFERED: '1', ...bot.environment },
        });
      } else if (bot.runtime === 'java') {
        childProcess = spawn('java', [bot.entryPoint.replace('.java', '')], {
          cwd: bot.directory,
          env: { ...process.env, ...bot.environment },
        });
      } else if (bot.runtime === 'go') {
        childProcess = spawn('go', ['run', bot.entryPoint], {
          cwd: bot.directory,
          env: { ...process.env, ...bot.environment },
        });
      } else if (bot.runtime === 'rust') {
        childProcess = spawn('cargo', ['run'], {
          cwd: bot.directory,
          env: { ...process.env, ...bot.environment },
        });
      } else {
        throw new Error('Unsupported runtime');
      }

      this.processes.set(botId, childProcess);
      this.startTimes.set(botId, Date.now());
      bot.status = 'running';

      childProcess.stdout?.on('data', (data) => {
        this.addLog(botId, data.toString());
      });

      childProcess.stderr?.on('data', (data) => {
        this.addLog(botId, `[ERROR] ${data.toString()}`);
      });

      childProcess.on('exit', () => {
        this.processes.delete(botId);
        this.startTimes.delete(botId);
        bot.status = 'stopped';
        this.addLog(botId, 'Bot process exited');
        if (bot.autoRestart) {
          setTimeout(() => this.startBot(botId), 5000);
        }
      });

      this.saveBotToDisk(bot);
      this.addLog(botId, `Bot started`);
    } catch (error) {
      bot.status = 'error';
      this.addLog(botId, `[ERROR] Failed to start: ${(error as Error).message}`);
      throw error;
    }
  }

  async stopBot(botId: string): Promise<void> {
    const bot = this.bots.get(botId);
    if (!bot) throw new Error('Bot not found');

    const process = this.processes.get(botId);
    if (process) {
      process.kill('SIGTERM');
      await new Promise((resolve) => setTimeout(resolve, 1000));
      if (!process.killed) {
        process.kill('SIGKILL');
      }
    }

    bot.status = 'stopped';
    this.processes.delete(botId);
    this.startTimes.delete(botId);
    this.saveBotToDisk(bot);
    this.addLog(botId, 'Bot stopped');
  }

  async restartBot(botId: string): Promise<void> {
    await this.stopBot(botId);
    await new Promise((resolve) => setTimeout(resolve, 500));
    await this.startBot(botId);
  }

  async deleteBot(botId: string): Promise<void> {
    const bot = this.bots.get(botId);
    if (!bot) throw new Error('Bot not found');

    if (bot.status === 'running') {
      await this.stopBot(botId);
    }

    const botDir = path.join(this.baseDir, botId);
    if (existsSync(botDir)) {
      rmSync(botDir, { recursive: true });
    }

    this.bots.delete(botId);
    this.consoleLogs.delete(botId);
  }

  getBots(): Bot[] {
    return Array.from(this.bots.values());
  }

  getBot(botId: string): Bot | undefined {
    return this.bots.get(botId);
  }

  updateBot(botId: string, updates: Partial<Bot>): void {
    const bot = this.bots.get(botId);
    if (!bot) throw new Error('Bot not found');
    Object.assign(bot, updates);
    this.saveBotToDisk(bot);
  }

  getConsoleLogs(botId: string, limit: number = 100): string[] {
    const logs = this.consoleLogs.get(botId) || [];
    return logs.slice(-limit);
  }

  clearConsoleLogs(botId: string): void {
    this.consoleLogs.set(botId, []);
  }

  setEnvironmentVariable(botId: string, key: string, value: string): void {
    const bot = this.bots.get(botId);
    if (!bot) throw new Error('Bot not found');
    bot.environment[key] = value;
    this.saveBotToDisk(bot);
  }

  removeEnvironmentVariable(botId: string, key: string): void {
    const bot = this.bots.get(botId);
    if (!bot) throw new Error('Bot not found');
    delete bot.environment[key];
    this.saveBotToDisk(bot);
  }

  setAutoRestart(botId: string, enabled: boolean): void {
    const bot = this.bots.get(botId);
    if (!bot) throw new Error('Bot not found');
    bot.autoRestart = enabled;
    this.saveBotToDisk(bot);
  }

  setAutoStart(botId: string, enabled: boolean): void {
    const bot = this.bots.get(botId);
    if (!bot) throw new Error('Bot not found');
    bot.autoStart = enabled;
    this.saveBotToDisk(bot);
  }
}

export const botsService = new BotsService();
