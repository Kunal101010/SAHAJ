import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../services/api';

function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, [filter, page]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const params = {
        limit: 20,
        skip: (page - 1) * 20,
        unreadOnly: filter === 'unread'
      };

      const response = await api.get('/api/notifications', { params });
      if (response.data.success) {
        if (page === 1) {
          setNotifications(response.data.notifications);
        } else {
          setNotifications(prev => [...prev, ...response.data.notifications]);
        }
        setHasMore(response.data.notifications.length === 20);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await api.patch(`/api/notifications/${notificationId}/read`);
      setNotifications(
        notifications.map(n =>
          n._id === notificationId ? { ...n, isRead: true } : n
        )
      );
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.patch('/api/notifications/read/all');
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    try {
      await api.delete(`/api/notifications/${notificationId}`);
      setNotifications(notifications.filter(n => n._id !== notificationId));
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Are you sure you want to delete all notifications?')) return;

    try {
      await api.delete('/api/notifications/clear/all');
      setNotifications([]);
    } catch (err) {
      console.error('Error clearing notifications:', err);
    }
  };

  const getNotificationIcon = (type) => {
    const icons = {
      request_created: '📝',
      request_assigned: '👤',
      request_status_changed: '⚙️',
      request_completed: '✅',
      booking_created: '📅',
      facility_maintenance_scheduled: '🔧',
      default: '🔔'
    };
    return icons[type] || icons.default;
  };

  const getNotificationColor = (type) => {
    const colors = {
      request_created: 'bg-blue-50 border-l-4 border-blue-500',
      request_assigned: 'bg-purple-50 border-l-4 border-purple-500',
      request_status_changed: 'bg-yellow-50 border-l-4 border-yellow-500',
      request_completed: 'bg-green-50 border-l-4 border-green-500',
      booking_created: 'bg-indigo-50 border-l-4 border-indigo-500',
      facility_maintenance_scheduled: 'bg-orange-50 border-l-4 border-orange-500',
      default: 'bg-gray-50 border-l-4 border-gray-500'
    };
    return colors[type] || colors.default;
  };

  const formatTime = (createdAt) => {
    return new Date(createdAt).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredNotifications = filter === 'all' ? notifications : notifications.filter(n => !n.isRead);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6 lg:p-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Notifications</h1>
          <p className="text-gray-600">Stay updated with your facility management activities</p>
        </motion.div>

        {/* Controls */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg shadow p-4 mb-6 flex justify-between items-center flex-wrap gap-4"
        >
          <div className="flex gap-2">
            <button
              onClick={() => { setFilter('all'); setPage(1); }}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => { setFilter('unread'); setPage(1); }}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === 'unread'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Unread
            </button>
          </div>

          <div className="flex gap-2">
            {notifications.some(n => !n.isRead) && (
              <button
                onClick={handleMarkAllAsRead}
                className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition font-medium text-sm"
              >
                Mark All Read
              </button>
            )}
            <button
              onClick={handleClearAll}
              className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition font-medium text-sm"
            >
              Clear All
            </button>
          </div>
        </motion.div>

        {/* Notifications List */}
        <div className="space-y-3">
          {loading && filteredNotifications.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Loading notifications...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <p className="text-5xl mb-4">🔔</p>
              <p className="text-gray-500 text-lg">
                {filter === 'unread' ? 'No unread notifications' : 'No notifications'}
              </p>
            </div>
          ) : (
            <>
              {filteredNotifications.map((notif, index) => (
                <motion.div
                  key={notif._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`p-4 rounded-lg shadow hover:shadow-md transition ${getNotificationColor(
                    notif.type
                  )} ${!notif.isRead ? 'ring-2 ring-blue-200' : ''}`}
                >
                  <div className="flex items-start gap-4">
                    <span className="text-3xl">{getNotificationIcon(notif.type)}</span>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-bold text-lg text-gray-900">
                            {notif.title}
                            {!notif.isRead && (
                              <span className="inline-block ml-2 w-2 h-2 bg-blue-600 rounded-full"></span>
                            )}
                          </h3>
                          <p className="text-gray-700 mt-1">{notif.message}</p>
                        </div>
                        <span className="text-xs text-gray-500 whitespace-nowrap ml-4">
                          {formatTime(notif.createdAt)}
                        </span>
                      </div>

                      {notif.relatedUser && (
                        <p className="text-sm text-gray-600 mt-2">
                          From: <span className="font-medium">{notif.relatedUser.firstName} {notif.relatedUser.lastName}</span>
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2 flex-shrink-0">
                      {!notif.isRead && (
                        <button
                          onClick={() => handleMarkAsRead(notif._id)}
                          className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition"
                          title="Mark as read"
                        >
                          ✓
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteNotification(notif._id)}
                        className="px-3 py-1 bg-red-100 text-red-600 text-sm rounded hover:bg-red-200 transition"
                        title="Delete"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}

              {/* Load More Button */}
              {hasMore && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center pt-4"
                >
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={loading}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                  >
                    {loading ? 'Loading...' : 'Load More'}
                  </button>
                </motion.div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default NotificationsPage;
