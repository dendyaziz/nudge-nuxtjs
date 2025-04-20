import { defineEventHandler, readBody, createError, sendError } from 'h3';
import axios from 'axios';
import { addToQueue } from '../utils/queue';

// Function to standardize phone number
const standardizePhoneNumber = (phone: string): string | null => {
  if (!phone) return null;

  let standardizedPhone = phone.replace(/\D/g, ''); // Remove all non-digit characters
  if (standardizedPhone.startsWith('0')) {
    return '62' + standardizedPhone.slice(1);
  } else if (standardizedPhone.startsWith('62')) {
    return standardizedPhone;
  }

  return null;
};

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { phone, message, topicId } = body;
  if (!phone || !message || !topicId) {
    return sendError(event, createError({
      statusCode: 400,
      statusMessage: 'Phone, message, and topicId are required'
    }));
  }

  // Standardize the phone number
  const standardizedPhone = standardizePhoneNumber(phone);
  if (!standardizedPhone) {
    return sendError(event, createError({
      statusCode: 400,
      statusMessage: 'Nomor telepon tidak valid'
    }));
  }

  try {
    // Add message to queue instead of sending directly
    const queueResult = await addToQueue(topicId, standardizedPhone, message);

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
