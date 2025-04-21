<template>
  <div class="max-w-4xl mx-auto p-4">
    <h1 class="text-2xl font-bold mb-4">Semua Pesan</h1>

    <div v-if="loading" class="flex justify-center my-8">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <div v-else-if="messages.length === 0" class="alert alert-info">
      <div>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-current flex-shrink-0 w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        <span>Anda belum mengirim pesan apapun.</span>
      </div>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
      <div v-for="message in messages" :key="message.id" class="card bg-base-100 shadow-md">
        <div class="card-body">
          <h2 class="card-title">{{ message.fullName }}</h2>
          <p class="text-sm mb-2">Nomor WhatsApp: +{{ message.phone }}</p>

          <div class="flex items-center gap-2 mb-4">
            <span class="font-semibold">Status:</span>
            <!-- Queue status -->
            <span v-if="message.status === 'QUEUED'" class="badge badge-warning">Dalam Antrian</span>
            <!-- Message status after sent -->
            <span v-else-if="message.status === 'DELIVERED'" class="badge badge-success">Terkirim</span>
            <span v-else-if="message.status === 'SENT'" class="badge badge-outline">Mengirim...</span>
            <span v-else-if="message.status === 'PENDING'" class="badge badge-outline">Mengirim...</span>
            <span v-else-if="message.status === 'READ'" class="badge badge-success">Dibaca</span>
            <span v-else-if="message.status === 'PLAYED'" class="badge badge-success">Diputar</span>
            <span v-else-if="message.status === 'FAILED'" class="badge badge-error">Gagal</span>
            <span v-else-if="message.queueStatus === 'PROCESSING'" class="badge badge-info">Sedang Diproses</span>
            <span v-else class="badge badge-outline">Memuat...</span>
          </div>

          <div class="card-actions justify-end">
            <NuxtLink :to="`/topics/${message.id}`" class="btn btn-primary btn-sm">Lihat Detail</NuxtLink>
          </div>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="flex justify-center mt-4">
      <div class="btn-group">
        <button
          class="btn"
          :class="{ 'btn-disabled': currentPage === 1 }"
          @click="changePage(currentPage - 1)"
          :disabled="currentPage === 1"
        >
          «
        </button>

        <button v-for="page in paginationRange" :key="page"
          class="btn"
          :class="{ 'btn-active': page === currentPage }"
          @click="changePage(page)"
        >
          {{ page }}
        </button>

        <button
          class="btn"
          :class="{ 'btn-disabled': currentPage === totalPages }"
          @click="changePage(currentPage + 1)"
          :disabled="currentPage === totalPages"
        >
          »
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useAuth } from '~/composables/useAuth';
import { useNuxtApp } from '#app';
import { collection, query, where, orderBy, getDocs, limit, startAfter, getDoc, doc, Timestamp } from 'firebase/firestore';

const { user } = useAuth();
const nuxtApp = useNuxtApp();
const db = nuxtApp.$firestore;

const messages = ref<any[]>([]);
const loading = ref(true);
const currentPage = ref(1);
const totalPages = ref(1);
const messagesPerPage = 1;
const lastVisible = ref<any>(null);
const allDocuments = ref<any[]>([]);

// Computed property for pagination range
const paginationRange = computed(() => {
  const range = [];
  const maxVisiblePages = 5;

  let start = Math.max(1, currentPage.value - Math.floor(maxVisiblePages / 2));
  let end = Math.min(totalPages.value, start + maxVisiblePages - 1);

  if (end - start + 1 < maxVisiblePages) {
    start = Math.max(1, end - maxVisiblePages + 1);
  }

  for (let i = start; i <= end; i++) {
    range.push(i);
  }

  return range;
});

// Function to fetch messages for the current user
async function fetchMessages() {
  if (!user.value) return;

  loading.value = true;

  try {
    // Query to get all documents for pagination calculation
    if (currentPage.value === 1) {
      const topicsRef = collection(db, 'topics');
      const q = query(
        topicsRef,
        where('userId', '==', user.value.uid),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      allDocuments.value = querySnapshot.docs;
      totalPages.value = Math.ceil(allDocuments.value.length / messagesPerPage);
    }

    // Get the current page of documents
    const startIndex = (currentPage.value - 1) * messagesPerPage;
    const endIndex = Math.min(startIndex + messagesPerPage, allDocuments.value.length);
    const currentPageDocs = allDocuments.value.slice(startIndex, endIndex);

    // Map documents to message objects
    messages.value = currentPageDocs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        fullName: data.fullName,
        phone: data.phone,
        status: data.status,
        queueStatus: data.queueStatus,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
      };
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
  } finally {
    loading.value = false;
  }
}

// Function to change page
function changePage(page: number) {
  if (page < 1 || page > totalPages.value) return;
  currentPage.value = page;
  fetchMessages();
}

// Watch for user changes
watch(user, (newUser) => {
  if (newUser) {
    currentPage.value = 1;
    fetchMessages();
  } else {
    messages.value = [];
  }
});

// Fetch messages on component mount
onMounted(() => {
  if (user.value) {
    fetchMessages();
  } else {
    loading.value = false;
  }
});
</script>
