import { defineEventHandler, readBody, createError, sendError } from 'h3';
import axios from 'axios';
import { addToQueue } from '../utils/queue';
import { initializeFirebaseAdmin } from '../utils/firestore-admin';
import { Timestamp } from 'firebase-admin/firestore';

// Message limit configuration
// Maximum number of messages a user can send per time period
const MAX_MESSAGES_PER_USER = 3 + 1;
// Time period for user message limit in days
const USER_MESSAGE_LIMIT_DAYS = 1;

// Maximum number of messages a phone number can receive per time period
const MAX_MESSAGES_PER_PHONE = 2 + 1;
// Time period for phone message limit in days
const PHONE_MESSAGE_LIMIT_DAYS = 1;

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

// Function to get start and end of time period timestamps
const getTimePeriodBoundaries = (days: number = 1) => {
  const now = new Date();

  // Calculate start date (beginning of day 'days' ago)
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - (days - 1));
  const startOfPeriod = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate(), 0, 0, 0);

  // End date is end of current day
  const endOfPeriod = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  return {
    startOfDay: Timestamp.fromDate(startOfPeriod),
    endOfDay: Timestamp.fromDate(endOfPeriod)
  };
};

// Function to check if user has reached message limit
const checkUserMessageLimit = async (userId: string) => {
  const db = initializeFirebaseAdmin();
  const { startOfDay, endOfDay } = getTimePeriodBoundaries(USER_MESSAGE_LIMIT_DAYS);

  // Count messages sent by this user within the time period
  const userMessagesQuery = await db.collection('topics')
    .where('userId', '==', userId)
    .where('createdAt', '>=', startOfDay)
    .where('createdAt', '<=', endOfDay)
    .get();

  return userMessagesQuery.size >= MAX_MESSAGES_PER_USER;
};

// Function to check if phone has reached message limit
const checkPhoneMessageLimit = async (phone: string) => {
  const db = initializeFirebaseAdmin();
  const { startOfDay, endOfDay } = getTimePeriodBoundaries(PHONE_MESSAGE_LIMIT_DAYS);

  // Count messages sent to this phone within the time period
  const phoneMessagesQuery = await db.collection('topics')
    .where('phone', '==', phone)
    .where('createdAt', '>=', startOfDay)
    .where('createdAt', '<=', endOfDay)
    .get();

  return phoneMessagesQuery.size >= MAX_MESSAGES_PER_PHONE;
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
    // Get the topic document to retrieve the user ID
    const db = initializeFirebaseAdmin();
    const topicDoc = await db.collection('topics').doc(topicId).get();

    if (!topicDoc.exists) {
      return sendError(event, createError({
        statusCode: 404,
        statusMessage: 'Topic not found'
      }));
    }

    const topicData = topicDoc.data();
    const userId = topicData?.userId;

    if (!userId) {
      return sendError(event, createError({
        statusCode: 400,
        statusMessage: 'User ID not found in topic'
      }));
    }

    // Check if user has reached message limit
    const userLimitReached = await checkUserMessageLimit(userId);
    if (userLimitReached) {
      return sendError(event, createError({
        statusCode: 429,
        statusMessage: `Batas mengirim pesan tercapai.`
      }));
    }

    // Check if phone has reached message limit
    const phoneLimitReached = await checkPhoneMessageLimit(standardizedPhone);
    if (phoneLimitReached) {
      return sendError(event, createError({
        statusCode: 429,
        statusMessage: `Pengiriman ke nomor ini dibatasi.`
      }));
    }

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
