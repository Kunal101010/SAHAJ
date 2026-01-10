const Notification = require('../model/notification');

exports.getNotifications = async (req, res) => {
  try {
    const { limit = 20, skip = 0, unreadOnly = false } = req.query;
    const filter = { recipient: req.user.id };

    if (unreadOnly === 'true') {
      filter.isRead = false;
    }

    const notifications = await Notification.find(filter)
      .populate('relatedUser', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await Notification.countDocuments(filter);
    const unreadCount = await Notification.countDocuments({
      recipient: req.user.id,
      isRead: false
    });

    res.json({
      success: true,
      notifications,
      total,
      unreadCount
    });
  } catch (err) {
    console.error('GetNotifications error:', err);
    res.status(500).json({ success: false, message: 'Error fetching notifications' });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;

    const notification = await Notification.findByIdAndUpdate(
      notificationId,
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    res.json({
      success: true,
      message: 'Notification marked as read',
      notification
    });
  } catch (err) {
    console.error('MarkAsRead error:', err);
    res.status(500).json({ success: false, message: 'Error marking notification as read' });
  }
};

exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user.id, isRead: false },
      { isRead: true }
    );

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (err) {
    console.error('MarkAllAsRead error:', err);
    res.status(500).json({ success: false, message: 'Error marking notifications as read' });
  }
};

exports.deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;

    const notification = await Notification.findByIdAndDelete(notificationId);

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    res.json({
      success: true,
      message: 'Notification deleted'
    });
  } catch (err) {
    console.error('DeleteNotification error:', err);
    res.status(500).json({ success: false, message: 'Error deleting notification' });
  }
};

exports.clearAllNotifications = async (req, res) => {
  try {
    await Notification.deleteMany({ recipient: req.user.id });

    res.json({
      success: true,
      message: 'All notifications cleared'
    });
  } catch (err) {
    console.error('ClearAllNotifications error:', err);
    res.status(500).json({ success: false, message: 'Error clearing notifications' });
  }
};
