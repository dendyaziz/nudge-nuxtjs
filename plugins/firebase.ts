import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig().public.firebase;
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
