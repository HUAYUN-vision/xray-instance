import { validateEnv } from './env.validation';

describe('validateEnv', () => {
  it('applies defaults', () => {
    const env = validateEnv({});
    expect(env.PORT).toBe(3000);
    expect(env.NODE_ENV).toBe('development');
    expect(env.SWAGGER_ENABLED).toBe(false);
  });

  it('coerces values', () => {
    const env = validateEnv({ PORT: '8080', SWAGGER_ENABLED: 'true' });
    expect(env.PORT).toBe(8080);
    expect(env.SWAGGER_ENABLED).toBe(true);
  });

  it('throws on invalid values', () => {
    expect(() => validateEnv({ PORT: 'abc' })).toThrow(/PORT/);
  });
});
