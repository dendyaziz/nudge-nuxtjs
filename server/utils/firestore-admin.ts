import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin SDK for server-side operations
export function initializeFirebaseAdmin() {
  const config = useRuntimeConfig();

  // Check if Firebase Admin is already initialized
  if (getApps().length === 0) {
    // For production, use service account credentials
    if (config.firebaseAdminCredentials) {
      try {
        const serviceAccount = JSON.parse(config.firebaseAdminCredentials);
        initializeApp({
          credential: cert(serviceAccount)
        });
      } catch (error) {
        console.error('Error initializing Firebase Admin with credentials:', error);
        // Fallback to default initialization if parsing fails
        initializeApp();
      }
    } else {
      // For development, use default initialization
      // This relies on GOOGLE_APPLICATION_CREDENTIALS environment variable
      initializeApp();
    }
  }

  return getFirestore();
}
