import { defineEventHandler, readBody, createError, sendError } from 'h3';
import axios from 'axios';
import { addToQueue } from '../utils/queue';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { phone, message, topicId } = body;
  if (!phone || !message || !topicId) {
    return sendError(event, createError({
      statusCode: 400,
      statusMessage: 'Phone, message, and topicId are required'
    }));
  }

  try {
    // Add message to queue instead of sending directly
    const queueResult = await addToQueue(topicId, phone, message);

    return {
      messageId: topicId,
      queueId: queueResult.queueId,
      scheduledFor: queueResult.scheduledFor,
      status: 'QUEUED'
    };
  } catch (err: any) {
    console.error('Error adding message to queue:', err);
    return sendError(event, createError({
      statusCode: 500,
      statusMessage: 'Failed to queue message',
      data: err.message
    }));
  }
});
