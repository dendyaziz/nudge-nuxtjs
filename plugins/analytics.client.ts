import { logEvent } from 'firebase/analytics';

export default defineNuxtPlugin((nuxtApp) => {
  const { $analytics } = useNuxtApp();

  // Only run on client-side and if analytics is available
  if (process.client && $analytics) {
    // Track initial page view
    const route = useRoute();
    logEvent($analytics, 'page_view', {
      page_path: route.fullPath,
      page_title: document.title,
      page_location: window.location.href
    });

    // Track page views on route changes
    nuxtApp.hook('page:finish', () => {
      logEvent($analytics, 'page_view', {
        page_path: route.fullPath,
        page_title: document.title,
        page_location: window.location.href
      });
    });
  }
});
