import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics, isSupported } from 'firebase/analytics';

export default defineNuxtPlugin(async () => {
  const config = useRuntimeConfig().public.firebase;
  const app = initializeApp(config);
  const auth = getAuth(app);
  const firestore = getFirestore(app);

  // Initialize analytics only if supported (not in SSR)
  let analytics = null;
  if (process.client) {
    const analyticsSupported = await isSupported();
    if (analyticsSupported) {
      analytics = getAnalytics(app);
    }
  }

  return {
    provide: {
      auth,
      firestore,
      analytics
    }
  };
});
