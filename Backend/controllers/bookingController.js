const Booking = require('../model/booking');
const Facility = require('../model/facility');
const User = require('../model/user');
const notificationService = require('../services/notificationService');

// Create a booking — checks for overlapping bookings
exports.createBooking = async (req, res) => {
  try {
    const { facilityId, start, end, purpose } = req.body;

    if (!facilityId || !start || !end) {
      return res.status(400).json({ success: false, message: 'facilityId, start and end are required' });
    }

    const facility = await Facility.findById(facilityId);
    if (!facility) {
      return res.status(404).json({ success: false, message: 'Facility not found' });
    }

    const startDate = new Date(start);
    const endDate = new Date(end);
    if (startDate >= endDate) {
      return res.status(400).json({ success: false, message: 'End must be after start' });
    }

    // Check overlap: existing.start < new.end && existing.end > new.start
    const overlap = await Booking.findOne({
      facility: facilityId,
      status: 'Booked',
      $or: [
        { start: { $lt: endDate }, end: { $gt: startDate } }
      ]
    });

    if (overlap) {
      return res.status(409).json({ success: false, message: 'Facility already booked for selected time' });
    }

    // normalized date string for the booking (YYYY-MM-DD) based on start local date
    const dateStr = startDate.toISOString().slice(0, 10);

    const booking = new Booking({
      facility: facilityId,
      user: req.user._id,
      start: startDate,
      end: endDate,
      purpose: purpose || '',
      date: dateStr,
    });

    await booking.save();

    // Notify managers and admins about new booking
    const managerAndAdminIds = await notificationService.getUsersByRole(['admin', 'manager']);
    const dateFormatted = startDate.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });

    if (managerAndAdminIds.length > 0) {
      const bookingNotification = notificationService.bookingCreatedNotification(
        booking._id,
        facility.name,
        dateFormatted
      );
      await notificationService.notifyMultiple(managerAndAdminIds, bookingNotification);
    }

    res.status(201).json({ success: true, booking });
  } catch (err) {
    console.error('Create booking error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get bookings for current user
exports.getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id }).populate('facility').sort('-start');
    res.json({ success: true, bookings });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get bookings for a facility (admin/manager)
exports.getFacilityBookings = async (req, res) => {
  try {
    const { facilityId } = req.params;
    const { date } = req.query; // optional YYYY-MM-DD

    let filter = { facility: facilityId };

    if (date) {
      const startOfDay = new Date(date + 'T00:00:00.000Z');
      const endOfDay = new Date(date + 'T23:59:59.999Z');

      // find bookings that overlap the day: booking.start < endOfDay && booking.end > startOfDay
      filter = {
        facility: facilityId,
        start: { $lt: endOfDay },
        end: { $gt: startOfDay },
      };
    }

    // only return booked (not cancelled)
    filter = { ...filter, status: 'Booked' };

    const bookings = await Booking.find(filter).populate('user').sort('start');
    res.json({ success: true, bookings });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get bookings for a given date across all facilities
exports.getBookingsByDate = async (req, res) => {
  try {
    const { date } = req.query; // YYYY-MM-DD
    if (!date) return res.status(400).json({ success: false, message: 'date query param required' });

    const startOfDay = new Date(date + 'T00:00:00.000Z');
    const endOfDay = new Date(date + 'T23:59:59.999Z');

    const bookings = await Booking.find({
      start: { $lt: endOfDay },
      end: { $gt: startOfDay },
      status: 'Booked'
    }).populate('facility user').sort('start');

    res.json({ success: true, bookings });
  } catch (err) {
    console.error('getBookingsByDate error', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Cancel booking (user can cancel their own)
exports.cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    // Only owner or admin can cancel
    if (booking.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to cancel this booking' });
    }

    booking.status = 'Cancelled';
    await booking.save();

    res.json({ success: true, booking });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
