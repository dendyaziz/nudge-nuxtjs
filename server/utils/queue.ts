import { initializeFirebaseAdmin } from './firestore-admin';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';

// Queue status constants
export const QUEUE_STATUS = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED'
};

// Message status constants
export const MESSAGE_STATUS = {
  QUEUED: 'QUEUED',
  SENT: 'SENT',
  DELIVERED: 'DELIVERED',
  READ: 'READ',
  PLAYED: 'PLAYED',
  FAILED: 'FAILED'
};

// Interface for queue item
export interface QueueItem {
  id: string;
  topicId: string;
  phone: string;
  message: string;
  status: string;
  scheduledFor: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  processedAt?: Timestamp;
  error?: string;
}

// Add a message to the queue
export async function addToQueue(topicId: string, phone: string, message: string) {
  const db = initializeFirebaseAdmin();
  const now = Timestamp.now();

  // Check if there are any pending queue items
  const pendingQuery = await db.collection('queue')
    .where('status', '==', QUEUE_STATUS.PENDING)
    .orderBy('scheduledFor', 'asc')
    .limit(1)
    .get();

  // Calculate scheduled time
  let scheduledFor = now;

  if (!pendingQuery.empty) {
    // If there are pending items, schedule this one for 1 minute after the last one
    const lastPending = pendingQuery.docs[pendingQuery.docs.length - 1].data();
    scheduledFor = new Timestamp(
      lastPending.scheduledFor.seconds + 60,
      lastPending.scheduledFor.nanoseconds
    );
  } else {
    // No pending items, check when the last message was processed
    const lastProcessedQuery = await db.collection('queue')
      .where('status', '==', QUEUE_STATUS.COMPLETED)
      .orderBy('processedAt', 'desc')
      .limit(1)
      .get();

    if (!lastProcessedQuery.empty) {
      const lastProcessed = lastProcessedQuery.docs[0].data();
      const lastProcessedTime = lastProcessed.processedAt;

      // Check if the last message was processed less than a minute ago
      const oneMinuteAgo = new Timestamp(now.seconds - 60, now.nanoseconds);

      if (lastProcessedTime && lastProcessedTime.seconds > oneMinuteAgo.seconds) {
        // Last message was processed less than a minute ago
        // Schedule this one for 1 minute after the last processed message
        scheduledFor = new Timestamp(
          lastProcessedTime.seconds + 60,
          lastProcessedTime.nanoseconds
        );
      }
      // Otherwise, if it was processed more than a minute ago, keep scheduledFor as now
    }
    // If no messages have been processed yet, keep scheduledFor as now
  }

  // Create a new queue item
  const queueRef = db.collection('queue').doc();
  const queueItem: QueueItem = {
    id: queueRef.id,
    topicId,
    phone,
    message,
    status: QUEUE_STATUS.PENDING,
    scheduledFor,
    createdAt: now,
    updatedAt: now
  };

  // Save to Firestore
  await queueRef.set(queueItem);

  // Update the topic with queue information
  await db.collection('topics').doc(topicId).update({
    queueId: queueRef.id,
    queueStatus: QUEUE_STATUS.PENDING,
    scheduledFor,
    status: MESSAGE_STATUS.QUEUED,
    updatedAt: FieldValue.serverTimestamp()
  });

  return {
    queueId: queueRef.id,
    scheduledFor
  };
}

// Process the next item in the queue
export async function processNextQueueItem() {
  const db = initializeFirebaseAdmin();
  const now = Timestamp.now();

  // Transaction to ensure only one item is processed at a time
  return db.runTransaction(async (transaction) => {
    // Get the next item to process (scheduled for now or earlier)
    const querySnapshot = await db.collection('queue')
      .where('status', '==', QUEUE_STATUS.PENDING)
      .where('scheduledFor', '<=', now)
      .orderBy('scheduledFor', 'asc')
      .limit(1)
      .get();

    if (querySnapshot.empty) {
      return { success: false, message: 'No items in queue ready for processing' };
    }

    const queueDoc = querySnapshot.docs[0];
    const queueItem = queueDoc.data() as QueueItem;

    // Mark as processing
    transaction.update(queueDoc.ref, {
      status: QUEUE_STATUS.PROCESSING,
      updatedAt: now
    });

    // Also update the topic
    const topicRef = db.collection('topics').doc(queueItem.topicId);
    transaction.update(topicRef, {
      queueStatus: QUEUE_STATUS.PROCESSING,
      updatedAt: FieldValue.serverTimestamp()
    });

    return {
      success: true,
      queueItem
    };
  });
}

// Update queue item status after processing
export async function updateQueueItemStatus(
  queueId: string,
  status: string,
  messageData?: any,
  error?: string
) {
  const db = initializeFirebaseAdmin();
  const now = Timestamp.now();

  // Get the queue item
  const queueRef = db.collection('queue').doc(queueId);
  const queueDoc = await queueRef.get();

  if (!queueDoc.exists) {
    throw new Error(`Queue item ${queueId} not found`);
  }

  const queueItem = queueDoc.data() as QueueItem;

  // Update queue item
  const updateData: any = {
    status,
    updatedAt: now,
    processedAt: now
  };

  if (error) {
    updateData.error = error;
  }

  await queueRef.update(updateData);

  // Update the topic
  const topicRef = db.collection('topics').doc(queueItem.topicId);
  const topicUpdateData: any = {
    queueStatus: status,
    updatedAt: FieldValue.serverTimestamp()
  };

  // If message was sent successfully, update with message server ID
  if (status === QUEUE_STATUS.COMPLETED && messageData) {
    topicUpdateData.messageServerId = messageData.messageServerId;
    topicUpdateData.status = MESSAGE_STATUS.SENT;
  } else if (status === QUEUE_STATUS.FAILED) {
    topicUpdateData.status = MESSAGE_STATUS.FAILED;
    if (error) {
      topicUpdateData.error = error;
    }
  }

  await topicRef.update(topicUpdateData);

  return { success: true };
}
