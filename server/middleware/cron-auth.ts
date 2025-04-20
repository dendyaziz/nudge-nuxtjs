import { defineEventHandler } from 'h3';
import { verifyCronToken } from '../utils/auth';

// List of paths that should be protected by cron authentication
const CRON_PATHS = [
  '/api/cron/process-queue',
  '/api/process-queue', // Also protect the internal process-queue endpoint
];

export default defineEventHandler(async (event) => {
  // Get the request path
  const path = event.node.req.url || '';

  // Only apply cron authentication to cron paths
  if (CRON_PATHS.some(cronPath => path.startsWith(cronPath))) {
    try {
      // Verify the cron token
      verifyCronToken(event);
    } catch (error) {
      // Let the error propagate to be handled by the API
      throw error;
    }
  }
});
