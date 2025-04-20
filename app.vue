<template>
  <div>
    <!-- Navbar -->
    <div class="navbar bg-base-100 shadow-md mb-4">
      <div class="flex-1">
        <NuxtLink to="/" class="btn btn-ghost normal-case text-xl">Nudge</NuxtLink>
      </div>
      <div class="flex-none">
        <div v-if="user">
          <button @click="logout" class="btn btn-ghost">Keluar</button>
        </div>
        <div v-else>
          <button @click="login" class="btn btn-primary">Masuk dengan Google</button>
        </div>
      </div>
    </div>

    <!-- Page Content -->
    <NuxtPage />
  </div>
</template>

<script setup>
import { useAuth } from '~/composables/useAuth';
const { user, signOut, signInWithGoogle } = useAuth();

async function login() {
  await signInWithGoogle();
}

async function logout() {
  await signOut();
  navigateTo('/', { external: true });
}
</script>
