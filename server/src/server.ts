import { createApp } from './app';
import { connectDatabase } from './config/db';
import { env } from './config/env';
import { logger } from './utils/logger';
import { seedDevAdmin, seedDevCustomer, seedDevCatalog } from './config/devSeed';
import { expireStaleOrders } from './jobs/expireOrders.job';

// In-process interval, no Redis/queue required — this is the "keep it simple
// until Redis is actually enabled" scheduler the design doc calls for.
// Swap for a BullMQ repeatable job if this ever needs to run across
// multiple server instances without each one polling independently.
const ORDER_EXPIRY_CHECK_INTERVAL_MS = 5 * 60 * 1000;

async function main() {
  await connectDatabase();

  if (env.NODE_ENV === 'development') {
    await seedDevAdmin();
    await seedDevCustomer();
    await seedDevCatalog();
  }

  setInterval(() => {
    expireStaleOrders().catch((err) => {
      logger.error('Order expiry job failed', { message: err instanceof Error ? err.message : String(err) });
    });
  }, ORDER_EXPIRY_CHECK_INTERVAL_MS);

  const app = createApp();

  app.listen(env.PORT, () => {
    logger.info(`Server listening on port ${env.PORT}`, { env: env.NODE_ENV });
  });
}

main().catch((err) => {
  logger.error('Failed to start server', { message: err instanceof Error ? err.message : String(err) });
  process.exit(1);
});
