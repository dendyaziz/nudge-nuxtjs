<template>
  <div class="max-w-md mx-auto p-4">
    <!-- Debug button: test Firestore connectivity -->
    <button class="btn btn-secondary w-full mb-4" @click="testFirestore()">Test Firestore</button>
    <div v-if="stage === 'input'">
      <h1 class="text-2xl font-bold mb-4">Send a New Nudge</h1>
      <div class="form-control mb-4">
        <label class="label"><span class="label-text">WhatsApp Number</span></label>
        <input v-model="phone" type="text" class="input input-bordered" placeholder="e.g. 628123456789" />
      </div>
      <div class="form-control mb-4">
        <label class="label"><span class="label-text">Full Name</span></label>
        <input v-model="fullName" type="text" class="input input-bordered" placeholder="Full Name of the person" />
      </div>
      <div class="form-control mb-4">
        <label class="label"><span class="label-text">Message</span></label>
        <textarea v-model="rawMessage" class="textarea textarea-bordered" placeholder="Type your message here"></textarea>
      </div>
      <button class="btn btn-primary w-full" :disabled="!phone || !fullName || !rawMessage || loading" @click="continueToReview">
        <span v-if="user">Continue</span>
        <span v-else>Login and Continue</span>
      </button>
    </div>
    <div v-else-if="stage === 'review'">
      <h1 class="text-2xl font-bold mb-4">Review Softened Message</h1>
      <div class="p-4 mb-4 border rounded bg-base-200">
        <p v-html="previewMessage" class="whitespace-pre-line"></p>
      </div>
      <div class="flex gap-2">
        <button class="btn btn-outline" :disabled="loading" @click="regenerate">Regenerate</button>
        <button class="btn btn-outline" @click="refine">Refine</button>
        <button class="btn btn-primary ml-auto" :disabled="loading" @click="sendMessage">Send</button>
      </div>
    </div>
    <div v-else-if="stage === 'refine'">
      <h1 class="text-2xl font-bold mb-4">Refine Message</h1>
      <div class="p-4 mb-2 border rounded bg-base-200">
        <p v-html="previewMessage" class="whitespace-pre-line"></p>
      </div>
      <div class="form-control mb-4">
        <label class="label"><span class="label-text">What to add?</span></label>
        <input v-model="refineInstruction" type="text" class="input input-bordered" placeholder="e.g. be more polite" />
      </div>
      <div class="flex justify-between">
        <button class="btn btn-outline" @click="cancelRefine">Cancel</button>
        <button class="btn btn-primary" :disabled="!refineInstruction || loading" @click="submitRefine">Refine</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAuth } from '~/composables/useAuth';
import { useRouter } from 'vue-router';
import { useNuxtApp, useRuntimeConfig } from '#app';
import { doc, getDoc, updateDoc, setDoc, serverTimestamp, enableNetwork } from 'firebase/firestore';

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
const phone = ref('6285155454174');
const fullName = ref('Dendy');
const rawMessage = ref('Ketek lu bau biawak');
const softenData = ref<SoftenData | null>(null);
const previewMessage = ref('');
const refineInstruction = ref('');
const { user, signInWithGoogle } = useAuth();
const router = useRouter();
const nuxtApp = useNuxtApp();
const runtimeConfig = useRuntimeConfig();
const firestore = nuxtApp.$firestore as import('firebase/firestore').Firestore;

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
    stage.value = form.stage;
    localStorage.removeItem('nudgeForm');
  }
});

async function continueToReview() {
  if (!user.value) {
    localStorage.setItem('nudgeForm', JSON.stringify({ phone: phone.value, fullName: fullName.value, rawMessage: rawMessage.value, softenData: JSON.stringify(softenData.value), refineInstruction: refineInstruction.value, stage: 'review' }));
    await signInWithGoogle();

    if (!user)
      return
  }

  loading.value = true;
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
      stage.value = 'review';
    }
  } catch (error) {
    console.error('Error calling API:', error);
    previewMessage.value = 'An error occurred while processing your request.';
  } finally {
    loading.value = false;
  }
}

async function regenerate() {
  if (!user.value) {
    localStorage.setItem('nudgeForm', JSON.stringify({ phone: phone.value, fullName: fullName.value, rawMessage: rawMessage.value, softenData: JSON.stringify(softenData.value), refineInstruction: refineInstruction.value, stage: 'review' }));
    router.push('/login');
    return;
  }

  loading.value = true;
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
    previewMessage.value = 'An error occurred while processing your request.';
  } finally {
    loading.value = false;
  }
}

function refine() { stage.value = 'refine'; }
function cancelRefine() { refineInstruction.value = ''; stage.value = 'review'; }

async function submitRefine() {
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
    previewMessage.value = 'An error occurred while processing your request.';
  } finally {
    loading.value = false;
  }
}

async function sendMessage() {
  if (!user.value) {
    localStorage.setItem('nudgeForm', JSON.stringify({ phone: phone.value, fullName: fullName.value, rawMessage: rawMessage.value, softenData: JSON.stringify(softenData.value), refineInstruction: refineInstruction.value, stage: 'review' }));
    router.push('/login');
    return;
  }
  loading.value = true;

  const info = '> ⓘ Pesan ini hanya sebagai perantara dan dikirim otomatis oleh sistem. Mohon untuk tidak memblokir nomor ini.'

  // Handle empty suggestion
  let message;
  if (softenData.value?.suggestion) {
    message = `${softenData.value.soften_message}\n\n${softenData.value.suggestion}\n\n${softenData.value.disclaimer}\n\n${info}`;
  } else {
    message = `${softenData.value?.soften_message}\n\n${softenData.value?.disclaimer}\n\n${info}`;
  }

  const res = await $fetch('/api/send-whatsapp', { method: 'POST', body: { phone: phone.value, message } });
  const { messageId } = res as any;
  await setDoc(doc(firestore, 'topics', messageId), { id: messageId, userId: user.value.uid, phone: phone.value, fullName: fullName.value, rawMessage: rawMessage.value, softenData: JSON.stringify(softenData.value), messageServerId: (res as any).messageServerId, createdAt: serverTimestamp(), status: 'PENDING' });
  loading.value = false;
  router.push(`/topics/${messageId}`);
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
