import { createApp } from './app';
import { connectDatabase } from './config/db';
import { env } from './config/env';
import { logger } from './utils/logger';
import { seedDevAdmin, seedDevCustomer, seedDevCatalog } from './config/devSeed';

async function main() {
  await connectDatabase();

  if (env.NODE_ENV === 'development') {
    await seedDevAdmin();
    await seedDevCustomer();
    await seedDevCatalog();
  }

  const app = createApp();

  app.listen(env.PORT, () => {
    logger.info(`Server listening on port ${env.PORT}`, { env: env.NODE_ENV });
  });
}

main().catch((err) => {
  logger.error('Failed to start server', { message: err instanceof Error ? err.message : String(err) });
  process.exit(1);
});
