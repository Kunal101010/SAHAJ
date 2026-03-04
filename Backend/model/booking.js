const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  facility: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Facility',
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  start: {
    type: Date,
    required: true,
  },
  end: {
    type: Date,
    required: true,
  },
  // normalized date for quick queries (YYYY-MM-DD)
  date: {
    type: String,
    required: true,
  },
  purpose: {
    type: String,
    trim: true,
    maxlength: 500,
  },
  status: {
    type: String,
    enum: ['confirmed', 'cancelled', 'completed', 'Booked', 'Cancelled', 'Completed'],
    default: 'confirmed',
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual fields for frontend compatibility
bookingSchema.virtual('startTime').get(function() {
  return this.start.toTimeString().slice(0, 5); // HH:MM format
});

bookingSchema.virtual('endTime').get(function() {
  return this.end.toTimeString().slice(0, 5); // HH:MM format
});

bookingSchema.virtual('dateFormatted').get(function() {
  return this.date; // Already in YYYY-MM-DD format
});

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
