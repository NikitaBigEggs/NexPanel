import os from 'os';
import { exec, execSync } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface SystemStats {
  cpu: number;
  ram: number;
  disk: number;
  temperature: number;
  uptime: number;
  networkIn: number;
  networkOut: number;
  onlineUsers: number;
  cpuUsageHistory: Array<{ time: string; value: number }>;
  ramUsageHistory: Array<{ time: string; value: number }>;
  timestamp: number;
}

export class SystemService {
  private bootTime: number;
  private cpuHistory: Array<{ time: string; value: number }> = [];
  private ramHistory: Array<{ time: string; value: number }> = [];
  private lastNetworkStats: { bytesIn: number; bytesOut: number } | null = null;
  private lastCpuStats: { user: number; system: number; idle: number } | null = null;
  private maxHistory = 60;

  constructor() {
    this.bootTime = os.uptime();
    this.initializeCpuStats();
  }

  private initializeCpuStats(): void {
    try {
      const cpus = os.cpus();
      let totalUser = 0,
        totalSystem = 0,
        totalIdle = 0;
      for (const cpu of cpus) {
        totalUser += cpu.times.user;
        totalSystem += cpu.times.sys;
        totalIdle += cpu.times.idle;
      }
      this.lastCpuStats = {
        user: totalUser,
        system: totalSystem,
        idle: totalIdle,
      };
    } catch (e) {
      console.error('Failed to initialize CPU stats:', e);
    }
  }

  private calculateCpuUsage(): number {
    try {
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
    } catch (e) {
      console.error('Failed to calculate CPU usage:', e);
      return 0;
    }
  }

  getRamUsage(): { used: number; total: number; percent: number } {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    return {
      used: usedMem,
      total: totalMem,
      percent: Math.min(100, Math.max(0, (usedMem / totalMem) * 100)),
    };
  }

  async getDiskUsage(): Promise<{ used: number; total: number; percent: number }> {
    try {
      const { stdout } = await execAsync('df / 2>/dev/null | tail -1 | awk \'{print $2, $3, $5}\'');
      const [total, used, percent] = stdout.trim().split(/\s+/).map(Number);
      return {
        total: total * 1024,
        used: used * 1024,
        percent: Math.min(100, Math.max(0, percent)),
      };
    } catch (e) {
      console.error('Failed to get disk usage:', e);
      return { total: 0, used: 0, percent: 0 };
    }
  }

  async getTemperature(): Promise<number> {
    try {
      const { stdout } = await execAsync(
        'cat /sys/class/thermal/thermal_zone0/temp 2>/dev/null || cat /sys/bus/platform/devices/coretemp.0/hwmon/hwmon*/temp1_input 2>/dev/null || echo 0'
      );
      const temp = parseInt(stdout.trim());
      return temp > 100 ? temp / 1000 : temp; // Handle both millidegrees and degrees
    } catch {
      return 0;
    }
  }

  getUptimeHours(): number {
    return Math.floor(os.uptime() / 3600);
  }

  async getOnlineUsers(): Promise<number> {
    try {
      const { stdout } = await execAsync('who | wc -l');
      return parseInt(stdout.trim()) || 1;
    } catch {
      return 1;
    }
  }

  async getNetworkStats(): Promise<{ bytesIn: number; bytesOut: number; speedIn: number; speedOut: number }> {
    try {
      const { stdout } = await execAsync(
        'cat /proc/net/dev 2>/dev/null | grep -E "^\\s+(eth|wlan|en)" | awk \'{sum1+=$2; sum2+=$10} END {print sum1, sum2}\' || echo "0 0"'
      );
      const [bytesIn, bytesOut] = stdout.trim().split(' ').map(Number);

      let speedIn = 0,
        speedOut = 0;
      if (this.lastNetworkStats) {
        speedIn = Math.max(0, bytesIn - this.lastNetworkStats.bytesIn);
        speedOut = Math.max(0, bytesOut - this.lastNetworkStats.bytesOut);
      }

      this.lastNetworkStats = { bytesIn, bytesOut };

      return { bytesIn, bytesOut, speedIn, speedOut };
    } catch {
      return { bytesIn: 0, bytesOut: 0, speedIn: 0, speedOut: 0 };
    }
  }

  private recordHistory(cpu: number, ram: number): void {
    const timestamp = new Date().toLocaleTimeString();

    this.cpuHistory.push({
      time: timestamp,
      value: Math.round(cpu * 10) / 10,
    });

    this.ramHistory.push({
      time: timestamp,
      value: Math.round(ram * 10) / 10,
    });

    if (this.cpuHistory.length > this.maxHistory) {
      this.cpuHistory.shift();
    }
    if (this.ramHistory.length > this.maxHistory) {
      this.ramHistory.shift();
    }
  }

  async getAllStats(): Promise<SystemStats> {
    const cpu = this.calculateCpuUsage();
    const ram = this.getRamUsage();
    const disk = await this.getDiskUsage();
    const temp = await this.getTemperature();
    const network = await this.getNetworkStats();
    const onlineUsers = await this.getOnlineUsers();

    this.recordHistory(cpu, ram.percent);

    return {
      cpu,
      ram: ram.percent,
      disk: disk.percent,
      temperature: temp,
      uptime: this.getUptimeHours(),
      networkIn: network.bytesIn,
      networkOut: network.bytesOut,
      onlineUsers,
      cpuUsageHistory: this.cpuHistory,
      ramUsageHistory: this.ramHistory,
      timestamp: Date.now(),
    };
  }
}

export const systemService = new SystemService();
