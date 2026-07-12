import { execAsync } from '../utils/exec.js';
import os from 'os';

export interface MetricsSnapshot {
  timestamp: number;
  cpu: number;
  ram: number;
  swap: number;
  disk: number;
  networkIn: number;
  networkOut: number;
  temperature: number;
  processes: ProcessInfo[];
}

export interface ProcessInfo {
  pid: number;
  name: string;
  cpu: number;
  memory: number;
  state: string;
}

export interface MetricsHistory {
  cpu: Array<{ time: number; value: number }>;
  ram: Array<{ time: number; value: number }>;
  swap: Array<{ time: number; value: number }>;
  disk: Array<{ time: number; value: number }>;
  network: Array<{ time: number; bytesIn: number; bytesOut: number }>;
  temperature: Array<{ time: number; value: number }>;
}

export class MonitoringService {
  private metricsHistory: MetricsHistory = {
    cpu: [],
    ram: [],
    swap: [],
    disk: [],
    network: [],
    temperature: [],
  };
  private maxHistoryPoints = 120; // 2 hours at 1-minute intervals
  private lastCpuStats: { user: number; system: number; idle: number } | null = null;
  private lastNetworkStats: { bytesIn: number; bytesOut: number } | null = null;

  constructor() {
    this.initializeCpuStats();
  }

  private initializeCpuStats(): void {
    const cpus = os.cpus();
    let totalUser = 0,
      totalSystem = 0,
      totalIdle = 0;
    for (const cpu of cpus) {
      totalUser += cpu.times.user;
      totalSystem += cpu.times.sys;
      totalIdle += cpu.times.idle;
    }
    this.lastCpuStats = { user: totalUser, system: totalSystem, idle: totalIdle };
  }

  async getAllMetrics(): Promise<MetricsSnapshot> {
    const timestamp = Date.now();

    const cpu = this.calculateCpuUsage();
    const ramUsage = this.getRamUsage();
    const diskUsage = await this.getDiskUsage();
    const swapUsage = await this.getSwapUsage();
    const temp = await this.getTemperature();
    const network = await this.getNetworkStats();
    const processes = await this.getTopProcesses(10);

    // Record in history
    this.recordHistory(timestamp, cpu, ramUsage.percent, swapUsage, diskUsage, temp, network);

    return {
      timestamp,
      cpu,
      ram: ramUsage.percent,
      swap: swapUsage,
      disk: diskUsage,
      networkIn: network.bytesIn,
      networkOut: network.bytesOut,
      temperature: temp,
      processes,
    };
  }

  private calculateCpuUsage(): number {
    const cpus = os.cpus();
    let totalUser = 0,
      totalSystem = 0,
      totalIdle = 0;

    for (const cpu of cpus) {
      totalUser += cpu.times.user;
      totalSystem += cpu.times.sys;
      totalIdle += cpu.times.idle;
    }

    if (!this.lastCpuStats) {
      this.lastCpuStats = { user: totalUser, system: totalSystem, idle: totalIdle };
      return 0;
    }

    const userDiff = totalUser - this.lastCpuStats.user;
    const systemDiff = totalSystem - this.lastCpuStats.system;
    const idleDiff = totalIdle - this.lastCpuStats.idle;

    const totalDiff = userDiff + systemDiff + idleDiff;
    const usage = totalDiff === 0 ? 0 : ((userDiff + systemDiff) / totalDiff) * 100;

    this.lastCpuStats = { user: totalUser, system: totalSystem, idle: totalIdle };

    return Math.min(100, Math.max(0, usage));
  }

  private getRamUsage(): { used: number; total: number; percent: number } {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    return {
      total: totalMem,
      used: usedMem,
      percent: (usedMem / totalMem) * 100,
    };
  }

  async getDiskUsage(): Promise<number> {
    try {
      const { stdout } = await execAsync('df / 2>/dev/null | tail -1 | awk \'{print $5}\'');
      const percent = parseInt(stdout.trim());
      return Math.min(100, Math.max(0, percent));
    } catch {
      return 0;
    }
  }

  async getSwapUsage(): Promise<number> {
    try {
      const { stdout } = await execAsync('free | grep Swap | awk \'{printf("%.0f", ($3/$2)*100)}\'');
      const percent = parseInt(stdout.trim()) || 0;
      return Math.min(100, Math.max(0, percent));
    } catch {
      return 0;
    }
  }

  async getTemperature(): Promise<number> {
    try {
      const { stdout } = await execAsync(
        'cat /sys/class/thermal/thermal_zone0/temp 2>/dev/null || cat /sys/bus/platform/devices/coretemp.0/hwmon/hwmon*/temp1_input 2>/dev/null || echo 0'
      );
      const temp = parseInt(stdout.trim());
      return temp > 100 ? temp / 1000 : temp;
    } catch {
      return 0;
    }
  }

