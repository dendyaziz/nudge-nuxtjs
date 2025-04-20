<template>
  <div class="max-w-md mx-auto p-4">
    <h1 class="text-2xl font-bold mb-4">Pesan untuk {{ topic?.fullName }}</h1>
    <div class="p-4 mb-4 border rounded bg-base-200">
      <p v-if="!showRaw" v-html="previewMessage" class="whitespace-pre-line"></p>
      <p v-else>{{ topic?.rawMessage }}</p>
      <button class="btn btn-outline btn-sm mt-8" @click="showRaw = !showRaw">
        {{ showRaw ? 'Sembunyikan' : 'Tampilkan' }} Pesan Asli
      </button>
    </div>
    <p v-if="showRaw" class="text-gray-500 mb-4">{{ topic?.rawMessage }}</p>
    <div>
      <p><strong>Status:</strong> {{ messageStatus }}</p>
      <p v-if="messageStatusError" class="text-red-500 text-sm">{{ messageStatusError }}</p>
    </div>
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
