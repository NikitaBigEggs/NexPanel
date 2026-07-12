import { exec } from 'child_process';
import { promisify } from 'util';

export const execAsync = promisify(exec);

export async function executeCommand(command: string, options: { timeout?: number } = {}): Promise<string> {
  const { timeout = 30000 } = options;
  try {
    const { stdout } = await execAsync(command, { timeout });
    return stdout.trim();
  } catch (error: any) {
    throw new Error(`Command failed: ${error.message}`);
  }
}

export function executeCommandSync(command: string): string {
  const { execSync } = require('child_process');
  try {
    return execSync(command, { encoding: 'utf-8', timeout: 30000 }).trim();
  } catch (error: any) {
    throw new Error(`Command failed: ${error.message}`);
  }
}
