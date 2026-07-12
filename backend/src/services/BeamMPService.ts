import { spawn, ChildProcess } from 'child_process';
import { execAsync } from '../utils/exec.js';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import path from 'path';

export interface ServerConfig {
  name: string;
  port: number;
  maxPlayers: number;
  description: string;
  tags: string[];
  private: boolean;
  whitelist: string[];
  banned: string[];
}

export interface ServerStats {
  status: 'running' | 'stopped' | 'crashed';
  uptime: number;
  cpu: number;
  ram: number;
  players: number;
  tps: number;
}

export interface Player {
  id: string;
  name: string;
  joinTime: number;
  vehicles: number;
}

export class BeamMPService {
  private serverProcess: ChildProcess | null = null;
  private serverPath: string;
  private configPath: string;
  private logsPath: string;
  private consoleLogs: string[] = [];
  private maxConsoleLogs = 1000;
  private stats: ServerStats = {
    status: 'stopped',
    uptime: 0,
    cpu: 0,
    ram: 0,
    players: 0,
    tps: 60,
  };
  private players: Player[] = [];
  private config: ServerConfig = {
    name: 'BeamMP Server',
    port: 30814,
    maxPlayers: 32,
    description: 'A BeamMP Server',
    tags: ['default'],
    private: false,
    whitelist: [],
    banned: [],
  };
  private autoRestartEnabled = false;
  private autoStartEnabled = false;

  constructor(basePath: string = '/opt/beammp') {
    this.serverPath = basePath;
    this.configPath = path.join(basePath, 'ServerConfig.toml');
    this.logsPath = path.join(basePath, 'logs');
    this.loadConfig();
  }

  private loadConfig(): void {
    try {
      if (existsSync(this.configPath)) {
        const content = readFileSync(this.configPath, 'utf-8');
        this.config = this.parseToml(content);
      }
    } catch (error) {
      console.error('Failed to load BeamMP config:', error);
    }
  }

  private parseToml(content: string): ServerConfig {
    // Simple TOML parser for BeamMP config
    const config: any = { ...this.config };
    const lines = content.split('\n');

    for (const line of lines) {
      if (line.includes('=')) {
        const [key, value] = line.split('=').map((s) => s.trim());
        if (key === 'ServerName') config.name = value.replace(/['"]/g, '');
        if (key === 'Port') config.port = parseInt(value);
        if (key === 'MaxPlayers') config.maxPlayers = parseInt(value);
        if (key === 'Description') config.description = value.replace(/['"]/g, '');
        if (key === 'Private') config.private = value === 'true';
      }
    }

    return config;
  }

  private tomlStringify(config: ServerConfig): string {
    return `# BeamMP Server Configuration
ServerName = "${config.name}"
Description = "${config.description}"
Port = ${config.port}
MaxPlayers = ${config.maxPlayers}
Private = ${config.private}
Tags = [${config.tags.map((t) => `"${t}"`).join(', ')}]

[Whitelist]
${config.whitelist.map((w) => `${w} = true`).join('\n')}

[Banned]
${config.banned.map((b) => `${b} = true`).join('\n')}
`;
  }

  async start(): Promise<void> {
    if (this.serverProcess) {
      throw new Error('Server is already running');
    }

    try {
      const binaryPath = path.join(this.serverPath, 'BeamMP-Server');
      this.serverProcess = spawn(binaryPath, ['--config', this.configPath], {
        cwd: this.serverPath,
      });

      this.stats.status = 'running';
      this.stats.uptime = 0;

      this.serverProcess.stdout?.on('data', (data) => {
        const output = data.toString();
        this.consoleLogs.push(output);
        if (this.consoleLogs.length > this.maxConsoleLogs) {
          this.consoleLogs.shift();
        }
        this.parseServerOutput(output);
      });

      this.serverProcess.stderr?.on('data', (data) => {
        const output = data.toString();
        this.consoleLogs.push(`[ERROR] ${output}`);
        if (this.consoleLogs.length > this.maxConsoleLogs) {
          this.consoleLogs.shift();
        }
      });

      this.serverProcess.on('exit', () => {
        this.serverProcess = null;
        this.stats.status = 'stopped';
        if (this.autoRestartEnabled) {
          setTimeout(() => this.start(), 5000);
        }
      });

      console.log('BeamMP server started');
    } catch (error) {
      console.error('Failed to start BeamMP server:', error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (!this.serverProcess) {
      throw new Error('Server is not running');
    }

    this.serverProcess.kill('SIGTERM');
    await new Promise((resolve) => setTimeout(resolve, 2000));

    if (this.serverProcess && !this.serverProcess.killed) {
      this.serverProcess.kill('SIGKILL');
    }

    this.stats.status = 'stopped';
    this.serverProcess = null;
  }

  async restart(): Promise<void> {
    await this.stop();
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await this.start();
  }

  async kill(): Promise<void> {
    if (this.serverProcess) {
      this.serverProcess.kill('SIGKILL');
      this.serverProcess = null;
    }
    this.stats.status = 'stopped';
  }

  getConsoleLogs(limit: number = 100): string[] {
    return this.consoleLogs.slice(-limit);
  }

  clearConsoleLogs(): void {
    this.consoleLogs = [];
  }

  private parseServerOutput(output: string): void {
    // Parse server output for player count, TPS, etc
    if (output.includes('players')) {
      const match = output.match(/(\d+)\s+players?/i);
      if (match) {
        this.stats.players = parseInt(match[1]);
      }
    }

    if (output.includes('TPS')) {
      const match = output.match(/TPS:\s*(\d+(?:\.\d+)?)/i);
      if (match) {
        this.stats.tps = parseFloat(match[1]);
      }
    }
  }

  getStats(): ServerStats {
    return { ...this.stats };
  }

  setConfig(newConfig: Partial<ServerConfig>): void {
    this.config = { ...this.config, ...newConfig };
    writeFileSync(this.configPath, this.tomlStringify(this.config));
  }

  getConfig(): ServerConfig {
    return { ...this.config };
  }

  getPlayers(): Player[] {
    return [...this.players];
  }

  kickPlayer(playerId: string): void {
    if (this.serverProcess) {
      this.serverProcess.stdin?.write(`kick ${playerId}\n`);
    }
  }

  banPlayer(playerId: string): void {
    const player = this.players.find((p) => p.id === playerId);
    if (player) {
      this.config.banned.push(player.name);
      this.kickPlayer(playerId);
    }
  }

  unbanPlayer(playerName: string): void {
    this.config.banned = this.config.banned.filter((b) => b !== playerName);
  }

  addToWhitelist(playerName: string): void {
    if (!this.config.whitelist.includes(playerName)) {
      this.config.whitelist.push(playerName);
    }
  }

  removeFromWhitelist(playerName: string): void {
    this.config.whitelist = this.config.whitelist.filter((w) => w !== playerName);
  }

  setAutoRestart(enabled: boolean): void {
    this.autoRestartEnabled = enabled;
  }

  setAutoStart(enabled: boolean): void {
    this.autoStartEnabled = enabled;
  }

  isRunning(): boolean {
    return this.stats.status === 'running';
  }
}

export const beammpService = new BeamMPService();
