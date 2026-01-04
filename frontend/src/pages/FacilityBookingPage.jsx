import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../utils/auth';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import BookFacilityModal from '../components/BookFacilityModal';
import api from '../services/api'; // Import API service

function FacilityBookingPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(getCurrentUser());

  const [selectedDate, setSelectedDate] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [facilities, setFacilities] = useState([]);        // Dynamic facilities
  const [selectedFacility, setSelectedFacility] = useState(null); // For modal
  const [loading, setLoading] = useState(true);            // Loading state
  const [error, setError] = useState(null);                // Error handling

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (user?.role === 'technician') {
      navigate('/dashboard');
      return;
    }

    // Fetch facilities from API
    const fetchFacilities = async () => {
      try {
        setLoading(true);
        const response = await api.get('/api/admin/facilities/public'); // Use public facilities endpoint
        setFacilities(response.data.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch facilities');
        console.error('Error fetching facilities:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFacilities();
  }, []); // Remove user from dependency array to prevent infinite loop

  // Calendar logic (December 2025)
  const today = new Date(2025, 11, 23); // Dec 23, 2025
  const year = today.getFullYear();
  const month = today.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const days = [];
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    days.push(d);
  }

  const openModal = (facility) => {
    if (!selectedDate) {
      alert('Please select a date first!');
      return;
    }
    setSelectedFacility(facility);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedFacility(null);
  };

  return (
    <div className="flex relative">
      <Sidebar />

      <div className="ml-64 flex-1 pt-16 bg-gray-50 min-h-screen">
        <TopBar user={user} />

        <div className="p-8 max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-800 mb-8">Facility Booking</h2>

          {/* Calendar + Facilities Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Calendar */}
            <div className="bg-white p-6 rounded-2xl shadow-lg">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">December 2025</h3>
                <div className="flex space-x-2">
                  <button className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300">&lt;</button>
                  <button className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300">&gt;</button>
                </div>
              </div>
              <div className="grid grid-cols-7 text-center text-sm font-medium text-gray-600 mb-2">
                <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
              </div>
              <div className="grid grid-cols-7 text-center">
                {days.map((day, index) => (
                  <div
                    key={index}
                    className={`p-3 m-1 rounded-lg cursor-pointer transition
                      ${day === null ? '' : 'hover:bg-blue-100'}
                      ${day === 23 ? 'bg-blue-600 text-white font-bold' : ''}
                      ${selectedDate === day ? 'ring-4 ring-blue-400 bg-blue-200' : ''}
                    `}
                    onClick={() => day && setSelectedDate(day)}
                  >
                    {day || ''}
                  </div>
                ))}
              </div>
              {selectedDate && (
                <p className="text-center mt-4 text-blue-600 font-medium">
                  Selected: December {selectedDate}, 2025
                </p>
              )}
            </div>

            {/* Available Facilities */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold mb-4">Available Facilities</h3>

              {loading && (
                <div className="text-center py-8 text-gray-500">Loading facilities...</div>
              )}

              {error && (
                <div className="text-center py-8 text-red-500">
                  Error: {error}
                </div>
              )}

              {!loading && !error && facilities.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No facilities available at the moment.
                </div>
              )}

              {!loading && !error && facilities.map((facility) => (
                <div
                  key={facility.id}
                  className="bg-white p-6 rounded-2xl shadow hover:shadow-xl transition"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-800">{facility.name}</h4>
                      <p className="text-sm text-gray-600">Capacity: {facility.capacity} people</p>
                      {facility.bookingsToday !== undefined && (
                        <p className="text-sm text-gray-500 mt-1">{facility.bookingsToday} bookings today</p>
                      )}
                    </div>
                    <button
                      onClick={() => openModal(facility)}
                      disabled={!selectedDate}
                      className={`px-6 py-3 rounded-lg font-medium transition ${
                        selectedDate
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      Book Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Bookings */}
          <div className="bg-white p-6 rounded-2xl shadow-lg">
            <h3 className="text-xl font-semibold mb-4">My Upcoming Bookings</h3>
            <div className="text-center text-gray-500 py-8">
              No upcoming bookings. Book a facility to see it here!
            </div>
          </div>
        </div>
      </div>

      {/* Booking Modal - Pass selected facility and date */}
      <BookFacilityModal
        isOpen={isModalOpen}
        onClose={closeModal}
        facility={selectedFacility}
        selectedDate={selectedDate ? `2025-12-${selectedDate.toString().padStart(2, '0')}` : null}
      />
    </div>
  );
}

export default FacilityBookingPage;