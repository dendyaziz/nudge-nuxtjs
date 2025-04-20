import {defineEventHandler} from 'h3';
import {verifyFirebaseToken} from '../utils/auth';

// List of paths that should be excluded from authentication
const PUBLIC_PATHS = [
  '/api/cron/process-queue', // This will be protected by cron-auth middleware
  '/api/process-queue', // This is called internally by the cron endpoint
];

export default defineEventHandler(async (event) => {
  // Get the request path
  const path = event.node.req.url || '';

  // Skip authentication for non-API routes
  if (!path.startsWith('/api/')) {
    return;
  }

  // Skip authentication for public paths
  if (PUBLIC_PATHS.some(publicPath => path.startsWith(publicPath))) {
    return;
  }

  try {
    // Verify the Firebase token
    // Add the user to the event context for use in API handlers
    event.context.user = await verifyFirebaseToken(event);
  } catch (error) {
    // Let the error propagate to be handled by the API
    throw error;
  }
});
