import { execAsync } from '../utils/exec.js';

export interface Container {
  id: string;
  name: string;
  image: string;
  status: string;
  state: 'running' | 'exited' | 'paused';
  ports: string[];
  created: number;
  uptime: number;
  cpu?: number;
  memory?: number;
}

export interface DockerImage {
  id: string;
  repository: string;
  tag: string;
  size: number;
  created: number;
}

export class DockerService {
  async isDockerAvailable(): Promise<boolean> {
    try {
      await execAsync('docker --version 2>/dev/null', { timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  async listContainers(all: boolean = false): Promise<Container[]> {
    try {
      const format = "{{.ID}}|{{.Names}}|{{.Image}}|{{.Status}}|{{.State}}|{{.Ports}}|{{.CreatedAt}}";
      const cmd = `docker ps ${all ? '-a' : ''} --format "${format}" 2>/dev/null || echo ""`;
      const { stdout } = await execAsync(cmd, { timeout: 10000 });

      const containers: Container[] = [];
      for (const line of stdout.trim().split('\n')) {
        if (line) {
          const parts = line.split('|');
          if (parts.length >= 7) {
            containers.push({
              id: parts[0].slice(0, 12),
              name: parts[1],
              image: parts[2],
              status: parts[3],
              state: (parts[4].toLowerCase() as any) || 'exited',
              ports: parts[5] ? parts[5].split(', ') : [],
              created: new Date(parts[6]).getTime(),
              uptime: 0,
            });
          }
        }
      }
      return containers;
    } catch (error) {
      console.error('Failed to list containers:', error);
      return [];
    }
  }

  async listImages(): Promise<DockerImage[]> {
    try {
      const format = "{{.ID}}|{{.Repository}}|{{.Tag}}|{{.Size}}|{{.CreatedAt}}";
      const { stdout } = await execAsync(`docker images --format "${format}" 2>/dev/null || echo ""`, {
        timeout: 10000,
      });

      const images: DockerImage[] = [];
      for (const line of stdout.trim().split('\n')) {
        if (line && !line.includes('REPOSITORY')) {
          const parts = line.split('|');
          if (parts.length >= 5) {
            const sizeStr = parts[3];
            const size = this.parseSize(sizeStr);
            images.push({
              id: parts[0].slice(0, 12),
              repository: parts[1],
              tag: parts[2],
              size,
              created: new Date(parts[4]).getTime(),
            });
          }
        }
      }
      return images;
    } catch (error) {
      console.error('Failed to list images:', error);
      return [];
    }
  }

  async startContainer(containerId: string): Promise<boolean> {
    try {
      await execAsync(`docker start ${containerId} 2>/dev/null`, { timeout: 10000 });
      return true;
    } catch {
      return false;
    }
  }

  async stopContainer(containerId: string): Promise<boolean> {
    try {
      await execAsync(`docker stop ${containerId} 2>/dev/null`, { timeout: 10000 });
      return true;
    } catch {
      return false;
    }
  }

  async restartContainer(containerId: string): Promise<boolean> {
    try {
      await execAsync(`docker restart ${containerId} 2>/dev/null`, { timeout: 10000 });
      return true;
    } catch {
      return false;
    }
  }

  async removeContainer(containerId: string, force: boolean = false): Promise<boolean> {
    try {
      const forceFlag = force ? '-f' : '';
      await execAsync(`docker rm ${forceFlag} ${containerId} 2>/dev/null`, { timeout: 10000 });
      return true;
    } catch {
      return false;
    }
  }

  async getContainerLogs(containerId: string, lines: number = 100): Promise<string> {
    try {
      const { stdout } = await execAsync(`docker logs --tail ${lines} ${containerId} 2>/dev/null || echo ""`, {
        timeout: 10000,
      });
      return stdout;
    } catch {
      return '';
    }
  }

  async getContainerStats(containerId: string): Promise<{ cpu: number; memory: number }> {
    try {
      const { stdout } = await execAsync(`docker stats --no-stream --format "{{.CPUPerc}}|{{.MemPerc}}" ${containerId} 2>/dev/null || echo "0%|0%"`, {
        timeout: 10000,
      });
      const parts = stdout.trim().split('|');
      const cpu = parseFloat(parts[0]) || 0;
      const memory = parseFloat(parts[1]) || 0;
      return { cpu, memory };
    } catch {
      return { cpu: 0, memory: 0 };
    }
  }

  async pullImage(image: string): Promise<boolean> {
    try {
      await execAsync(`docker pull ${image} 2>/dev/null`, { timeout: 60000 });
      return true;
    } catch {
      return false;
    }
  }

  async removeImage(imageId: string, force: boolean = false): Promise<boolean> {
    try {
      const forceFlag = force ? '-f' : '';
      await execAsync(`docker rmi ${forceFlag} ${imageId} 2>/dev/null`, { timeout: 10000 });
      return true;
    } catch {
      return false;
    }
  }

  async getDockerInfo(): Promise<{ version: string; containers: number; images: number }> {
    try {
      const { stdout: version } = await execAsync('docker --version 2>/dev/null || echo "Docker not available"', {
        timeout: 5000,
      });
      const containers = await this.listContainers(true);
      const images = await this.listImages();

      return {
        version: version.trim(),
        containers: containers.length,
        images: images.length,
      };
    } catch {
      return { version: 'Unknown', containers: 0, images: 0 };
    }
  }

  private parseSize(sizeStr: string): number {
    const match = sizeStr.match(/(\d+(?:\.\d+)?)\s*([KMGT]?)B/i);
    if (!match) return 0;

    const value = parseFloat(match[1]);
    const unit = (match[2] || '').toUpperCase();

    const multipliers: Record<string, number> = {
      K: 1024,
      M: 1024 * 1024,
      G: 1024 * 1024 * 1024,
      T: 1024 * 1024 * 1024 * 1024,
      '': 1,
    };

    return value * (multipliers[unit] || 1);
  }
}

export const dockerService = new DockerService();
