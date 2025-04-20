import { defineNuxtPlugin } from '#app';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

export default defineNuxtPlugin((nuxtApp) => {
  // Get the auth instance from the firebase plugin
  const auth = nuxtApp.$auth;

  // Override the default fetch function to include the auth token
  const originalFetch = globalThis.$fetch;

  globalThis.$fetch = async (request, options = {}) => {
    // Only add the auth token for API requests to our own server
    if (typeof request === 'string' && request.startsWith('/api/')) {
      // Check if auth is defined before accessing currentUser
      if (!auth) {
        console.warn('Auth is not initialized yet');
        return originalFetch(request, options);
      }

      // Get the current user
      const user = auth.currentUser;

      // If the user is logged in, get their token and add it to the headers
      if (user) {
        try {
          const token = await user.getIdToken();

          // Initialize headers if they don't exist
          options.headers = options.headers || {};

          // Add the Authorization header with the token
          options.headers = {
            ...options.headers,
            Authorization: `Bearer ${token}`
          };
        } catch (error) {
          console.error('Error getting auth token:', error);
        }
      }
    }

    // Call the original fetch function with the updated options
    return originalFetch(request, options);
  };
});
