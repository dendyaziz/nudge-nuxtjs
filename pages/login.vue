<template>
  <div class="h-screen flex items-center justify-center">
    <button class="btn btn-primary" @click="login">Masuk dengan Google</button>
  </div>
</template>

<script setup lang="ts">
import { useAuth } from '~/composables/useAuth';
import { useRouter } from 'vue-router';
const { signInWithGoogle } = useAuth();
const router = useRouter();

async function login() {
  await signInWithGoogle();
  router.push('/');
}
</script>
