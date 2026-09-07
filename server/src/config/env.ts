import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  API_VERSION: z.string().default('v1'),
  CLIENT_ORIGIN: z.string().default('http://localhost:5173'),

  MONGODB_URI: z.string().optional().default(''),

  JWT_ACCESS_SECRET: z.string().default('dev-access-secret-change-me'),
  JWT_REFRESH_SECRET: z.string().default('dev-refresh-secret-change-me'),

  SHIPPING_PROVIDER_MODE: z.enum(['mock', 'real']).default('mock'),

  PAYMENT_PROVIDER_MODE: z.enum(['mock', 'real']).default('mock'),
  PAYMENT_KEY: z.string().optional().default(''),
  PAYMENT_SECRET: z.string().optional().default(''),

  REDIS_ENABLED: z
    .string()
    .default('false')
    .transform((v) => v === 'true'),
  REDIS_URL: z.string().optional().default(''),

  PAYMENT_TIMEOUT_MINUTES: z.coerce.number().default(20),
  DEFAULT_COMMISSION_RATE_BPS: z.coerce.number().default(1500),
});

// Treat empty-string env vars (common in a committed .env.example that a dev
// hasn't filled in yet) the same as "unset", so zod defaults still apply.
const rawEnv = Object.fromEntries(
  Object.entries(process.env).map(([key, value]) => [key, value === '' ? undefined : value])
);

const parsed = envSchema.safeParse(rawEnv);

if (!parsed.success) {
  console.error('Invalid environment configuration:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;

if (
  env.NODE_ENV === 'production' &&
  (env.JWT_ACCESS_SECRET.startsWith('dev-') || env.JWT_REFRESH_SECRET.startsWith('dev-'))
) {
  console.error('Refusing to start in production with default dev JWT secrets.');
  process.exit(1);
}
