<template>
  <div class="max-w-md mx-auto p-4">
    <h1 class="text-2xl font-bold mb-2">Pesan untuk {{ topic?.fullName }}</h1>

    <p class="mb-4 text-base-content">WhatsApp: {{ topic?.phone }}</p>

    <div class="p-4 mb-4 border rounded bg-base-200">
      <div class="inline-flex gap-1 items-center mb-6">
        <strong>Status:</strong>
        <span v-if="messageStatus === 'DELIVERED'" class="relative group inline-flex items-center gap-1">
        Terkirim
        <div class="tooltip" data-tip="Penerima mungkin telah membaca pesan, tetapi mereka mematikan status 'Dibaca' pada WhatsApp di ponsel mereka.">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 -960 960 960"
            class="w-5 fill-current text-base-content/70"
          ><path d="M440-280h80v-240h-80v240Zm40-320q17 0 28.5-11.5T520-640q0-17-11.5-28.5T480-680q-17 0-28.5 11.5T440-640q0 17 11.5 28.5T480-600Zm0 520q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z"/></svg>
        </div>
      </span>
        <span v-else-if="messageStatus === 'SENT'">Terkirim ke server</span>
        <span v-else-if="messageStatus === 'READ'">Dibaca</span>
        <span v-else-if="messageStatus === 'PLAYED'">Diputar</span>
        <span v-else>Tak Diketahui</span>
        <p v-if="messageStatusError" class="text-red-500 text-sm">{{ messageStatusError }}</p>      <p v-if="messageStatusError" class="text-red-500 text-sm">{{ messageStatusError }}</p>
      </div>

      <p v-if="!showRaw" v-html="previewMessage" class="whitespace-pre-line"></p>
      <p v-else>{{ topic?.rawMessage }}</p>
      <button class="btn btn-outline btn-sm mt-8" @click="showRaw = !showRaw">
        {{ showRaw ? 'Sembunyikan' : 'Tampilkan' }} Pesan Asli
      </button>
    </div>


    <NuxtLink to="/">
      <button class="btn btn-ghost w-full">Kirim pesan lain</button>
    </NuxtLink>
  </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router';
import { ref, onMounted, computed } from 'vue';
import { useNuxtApp } from '#app';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

const route = useRoute();
const topic = ref<any>(null);
const showRaw = ref(false);
const messageStatus = ref<string>('Loading...');
const messageStatusError = ref<string | null>(null);

// Define the type for the soften data
interface SoftenData {
  soften_message: string;
  suggestion: string;
  disclaimer: string;
}

// make me computed value for the preview message send to the user
const previewMessage = computed(() => {
  if (!topic.value)
    return ''

  const softenData = JSON.parse(topic.value.softenData) as SoftenData

  if (!softenData)
    return ''

  // Format the preview message, handling empty suggestion
  if (softenData.suggestion) {
    return `${softenData.soften_message}<br><br>${softenData.suggestion}`;
  } else {
    return softenData.soften_message;
  }
});

// Function to fetch message status from the API and update Firebase
async function fetchMessageStatus(messageId: string) {
  try {
    messageStatus.value = 'Loading...';
    messageStatusError.value = null;

    // Use query parameters instead of URL parameters
    const response = await $fetch(`/api/message-status`, {
      params: { messageId }
    });

    if (response.success) {
      messageStatus.value = response.data.status;

      // Update the Firebase topic data with the latest status
      if (topic.value && topic.value.id) {
        const firestore = useNuxtApp().$firestore as import('firebase/firestore').Firestore;
        const docRef = doc(firestore, 'topics', topic.value.id);
        await updateDoc(docRef, { status: response.data.status });
        console.log('Updated topic status in Firebase:', response.data.status);
      }
    } else {
      messageStatus.value = 'Error';
      messageStatusError.value = response.message;
      console.error('Error fetching message status:', response.message);
    }
  } catch (error: any) {
    messageStatus.value = 'Error';
    messageStatusError.value = error.message || 'Failed to fetch message status';
    console.error('Error fetching message status:', error);
  }
}

onMounted(async () => {
  const firestore = useNuxtApp().$firestore as import('firebase/firestore').Firestore;
  const id = route.params.id as string;
  const docRef = doc(firestore, 'topics', id);
  console.log('1')
  const snap = await getDoc(docRef);
  if (snap.exists()) {
  console.log('2')
    topic.value = snap.data();

    // Fetch message status from the API if messageServerId exists
    if (topic.value.messageServerId) {
  console.log('3')
      await fetchMessageStatus(topic.value.messageServerId);
    }
  }
});
</script>
