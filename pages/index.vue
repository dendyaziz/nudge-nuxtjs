<template>
  <div class="max-w-md mx-auto p-4">
    <!-- Debug button: test Firestore connectivity -->
    <button v-if="false" class="btn btn-secondary w-full mb-4" @click="testFirestore()">Uji Firestore</button>
    <div v-if="stage === 'input'">
      <h1 class="text-2xl font-bold mb-2">Cara Baru Untuk Peduli</h1>

      <p class="mb-4 text-base-content">Sampaikan pesan kepedulian ke orang terdekatmu secara Anonim!</p>

      <div v-if="errorMessage" class="alert alert-error mb-4">
        <div>
          <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current flex-shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          <span>{{ errorMessage }}</span>
        </div>
      </div>
      <div class="form-control mb-4">
        <label class="label"><span class="label-text">Nomor WhatsApp Penerima</span></label>
        <input v-model="phone" type="text" class="input input-bordered" placeholder="contoh: 08123456789" />
      </div>
      <div class="form-control mb-4">
        <label class="label"><span class="label-text">Nama Lengkap Penerima</span></label>
        <input v-model="fullName" type="text" class="input input-bordered" placeholder="Nama Lengkap" />
      </div>
      <div class="form-control mb-4">
        <label class="label"><span class="label-text">Pesan</span></label>
        <textarea v-model="rawMessage" class="textarea textarea-bordered" placeholder="Ketik pesan Anda di sini"></textarea>
      </div>
      <button class="btn btn-primary w-full" :disabled="!phone || !fullName || !rawMessage || loading" @click="continueToReview">
        <span v-if="user">Lanjutkan</span>
        <span v-else>Login dan Lanjutkan</span>
      </button>
    </div>
    <div v-else-if="stage === 'review'">
      <h1 class="text-2xl font-bold mb-2">Tinjau Pesan</h1>
      <div v-if="errorMessage" class="alert alert-error mb-4">
        <div>
          <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current flex-shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          <span>{{ errorMessage }}</span>
        </div>
      </div>

      <p class="mb-4 text-base-content">Pesan Anda telah disesuaikan untuk memperbaiki penyampaian.</p>

      <div class="p-4 mb-4 border rounded bg-base-200">
        <span>Kepada: <span class="font-medium">{{ fullName }} ({{ phone }})</span></span>

        <hr class="border-base-content/15 my-4">

        <p v-html="previewMessage" class="whitespace-pre-line"></p>

        <div class="flex gap-2 mt-8">
          <button class="btn btn-outline btn-sm gap-2" :class="{'pointer-events-none': loading}" :disabled="loadingRegenerate" @click="regenerate">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" class="w-5 fill-current" :class="{'animate-spin': loadingRegenerate}"><path d="M482-160q-134 0-228-93t-94-227v-7l-64 64-56-56 160-160 160 160-56 56-64-64v7q0 100 70.5 170T482-240q26 0 51-6t49-18l60 60q-38 22-78 33t-82 11Zm278-161L600-481l56-56 64 64v-7q0-100-70.5-170T478-720q-26 0-51 6t-49 18l-60-60q38-22 78-33t82-11q134 0 228 93t94 227v7l64-64 56 56-160 160Z"/></svg>
            Regenerate
          </button>
          <button class="btn btn-outline btn-sm" :class="{'pointer-events-none': loading || loadingRegenerate}" @click="refine">Perbaiki</button>
        </div>
      </div>
      <div class="form-control mb-6">
        <label class="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" v-model="termsAccepted" class="checkbox checkbox-primary" />
          <span class="label-text">Saya menyetujui <NuxtLink to="/terms" class="text-primary hover:underline" target="_blank">Syarat dan Ketentuan</NuxtLink> serta <NuxtLink to="/privacy" class="text-primary hover:underline" target="_blank">Kebijakan Privasi</NuxtLink> Nudge</span>
        </label>
      </div>
      <div class="flex gap-2">
        <button class="btn btn-outline" @click="goBackToInput">Kembali</button>
        <button class="btn btn-primary ml-auto" :class="{'pointer-events-none': loadingRegenerate}" :disabled="loading || !termsAccepted" @click="sendMessage">Kirim Pesan</button>
      </div>
    </div>
    <div v-else-if="stage === 'refine'">
      <h1 class="text-2xl font-bold mb-4">Perhalus Pesan</h1>
      <div class="p-4 mb-2 border rounded bg-base-200">
        <p v-html="previewMessage" class="whitespace-pre-line"></p>
      </div>
      <div class="form-control mb-4">
        <label class="label"><span class="label-text">Apa yang ingin ditambahkan?</span></label>
        <input v-model="refineInstruction" type="text" class="input input-bordered" placeholder="contoh: lebih sopan" />
      </div>
      <div class="flex justify-between">
        <button class="btn btn-outline" @click="cancelRefine">Batal</button>
        <button class="btn btn-primary" :disabled="!refineInstruction || loading" @click="submitRefine">Perbaiki Pesan</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useAuth } from '~/composables/useAuth';
