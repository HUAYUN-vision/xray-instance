import { BadRequestException } from '@nestjs/common';
import { CommandsService } from './commands.service';

describe('CommandsService', () => {
  const service = new CommandsService();

  it('returns stdout of each command in order', async () => {
    await expect(service.runCommands(['echo one', 'echo two'])).resolves.toEqual([
      'one\n',
      'two\n',
    ]);
  });

  it('throws when a command exits with non-zero code', async () => {
    await expect(service.runCommands(['exit 3'])).rejects.toBeInstanceOf(BadRequestException);
  });

  it('throws when a command writes to stderr', async () => {
    await expect(service.runCommands(['echo oops >&2'])).rejects.toThrow('oops');
  });

  it('stops on the first failing command', async () => {
    await expect(service.runCommands(['false', 'echo never'])).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
