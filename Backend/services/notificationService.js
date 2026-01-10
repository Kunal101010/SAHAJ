const Notification = require('../model/notification');
const User = require('../model/user');

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
      return notification;
    } catch (err) {
      console.error('Error creating notification:', err);
      throw err;
    }
  },

  // Create notification for multiple users (e.g., all admins/managers)
  async notifyMultiple(recipientIds, data) {
    try {
      const notifications = recipientIds.map(recipientId => ({
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

      const result = await Notification.insertMany(notifications);
      console.log(`Notifications created for ${recipientIds.length} users`);
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