import { useRouter } from 'vue-router';
import { useNuxtApp, useRuntimeConfig } from '#app';
import { doc, getDoc, updateDoc, setDoc, serverTimestamp, enableNetwork } from 'firebase/firestore';
import {createError, sendError} from "h3";
import { useAnalytics } from '~/composables/useAnalytics';

// Define the type for the API response
interface Response<T> {
  statusCode: number;
  statusMessage: string;
  stack?: any[];
  data: T | string;
}

// Define the type for the soften data
interface SoftenData {
  soften_message: string;
  suggestion: string;
  disclaimer: string;
}

const stage = ref<'input'|'review'|'refine'>('input');
const loading = ref(false);
const loadingRegenerate = ref(false);
const runtimeConfig = useRuntimeConfig();
const phone = ref(runtimeConfig.public.defaultPhone);
const fullName = ref(runtimeConfig.public.defaultName);
const rawMessage = ref(runtimeConfig.public.defaultMessage);
const softenData = ref<SoftenData | null>(null);
const previewMessage = ref('');
const refineInstruction = ref('');
const errorMessage = ref('');
const termsAccepted = ref(false);
const { user, signInWithGoogle } = useAuth();
const router = useRouter();
const nuxtApp = useNuxtApp();
const firestore = nuxtApp.$firestore as import('firebase/firestore').Firestore;
const { trackEvent } = useAnalytics();

// Watch for changes in terms acceptance and track them
watch(termsAccepted, (newValue) => {
  trackEvent('terms_checkbox_change', { accepted: newValue });
});

onMounted(() => {
  const saved = localStorage.getItem('nudgeForm');
  if (user.value && saved) {
    const form = JSON.parse(saved);
    phone.value = form.phone;
    fullName.value = form.fullName;
    rawMessage.value = form.rawMessage;
    softenData.value = JSON.parse(form.softenData);
    if (softenData.value) {
      // Format the preview message, handling empty suggestion
      if (softenData.value.suggestion) {
        previewMessage.value = `${softenData.value.soften_message}<br><br>${softenData.value.suggestion}`;
      } else {
        previewMessage.value = softenData.value.soften_message;
      }
    }
    refineInstruction.value = form.refineInstruction;
    termsAccepted.value = form.termsAccepted || false;
    stage.value = form.stage;
    localStorage.removeItem('nudgeForm');
  }
});


// Function to standardize phone number
const standardizePhoneNumber = (phone: string): string | null => {
  if (!phone) return null;

  let standardizedPhone = phone.replace(/\D/g, ''); // Remove all non-digit characters
  if (standardizedPhone.startsWith('0')) {
    return '62' + standardizedPhone.slice(1);
  } else if (standardizedPhone.startsWith('62')) {
    return standardizedPhone;
  }

  return null;
};

async function continueToReview() {
  // Reset error state
  errorMessage.value = '';

  // Track event
  trackEvent('form_continue_to_review_attempt');

  // Validate & standardize phone number
  const standardizedPhone = standardizePhoneNumber(phone.value);
  if (!standardizedPhone) {
    errorMessage.value = 'Nomor telepon tidak valid.';
    trackEvent('form_validation_error', { error_type: 'invalid_phone' });
    return;
  }

  if (!user.value) {
    localStorage.setItem('nudgeForm', JSON.stringify({ phone: phone.value, fullName: fullName.value, rawMessage: rawMessage.value, softenData: JSON.stringify(softenData.value), refineInstruction: refineInstruction.value, termsAccepted: termsAccepted.value, stage: 'review' }));
    await signInWithGoogle();

    if (!user)
      return
  }

  loading.value = true;
  try {
    if (!user.value)
      return

    // First validate message limits
    const limitsRes = await $fetch('/api/validate-limits', {
      method: 'POST',
      body: {
        userId: user.value.uid,
        phone: standardizedPhone
      }
    });

    // Check if user has reached message limit
    if (limitsRes.userLimitReached) {
      errorMessage.value = 'Batas mengirim pesan tercapai.';
      return;
    }

    // Check if phone has reached message limit
    if (limitsRes.phoneLimitReached) {
      errorMessage.value = 'Pengiriman ke nomor ini dibatasi.';
      return;
    }

    // If limits are not reached, proceed with softening the message
    const res = await $fetch<Response<SoftenData>>('/api/soften', { method: 'POST', body: { message: rawMessage.value, fullName: fullName.value } });
    if (typeof res.data === 'string') {
      // Handle error case where data is a string
      console.error('Error from API:', res.data);
      previewMessage.value = `Error: ${res.statusMessage}`;
      errorMessage.value = `Error: ${res.statusMessage}`;
    } else {
      // Handle success case where data is SoftenData
      // Format the preview message, handling empty suggestion
      if (res.data.suggestion) {
        previewMessage.value = `${res.data.soften_message}<br><br>${res.data.suggestion}`;
      } else {
        previewMessage.value = res.data.soften_message;
      }
      softenData.value = res.data
      stage.value = 'review';
    }
  } catch (error: any) {
    console.error('Error calling API:', error);

    // Check if the error has a response with a status message
    if (error.response && error.response._data && error.response._data.statusMessage) {
      errorMessage.value = error.response._data.statusMessage;
    } else {
      previewMessage.value = 'Terjadi kesalahan saat memproses permintaan Anda.';
      errorMessage.value = 'Terjadi kesalahan saat memproses permintaan Anda.';
    }
  } finally {
    loading.value = false;
  }
}

