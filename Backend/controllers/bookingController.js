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

// Get bookings for current user (employee view)
exports.getMyBookings = async (req, res) => {
  try {
    console.log('getMyBookings called by user:', req.user.role, req.user._id);
    const bookings = await Booking.find({ user: req.user._id })
      .populate('facility', 'name capacity location')
      .populate('user', 'username firstName lastName')
      .sort({ start: -1 })
      .lean(); // Use lean for performance and ensure virtuals work
    
    console.log('Found user bookings count:', bookings.length);
    console.log('User bookings:', bookings);
    
    res.json({ success: true, data: bookings });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get all bookings (admin/manager view)
exports.getAllBookings = async (req, res) => {
  try {
    console.log('getAllBookings called by user:', req.user.role, req.user._id);
    const bookings = await Booking.find()
      .populate('user', 'username firstName lastName')
      .populate('facility', 'name capacity location')
      .sort({ start: -1 })
      .lean();

    console.log('Found bookings count:', bookings.length);
    console.log('Bookings:', bookings);

    res.json({ success: true, data: bookings });
  } catch (err) {
    console.error('getAllBookings error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get bookings for a facility (admin/manager)
exports.getFacilityBookings = async (req, res) => {
  try {
    const { facilityId } = req.params;
    const { date } = req.query; // optional YYYY-MM-DD

    console.log('getFacilityBookings called with:', { facilityId, date });

    let filter = { facility: facilityId };

    if (date) {
      const startOfDay = new Date(date + 'T00:00:00.000Z');
      const endOfDay = new Date(date + 'T23:59:59.999Z');

      console.log('Date range:', { startOfDay, endOfDay });

      // find bookings that overlap the day: booking.start < endOfDay && booking.end > startOfDay
      filter = {
        facility: facilityId,
        start: { $lt: endOfDay },
        end: { $gt: startOfDay },
      };
    }

    // only return booked (not cancelled) - include both Booked and confirmed
    filter = { ...filter, status: { $in: ['Booked', 'confirmed'] } };

    console.log('Final filter:', filter);

    const bookings = await Booking.find(filter).populate('user').sort('start');
    console.log('Found bookings:', bookings);

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

// Update booking (admin/manager only)
exports.updateBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Only admin or manager can update bookings
    if (!['admin', 'manager'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Not authorized to update bookings' });
    }

    const { facility, start, end, purpose } = req.body;

    // Validate new dates
    const startDate = new Date(start);
    const endDate = new Date(end);
    if (startDate >= endDate) {
      return res.status(400).json({ success: false, message: 'End time must be after start time' });
    }

    // Check for overlapping bookings (exclude current booking)
    const overlap = await Booking.findOne({
      _id: { $ne: req.params.id },
      facility: facility || booking.facility,
      status: { $in: ['confirmed', 'Booked'] },
      $or: [
        { start: { $lt: endDate }, end: { $gt: startDate } }
      ]
    });

    if (overlap) {
      return res.status(409).json({ success: false, message: 'Facility already booked for selected time' });
    }

    // Update booking fields
    if (facility) booking.facility = facility;
    if (start) booking.start = startDate;
    if (end) booking.end = endDate;
    if (purpose !== undefined) booking.purpose = purpose;
    
    // Update date string if date changed
    if (start) {
      booking.date = startDate.toISOString().slice(0, 10);
    }

    await booking.save();

    // Emit Socket Event for real-time updates
    try {
      const { getSocketIO } = require('../utils/socket');
      const io = getSocketIO();
      if (io) {
        io.emit('booking_updated', { 
          bookingId: booking._id, 
          facilityId: booking.facility,
          updatedBy: req.user.username,
          booking: booking
        });
      }
    } catch (e) {
      console.error('Socket emit error:', e.message);
    }

    res.json({ 
      success: true, 
      message: 'Booking updated successfully',
      booking 
    });
  } catch (err) {
    console.error('Update booking error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Cancel booking with role-based permissions
exports.cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('user', 'username firstName lastName')
      .populate('facility', 'name');
    
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Check if booking is in the past
    const now = new Date();
    const bookingStartTime = new Date(booking.start);
    if (bookingStartTime <= now) {
      return res.status(400).json({ success: false, message: 'Cannot cancel past bookings' });
    }

    // Role-based permission check
    const userRole = req.user.role;
    const isOwner = booking.user._id.toString() === req.user._id.toString();
    
    // Employees can only cancel their own bookings
    // Admins and managers can cancel any upcoming booking
    if (userRole === 'employee' && !isOwner) {
      return res.status(403).json({ success: false, message: 'You can only cancel your own bookings' });
    }
    
    if (!['admin', 'manager', 'employee'].includes(userRole)) {
      return res.status(403).json({ success: false, message: 'Not authorized to cancel bookings' });
    }

    // Update booking status
    booking.status = 'cancelled';
    await booking.save();

    // Emit Socket Event for real-time updates
    try {
      const { getSocketIO } = require('../utils/socket');
      const io = getSocketIO();
      if (io) {
        io.emit('booking_cancelled', { 
          bookingId: booking._id, 
          facilityId: booking.facility._id,
          cancelledBy: req.user.username,
          booking: booking
        });
      }
    } catch (e) {
      console.error('Socket emit error:', e.message);
    }

    // Send notification to booking user if cancelled by admin/manager
    if (!isOwner && userRole !== 'employee') {
      try {
        const notificationService = require('../services/notificationService');
        const cancelNotification = notificationService.bookingCancelledNotification(
          booking._id,
          booking.facility.name,
          booking.start.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          })
        );
        await notificationService.notifySingle(booking.user._id, cancelNotification);
      } catch (notifErr) {
        console.error('Failed to send cancellation notification:', notifErr);
      }
    }

    res.json({ 
      success: true, 
      message: 'Booking cancelled successfully',
      booking 
    });
  } catch (err) {
    console.error('Cancel booking error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get ALL bookings (Admin/Manager only)
exports.getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('user', 'username email firstName lastName')
      .populate('facility', 'name')
      .sort({ start: -1 }); // Newest first

    res.json({ success: true, bookings });
  } catch (err) {
    console.error('getAllBookings error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get Booking Statistics
exports.getBookingStats = async (req, res) => {
  try {
    const totalBookings = await Booking.countDocuments();

    // Group by Facility
    const bookingsByFacility = await Booking.aggregate([
      {
        $group: {
          _id: '$facility',
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'facilities',
          localField: '_id',
          foreignField: '_id',
          as: 'facilityDetails'
        }
      },
      {
        $unwind: '$facilityDetails'
      },
      {
        $project: {
          name: '$facilityDetails.name',
          value: '$count'
        }
      },
      { $sort: { value: -1 } }
    ]);

    // Group by Status
    const bookingsByStatus = await Booking.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          name: '$_id',
          value: '$count'
        }
      }
    ]);

    // Monthly trend for last 12 months
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
    twelveMonthsAgo.setDate(1);
    twelveMonthsAgo.setHours(0, 0, 0, 0);

    const monthlyTrend = await Booking.aggregate([
      {
        $match: {
          start: { $gte: twelveMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$start' },
            month: { $month: '$start' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    // Format monthly trend
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const formattedTrend = monthlyTrend.map(item => {
      return {
        name: `${monthNames[item._id.month - 1]} ${item._id.year}`,
        bookings: item.count
      };
    });

    res.status(200).json({
      success: true,
      data: {
        total: totalBookings,
        byFacility: bookingsByFacility,
        byStatus: bookingsByStatus,
        trend: formattedTrend
      }
    });

  } catch (error) {
    console.error('getBookingStats error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
