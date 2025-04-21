import { defineEventHandler } from 'h3';
import axios from 'axios';
import { processNextQueueItem, updateQueueItemStatus, QUEUE_STATUS, cleanupOldQueueItems } from '../utils/queue';

export default defineEventHandler(async (event) => {
  try {
    // Process the next item in the queue
    const result = await processNextQueueItem();

    // If no items to process, return early
    if (!result.success) {
      return { success: true, message: result.message };
    }

    const queueItem = result.queueItem;

    // Get WhatsApp API configuration
    const config = useRuntimeConfig();
    const baseUrl = config.whatsappBaseUrl;
    const clientPhone = config.whatsappClientPhone;

    try {
      if (!queueItem)
        return

      // Send the message to WhatsApp API
      const res = await axios.post(`${baseUrl}/send-message`, {
        phone: queueItem.phone,
        message: queueItem.message,
        client_phone: clientPhone
      });

      if (!res.data.success) {
        // Update queue item status to failed
        await updateQueueItemStatus(
          queueItem.id,
          QUEUE_STATUS.FAILED,
          null,
          res.data.message || 'WhatsApp API returned error'
        );
        return {
          success: false,
          message: 'Failed to send message',
          error: res.data.message
        };
      }

      // Update queue item status to completed
      const { messageId, messageServerId, timestamp } = res.data.data;
      await updateQueueItemStatus(
        queueItem.id,
        QUEUE_STATUS.COMPLETED,
        { messageId, messageServerId, timestamp }
      );

      // Clean up old queue items (older than 5 minutes) after completing a queue
      const cleanupResult = await cleanupOldQueueItems();
      console.log('Queue cleanup result:', cleanupResult);

      return {
        success: true,
        message: 'Message sent successfully',
        data: {
          queueId: queueItem.id,
          topicId: queueItem.topicId,
          messageServerId
        }
      };
    } catch (err: any) {
      if (!queueItem)
        return

      // Update queue item status to failed
      await updateQueueItemStatus(
        queueItem.id,
        QUEUE_STATUS.FAILED,
        null,
        err.response?.data?.message || err.message || 'Error sending message'
      );

      return {
        success: false,
        message: 'Error sending message',
        error: err.response?.data || err.message
      };
    }
  } catch (err: any) {
    console.error('Error processing queue:', err);
    return {
      success: false,
      message: 'Error processing queue',
      error: err.message
    };
  }
});
