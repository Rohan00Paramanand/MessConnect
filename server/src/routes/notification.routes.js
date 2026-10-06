import express from 'express';
import { protect } from '../middleware/auth.middleware.js';
import {
  streamNotifications,
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification
} from '../controllers/notification.controller.js';

const router = express.Router();

// Real-time SSE stream endpoint (authenticated)
router.get('/stream', protect, streamNotifications);

// REST notification management
router.get('/', protect, getNotifications);
router.patch('/read-all', protect, markAllNotificationsAsRead);
router.patch('/:id/read', protect, markNotificationAsRead);
router.delete('/:id', protect, deleteNotification);

export default router;
