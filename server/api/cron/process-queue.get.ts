import { defineEventHandler, getQuery } from 'h3';

export default defineEventHandler(async (event) => {
  try {
    // Get the token from the query parameters
    const query = getQuery(event);
    const token = query.token as string;

    // Call the process-queue endpoint
    // Pass the token to the internal API call to maintain authentication context
    const result = await $fetch('/api/process-queue', {
      method: 'POST',
      // Include the token in the query parameters for internal authentication
      query: { token }
    });

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
