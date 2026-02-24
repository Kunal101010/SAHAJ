const Notification = require('../model/notification');
const User = require('../model/user');
// Import with require (lazy load inside function to avoid circular dep issues if any, 
// though top level might be fine if socket.js is independent)
const { getSocketIO } = require('../socket');

const notificationService = {
  // Create notification for single user
  async notify(recipientId, data) {
    try {
      // Role-aware actionUrl: technicians have no /maintenance-requests page,
      // so redirect them to their own tasks page instead.
      let actionUrl = data.actionUrl;
      if (actionUrl === '/maintenance-requests') {
        const recipient = await User.findById(recipientId).select('role').lean();
        if (recipient?.role === 'technician') {
          actionUrl = '/technician/maintenance';
        }
      }

      const notification = new Notification({
        recipient: recipientId,
        type: data.type,
        title: data.title,
        message: data.message,
        relatedRequest: data.relatedRequest,
        relatedBooking: data.relatedBooking,
        relatedFacility: data.relatedFacility,
        relatedUser: data.relatedUser,
        actionUrl
      });

      // 🚀 Emit socket FIRST — client gets the notification instantly
      try {
        const io = getSocketIO();
        io.to(recipientId.toString()).emit('new_notification', notification);
      } catch (e) {
        console.log('Socket emit failed', e.message);
      }

      // Persist to DB in the background (non-blocking)
      notification.save().catch(err => console.error('Notification DB save failed:', err));
      console.log(`Notification emitted for user ${recipientId} → ${actionUrl}`);

      return notification;
    } catch (err) {
      console.error('Error creating notification:', err);
      throw err;
    }
  },

  // Create notification for multiple users (e.g., all admins/managers)
  async notifyMultiple(recipientIds, data) {
    try {
      const notificationsData = recipientIds.map(recipientId => ({
        recipient: recipientId,
        type: data.type,
        title: data.title,
        message: data.message,
        relatedRequest: data.relatedRequest,
        relatedBooking: data.relatedBooking,
        relatedFacility: data.relatedFacility,
        relatedUser: data.relatedUser,
        actionUrl: data.actionUrl
      }));

      // 🚀 Emit socket events FIRST — all recipients get notified instantly
      try {
        const io = getSocketIO();
        notificationsData.forEach(n => {
          io.to(n.recipient.toString()).emit('new_notification', n);
        });
      } catch (e) {
        console.log('Socket emit failed', e.message);
      }

      // Persist to DB in the background (non-blocking)
      Notification.insertMany(notificationsData)
        .then(() => console.log(`Notifications saved for ${recipientIds.length} users`))
        .catch(err => console.error('Notification batch save failed:', err));

      return notificationsData;
    } catch (err) {
      console.error('Error creating notifications:', err);
      throw err;
    }
  },

  // Get users by role (admin, manager, technician)
  async getUsersByRole(roles) {
    try {
      const users = await User.find({ role: { $in: roles }, isActive: true }).select('_id');
      return users.map(user => user._id);
    } catch (err) {
      console.error('Error fetching users by role:', err);
      throw err;
    }
  },

  // Notification templates
  requestCreatedNotification: (requestId, requestTitle, submittedByName) => ({
    type: 'request_created',
    title: 'New Maintenance Request',
    message: `New request created: ${requestTitle} by ${submittedByName}`,
    relatedRequest: requestId,
    actionUrl: '/admin/maintenance'
  }),

  requestAssignedToTechnicianNotification: (requestId, requestTitle, technicianName) => ({
    type: 'request_assigned',
    title: 'Request Assigned to You',
    message: `You have been assigned to: ${requestTitle}`,
    relatedRequest: requestId,
    actionUrl: '/technician/maintenance'
  }),

  requestAssignedNotificationToUser: (requestId, requestTitle, technicianName) => ({
    type: 'request_assigned',
    title: 'Technician Assigned',
    message: `${technicianName} has been assigned to your request: ${requestTitle}`,
    relatedRequest: requestId,
    actionUrl: '/maintenance-requests'
  }),

  requestStatusChangedNotification: (requestId, requestTitle, newStatus) => ({
    type: 'request_status_changed',
    title: 'Request Status Updated',
    message: `Your request "${requestTitle}" is now ${newStatus}`,
    relatedRequest: requestId,
    actionUrl: '/maintenance-requests'
  }),

  requestCompletedNotification: (requestId, requestTitle) => ({
    type: 'request_completed',
    title: 'Request Completed',
    message: `Request "${requestTitle}" has been marked as completed`,
    relatedRequest: requestId,
    actionUrl: '/maintenance-requests'
  }),

  bookingCreatedNotification: (bookingId, facilityName, bookingDate) => ({
    type: 'booking_created',
    title: 'New Facility Booking',
    message: `New booking for ${facilityName} on ${bookingDate}`,
    relatedBooking: bookingId,
    actionUrl: '/manager/bookings'
  }),

  facilityMaintenanceScheduledNotification: (facilityId, facilityName) => ({
    type: 'facility_maintenance_scheduled',
    title: 'Facility Maintenance Scheduled',
    message: `Maintenance scheduled for ${facilityName}`,
    relatedFacility: facilityId,
    actionUrl: '/admin/facilities'
  })
};

module.exports = notificationService;
