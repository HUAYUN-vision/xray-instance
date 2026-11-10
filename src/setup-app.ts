import { type INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import helmet from 'helmet';
import { AppConfigService } from './config/app-config.service';

/** Shared app setup — used by main.ts and e2e tests. */
export function setupApp(app: INestApplication): void {
  const config = app.get(AppConfigService);

  app.use(helmet());
  app.enableCors({ origin: config.get('CORS_ORIGIN') });
  app.setGlobalPrefix(config.get('GLOBAL_PREFIX'), { exclude: ['health', 'health/{*path}'] });
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.enableShutdownHooks();
}