async function regenerate() {
  // Track event
  trackEvent('regenerate_message_attempt');

  // Validate & standardize phone number
  const standardizedPhone = standardizePhoneNumber(phone.value);
  if (!standardizedPhone) {
    errorMessage.value = 'Nomor telepon tidak valid.';
    trackEvent('form_validation_error', { error_type: 'invalid_phone', stage: 'regenerate' });
    return;
  }

  if (!user.value) {
    localStorage.setItem('nudgeForm', JSON.stringify({ phone: standardizedPhone, fullName: fullName.value, rawMessage: rawMessage.value, softenData: JSON.stringify(softenData.value), refineInstruction: refineInstruction.value, termsAccepted: termsAccepted.value, stage: 'review' }));
    trackEvent('regenerate_message_redirect_to_login');
    router.push('/login');
    return;
  }

  loadingRegenerate.value = true;
  try {
    const res = await $fetch<Response<SoftenData>>('/api/soften', { method: 'POST', body: { message: rawMessage.value, fullName: fullName.value } });

    if (typeof res.data === 'string') {
      // Handle error case where data is a string
      console.error('Error from API:', res.data);
      previewMessage.value = `Error: ${res.statusMessage}`;
    } else {
      // Handle success case where data is SoftenData
      // Format the preview message, handling empty suggestion
      if (res.data.suggestion) {
        previewMessage.value = `${res.data.soften_message}<br><br>${res.data.suggestion}`;
      } else {
        previewMessage.value = res.data.soften_message;
      }
      softenData.value = res.data
    }
  } catch (error) {
    console.error('Error calling API:', error);
    previewMessage.value = 'Terjadi kesalahan saat memproses permintaan Anda.';
  } finally {
    loadingRegenerate.value = false;
  }
}

function refine() {
  trackEvent('refine_message_click');
  stage.value = 'refine';
}

function cancelRefine() {
  trackEvent('cancel_refine');
  refineInstruction.value = '';
  stage.value = 'review';
}

function goBackToInput() {
  trackEvent('go_back_to_input');
  stage.value = 'input';
}

async function submitRefine() {
  // Track event
  trackEvent('submit_refine_attempt', { instruction: refineInstruction.value });

  loading.value = true;
  try {
    // Use the new refine endpoint with refineInstruction and softenData
    const res = await $fetch<Response<SoftenData>>('/api/refine', {
      method: 'POST',
      body: {
        refineInstruction: refineInstruction.value,
        softenData: softenData.value
      }
    });

    if (typeof res.data === 'string') {
      // Handle error case where data is a string
      console.error('Error from API:', res.data);
      previewMessage.value = `Error: ${res.statusMessage}`;
    } else {
      // Handle success case where data is SoftenData
      // Format the preview message, handling empty suggestion
      if (res.data.suggestion) {
        previewMessage.value = `${res.data.soften_message}<br><br>${res.data.suggestion}`;
      } else {
        previewMessage.value = res.data.soften_message;
      }

      // Create a new SoftenData object with the refined message, suggestion, and original disclaimer
      softenData.value = {
        soften_message: res.data.soften_message,
        suggestion: res.data.suggestion,
        disclaimer: softenData.value?.disclaimer || ''
      };

      stage.value = 'review';
    }
  } catch (error) {
    console.error('Error calling API:', error);
    previewMessage.value = 'Terjadi kesalahan saat memproses permintaan Anda.';
  } finally {
    loading.value = false;
  }
}

