import Notification from '../models/notification.model.js';

// Map of active SSE client connections: userId -> Set of Express Response objects
const activeClients = new Map();

/**
 * Register a client's SSE connection stream
 * @param {string} userId
 * @param {import('express').Response} res
 */
export const registerClient = (userId, res) => {
  const userKey = String(userId);
  if (!activeClients.has(userKey)) {
    activeClients.set(userKey, new Set());
  }
  activeClients.get(userKey).add(res);

  // Send initial ping to establish connection
  res.write(`event: connected\ndata: ${JSON.stringify({ status: 'connected', timestamp: Date.now() })}\n\n`);

  // Clean up when the client closes the connection or navigates away
  res.on('close', () => {
    const clients = activeClients.get(userKey);
    if (clients) {
      clients.delete(res);
      if (clients.size === 0) {
        activeClients.delete(userKey);
      }
    }
  });
};

/**
 * Send an in-app notification to a specific user.
 * Persists the notification in MongoDB and pushes it in real-time if the user is currently connected.
 *
 * @param {Object} params
 * @param {string} params.recipient - User ID of the recipient
 * @param {string} [params.collegeId] - College ID for multi-tenant isolation
 * @param {string} params.title - Short, bold notification headline
 * @param {string} params.message - Descriptive notification body
 * @param {'COMPLAINT_STATUS' | 'COMPLAINT_ASSIGNED' | 'SLA_NUDGE' | 'FEEDBACK' | 'VISIT_SCHEDULED' | 'MAINTENANCE_REQUEST' | 'SYSTEM'} [params.type]
 * @param {string} [params.link] - Frontend route path to navigate on click
 * @param {Object} [params.metadata] - Extra entity references
 * @returns {Promise<Object>} The persisted notification document
 */
export const notifyUser = async ({
  recipient,
  collegeId,
  title,
  message,
  type = 'SYSTEM',
  link = '',
  metadata = {}
}) => {
  try {
    if (!recipient) {
      console.warn('[NOTIFY WARNING] Recipient ID is required for sending in-app notification.');
      return null;
    }

    // 1. Persist notification to database (ensures availability even if user is currently offline)
    const notification = await Notification.create({
      recipient,
      collegeId,
      title,
      message,
      type,
      link,
      metadata
    });

    // 2. Real-time push via SSE if user has an active browser session
    const userKey = String(recipient);
    const clients = activeClients.get(userKey);

    if (clients && clients.size > 0) {
      const payload = JSON.stringify(notification);
      for (const clientRes of clients) {
        try {
          clientRes.write(`event: notification\ndata: ${payload}\n\n`);
        } catch (pushErr) {
          console.error(`[SSE PUSH ERROR] Failed to send to client for user ${userKey}:`, pushErr.message);
        }
      }
    }

    return notification;
  } catch (error) {
    console.error('[NOTIFY ERROR] Failed to save/push notification:', error.message);
    return null;
  }
};

/**
 * Send notification to multiple users (e.g. all committee members)
 * @param {string[]} recipientIds
 * @param {Object} payload
 */
export const notifyMultipleUsers = async (recipientIds, payload) => {
  if (!Array.isArray(recipientIds) || recipientIds.length === 0) return;
  const promises = recipientIds.map((id) =>
    notifyUser({ ...payload, recipient: id })
  );
  return Promise.allSettled(promises);
};

// Send a periodic heartbeat comment every 25 seconds to keep proxies from terminating idle connections
setInterval(() => {
  for (const [, clients] of activeClients.entries()) {
    for (const clientRes of clients) {
      try {
        clientRes.write(': ping\n\n');
      } catch {
        // Handled on close
      }
    }
  }
}, 25000);
