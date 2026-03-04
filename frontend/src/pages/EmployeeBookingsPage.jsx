import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../utils/auth';
import api from '../services/api';
import { useSocket } from '../context/SocketContext';
import EmptyState from '../components/EmptyState';
import { useToast } from '../context/ToastContext';

function EmployeeBookingsPage() {
  const currentUser = getCurrentUser();
  const socket = useSocket();
  const { showToast } = useToast();
  const navigate = useNavigate();
  
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [cancellingId, setCancellingId] = useState(null);

  // Fetch bookings for current user
  const fetchBookings = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/bookings/my-bookings');
      setBookings(response.data.bookings || []);
    } catch (err) {
      setError('Failed to fetch bookings');
      console.error('Error fetching bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'employee') {
      navigate('/booking-overview');
      return;
    }
    fetchBookings();
  }, []);

  // Listen for real-time updates
  useEffect(() => {
    if (!socket) return;

    const handleBookingUpdate = () => {
      fetchBookings();
    };

    socket.on('booking_created', handleBookingUpdate);
    socket.on('booking_cancelled', handleBookingUpdate);
    socket.on('booking_updated', handleBookingUpdate);

    return () => {
      socket.off('booking_created', handleBookingUpdate);
      socket.off('booking_cancelled', handleBookingUpdate);
      socket.off('booking_updated', handleBookingUpdate);
    };
  }, [socket]);

  // Cancel booking (employee can only cancel their own)
  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    
    setCancellingId(bookingId);
    try {
      await api.patch(`/api/bookings/${bookingId}/cancel`);
      showToast('Booking cancelled successfully', 'success');
      fetchBookings();
    } catch (err) {
      showToast(
        err.response?.data?.message || 'Failed to cancel booking',
        'error'
      );
    } finally {
      setCancellingId(null);
    }
  };

  // Check if user can cancel this booking
  const canCancelBooking = (booking) => {
    const bookingDate = new Date(booking.start);
    const now = new Date();
    const isUpcoming = bookingDate > now;
    
    if (!isUpcoming) return false;
    
    // Employees can only cancel their own bookings
    return booking.user._id === currentUser._id;
  };

  // Filter bookings
  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = 
      booking.facility?.name?.toLowerCase().includes(search.toLowerCase()) ||
      booking.purpose?.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
    
    let matchesDate = true;
    if (dateFilter === 'upcoming') {
      matchesDate = new Date(booking.start) > new Date();
    } else if (dateFilter === 'past') {
      matchesDate = new Date(booking.start) <= new Date();
    }
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'completed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';
      
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    
    if (typeof timeString === 'string') {
      const [hours, minutes] = timeString.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour > 12 ? hour - 12 : hour;
      return `${displayHour}:${minutes} ${ampm}`;
    } else if (timeString instanceof Date) {
      const hour = timeString.getHours();
      const minutes = timeString.getMinutes().toString().padStart(2, '0');
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour > 12 ? hour - 12 : hour;
      return `${displayHour}:${minutes} ${ampm}`;
    }
    
    return 'N/A';
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-2">
          My Bookings
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          View and manage your facility bookings
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Search
            </label>
            <input
              type="text"
              placeholder="Search by facility or purpose..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-200"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-200"
            >
              <option value="all">All Status</option>
              <option value="confirmed">Confirmed</option>
              <option value="cancelled">Cancelled</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Date
            </label>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-200"
            >
              <option value="all">All Dates</option>
              <option value="upcoming">Upcoming</option>
              <option value="past">Past</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Bookings List */}
      {filteredBookings.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg">
          <EmptyState
            icon={
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            }
            title="No bookings found"
            description={
              search || statusFilter !== 'all' || dateFilter !== 'all'
                ? 'Try adjusting your search terms or filters.'
                : 'You haven\'t made any bookings yet.'
            }
            actionText="Create Booking"
            onAction={() => navigate('/facility-booking')}
          />
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((booking) => (
            <div
              key={booking._id}
              className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                      {booking.facility?.name || 'Unknown Facility'}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                      {booking.status ? booking.status.charAt(0).toUpperCase() + booking.status.slice(1) : 'Unknown'}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Date & Time:</span>
                      <p className="text-gray-800 dark:text-gray-200 font-medium">
                        {formatDate(booking.date || booking.start)} at {formatTime(booking.startTime || booking.start)}
                      </p>
                    </div>
                    
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Purpose:</span>
                      <p className="text-gray-800 dark:text-gray-200 font-medium">
                        {booking.purpose || 'No purpose specified'}
                      </p>
                    </div>
                    
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Created:</span>
                      <p className="text-gray-800 dark:text-gray-200 font-medium">
                        {formatDate(booking.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="ml-4">
                  {canCancelBooking(booking) && (
                    <button
                      onClick={() => handleCancelBooking(booking._id)}
                      disabled={cancellingId === booking._id}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
                    >
                      {cancellingId === booking._id ? 'Cancelling...' : 'Cancel'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default EmployeeBookingsPage;
