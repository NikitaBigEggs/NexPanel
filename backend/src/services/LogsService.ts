import { execAsync } from '../utils/exec.js';
import { existsSync, readdirSync, statSync } from 'fs';
import path from 'path';

export interface LogFile {
  name: string;
  path: string;
  size: number;
  modified: number;
  type: 'system' | 'application' | 'security';
}

export interface LogEntry {
  timestamp: number;
  level: 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  message: string;
  source: string;
}

export class LogsService {
  private logsDir = '/var/log';
  private commonLogFiles = [
    { name: 'syslog', type: 'system' as const },
    { name: 'kern.log', type: 'system' as const },
    { name: 'auth.log', type: 'security' as const },
    { name: 'secure', type: 'security' as const },
    { name: 'messages', type: 'system' as const },
  ];

  async listLogFiles(): Promise<LogFile[]> {
    const files: LogFile[] = [];

    try {
      // Add common log files
      for (const logFile of this.commonLogFiles) {
        const filePath = path.join(this.logsDir, logFile.name);
        if (existsSync(filePath)) {
          const stat = statSync(filePath);
          files.push({
            name: logFile.name,
            path: filePath,
            size: stat.size,
            modified: stat.mtime.getTime(),
            type: logFile.type,
          });
        }
      }

      // Add journal logs
      files.push({
        name: 'journal (system)',
        path: 'journal',
        size: 0,
        modified: Date.now(),
        type: 'system',
      });
    } catch (error) {
      console.error('Failed to list log files:', error);
    }

    return files.sort((a, b) => b.modified - a.modified);
  }

  async readLog(logName: string, lines: number = 100): Promise<string> {
    try {
      if (logName === 'journal') {
        const { stdout } = await execAsync(`journalctl -n ${lines} --no-pager 2>/dev/null || echo ""`, {
          timeout: 10000,
        });
        return stdout;
      }

      const filePath = path.join(this.logsDir, logName);
      if (!existsSync(filePath)) {
        return '';
      }

      const { stdout } = await execAsync(`tail -n ${lines} "${filePath}" 2>/dev/null || echo ""`, {
        timeout: 10000,
      });
      return stdout;
    } catch (error) {
      console.error(`Failed to read log ${logName}:`, error);
      return '';
    }
  }

  async tailLog(logName: string, lines: number = 50): Promise<string> {
    return this.readLog(logName, lines);
  }

  async searchLogs(logName: string, query: string, lines: number = 100): Promise<string> {
    try {
      if (logName === 'journal') {
        const { stdout } = await execAsync(
          `journalctl -n ${lines} --grep="${query}" --no-pager 2>/dev/null || echo ""`,
          { timeout: 10000 }
        );
        return stdout;
      }

      const filePath = path.join(this.logsDir, logName);
      if (!existsSync(filePath)) {
        return '';
      }

      const { stdout } = await execAsync(
        `grep -i "${query}" "${filePath}" | tail -n ${lines} 2>/dev/null || echo ""`,
        { timeout: 10000 }
      );
      return stdout;
    } catch (error) {
      console.error(`Failed to search logs:`, error);
      return '';
    }
  }

  async filterLogs(
    logName: string,
    level?: 'ERROR' | 'WARNING' | 'INFO',
    lines: number = 100
  ): Promise<string> {
    try {
      const content = await this.readLog(logName, lines * 2);
      const pattern = level ? `(${level}|error|warn|critical)` : '.+';

      const filtered = content
        .split('\n')
        .filter((line) => new RegExp(pattern, 'i').test(line))
        .slice(-lines)
        .join('\n');

      return filtered;
    } catch (error) {
      console.error('Failed to filter logs:', error);
      return '';
    }
  }

  async clearLog(logName: string): Promise<boolean> {
    try {
      if (logName === 'journal') {
        await execAsync('journalctl --vacuum=0 2>/dev/null || true', { timeout: 10000 });
        return true;
      }

      const filePath = path.join(this.logsDir, logName);
      await execAsync(`truncate -s 0 "${filePath}" 2>/dev/null || true`, { timeout: 10000 });
      return true;
    } catch (error) {
      console.error(`Failed to clear log ${logName}:`, error);
      return false;
    }
  }

  async getLogStats(logName: string): Promise<{
    size: number;
    lines: number;
    lastModified: number;
    errors: number;
    warnings: number;
  }> {
    try {
      let size = 0;
      let lines = 0;
      let lastModified = 0;

      if (logName === 'journal') {
        const { stdout: sizeOutput } = await execAsync(
          'journalctl --disk-usage 2>/dev/null | grep -oP "\\d+\\.\\d+[MG]" | head -1 || echo "0M"',
          { timeout: 10000 }
        );
        size = this.parseSize(sizeOutput.trim());

        const { stdout: linesOutput } = await execAsync('journalctl | wc -l', { timeout: 10000 });
        lines = parseInt(linesOutput.trim()) || 0;

        lastModified = Date.now();
      } else {
        const filePath = path.join(this.logsDir, logName);
        if (existsSync(filePath)) {
          const stat = statSync(filePath);
          size = stat.size;
          lastModified = stat.mtime.getTime();

          const { stdout: linesOutput } = await execAsync(`wc -l < "${filePath}" 2>/dev/null || echo 0`, {
            timeout: 10000,
          });
          lines = parseInt(linesOutput.trim()) || 0;
        }
      }

      const content = await this.readLog(logName, 1000);
      const errors = (content.match(/error|ERROR|failed|FAILED/gi) || []).length;
      const warnings = (content.match(/warn|WARNING|notice|NOTICE/gi) || []).length;

      return { size, lines, lastModified, errors, warnings };
    } catch (error) {
      console.error(`Failed to get stats for ${logName}:`, error);
      return { size: 0, lines: 0, lastModified: 0, errors: 0, warnings: 0 };
    }
  }

  private parseSize(sizeStr: string): number {
    const match = sizeStr.match(/(\d+(?:\.\d+)?)\s*([MG])/i);
    if (!match) return 0;

    const value = parseFloat(match[1]);
    const unit = match[2].toUpperCase();

    if (unit === 'G') return value * 1024 * 1024 * 1024;
    if (unit === 'M') return value * 1024 * 1024;
    return value;
  }

  async getRecentErrors(logName: string, limit: number = 20): Promise<string[]> {
    try {
      const content = await this.readLog(logName, limit * 5);
      return content
        .split('\n')
        .filter((line) => /error|ERROR|failed|FAILED|critical|CRITICAL/i.test(line))
        .slice(-limit);
    } catch (error) {
      console.error('Failed to get recent errors:', error);
      return [];
    }
  }

  async exportLogs(logName: string, format: 'txt' | 'json' = 'txt'): Promise<string> {
    try {
      const content = await this.readLog(logName, 10000);

      if (format === 'json') {
        const lines = content.split('\n').filter((line) => line.trim());
        const json = {
          logFile: logName,
          exportDate: new Date().toISOString(),
          entries: lines,
        };
        return JSON.stringify(json, null, 2);
      }

      return content;
    } catch (error) {
      console.error('Failed to export logs:', error);
      return '';
    }
  }
}

export const logsService = new LogsService();
