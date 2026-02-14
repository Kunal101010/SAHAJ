import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../utils/auth';
// import Sidebar from '../components/Sidebar';
// import TopBar from '../components/TopBar';
import api from '../services/api';

import { useSocket } from '../context/SocketContext';

function ManagerBookingsPage() {
  const navigate = useNavigate();
  const socket = useSocket();
  const [user, setUser] = useState(getCurrentUser());
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [facilityFilter, setFacilityFilter] = useState('all');
  const [facilities, setFacilities] = useState([]);

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
      fetchData(); // Simplest approach: refetch all
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
      const [bookRes, facRes] = await Promise.all([
        api.get('/api/bookings/all'),
        api.get('/api/facilities'),
      ]);
      setBookings(bookRes.data.bookings || []);
      setFacilities(facRes.data.facilities || []);
      // Filters are applied in the render or via memo
    } catch (err) {
      console.error('Failed to fetch bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredBookings = () => {
    let filtered = bookings;

    // 1. Filter by Facility
    if (facilityFilter !== 'all') {
      filtered = filtered.filter(b => b.facility._id === facilityFilter);
    }

    // 2. Filter by Date (Upcoming vs Completed)
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today

    if (activeTab === 'upcoming') {
      // "Today and After"
      filtered = filtered.filter(b => new Date(b.start) >= today);
    } else {
      // "Before Today"
      filtered = filtered.filter(b => new Date(b.start) < today);
    }

    return filtered;
  };

  const currentBookings = getFilteredBookings();

  const getStatusColor = (status) => {
    switch (status) {
      case 'Booked':
        return 'bg-blue-100 text-blue-800';
      case 'Cancelled':
        return 'bg-red-100 text-red-800';
      case 'Completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="p-8 max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-800 mb-8">Facility Bookings Overview</h2>

        {/* Filters & Controls */}
        <div className="bg-white p-6 rounded-2xl shadow-lg mb-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">

            {/* Tabs */}
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setActiveTab('upcoming')}
                className={`px-6 py-2 rounded-md font-medium transition ${activeTab === 'upcoming'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
                  }`}
              >
                Upcoming
              </button>
              <button
                onClick={() => setActiveTab('completed')}
                className={`px-6 py-2 rounded-md font-medium transition ${activeTab === 'completed'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
                  }`}
              >
                Completed / Past
              </button>
            </div>

            {/* Facility Dropdown */}
            <div className="w-full md:w-64">
              <select
                value={facilityFilter}
                onChange={(e) => setFacilityFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Facilities</option>
                {facilities.map(f => (
                  <option key={f._id} value={f._id}>{f.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Bookings List */}
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading bookings...</div>
        ) : (
          <div className="space-y-4">
            {currentBookings.length === 0 ? (
              <div className="bg-white p-12 rounded-2xl shadow-lg text-center text-gray-500">
                No {activeTab} bookings found.
              </div>
            ) : (
              currentBookings.map(booking => (
                <div key={booking._id} className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition">
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                    <div>
                      <p className="text-sm text-gray-600">Facility</p>
                      <p className="font-bold text-gray-800">{booking.facility?.name || 'Unknown'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Booked By</p>
                      <p className="font-medium text-gray-800">{booking.user?.username || booking.user?.email || 'Unknown'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Date & Time</p>
                      <p className="font-medium text-gray-800">
                        {new Date(booking.start).toLocaleDateString()} {new Date(booking.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(booking.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Status</p>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(booking.status)}`}>
                        {booking.status}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Purpose</p>
                      <p className="font-medium text-gray-800">{booking.purpose || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ManagerBookingsPage;
