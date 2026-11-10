import { timingSafeEqual } from 'node:crypto';
import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AppConfigService } from '../../config/app-config.service';

export const API_KEY_HEADER = 'x-api-key';

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

/** Проверяет заголовок `X-API-Key` по `API_KEY`. */
@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly config: AppConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<{ headers: Record<string, unknown> }>();
    const provided = req.headers[API_KEY_HEADER];
    if (typeof provided === 'string' && safeEqual(provided, this.config.get('API_KEY'))) {
      return true;
    }
    throw new UnauthorizedException('invalid api key');
  }
}
