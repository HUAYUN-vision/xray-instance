import { Controller, Get, VERSION_NEUTRAL } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { HealthCheck, HealthCheckService, MemoryHealthIndicator } from '@nestjs/terminus';

@ApiTags('health')
@Controller({ path: 'health', version: VERSION_NEUTRAL })
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly memory: MemoryHealthIndicator,
  ) {}

  /** Liveness probe: process is up. */
  @Get('live')
  @HealthCheck()
  live() {
    return this.health.check([]);
  }

  /** Readiness probe: dependencies are OK. Add DB / Redis / HTTP indicators here. */
  @Get('ready')
  @HealthCheck()
  ready() {
    return this.health.check([() => this.memory.checkHeap('memory_heap', 512 * 1024 * 1024)]);
  }
}
