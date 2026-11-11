import { Body, Controller, Post, UseGuards, VERSION_NEUTRAL } from '@nestjs/common';
import { ApiHeader, ApiTags } from '@nestjs/swagger';
import { ApiKeyGuard } from '../../common/guards/api-key.guard';
import { CommandsService } from './commands.service';
import { CommandsDto } from './dto/commands.dto';

/** Path is kept as `/commands` (no prefix, no version) — passimx-vpn-bot relies on it. */
@ApiTags('commands')
@ApiHeader({ name: 'X-API-Key', required: true })
@UseGuards(ApiKeyGuard)
@Controller({ path: 'commands', version: VERSION_NEUTRAL })
export class CommandsController {
  constructor(private readonly commandsService: CommandsService) {}

  /** Runs shell commands sequentially and returns stdout of each one. */
  @Post()
  runCommands(@Body() body: CommandsDto): Promise<string[]> {
    return this.commandsService.runCommands(body.commands);
  }
}
