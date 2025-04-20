import { defineEventHandler, createError, sendError, getQuery } from 'h3';
import axios from 'axios';

export default defineEventHandler(async (event) => {
  // Get messageId from query parameters
  const query = getQuery(event);
  const messageId = query.messageId as string;

  if (!messageId) {
    return sendError(event, createError({ statusCode: 400, statusMessage: 'Message ID is required' }));
  }

  const config = useRuntimeConfig();
  const baseUrl = config.whatsappBaseUrl;
  const clientPhone = config.whatsappClientPhone;

  try {
    const res = await axios.get(`${baseUrl}/message-status/${clientPhone}/${messageId}`);

    // Return the response data directly
    return res.data;
  } catch (err: any) {
    // Handle specific error cases as mentioned in the API documentation
    const errorMessage = err.response?.data?.message || 'Failed to check message status';
    const statusCode = err.response?.status || 500;

    return sendError(event, createError({
      statusCode,
      statusMessage: errorMessage,
      data: err.response?.data || err.message
    }));
  }
});
