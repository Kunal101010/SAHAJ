const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
  createBooking,
  getMyBookings,
  getFacilityBookings,
  cancelBooking,
  getBookingsByDate,
  getAllBookings,
  getBookingStats,
} = require('../controllers/bookingController');

const router = express.Router();

// All booking routes require authentication
router.use(protect);

// Create a booking
router.post('/', createBooking);

// Get bookings across facilities for a date: ?date=YYYY-MM-DD
router.get('/', getBookingsByDate);

// Get current user's bookings
router.get('/me', getMyBookings);

// Get bookings for a specific facility (optionally filter by ?date=YYYY-MM-DD)
// Allow authenticated users to view bookings for availability checks
router.get('/facility/:facilityId', getFacilityBookings);

// Cancel a booking
router.put('/:id/cancel', cancelBooking);

// Get all bookings (Admin/Manager)
router.get('/all', authorize('admin', 'manager'), getAllBookings);

// Get Booking Stats (Admin/Manager)
router.get('/stats', authorize('admin', 'manager'), getBookingStats);

module.exports = router;
