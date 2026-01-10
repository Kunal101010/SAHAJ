const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: [
      'request_created',
      'request_assigned',
      'request_status_changed',
      'request_completed',
      'request_updated',
      'booking_created',
      'booking_approved',
      'booking_cancelled',
      'facility_maintenance_scheduled',
      'facility_available'
    ],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  relatedRequest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MaintenanceRequest'
  },
  relatedBooking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking'
  },
  relatedFacility: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Facility'
  },
  relatedUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  actionUrl: {
    type: String
  }
}, {
  timestamps: true
});

// Index for faster queries
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, isRead: 1 });

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
