const Notification = require('../model/notification');
const User = require('../model/user');
// Import with require to avoid circular dependency issues if possible, 
// but socket.js doesn't depend on this service, so it should be fine.
// We need to require inside functions or use a getter if circular dependency exists,
// but here it seems safe at top level or lazy load.
// Lazy loading getSocketIO inside the method is safer.
const { getSocketIO } = require('../socket');

const notificationService = {
  // Create notification for single user
  async notify(recipientId, data) {
    try {
      const notification = new Notification({
        recipient: recipientId,
        type: data.type,
        title: data.title,
        message: data.message,
        relatedRequest: data.relatedRequest,
        relatedBooking: data.relatedBooking,
        relatedFacility: data.relatedFacility,
        relatedUser: data.relatedUser,
        actionUrl: data.actionUrl
      });

      await notification.save();
      console.log(`Notification created for user ${recipientId}`);

      // Emit real-time notification
      try {
        const io = getSocketIO();
        io.top(recipientId.toString()).emit('new_notification', notification);
      } catch (e) {
        // Socket might not be init or other error, don't fail the request
        console.log('Socket emit failed', e.message);
      }

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

      const result = await Notification.insertMany(notificationsData);
      console.log(`Notifications created for ${recipientIds.length} users`);

      // Emit real-time notifications
      try {
        const io = getSocketIO();
        // result is array of saved documents
        result.forEach(notification => {
          io.to(notification.recipient.toString()).emit('new_notification', notification);
        });
      } catch (e) {
        console.log('Socket emit failed', e.message);
      }

      return result;
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
