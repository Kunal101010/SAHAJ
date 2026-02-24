import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import { getCurrentUser } from '../utils/auth';

function NotificationBell() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Rewrite any maintenance-requests URL to the correct page for the logged-in role
  const resolveActionUrl = (url) => {
    if (url === '/maintenance-requests' && currentUser?.role === 'technician') {
      return '/technician/maintenance';
    }
    return url;
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/api/notifications?limit=10');
      if (response.data.success) {
        setNotifications(response.data.notifications);
        setUnreadCount(response.data.unreadCount);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
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
      setUnreadCount(Math.max(0, unreadCount - 1));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.patch('/api/notifications/read/all');
      setNotifications(
        notifications.map(n => ({ ...n, isRead: true }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    try {
      await api.delete(`/api/notifications/${notificationId}`);
      const notification = notifications.find(n => n._id === notificationId);
      if (notification && !notification.isRead) {
        setUnreadCount(Math.max(0, unreadCount - 1));
      }
      setNotifications(notifications.filter(n => n._id !== notificationId));
    } catch (err) {
      console.error('Error deleting notification:', err);
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

  const formatTime = (createdAt) => {
    const now = new Date();
    const notifTime = new Date(createdAt);
    const diffMs = now - notifTime;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return notifTime.toLocaleDateString();
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none"
        title="Notifications"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl z-50 overflow-hidden"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4">
                <h3 className="font-bold text-lg">Notifications</h3>
                <p className="text-sm text-blue-100">
                  {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
                </p>
              </div>

              {/* Notifications List */}
              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <p className="text-4xl mb-2">🔔</p>
                    <p>No notifications yet</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {notifications.map((notif) => (
                      <motion.div
                        key={notif._id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className={`p-4 cursor-pointer transition-colors ${notif.isRead ? 'bg-gray-50 hover:bg-gray-100' : 'bg-blue-50 hover:bg-blue-100'
                          }`}
                        onClick={() => {
                          if (!notif.isRead) handleMarkAsRead(notif._id);
                          setIsOpen(false);
                          if (notif.actionUrl) {
                            navigate(resolveActionUrl(notif.actionUrl));
                          }
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-2xl mt-1">
                            {getNotificationIcon(notif.type)}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className={`font-semibold text-sm ${notif.isRead ? 'text-gray-700' : 'text-gray-900'}`}>
                              {notif.title}
                            </p>
                            <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                              {notif.message}
                            </p>
                            <p className="text-xs text-gray-500 mt-2">
                              {formatTime(notif.createdAt)}
                            </p>
                          </div>
                          {!notif.isRead && (
                            <div className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-2" />
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteNotification(notif._id);
                            }}
                            className="text-gray-400 hover:text-red-600 flex-shrink-0"
                            title="Delete"
                          >
                            ✕
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="bg-gray-50 border-t p-3 flex gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="flex-1 text-sm px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                  >
                    Mark all read
                  </button>
                )}
                <Link
                  to="/notifications"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 text-sm px-3 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition text-center"
                >
                  View All
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export default NotificationBell;
