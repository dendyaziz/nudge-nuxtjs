import { ref } from 'vue';
import { useNuxtApp, useState } from '#app';
import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut as fbSignOut, type User } from 'firebase/auth';

export function useAuth() {
  const nuxtApp = useNuxtApp();
  const auth = nuxtApp.$auth as import('firebase/auth').Auth;
  const user = useState<User | null>('user', () => null);

  onAuthStateChanged(auth, (u) => {
    user.value = u;
  });

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const signOut = async () => {
    await fbSignOut(auth);
    user.value = null;
  };

  return { user, signInWithGoogle, signOut };
}
