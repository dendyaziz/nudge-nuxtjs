import { defineEventHandler, readBody, createError, sendError } from 'h3';
import axios from 'axios';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { phone, message } = body;
  if (!phone || !message) {
    return sendError(event, createError({ statusCode: 400, statusMessage: 'Phone and message are required' }));
  }

  const config = useRuntimeConfig();
  const baseUrl = config.whatsappBaseUrl;
  const clientPhone = config.whatsappClientPhone;
  try {
    const res = await axios.post(`${baseUrl}/send-message`, {
      phone,
      message,
      client_phone: clientPhone
    });
    if (!res.data.success) {
      return sendError(event, createError({ statusCode: 500, statusMessage: res.data.message }));
    }
    const { messageId, messageServerId, timestamp } = res.data.data;
    return { messageId, messageServerId, timestamp };
  } catch (err: any) {
    return sendError(event, createError({ statusCode: 500, statusMessage: 'Failed to send message', data: err.response?.data || err.message }));
  }
});
