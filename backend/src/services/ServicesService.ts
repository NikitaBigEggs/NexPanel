import { execAsync } from '../utils/exec.js';

export interface Service {
  name: string;
  displayName: string;
  description: string;
  status: 'active' | 'inactive' | 'failed' | 'unknown';
  enabled: boolean;
  autoStart: boolean;
  uptime: number; // seconds
  mainPid?: number;
  memoryUsage?: number; // bytes
  cpuUsage?: number; // percentage
  restarts: number;
  lastRestart?: number;
}

export class ServicesService {
  private serviceCache: Map<string, Service> = new Map();
  private restartCounts: Map<string, number> = new Map();

  async listServices(): Promise<Service[]> {
    try {
      const { stdout } = await execAsync('systemctl list-units --all --no-pager --output=json 2>/dev/null || echo "[]"');
      const units = JSON.parse(stdout);

      const services: Service[] = [];

      for (const unit of units) {
        if (unit.type === 'service') {
          const service = await this.parseService(unit);
          if (service) {
            services.push(service);
            this.serviceCache.set(unit.unit, service);
          }
        }
      }

      return services.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      console.error('Failed to list services:', error);
      return [];
    }
  }

  private async parseService(unit: any): Promise<Service | null> {
    try {
      const name = unit.unit.replace('.service', '');
      const { stdout: statusOutput } = await execAsync(`systemctl show ${name} 2>/dev/null || echo ""`, {
        timeout: 5000,
      });

      const status = this.parseStatus(statusOutput);

      return {
        name,
        displayName: unit.description || name,
        description: unit.description || '',
        status: unit.active === 'active' ? 'active' : unit.active === 'failed' ? 'failed' : 'inactive',
        enabled: unit.enabled === 'enabled',
        autoStart: unit.enabled === 'enabled',
        uptime: this.calculateUptime(statusOutput),
        mainPid: this.extractPid(statusOutput),
        restarts: this.restartCounts.get(name) || 0,
      };
    } catch (error) {
      return null;
    }
  }

  private parseStatus(output: string): 'active' | 'inactive' | 'failed' | 'unknown' {
    if (output.includes('ActiveState=active')) return 'active';
    if (output.includes('ActiveState=inactive')) return 'inactive';
    if (output.includes('ActiveState=failed')) return 'failed';
    return 'unknown';
  }

  private calculateUptime(output: string): number {
    try {
      const match = output.match(/ActiveEnterTimestamp=(.+)/);
      if (match) {
        const startTime = new Date(match[1]).getTime();
        return Math.floor((Date.now() - startTime) / 1000);
      }
    } catch {
      // Ignore
    }
    return 0;
  }

  private extractPid(output: string): number | undefined {
    try {
      const match = output.match(/MainPID=(\d+)/);
      if (match) {
        return parseInt(match[1]);
      }
    } catch {
      // Ignore
    }
    return undefined;
  }

  async getService(name: string): Promise<Service | null> {
    try {
      const { stdout } = await execAsync(`systemctl show ${name} 2>/dev/null || echo ""`, {
        timeout: 5000,
      });

      if (!stdout) return null;

      const enabled = await this.isEnabled(name);
      const status = this.parseStatus(stdout);

      return {
        name,
        displayName: name,
        description: this.extractDescription(stdout),
        status,
        enabled,
        autoStart: enabled,
        uptime: this.calculateUptime(stdout),
        mainPid: this.extractPid(stdout),
        restarts: this.restartCounts.get(name) || 0,
      };
    } catch (error) {
      console.error(`Failed to get service ${name}:`, error);
      return null;
    }
  }

  private extractDescription(output: string): string {
    const match = output.match(/Description=(.+)/);
    return match ? match[1] : '';
  }

  async startService(name: string): Promise<boolean> {
    try {
      await execAsync(`systemctl start ${name}`, { timeout: 10000 });
      return true;
    } catch (error) {
      console.error(`Failed to start service ${name}:`, error);
      return false;
    }
  }

  async stopService(name: string): Promise<boolean> {
    try {
      await execAsync(`systemctl stop ${name}`, { timeout: 10000 });
      return true;
    } catch (error) {
      console.error(`Failed to stop service ${name}:`, error);
      return false;
    }
  }

  async restartService(name: string): Promise<boolean> {
    try {
      const count = (this.restartCounts.get(name) || 0) + 1;
      this.restartCounts.set(name, count);
      await execAsync(`systemctl restart ${name}`, { timeout: 10000 });
      return true;
    } catch (error) {
      console.error(`Failed to restart service ${name}:`, error);
      return false;
    }
  }

  async enableService(name: string): Promise<boolean> {
    try {
      await execAsync(`systemctl enable ${name}`, { timeout: 10000 });
      return true;
    } catch (error) {
      console.error(`Failed to enable service ${name}:`, error);
      return false;
    }
  }

  async disableService(name: string): Promise<boolean> {
    try {
      await execAsync(`systemctl disable ${name}`, { timeout: 10000 });
      return true;
    } catch (error) {
      console.error(`Failed to disable service ${name}:`, error);
      return false;
    }
  }

  private async isEnabled(name: string): Promise<boolean> {
    try {
      const { stdout } = await execAsync(`systemctl is-enabled ${name} 2>&1`, { timeout: 5000 });
      return stdout.includes('enabled');
    } catch {
      return false;
    }
  }

  async getLogs(name: string, lines: number = 50): Promise<string> {
    try {
      const { stdout } = await execAsync(`journalctl -u ${name} -n ${lines} --no-pager 2>/dev/null || echo ""`, {
        timeout: 10000,
      });
      return stdout;
    } catch (error) {
      console.error(`Failed to get logs for ${name}:`, error);
      return '';
    }
  }

  async reloadSystemd(): Promise<boolean> {
    try {
      await execAsync('systemctl daemon-reload', { timeout: 10000 });
      return true;
    } catch (error) {
      console.error('Failed to reload systemd:', error);
      return false;
    }
  }

  async getSystemStatus(): Promise<{
    runningServices: number;
    failedServices: number;
    totalServices: number;
  }> {
    const services = await this.listServices();
    return {
      runningServices: services.filter((s) => s.status === 'active').length,
      failedServices: services.filter((s) => s.status === 'failed').length,
      totalServices: services.length,
    };
  }
}

export const servicesService = new ServicesService();
