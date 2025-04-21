import { logEvent } from 'firebase/analytics';
import { useNuxtApp } from '#app';

export function useAnalytics() {
  const { $analytics } = useNuxtApp();

  /**
   * Track a custom event in Google Analytics
   * @param eventName The name of the event to track
   * @param eventParams Optional parameters to include with the event
   */
  function trackEvent(eventName: string, eventParams?: Record<string, any>) {
    if (process.client && $analytics) {
      logEvent($analytics, eventName, eventParams);
    }
  }

  return {
    trackEvent
  };
}
