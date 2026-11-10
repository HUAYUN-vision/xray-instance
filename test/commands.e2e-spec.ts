import { type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { type App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { setupApp } from '../src/setup-app';

describe('Commands (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication({ logger: false });
    setupApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /commands runs commands and returns stdout', () => {
    return request(app.getHttpServer())
      .post('/commands')
      .send({ commands: ['echo hello'] })
      .expect(201)
      .expect(['hello\n']);
  });

  it('POST /commands returns 400 on failing command', () => {
    return request(app.getHttpServer())
      .post('/commands')
      .send({ commands: ['exit 1'] })
      .expect(400);
  });

  it('POST /commands validates body', () => {
    return request(app.getHttpServer()).post('/commands').send({ commands: [] }).expect(400);
  });
});
