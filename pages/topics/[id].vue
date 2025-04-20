<template>
  <div class="max-w-md mx-auto p-4">
    <h1 class="text-2xl font-bold mb-4">Message to {{ topic?.fullName }}</h1>
    <div class="p-4 mb-4 border rounded bg-base-200">
      <p>{{ topic?.softenedMessage }}</p>
    </div>
    <button class="btn btn-link mb-4" @click="showRaw = !showRaw">
      {{ showRaw ? 'Hide' : 'Show' }} Original Message
    </button>
    <p v-if="showRaw" class="text-gray-500 mb-4">{{ topic?.rawMessage }}</p>
    <p><strong>Status:</strong> {{ topic?.status }}</p>
  </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router';
import { ref, onMounted } from 'vue';
import { useNuxtApp } from '#app';
import { doc, getDoc } from 'firebase/firestore';

const route = useRoute();
const topic = ref<any>(null);
const showRaw = ref(false);

onMounted(async () => {
  const firestore = useNuxtApp().$firestore as import('firebase/firestore').Firestore;
  const id = route.params.id as string;
  const docRef = doc(firestore, 'topics', id);
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    topic.value = snap.data();
  }
});
</script>