  async getNetworkStats(): Promise<{ bytesIn: number; bytesOut: number }> {
    try {
      const { stdout } = await execAsync(
        'cat /proc/net/dev 2>/dev/null | grep -E "^\\s+(eth|wlan|en)" | awk \'{sum1+=$2; sum2+=$10} END {print sum1, sum2}\' || echo "0 0"'
      );
      const [bytesIn, bytesOut] = stdout.trim().split(' ').map(Number);
      return { bytesIn, bytesOut };
    } catch {
      return { bytesIn: 0, bytesOut: 0 };
    }
  }

  async getTopProcesses(limit: number = 10): Promise<ProcessInfo[]> {
    try {
      const { stdout } = await execAsync(
        `ps aux --sort=-%cpu | head -${limit + 1} | tail -${limit} | awk '{print $2, $1, $3, $4, $8}'`
      );

      const processes: ProcessInfo[] = [];
      for (const line of stdout.trim().split('\n')) {
        if (line.trim()) {
          const parts = line.trim().split(/\s+/);
          processes.push({
            pid: parseInt(parts[0]),
            name: parts[1],
            cpu: parseFloat(parts[2]),
            memory: parseFloat(parts[3]),
            state: parts[4],
          });
        }
      }
      return processes;
    } catch {
      return [];
    }
  }

  private recordHistory(
    timestamp: number,
    cpu: number,
    ram: number,
    swap: number,
    disk: number,
    temp: number,
    network: { bytesIn: number; bytesOut: number }
  ): void {
    // CPU history
    this.metricsHistory.cpu.push({ time: timestamp, value: cpu });
    if (this.metricsHistory.cpu.length > this.maxHistoryPoints) {
      this.metricsHistory.cpu.shift();
    }

    // RAM history
    this.metricsHistory.ram.push({ time: timestamp, value: ram });
    if (this.metricsHistory.ram.length > this.maxHistoryPoints) {
      this.metricsHistory.ram.shift();
    }

    // Swap history
    this.metricsHistory.swap.push({ time: timestamp, value: swap });
    if (this.metricsHistory.swap.length > this.maxHistoryPoints) {
      this.metricsHistory.swap.shift();
    }

    // Disk history
    this.metricsHistory.disk.push({ time: timestamp, value: disk });
    if (this.metricsHistory.disk.length > this.maxHistoryPoints) {
      this.metricsHistory.disk.shift();
    }

    // Temperature history
    this.metricsHistory.temperature.push({ time: timestamp, value: temp });
    if (this.metricsHistory.temperature.length > this.maxHistoryPoints) {
      this.metricsHistory.temperature.shift();
    }

    // Network history
    this.metricsHistory.network.push({
      time: timestamp,
      bytesIn: network.bytesIn,
      bytesOut: network.bytesOut,
    });
    if (this.metricsHistory.network.length > this.maxHistoryPoints) {
      this.metricsHistory.network.shift();
    }
  }

  getHistory(): MetricsHistory {
    return { ...this.metricsHistory };
  }

  getHistorySince(minutes: number): MetricsHistory {
    const cutoffTime = Date.now() - minutes * 60 * 1000;

    return {
      cpu: this.metricsHistory.cpu.filter((p) => p.time >= cutoffTime),
      ram: this.metricsHistory.ram.filter((p) => p.time >= cutoffTime),
      swap: this.metricsHistory.swap.filter((p) => p.time >= cutoffTime),
      disk: this.metricsHistory.disk.filter((p) => p.time >= cutoffTime),
      network: this.metricsHistory.network.filter((p) => p.time >= cutoffTime),
      temperature: this.metricsHistory.temperature.filter((p) => p.time >= cutoffTime),
    };
  }

  getStats(): {
    cpu: { current: number; avg: number; max: number; min: number };
    ram: { current: number; avg: number; max: number; min: number };
    temp: { current: number; avg: number; max: number; min: number };
  } {
    const cpu = this.metricsHistory.cpu.map((p) => p.value);
    const ram = this.metricsHistory.ram.map((p) => p.value);
    const temp = this.metricsHistory.temperature.map((p) => p.value);

    const calculateStats = (values: number[]) => ({
      current: values.length > 0 ? values[values.length - 1] : 0,
      avg: values.length > 0 ? values.reduce((a, b) => a + b) / values.length : 0,
      max: values.length > 0 ? Math.max(...values) : 0,
      min: values.length > 0 ? Math.min(...values) : 0,
    });

    return {
      cpu: calculateStats(cpu),
      ram: calculateStats(ram),
      temp: calculateStats(temp),
    };
  }
}

export const monitoringService = new MonitoringService();