async function sendMessage() {
  // Track event
  trackEvent('send_message_attempt');

  if (!user.value) {
    localStorage.setItem('nudgeForm', JSON.stringify({ phone: phone.value, fullName: fullName.value, rawMessage: rawMessage.value, softenData: JSON.stringify(softenData.value), refineInstruction: refineInstruction.value, termsAccepted: termsAccepted.value, stage: 'review' }));
    trackEvent('send_message_redirect_to_login');
    router.push('/login');
    return;
  }

  // Validate & standardize phone number
  const standardizedPhone = standardizePhoneNumber(phone.value);
  if (!standardizedPhone) {
    errorMessage.value = 'Nomor telepon tidak valid.';
    trackEvent('form_validation_error', { error_type: 'invalid_phone', stage: 'send_message' });
    return;
  }

  // Reset error state
  errorMessage.value = '';
  loading.value = true;

  // First validate message limits
  const limitsRes = await $fetch('/api/validate-limits', {
    method: 'POST',
    body: {
      userId: user.value.uid,
      phone: standardizedPhone
    }
  });

  // Check if user has reached message limit
  if (limitsRes.userLimitReached) {
    errorMessage.value = 'Batas mengirim pesan tercapai.';
    loading.value = false;
    return;
  }

  // Check if phone has reached message limit
  if (limitsRes.phoneLimitReached) {
    errorMessage.value = 'Pengiriman ke nomor ini dibatasi.';
    loading.value = false;
    return;
  }

  try {
    const info = '> ⓘ Pesan ini hanya sebagai perantara dan dikirim otomatis oleh sistem. Balas "Stop" jika Anda tidak berkanan menerima pesan lainnya.'

    // Handle empty suggestion
    let message;
    if (softenData.value?.suggestion) {
      message = `${softenData.value.soften_message}\n\n${softenData.value.suggestion}\n\n${softenData.value.disclaimer}\n\n${info}`;
    } else {
      message = `${softenData.value?.soften_message}\n\n${softenData.value?.disclaimer}\n\n${info}`;
    }

    // Create the topic document first
    const messageId = crypto.randomUUID();
    await setDoc(doc(firestore, 'topics', messageId), {
      id: messageId,
      userId: user.value.uid,
      phone: standardizedPhone,
      fullName: fullName.value,
      rawMessage: rawMessage.value,
      softenData: JSON.stringify(softenData.value),
      createdAt: serverTimestamp(),
      status: 'PENDING'
    });

    // Then queue the message
    const res = await $fetch('/api/send-whatsapp', {
      method: 'POST',
      body: {
        phone: standardizedPhone,
        message,
        topicId: messageId
      }
    });

    // Update the topic with queue information
    if ((res as any).queueId) {
      await updateDoc(doc(firestore, 'topics', messageId), {
        queueId: (res as any).queueId,
        scheduledFor: (res as any).scheduledFor,
        status: (res as any).status
      });
    }

    // Track successful message sending
    trackEvent('message_sent_success', {
      messageId,
      hasRefinement: !!refineInstruction.value
    });

    router.push(`/topics/${messageId}`);
  } catch (error: any) {
    console.error('Error sending message:', error);

    // Track error
    trackEvent('message_sent_error', {
      error: error.response?._data?.statusMessage || 'unknown_error'
    });

    // Check if the error has a response with a status message
    if (error.response && error.response._data && error.response._data.statusMessage) {
      errorMessage.value = error.response._data.statusMessage;
    } else {
      errorMessage.value = 'Terjadi kesalahan saat mengirim pesan. Silakan coba lagi.';
    }
  } finally {
    loading.value = false;
  }
}

// Debug helper: read and update a doc's `updatedAt` field
async function testFirestore() {
  const id = window.prompt('Enter a topics doc ID to test:');
  if (!id) return;
  try {
    console.log('[testFirestore] Firestore instance:', firestore);
    console.log('[testFirestore] runtimeConfig.public.firebase:', runtimeConfig.public.firebase);
    await enableNetwork(firestore);
    console.log('[testFirestore] Network enabled.');
    const ref = doc(firestore, 'topics', id);
    console.log('[testFirestore] Document ref:', ref);
    const snap = await getDoc(ref);
    console.log('[testFirestore] Document snapshot exists:', snap.exists(), 'data:', snap.data());
    await updateDoc(ref, { updatedAt: serverTimestamp() });
    console.log('[testFirestore] updated updatedAt field to serverTimestamp()');
  } catch (e) {
    console.error('[testFirestore] Firestore test failed:', e);
  }
}
</script>
