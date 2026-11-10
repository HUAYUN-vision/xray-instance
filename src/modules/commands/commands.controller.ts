import { Body, Controller, Post, VERSION_NEUTRAL } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CommandsService } from './commands.service';
import { CommandsDto } from './dto/commands.dto';

/** Path is kept as `/commands` (no prefix, no version) — passimx-vpn-bot relies on it. */
@ApiTags('commands')
@Controller({ path: 'commands', version: VERSION_NEUTRAL })
export class CommandsController {
  constructor(private readonly commandsService: CommandsService) {}

  /** Runs shell commands sequentially and returns stdout of each one. */
  @Post()
  runCommands(@Body() body: CommandsDto): Promise<string[]> {
    return this.commandsService.runCommands(body.commands);
  }
}
