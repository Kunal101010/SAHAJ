const Booking = require('../model/booking');

class BookingStatusService {
  constructor() {
    this.intervalId = null;
    this.isRunning = false;
  }

  // Start the automatic status update service
  start() {
    if (this.isRunning) {
      console.log('Booking status service is already running');
      return;
    }

    console.log('Starting booking status service...');
    this.isRunning = true;
    
    // Run immediately on start
    this.updatePastBookings();
    
    // Then run every 5 minutes (300000 ms)
    this.intervalId = setInterval(() => {
      this.updatePastBookings();
    }, 300000); // 5 minutes
  }

  // Stop the automatic status update service
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('Booking status service stopped');
  }

  // Update past bookings to 'completed' status
  async updatePastBookings() {
    try {
      const now = new Date();
      
      // Find all bookings that are still 'booked' but have end time in the past
      const pastBookings = await Booking.find({
        status: 'booked',
        end: { $lt: now }
      });

      if (pastBookings.length > 0) {
        console.log(`Found ${pastBookings.length} past bookings to update to 'completed' status`);
        
        // Update all past bookings to 'completed' status
        const result = await Booking.updateMany(
          {
            _id: { $in: pastBookings.map(booking => booking._id) },
            status: 'booked',
            end: { $lt: now }
          },
          {
            $set: { status: 'completed' }
          }
        );

        console.log(`Updated ${result.modifiedCount} bookings to 'completed' status`);

        // Emit socket events for real-time updates
        try {
          const { getSocketIO } = require('../utils/socket');
          const io = getSocketIO();
          
          if (io) {
            pastBookings.forEach(booking => {
              io.emit('booking_completed', {
                bookingId: booking._id,
                facilityId: booking.facility,
                completedAt: now,
                booking: { ...booking.toObject(), status: 'completed' }
              });
            });
            console.log(`Emitted socket events for ${pastBookings.length} completed bookings`);
          }
        } catch (socketError) {
          console.error('Error emitting socket events for completed bookings:', socketError.message);
        }

        // Send notifications to users about completed bookings
        try {
          const notificationService = require('./notificationService');
          
          for (const booking of pastBookings) {
            const completedNotification = notificationService.bookingCompletedNotification(
              booking._id,
              booking.facility,
              booking.start.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              })
            );
            
            await notificationService.notifySingle(booking.user, completedNotification);
          }
          
          console.log(`Sent completion notifications for ${pastBookings.length} bookings`);
        } catch (notificationError) {
          console.error('Error sending completion notifications:', notificationError.message);
        }
      } else {
        console.log('No past bookings to update');
      }
    } catch (error) {
      console.error('Error updating past booking statuses:', error);
    }
  }

  // Manual trigger for updating past bookings (for testing or manual updates)
  async forceUpdate() {
    console.log('Force updating past booking statuses...');
    await this.updatePastBookings();
  }

  // Get service status
  getStatus() {
    return {
      isRunning: this.isRunning,
      intervalId: this.intervalId,
      nextRun: this.intervalId ? new Date(Date.now() + 300000) : null
    };
  }
}

module.exports = new BookingStatusService();
