export default defineNuxtConfig({
  modules: ['@nuxtjs/tailwindcss'],

  app: {
    head: {
      title: 'Nudge - Cara Baru Untuk Peduli',
      meta: [
        { name: 'description', content: 'Nudge adalah platform inovatif yang memudahkan Anda untuk peduli dan berbagi dengan orang lain melalui pesan untuk membuat perubahan positif hari ini.' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { property: 'og:title', content: 'Nudge - Cara Baru Untuk Peduli' },
        { property: 'og:description', content: 'Nudge adalah platform inovatif yang memudahkan Anda untuk peduli dan berbagi dengan orang lain melalui pesan untuk membuat perubahan positif hari ini.' },
        { property: 'og:url', content: process.env.NUXT_ENV_PUBLIC_APP_URL || 'https://www.nudge.web.id' },
        { property: 'og:type', content: 'website' },
        { property: 'og:image', content: '/thumbnail.png' },
        { property: 'og:image:alt', content: 'Nudge' },
        { property: 'og:image:width', content: '1028' },
        { property: 'og:image:height', content: '538' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: 'Nudge - Cara Baru Untuk Peduli' },
        { name: 'twitter:description', content: 'Nudge adalah platform inovatif yang memudahkan Anda untuk peduli dan berbagi dengan orang lain melalui pesan untuk membuat perubahan positif hari ini.' },
        { name: 'twitter:image', content: '/thumbnail.png' },
        { name: 'twitter:image:alt', content: 'Nudge' },
        { name: 'twitter:image:width', content: '1028' },
        { name: 'twitter:image:height', content: '538' },
      ],
      link: [
        { rel: 'canonical', href: process.env.NUXT_ENV_PUBLIC_APP_URL || 'https://www.nudge.web.id' },
        {
          rel: 'icon',
          href: '/favicon.ico?v=3',
          type: 'image/x-icon',
          sizes: '32x32',
        },
        {
          rel: 'icon',
          href: '/icon.png',
          type: 'image/png',
          sizes: '192x192',
        },
      ],
    },
  },

  runtimeConfig: {
    firebase: {
      apiKey: process.env.NUXT_ENV_PUBLIC_FIREBASE_API_KEY || '',
      authDomain: process.env.NUXT_ENV_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
      projectId: process.env.NUXT_ENV_PUBLIC_FIREBASE_PROJECT_ID || '',
      storageBucket: process.env.NUXT_ENV_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
      messagingSenderId: process.env.NUXT_ENV_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
      appId: process.env.NUXT_ENV_PUBLIC_FIREBASE_APP_ID || '',
      measurementId: process.env.NUXT_ENV_PUBLIC_FIREBASE_MEASUREMENT_ID || '',
    },
    // Firebase Admin SDK credentials for server-side operations
    firebaseAdminCredentials: process.env.NUXT_ENV_FIREBASE_ADMIN_CREDENTIALS || '',
    geminiApiKey: process.env.NUXT_ENV_GEMINI_API_KEY || '',
    whatsappBaseUrl: 'https://whatsapp-bot.hust.sale',
    whatsappClientPhone: process.env.NUXT_ENV_WHATSAPP_CLIENT_PHONE || '',
    // Secret token for cron job authentication
    cronSecretToken: process.env.NUXT_ENV_CRON_SECRET_TOKEN || 'default-cron-secret-for-development',
    public: {
      firebase: {
        apiKey: process.env.NUXT_ENV_PUBLIC_FIREBASE_API_KEY || '',
        authDomain: process.env.NUXT_ENV_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
        projectId: process.env.NUXT_ENV_PUBLIC_FIREBASE_PROJECT_ID || '',
        storageBucket: process.env.NUXT_ENV_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
        messagingSenderId: process.env.NUXT_ENV_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
        appId: process.env.NUXT_ENV_PUBLIC_FIREBASE_APP_ID || '',
        measurementId: process.env.NUXT_ENV_PUBLIC_FIREBASE_MEASUREMENT_ID || '',
      },
      baseUrl: process.env.NUXT_ENV_PUBLIC_APP_URL || 'https://www.nudge.web.id',
      defaultPhone: process.env.NUXT_ENV_DEFAULT_PHONE || '',
      defaultName: process.env.NUXT_ENV_DEFAULT_NAME || '',
      defaultMessage: process.env.NUXT_ENV_DEFAULT_MESSAGE || ''
    }
  },

  tailwindcss: {
    cssPath: '~/assets/css/tailwind.css'
  },

  compatibilityDate: '2025-04-20'
});
