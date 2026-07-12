import { spawn, ChildProcess } from 'child_process';
import * as pty from 'node-pty';
import os from 'os';

export interface TerminalSession {
  id: string;
  pid: number;
  createdAt: number;
  lastActivity: number;
  cols: number;
  rows: number;
  shell: string;
}

export class TerminalService {
  private sessions: Map<string, { ptyProcess: pty.IPty; session: TerminalSession }> = new Map();
  private sessionLogs: Map<string, string[]> = new Map();
  private maxLogSize = 10000;

  constructor() {
    // Cleanup stale sessions every 5 minutes
    setInterval(() => this.cleanupStaleSessions(), 5 * 60 * 1000);
  }

  createSession(cols: number = 120, rows: number = 40): TerminalSession {
    const id = `term_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const shell = process.env.SHELL || '/bin/bash';

    try {
      const ptyProcess = pty.spawn(shell, [], {
        name: 'xterm-256color',
        cols,
        rows,
        cwd: process.env.HOME || '/root',
        env: process.env as any,
      });

      const session: TerminalSession = {
        id,
        pid: ptyProcess.pid,
        createdAt: Date.now(),
        lastActivity: Date.now(),
        cols,
        rows,
        shell,
      };

      this.sessions.set(id, { ptyProcess, session });
      this.sessionLogs.set(id, []);

      // Capture output
      ptyProcess.on('data', (data) => {
        this.logData(id, data.toString());
      });

      ptyProcess.on('exit', () => {
        this.sessions.delete(id);
      });

      return session;
    } catch (error) {
      console.error('Failed to create terminal session:', error);
      throw error;
    }
  }

  getSession(sessionId: string): TerminalSession | undefined {
    const entry = this.sessions.get(sessionId);
    if (entry) {
      entry.session.lastActivity = Date.now();
      return entry.session;
    }
    return undefined;
  }

  listSessions(): TerminalSession[] {
    return Array.from(this.sessions.values()).map((e) => e.session);
  }

  write(sessionId: string, data: string): void {
    const entry = this.sessions.get(sessionId);
    if (entry) {
      entry.session.lastActivity = Date.now();
      entry.ptyProcess.write(data);
    }
  }

  resize(sessionId: string, cols: number, rows: number): void {
    const entry = this.sessions.get(sessionId);
    if (entry) {
      entry.ptyProcess.resize(cols, rows);
      entry.session.cols = cols;
      entry.session.rows = rows;
      entry.session.lastActivity = Date.now();
    }
  }

  kill(sessionId: string): void {
    const entry = this.sessions.get(sessionId);
    if (entry) {
      try {
        entry.ptyProcess.kill();
      } catch {
        // Already killed
      }
      this.sessions.delete(sessionId);
      this.sessionLogs.delete(sessionId);
    }
  }

  private logData(sessionId: string, data: string): void {
    let logs = this.sessionLogs.get(sessionId) || [];
    logs.push(data);
    if (logs.length > this.maxLogSize) {
      logs = logs.slice(-this.maxLogSize);
    }
    this.sessionLogs.set(sessionId, logs);
  }

  getLogs(sessionId: string, lines: number = 100): string {
    const logs = this.sessionLogs.get(sessionId) || [];
    return logs.slice(-lines).join('');
  }

  private cleanupStaleSessions(): void {
    const now = Date.now();
    const staleTimeout = 30 * 60 * 1000; // 30 minutes

    for (const [id, entry] of this.sessions.entries()) {
      if (now - entry.session.lastActivity > staleTimeout) {
        this.kill(id);
      }
    }
  }

  killAll(): void {
    for (const id of this.sessions.keys()) {
      this.kill(id);
    }
  }
}

export const terminalService = new TerminalService();
