const express = require('express');
const { getNotifications, markAsRead, markAllAsRead, deleteNotification, clearAllNotifications } = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All notification routes require authentication
router.use(protect);

// Get notifications for current user
router.get('/', getNotifications);

// Mark single notification as read
router.patch('/:notificationId/read', markAsRead);

// Mark all notifications as read
router.patch('/read/all', markAllAsRead);

// Delete single notification
router.delete('/:notificationId', deleteNotification);

// Clear all notifications
router.delete('/clear/all', clearAllNotifications);

module.exports = router;
