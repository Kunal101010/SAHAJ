import { useState, useEffect } from 'react';
import { getCurrentUser } from '../utils/auth';
import api from '../services/api';
import { useSocket } from '../context/SocketContext';
import EmptyState from '../components/EmptyState';
import { useToast } from '../context/ToastContext';

function BookingOverviewPage() {
  const currentUser = getCurrentUser();
  const socket = useSocket();
  const { showToast } = useToast();
  
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [cancellingId, setCancellingId] = useState(null);
  const [editingBooking, setEditingBooking] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [facilities, setFacilities] = useState([]);

  // Fetch bookings based on user role
  const fetchBookings = async () => {
    setLoading(true);
    try {
      // Use different endpoints based on user role
      let endpoint;
      if (currentUser.role === 'employee') {
        endpoint = '/api/bookings/my-bookings';
      } else {
        endpoint = '/api/bookings/all';
      }
      
      console.log('Current user role:', currentUser.role);
      console.log('Using endpoint:', endpoint);
      
      const [bookRes, facRes] = await Promise.all([
        api.get(endpoint),
        api.get('/api/facilities')
      ]);
      
      console.log('API response:', bookRes.data);
      console.log('API response keys:', Object.keys(bookRes.data));
      console.log('API response data:', bookRes.data.data);
      console.log('API response bookings:', bookRes.data.bookings);
      console.log('API response success:', bookRes.data.success);
      console.log('Full response:', JSON.stringify(bookRes.data, null, 2));
      
      // Use correct field based on which endpoint was called
      const bookingsData = bookRes.data.bookings || bookRes.data.data || [];
      setBookings(bookingsData);
      setFacilities(facRes.data.facilities || []);
    } catch (err) {
      console.error('Error fetching bookings:', err);
      console.error('Error status:', err.response?.status);
      console.error('Error message:', err.response?.data?.message);
      setError('Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Redirect technicians away from booking system
    if (currentUser?.role === 'technician') {
      navigate('/dashboard');
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

  // Cancel booking with role-based permissions
  const handleCancelBooking = async (bookingId) => {
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

  // Edit booking handlers
  const handleEditBooking = (booking) => {
    setEditingBooking(booking);
    setShowEditModal(true);
  };

  const handleUpdateBooking = async (updatedData) => {
    try {
      await api.patch(`/api/bookings/${editingBooking._id}`, updatedData);
      showToast('Booking updated successfully', 'success');
      setShowEditModal(false);
      setEditingBooking(null);
      fetchBookings();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update booking', 'error');
    }
  };

  // Check if user can cancel this booking
  const canCancelBooking = (booking) => {
    const bookingDate = new Date(booking.date);
    const now = new Date();
    const isUpcoming = bookingDate > now;
    
    if (!isUpcoming) return false;
    
    if (currentUser.role === 'employee') {
      return booking.user._id === currentUser._id;
    }
    
    return currentUser.role === 'admin' || currentUser.role === 'manager';
  };

  // Filter bookings
  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = 
      booking.facility?.name?.toLowerCase().includes(search.toLowerCase()) ||
      booking.purpose?.toLowerCase().includes(search.toLowerCase()) ||
      booking.user?.username?.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
    
    let matchesDate = true;
    if (dateFilter === 'upcoming') {
      matchesDate = new Date(booking.date) > new Date();
    } else if (dateFilter === 'past') {
      matchesDate = new Date(booking.date) <= new Date();
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
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Date formatting error:', error);
      return 'Invalid Date';
    }
  };

  const formatTime = (timeString) => {
    console.log('formatTime called with:', timeString, typeof timeString);
    
    if (!timeString) return 'N/A';
    
    // Handle ISO date strings (like "2026-03-13T10:15:00.000Z")
    if (typeof timeString === 'string' && timeString.includes('T')) {
      const date = new Date(timeString);
      const hour = date.getHours();
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour > 12 ? hour - 12 : hour;
      return `${displayHour}:${minutes} ${ampm}`;
    }
    // Handle "HH:MM" format
    else if (typeof timeString === 'string') {
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
          {currentUser.role === 'employee' ? 'My Bookings' : 'All Bookings'}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {currentUser.role === 'employee' 
            ? 'View and manage your facility bookings'
            : 'View and manage all facility bookings'
          }
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
              placeholder="Search by facility, purpose, or user..."
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
                : currentUser.role === 'employee'
                ? 'You haven\'t made any bookings yet.'
                : 'No bookings have been made yet.'
            }
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
                        {console.log('Booking date:', booking.date, 'startTime:', booking.startTime, 'start:', booking.start)}
                        {formatDate(booking.date)} at {formatTime(booking.startTime || booking.start)}
                      </p>
                    </div>
                    
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Purpose:</span>
                      <p className="text-gray-800 dark:text-gray-200 font-medium">
                        {booking.purpose || 'No purpose specified'}
                      </p>
                    </div>
                    
                    {currentUser.role !== 'employee' && (
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Booked by:</span>
                        <p className="text-gray-800 dark:text-gray-200 font-medium">
                          {booking.user?.username || 'Unknown User'}
                        </p>
                      </div>
                    )}
                    
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Created:</span>
                      <p className="text-gray-800 dark:text-gray-200 font-medium">
                        {formatDate(booking.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="ml-4 flex space-x-2">
                  {canCancelBooking(booking) && currentUser.role === 'employee' && (
                    <button
                      onClick={() => handleCancelBooking(booking._id)}
                      disabled={cancellingId === booking._id}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
                    >
                      {cancellingId === booking._id ? 'Cancelling...' : 'Cancel'}
                    </button>
                  )}
                  
                  {booking.status !== 'cancelled' && booking.status !== 'completed' && (
                    <button
                      onClick={() => handleEditBooking(booking)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                    >
                      Edit
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingBooking && (
        <EditBookingModal
          booking={editingBooking}
          facilities={facilities}
          onClose={() => {
            setShowEditModal(false);
            setEditingBooking(null);
          }}
          onSave={handleUpdateBooking}
        />
      )}
    </div>
  );
}

// Edit Booking Modal Component
function EditBookingModal({ booking, facilities, onClose, onSave }) {
  const [formData, setFormData] = useState({
    facility: booking.facility._id,
    date: booking.date || new Date(booking.start).toISOString().split('T')[0],
    startTime: booking.startTime || new Date(booking.start).toTimeString().slice(0, 5),
    endTime: booking.endTime || new Date(booking.end).toTimeString().slice(0, 5),
    purpose: booking.purpose || ''
  });
  const [loading, setLoading] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const updatedData = {
        ...formData,
        start: new Date(`${formData.date}T${formData.startTime}`),
        end: new Date(`${formData.date}T${formData.endTime}`)
      };
      
      await onSave(updatedData);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    
    setCancelling(true);
    try {
      await api.patch(`/api/bookings/${booking._id}/cancel`);
      window.location.reload(); // Refresh to show updated booking
    } catch (err) {
      console.error('Failed to cancel booking:', err);
      alert('Failed to cancel booking: ' + (err.response?.data?.message || err.message));
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
        <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-200">Edit Booking</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Facility
            </label>
            <select
              value={formData.facility}
              onChange={(e) => setFormData({...formData, facility: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-200"
              required
            >
              {facilities.map(f => (
                <option key={f._id} value={f._id}>{f.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Date
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({...formData, date: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-200"
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Start Time
              </label>
              <input
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-200"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                End Time
              </label>
              <input
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-200"
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Purpose
            </label>
            <textarea
              value={formData.purpose}
              onChange={(e) => setFormData({...formData, purpose: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-200"
              rows="3"
              placeholder="Enter purpose for booking"
            />
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleCancelBooking}
              disabled={cancelling}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {cancelling ? 'Cancelling...' : 'Cancel Booking'}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default BookingOverviewPage;
