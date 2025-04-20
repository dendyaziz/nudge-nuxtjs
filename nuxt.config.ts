export default defineNuxtConfig({
  modules: ['@nuxtjs/tailwindcss'],

  runtimeConfig: {
    firebase: {
      apiKey: process.env.NUXT_ENV_PUBLIC_FIREBASE_API_KEY || '',
      authDomain: process.env.NUXT_ENV_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
      projectId: process.env.NUXT_ENV_PUBLIC_FIREBASE_PROJECT_ID || '',
      storageBucket: process.env.NUXT_ENV_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
      messagingSenderId: process.env.NUXT_ENV_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
      appId: process.env.NUXT_ENV_PUBLIC_FIREBASE_APP_ID || ''
    },
    // Firebase Admin SDK credentials for server-side operations
    firebaseAdminCredentials: process.env.NUXT_ENV_FIREBASE_ADMIN_CREDENTIALS || '',
    geminiApiKey: process.env.NUXT_ENV_GEMINI_API_KEY || '',
    whatsappBaseUrl: 'https://whatsapp-bot.hust.sale',
    whatsappClientPhone: process.env.NUXT_ENV_WHATSAPP_CLIENT_PHONE || '',
    public: {
      firebase: {
        apiKey: process.env.NUXT_ENV_PUBLIC_FIREBASE_API_KEY || '',
        authDomain: process.env.NUXT_ENV_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
        projectId: process.env.NUXT_ENV_PUBLIC_FIREBASE_PROJECT_ID || '',
        storageBucket: process.env.NUXT_ENV_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
        messagingSenderId: process.env.NUXT_ENV_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
        appId: process.env.NUXT_ENV_PUBLIC_FIREBASE_APP_ID || ''
      }
    }
  },

  tailwindcss: {
    cssPath: '~/assets/css/tailwind.css'
  },

  compatibilityDate: '2025-04-20'
});
