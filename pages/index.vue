<template>
  <div class="max-w-md mx-auto p-4">
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
        Continue
      </button>
    </div>
    <div v-else-if="stage === 'review'">
      <h1 class="text-2xl font-bold mb-4">Review Softened Message</h1>
      <div class="p-4 mb-4 border rounded bg-base-200">
        <p>{{ softenedMessage }}</p>
      </div>
      <div class="flex justify-between">
        <button class="btn btn-outline" :disabled="loading" @click="regenerate">Regenerate</button>
        <button class="btn btn-outline" @click="refine">Refine</button>
        <button class="btn btn-primary" :disabled="loading" @click="sendMessage">Send</button>
      </div>
    </div>
    <div v-else-if="stage === 'refine'">
      <h1 class="text-2xl font-bold mb-4">Refine Message</h1>
      <div class="p-4 mb-2 border rounded bg-base-200">
        <p>{{ softenedMessage }}</p>
      </div>
      <div class="form-control mb-4">
        <label class="label"><span class="label-text">What to add?</span></label>
        <input v-model="refineText" type="text" class="input input-bordered" placeholder="e.g. be more polite" />
      </div>
      <div class="flex justify-between">
        <button class="btn btn-outline" @click="cancelRefine">Cancel</button>
        <button class="btn btn-primary" :disabled="!refineText || loading" @click="submitRefine">Refine</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAuth } from '~/composables/useAuth';
import { useRouter } from 'vue-router';
import { useNuxtApp } from '#app';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

const stage = ref<'input'|'review'|'refine'>('input');
const loading = ref(false);
const phone = ref('6285155454174');
const fullName = ref('Dendy');
const rawMessage = ref('Ketek lu bau biawak');
const softenedMessage = ref('');
const refineText = ref('');
const { user } = useAuth();
const router = useRouter();
const nuxtApp = useNuxtApp();
const firestore = nuxtApp.$firestore as import('firebase/firestore').Firestore;

onMounted(() => {
  const saved = localStorage.getItem('nudgeForm');
  if (user.value && saved) {
    const form = JSON.parse(saved);
    phone.value = form.phone;
    fullName.value = form.fullName;
    rawMessage.value = form.rawMessage;
    softenedMessage.value = form.softenedMessage;
    refineText.value = form.refineText;
    stage.value = form.stage;
    localStorage.removeItem('nudgeForm');
  }
});

async function continueToReview() {
  loading.value = true;
  const res = await $fetch('/api/soften', { method: 'POST', body: { message: rawMessage.value, fullName: fullName.value } });
  softenedMessage.value = (res as any).softened;
  stage.value = 'review';
  loading.value = false;
}

async function regenerate() {
  loading.value = true;
  const res = await $fetch('/api/soften', { method: 'POST', body: { message: rawMessage.value, fullName: fullName.value } });
  softenedMessage.value = (res as any).softened;
  loading.value = false;
}

function refine() { stage.value = 'refine'; }
function cancelRefine() { refineText.value = ''; stage.value = 'review'; }

async function submitRefine() {
  loading.value = true;
  const combined = `${rawMessage.value}. Additionally, ${refineText.value}`;
  const res = await $fetch('/api/soften', { method: 'POST', body: { message: combined, fullName: fullName.value } });
  softenedMessage.value = (res as any).softened;
  stage.value = 'review';
  loading.value = false;
}

async function sendMessage() {
  if (!user.value) {
    localStorage.setItem('nudgeForm', JSON.stringify({ phone: phone.value, fullName: fullName.value, rawMessage: rawMessage.value, softenedMessage: softenedMessage.value, refineText: refineText.value, stage: 'review' }));
    router.push('/login');
    return;
  }
  loading.value = true;
  const res = await $fetch('/api/send-whatsapp', { method: 'POST', body: { phone: phone.value, message: softenedMessage.value } });
  const { messageId } = res as any;
  await setDoc(doc(firestore, 'topics', messageId), { id: messageId, userId: user.value.uid, phone: phone.value, fullName: fullName.value, rawMessage: rawMessage.value, softenedMessage: softenedMessage.value, messageServerId: (res as any).messageServerId, createdAt: serverTimestamp(), status: 'PENDING' });
  loading.value = false;
  router.push(`/topics/${messageId}`);
}
</script>
