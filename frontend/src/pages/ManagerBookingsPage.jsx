import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../utils/auth';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { useSocket } from '../context/SocketContext';
import EmptyState from '../components/EmptyState';

function ManagerBookingsPage() {
  const navigate = useNavigate();
  const socket = useSocket();
  const { showToast } = useToast();
  const [user, setUser] = useState(getCurrentUser());
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [facilityFilter, setFacilityFilter] = useState('all');
  const [facilities, setFacilities] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [cancellingId, setCancellingId] = useState(null);
  const [editingBooking, setEditingBooking] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const [activeTab, setActiveTab] = useState('upcoming');

  useEffect(() => {
    if (!user || !['manager', 'admin'].includes(user.role)) {
      navigate('/dashboard');
      return;
    }
    fetchData();
  }, []);

  // Real-time updates
  useEffect(() => {
    if (!socket) return;

    socket.on('booking_created', (newBooking) => {
      console.log('New booking received via socket:', newBooking);
      fetchData();
    });

    socket.on('booking_cancelled', (data) => {
      console.log('Booking cancelled via socket:', data);
      fetchData();
    });

    return () => {
      socket.off('booking_created');
      socket.off('booking_cancelled');
    };
  }, [socket]);

  const fetchData = async () => {
    setLoading(true);
    try {
      console.log('Fetching bookings for admin/manager...');
      const [bookRes, facRes] = await Promise.all([
        api.get('/api/bookings/all'),
        api.get('/api/facilities'),
      ]);
      
      console.log('Bookings API response:', bookRes.data);
      console.log('Facilities API response:', facRes.data);
      
      setBookings(bookRes.data.bookings || []);
      setFacilities(facRes.data.facilities || []);
      
      console.log('Bookings set:', bookRes.data.bookings || []);
      console.log('Facilities set:', facRes.data.facilities || []);
    } catch (err) {
      setError('Failed to fetch bookings');
      console.error('Failed to fetch bookings:', err);
      console.error('Error status:', err.response?.status);
      console.error('Error message:', err.response?.data?.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    
    setCancellingId(bookingId);
    try {
      await api.patch(`/api/bookings/${bookingId}/cancel`);
      showToast('Booking cancelled successfully', 'success');
      fetchData();
    } catch (err) {
      console.error('Failed to cancel booking', err);
      showToast(err.response?.data?.message || 'Failed to cancel booking', 'error');
    } finally {
      setCancellingId(null);
    }
  };

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
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update booking', 'error');
    }
  };

  // Check if user can cancel this booking
  const canCancelBooking = (booking) => {
    const bookingDate = new Date(booking.start);
    const now = new Date();
    const isUpcoming = bookingDate > now;
    
    if (!isUpcoming) return false;
    
    if (user.role === 'employee') {
      return booking.user._id === user._id;
    }
    
    return user.role === 'admin' || user.role === 'manager';
  };

  const getFilteredBookings = () => {
    let filtered = bookings;

    // Search filter
    if (search) {
      filtered = filtered.filter(booking => 
        booking.facility?.name?.toLowerCase().includes(search.toLowerCase()) ||
        booking.purpose?.toLowerCase().includes(search.toLowerCase()) ||
        booking.user?.username?.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(booking => booking.status === statusFilter);
    }

    // Facility filter
    if (facilityFilter !== 'all') {
      filtered = filtered.filter(b => b.facility._id === facilityFilter);
    }

    // Date filter (Upcoming vs Past)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (activeTab === 'upcoming') {
      filtered = filtered.filter(b => new Date(b.start) >= today);
    } else {
      filtered = filtered.filter(b => new Date(b.start) < today);
    }

    return filtered;
  };

  const currentBookings = getFilteredBookings();

  const getStatusColor = (status) => {
    switch (status) {
      case 'booked':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
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

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-2">
          All Bookings
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage and view all facility bookings
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Search
            </label>
            <input
              type="text"
              placeholder="Search bookings..."
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
              <option value="booked">Booked</option>
              <option value="cancelled">Cancelled</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Facility
            </label>
            <select
              value={facilityFilter}
              onChange={(e) => setFacilityFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-200"
            >
              <option value="all">All Facilities</option>
              {facilities.map(f => (
                <option key={f._id} value={f._id}>{f.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Date Filter
            </label>
            <div className="flex space-x-2">
              <button
                onClick={() => setActiveTab('upcoming')}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${
                  activeTab === 'upcoming'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Upcoming
              </button>
              <button
                onClick={() => setActiveTab('completed')}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${
                  activeTab === 'completed'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Past
              </button>
            </div>
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
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading bookings...</div>
      ) : currentBookings.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg">
          <EmptyState
            icon={
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            }
            title="No bookings found"
            description={
              search || statusFilter !== 'all' || facilityFilter !== 'all'
                ? 'Try adjusting your search terms or filters.'
                : 'No bookings have been made yet.'
            }
          />
        </div>
      ) : (
        <div className="space-y-4">
          {currentBookings.map(booking => (
            <div key={booking._id} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
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
                      <span className="text-gray-500 dark:text-gray-400">Booked by:</span>
                      <p className="text-gray-800 dark:text-gray-200 font-medium">
                        {booking.user?.username || 'Unknown User'}
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
                
                <div className="ml-4 flex space-x-2">
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

export default ManagerBookingsPage;
