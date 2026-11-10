import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

@Injectable()
export class CommandsService {
  private readonly logger = new Logger(CommandsService.name);

  /** Runs commands one by one; stops on the first one that fails or writes to stderr. */
  async runCommands(commands: string[]): Promise<string[]> {
    const result: string[] = [];

    for (const command of commands) {
      let stdout: string;
      let stderr: string;

      try {
        ({ stdout, stderr } = await execAsync(command));
      } catch (error) {
        const { stderr: errStderr, message } = error as { stderr?: string; message?: string };
        const reason = errStderr || message || String(error);
        this.logger.error(reason);
        throw new BadRequestException(reason);
      }

      if (stderr) {
        this.logger.error(stderr);
        throw new BadRequestException(stderr);
      }

      result.push(stdout);
    }

    return result;
  }
}
