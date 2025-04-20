import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { H3Event, createError, getQuery } from 'h3';
import { initializeFirebaseAdmin } from '../utils/firestore-admin';

// Initialize Firebase Admin Auth
export function initializeFirebaseAdminAuth() {
  // Ensure Firebase Admin is initialized
  if (getApps().length === 0) {
    // This will initialize the app using the same logic as in firestore-admin.ts
    initializeFirebaseAdmin();
  }

  return getAuth();
}

// Verify Firebase Auth token from request
export async function verifyFirebaseToken(event: H3Event): Promise<any> {
  try {
    // Get the authorization header
    const authHeader = event.node.req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized: Missing or invalid authorization header'
      });
    }

    // Extract the token
    const token = authHeader.split('Bearer ')[1];
    if (!token) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized: No token provided'
      });
    }

    // Verify the token
    const auth = initializeFirebaseAdminAuth();
    const decodedToken = await auth.verifyIdToken(token);

    return decodedToken;
  } catch (error: any) {
    console.error('Error verifying Firebase token:', error);
    throw createError({
      statusCode: 401,
      statusMessage: `Unauthorized: ${error.message}`
    });
  }
}

// Verify cron job token
export function verifyCronToken(event: H3Event): void {
  const config = useRuntimeConfig();
  const query = getQuery(event);
  const token = query.token as string;

  // Check if token is provided and matches the expected value
  if (!token || token !== config.cronSecretToken) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized: Invalid or missing cron token'
    });
  }
}
