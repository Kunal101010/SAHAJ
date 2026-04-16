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
  updateBooking,
} = require('../controllers/bookingController');
const bookingStatusService = require('../services/bookingStatusService');

const router = express.Router();

// All booking routes require authentication
router.use(protect);

// Create a booking
router.post('/', createBooking);

// Get bookings across facilities for a date: ?date=YYYY-MM-DD
router.get('/', getBookingsByDate);

// Get current user's bookings (for employees)
router.get('/my-bookings', getMyBookings);

// Get all bookings (for admin/manager)
router.get('/all', authorize('admin', 'manager'), getAllBookings);

// Get bookings for a specific facility (optionally filter by ?date=YYYY-MM-DD)
// Allow authenticated users to view bookings for availability checks
router.get('/facility/:facilityId', getFacilityBookings);

// Update a booking (admin/manager only)
router.patch('/:id', authorize('admin', 'manager'), updateBooking);

// Cancel a booking using PATCH method
router.patch('/:id/cancel', cancelBooking);

// Get Booking Stats (Admin/Manager)
router.get('/stats', authorize('admin', 'manager'), getBookingStats);

// Manual trigger for updating past booking statuses (Admin/Manager only - for testing)
router.post('/update-status', authorize('admin', 'manager'), async (req, res) => {
  try {
    await bookingStatusService.forceUpdate();
    res.json({ 
      success: true, 
      message: 'Booking status update triggered successfully' 
    });
  } catch (error) {
    console.error('Error updating booking statuses:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update booking statuses' 
    });
  }
});

// Get booking status service status (Admin/Manager only)
router.get('/status-service', authorize('admin', 'manager'), (req, res) => {
  const status = bookingStatusService.getStatus();
  res.json({ 
    success: true, 
    data: status 
  });
});

module.exports = router;
