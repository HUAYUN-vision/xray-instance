import { validateEnv } from './env.validation';

const required = { API_KEY: 'x'.repeat(32) };

describe('validateEnv', () => {
  it('applies defaults', () => {
    const env = validateEnv({ ...required });
    expect(env.PORT).toBe(3000);
    expect(env.NODE_ENV).toBe('development');
    expect(env.SWAGGER_ENABLED).toBe(false);
  });

  it('coerces values', () => {
    const env = validateEnv({ ...required, PORT: '8080', SWAGGER_ENABLED: 'true' });
    expect(env.PORT).toBe(8080);
    expect(env.SWAGGER_ENABLED).toBe(true);
  });

  it('throws on invalid values', () => {
    expect(() => validateEnv({ ...required, PORT: 'abc' })).toThrow(/PORT/);
  });

  it('requires API_KEY', () => {
    expect(() => validateEnv({})).toThrow(/API_KEY/);
    expect(() => validateEnv({ API_KEY: 'short' })).toThrow(/API_KEY/);
  });
});
