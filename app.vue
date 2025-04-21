<template>
  <div>
    <!-- Drawer for mobile navigation -->
    <div class="drawer drawer-end">
      <input id="my-drawer" type="checkbox" class="drawer-toggle" />

      <div class="drawer-content">
        <!-- Navbar -->
        <div class="navbar bg-base-100 shadow-md mb-4">
          <div class="flex-1">
            <NuxtLink to="/" class="btn btn-ghost normal-case text-xl">
              <img src="@/assets/img/logo-w-label.png" alt="Logo" class="h-10 -ml-2">
            </NuxtLink>

            <!-- Mobile menu button - only visible on small screens -->
            <label for="my-drawer" class="btn btn-ghost drawer-button lg:hidden ml-auto">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="inline-block w-5 h-5 stroke-current">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
              </svg>
            </label>

            <NuxtLink to="/" class="btn btn-ghost hidden lg:flex">Tulis Pesan</NuxtLink>
            <NuxtLink to="/messages" class="btn btn-ghost hidden lg:flex">Semua Pesan</NuxtLink>
          </div>

          <!-- Desktop navigation - hidden on small screens -->
          <div class="flex-none hidden lg:block">
            <div v-if="user" class="flex items-center gap-2">
              <!-- User dropdown -->
              <div class="dropdown dropdown-end">
                <label tabindex="0" class="btn btn-ghost avatar gap-3">
                  <div class="w-10 rounded-full">
                    <img v-if="user.photoURL" :src="user.photoURL" alt="Profile" />
                    <div v-else class="bg-primary text-primary-content flex items-center justify-center h-full">
                      {{ user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U' }}
                    </div>
                  </div>

                  <span>{{ user.displayName }}</span>
                </label>
                <ul tabindex="0" class="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52">
                  <li><a @click="logout">Keluar</a></li>
                </ul>
              </div>
            </div>
            <div v-else>
              <button @click="login" class="btn btn-primary">Login dengan Google</button>
            </div>
          </div>
        </div>

        <!-- Page Content -->
        <NuxtPage />
      </div>

      <!-- Drawer side - mobile menu -->
      <div class="drawer-side">
        <label for="my-drawer" class="drawer-overlay"></label>
        <ul class="menu p-4 w-80 h-full bg-base-200 text-base-content">
          <!-- User profile in drawer - only when logged in -->
          <li v-if="user" class="mb-4">
            <div class="flex items-center gap-4 p-2">
              <div class="avatar">
                <div class="w-12 rounded-full">
                  <img v-if="user.photoURL" :src="user.photoURL" alt="Profile" />
                  <div v-else class="bg-primary text-primary-content flex items-center justify-center h-full text-xl">
                    {{ user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U' }}
                  </div>
                </div>
              </div>
              <span class="font-medium">{{ user.displayName || user.email }}</span>
            </div>
          </li>

          <!-- Menu items -->
          <li v-if="user"><NuxtLink to="/" @click="closeDrawer">Tulis Pesan</NuxtLink></li>
          <li v-if="user"><NuxtLink to="/messages" @click="closeDrawer">Semua Pesan</NuxtLink></li>
          <li v-if="user"><a @click="logout(); closeDrawer()">Keluar</a></li>
          <li v-else><a @click="login(); closeDrawer()">Login dengan Google</a></li>
        </ul>
      </div>
    </div>
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

function closeDrawer() {
  document.getElementById('my-drawer').checked = false;
}
</script>
