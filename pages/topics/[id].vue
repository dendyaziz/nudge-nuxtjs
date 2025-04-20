<template>
  <div class="max-w-md mx-auto p-4">
    <h1 class="text-2xl font-bold mb-2">Pesan untuk {{ topic?.fullName }}</h1>

    <p class="mb-4 text-base-content">WhatsApp: {{ topic?.phone }}</p>

    <div class="p-4 mb-4 border rounded bg-base-200">
      <div class="flex flex-col gap-2 mb-6">
        <div class="inline-flex gap-1 items-center">
          <strong>Status:</strong>
          <!-- Queue status -->
          <div v-if="topic?.status === 'QUEUED'" class="inline-flex items-center gap-1">
            <span class="badge badge-warning">
              Dalam Antrian
            </span>

            <div class="tooltip tooltip-accent" :data-tip="formatScheduledTime(topic.scheduledFor)">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 -960 960 960"
                class="w-5 fill-current text-base-content/70"
              ><path d="M440-280h80v-240h-80v240Zm40-320q17 0 28.5-11.5T520-640q0-17-11.5-28.5T480-680q-17 0-28.5 11.5T440-640q0 17 11.5 28.5T480-600Zm0 520q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z"/></svg>
            </div>
          </div>
          <!-- Message status after sent -->
          <span v-else-if="messageStatus === 'DELIVERED'" class="badge badge-success relative group inline-flex items-center gap-1">
            Terkirim
            <div v-if="false" class="tooltip tooltip-accent" data-tip="Penerima mungkin telah membaca pesan, tetapi mereka mematikan status 'Dibaca' pada WhatsApp di ponsel mereka.">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 -960 960 960"
                class="w-5 fill-current text-base-content/70"
              ><path d="M440-280h80v-240h-80v240Zm40-320q17 0 28.5-11.5T520-640q0-17-11.5-28.5T480-680q-17 0-28.5 11.5T440-640q0 17 11.5 28.5T480-600Zm0 520q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z"/></svg>
            </div>
          </span>
          <span v-else-if="messageStatus === 'SENT'" class="badge badge-info">Terkirim ke server</span>
          <span v-else-if="messageStatus === 'PENDING'" class="badge badge-outline">Mengirim...</span>
          <span v-else-if="messageStatus === 'READ'" class="badge badge-success">Dibaca</span>
          <span v-else-if="messageStatus === 'PLAYED'" class="badge badge-success">Diputar</span>
          <div v-else-if="topic?.status === 'FAILED'" class="inline-flex items-center gap-1">
            <span class="badge badge-error">
              Gagal
            </span>

            <div v-if="messageStatusError || topic?.error" class="tooltip tooltip-error" :data-tip="messageStatusError || topic?.error">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 -960 960 960"
                class="w-5 fill-current text-base-content/70"
              ><path d="M440-280h80v-240h-80v240Zm40-320q17 0 28.5-11.5T520-640q0-17-11.5-28.5T480-680q-17 0-28.5 11.5T440-640q0 17 11.5 28.5T480-600Zm0 520q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z"/></svg>
            </div>
          </div>
          <span v-else-if="topic?.queueStatus === 'PROCESSING'" class="badge badge-info">Sedang Diproses</span>
          <span v-else class="badge badge-outline">Memuat...</span>
        </div>

        <!-- Queue information -->
        <div v-if="topic?.scheduledFor && topic?.status === 'QUEUED'" class="text-sm">
          <span>Dijadwalkan untuk dikirim pada: {{ formatScheduledTime(topic.scheduledFor) }}</span>
        </div>
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
import { ref, onMounted, onUnmounted, computed, watch } from 'vue';
import { useNuxtApp } from '#app';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { Timestamp } from 'firebase/firestore';

const route = useRoute();
const topic = ref<any>(null);
const showRaw = ref(false);
const messageStatus = ref<string>('');
const messageStatusError = ref<string | null>(null);
const statusCheckInterval = ref<number | null>(null);

// Function to format scheduled time for display
function formatScheduledTime(timestamp: any): string {
  if (!timestamp) return 'Tidak diketahui';

  // Handle Firestore Timestamp
  let date;
  if (timestamp._seconds) {
    // Convert Firestore Timestamp to JavaScript Date
    date = new Date(timestamp._seconds * 1000);
  } else if (timestamp.toDate) {
    // Handle Firestore Timestamp object with toDate method
    date = timestamp.toDate();
  } else {
    // Handle regular Date object or timestamp number
    date = new Date(timestamp);
  }

  // Check if date is valid
  if (isNaN(date.getTime())) return 'Waktu tidak valid';

  // Format the date and time in Indonesian locale if possible
  try {
    return new Intl.DateTimeFormat('id-ID', {
      dateStyle: 'medium',
      timeStyle: 'medium'
    }).format(date);
  } catch (e) {
    // Fallback to basic formatting
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
  }
}

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
    messageStatus.value = '';
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

        if (response.data.status === 'PENDING') {
          setTimeout(async () => {
            await fetchMessageStatus(messageId)
          }, 1000)
        }
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

// Function to start polling for message status
function startStatusPolling() {
  // Clear any existing interval first
  stopStatusPolling();

  // Only start polling if we have a messageServerId
  if (topic.value?.messageServerId) {
    statusCheckInterval.value = window.setInterval(() => {
      fetchMessageStatus(topic.value.messageServerId);
    }, 5000); // Check every 5 seconds
  }
}

// Function to stop polling
function stopStatusPolling() {
  if (statusCheckInterval.value !== null) {
    window.clearInterval(statusCheckInterval.value);
    statusCheckInterval.value = null;
  }
}

// Watch for changes in messageStatus
watch(messageStatus, (newStatus) => {
  if (newStatus === 'PENDING') {
    startStatusPolling();
  } else if (statusCheckInterval.value !== null) {
    // If status is no longer PENDING and we have an active interval, stop it
    stopStatusPolling();
  }
});

onMounted(async () => {
  const firestore = useNuxtApp().$firestore as import('firebase/firestore').Firestore;
  const id = route.params.id as string;
  const docRef = doc(firestore, 'topics', id);

  // Initial fetch
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    topic.value = snap.data();

    // Fetch message status from the API if messageServerId exists and status is not QUEUED
    if (topic.value.messageServerId && topic.value.status !== 'QUEUED') {
      await fetchMessageStatus(topic.value.messageServerId);

      // If the initial status is PENDING, start polling immediately
      if (messageStatus.value === 'PENDING') {
        startStatusPolling();
      }
    }

    // Set up real-time listener for topic updates
    import('firebase/firestore').then(({ onSnapshot }) => {
      // Listen for real-time updates to the topic document
      const unsubscribe = onSnapshot(docRef, (doc) => {
        if (doc.exists()) {
          const newData = doc.data();
          topic.value = newData;

          // If status changed to SENT or PENDING, fetch the message status
          if ((newData.status === 'PENDING') && newData.messageServerId) {
            fetchMessageStatus(newData.messageServerId);
          }
        }
      }, (error) => {
        console.error("Error listening to topic updates:", error);
      });

      // Clean up the listener when component is unmounted
      onUnmounted(() => {
        unsubscribe();
        // Also stop any active status polling
        stopStatusPolling();
      });
    });
  }
});
</script>
