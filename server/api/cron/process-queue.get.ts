import { defineEventHandler } from 'h3';

export default defineEventHandler(async (event) => {
  try {
    // Call the process-queue endpoint
    const result = await $fetch('/api/process-queue', { method: 'POST' });
    return result;
  } catch (error: any) {
    console.error('Error in cron job:', error);
    return {
      success: false,
      message: 'Error in cron job',
      error: error.message
    };
  }
});
