import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig().public.firebase;
  // Log provided Firebase config (public) for debugging
  console.log('[Firebase Plugin] public config:', config);
  const app = initializeApp(config);
  const auth = getAuth(app);
  const firestore = getFirestore(app);

  return {
    provide: {
      auth,
      firestore
    }
  };
});
