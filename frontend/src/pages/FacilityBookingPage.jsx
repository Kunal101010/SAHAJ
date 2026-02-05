import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../utils/auth';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import BookFacilityModal from '../components/BookFacilityModal';
import Toast from '../components/Toast';
import api from '../services/api'; // Import API service
import { useMemo } from 'react';

function FacilityBookingPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(getCurrentUser());

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [facilities, setFacilities] = useState([]);        // Dynamic facilities
  const [selectedFacility, setSelectedFacility] = useState(null); // For modal
  const [loading, setLoading] = useState(true);            // Loading state
  const [error, setError] = useState(null);                // Error handling
  const [toast, setToast] = useState({ isVisible: false, message: '', type: 'success' });

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
        const response = await api.get('/api/facilities');
        setFacilities(response.data.facilities || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch facilities');
        console.error('Error fetching facilities:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFacilities();
  }, []); // Remove user from dependency array to prevent infinite loop

  // When selectedDate or facilities change, fetch bookings count for each facility on that date
  useEffect(() => {
    if (!selectedDate || facilities.length === 0) return;

    const dateStr = selectedDate.toISOString().slice(0, 10); // YYYY-MM-DD

    const fetchCounts = async () => {
      try {
        const promises = facilities.map(async (f) => {
          const res = await api.get(`/api/bookings/facility/${f._id}?date=${dateStr}`);
          return { id: f._id, bookings: res.data.bookings || [] };
        });

        const results = await Promise.all(promises);
        const map = {};
        results.forEach(r => { map[r.id] = r.bookings; });

        // Attach bookingsToday to facilities
        setFacilities(prev => prev.map(f => ({ ...f, bookingsToday: (map[f._id] || []).length, bookingsList: map[f._id] || [] })));
      } catch (err) {
        console.error('Error fetching bookings for date', err);
      }
    };

    fetchCounts();
  }, [selectedDate, facilities.length]);

  // Helper to fetch bookings counts (can be called after bookings change)
  const fetchBookingsForDate = async (dateObj) => {
    if (!dateObj || facilities.length === 0) return;
    const dateStr = dateObj.toISOString().slice(0, 10);
    try {
      const promises = facilities.map(async (f) => {
        const res = await api.get(`/api/bookings/facility/${f._id}?date=${dateStr}`);
        return { id: f._id, bookings: res.data.bookings || [] };
      });

      const results = await Promise.all(promises);
      const map = {};
      results.forEach(r => { map[r.id] = r.bookings; });
      setFacilities(prev => prev.map(f => ({ ...f, bookingsToday: (map[f._id] || []).length, bookingsList: map[f._id] || [] })));
    } catch (err) {
      console.error('Error fetching bookings for date', err);
    }
  };

  // Calendar logic - dynamic month/year
  const [currentMonth, setCurrentMonth] = useState(() => {
    const dt = new Date();
    return new Date(dt.getFullYear(), dt.getMonth(), 1);
  });

  const buildDays = (monthDate) => {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const arr = [];
    for (let i = 0; i < firstDay; i++) arr.push(null);
    for (let d = 1; d <= daysInMonth; d++) arr.push(d);
    return arr;
  };

  const days = buildDays(currentMonth);

  const monthTitle = currentMonth.toLocaleString(undefined, { month: 'long', year: 'numeric' });

  const goPrev = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const goNext = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));

  const showToast = (message, type = 'success') => {
    setToast({ isVisible: true, message, type });
  };

  const openModal = (facility) => {
    if (!selectedDate) {
      showToast('Please select a date first!', 'warning');
      return;
    }
    setSelectedFacility(facility);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedFacility(null);
    // refresh booking counts for the selected date
    fetchBookingsForDate(selectedDate);
  };

  // Fetch user's upcoming bookings for 'My Upcoming Bookings'
  const [myBookings, setMyBookings] = useState([]);
  useEffect(() => {
    const fetchMy = async () => {
      try {
        const res = await api.get('/api/bookings/me');
        setMyBookings(res.data.bookings || []);
      } catch (err) {
        console.error('Failed to fetch my bookings', err);
      }
    };
    fetchMy();
  }, []);

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="p-8 max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-800 mb-8">Facility Booking</h2>

        {/* Calendar + Facilities Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Calendar */}
          <div className="bg-white p-6 rounded-2xl shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">{monthTitle}</h3>
              <div className="flex space-x-2">
                <button onClick={goPrev} className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300">&lt;</button>
                <button onClick={goNext} className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300">&gt;</button>
              </div>
            </div>
            <div className="grid grid-cols-7 text-center text-sm font-medium text-gray-600 mb-2">
              <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
            </div>
            <div className="grid grid-cols-7 text-center">
              {days.map((day, index) => {
                const isToday = (() => {
                  if (!day) return false;
                  const d = new Date();
                  return d.getDate() === day && d.getMonth() === currentMonth.getMonth() && d.getFullYear() === currentMonth.getFullYear();
                })();

                const selectedMatch = (() => {
                  if (!selectedDate) return false;
                  return selectedDate.getDate() === day && selectedDate.getMonth() === currentMonth.getMonth() && selectedDate.getFullYear() === currentMonth.getFullYear();
                })();

                return (
                  <div
                    key={index}
                    className={`p-3 m-1 rounded-lg cursor-pointer transition ${day === null ? '' : 'hover:bg-blue-100'} ${isToday ? 'bg-blue-600 text-white font-bold' : ''} ${selectedMatch ? 'ring-4 ring-blue-400 bg-blue-200' : ''}`}
                    onClick={() => day && setSelectedDate(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day))}
                  >
                    {day || ''}
                  </div>
                );
              })}
            </div>
            {selectedDate && (
              <p className="text-center mt-4 text-blue-600 font-medium">
                Selected: {selectedDate.toLocaleDateString()}
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
                key={facility._id || facility.id}
                className="bg-white p-6 rounded-2xl shadow hover:shadow-xl transition"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-800">{facility.name}</h4>
                    <p className="text-sm text-gray-600">Capacity: {facility.capacity} people</p>
                    {facility.bookingsToday !== undefined && (
                      <p className="text-sm text-gray-500 mt-1">{facility.bookingsToday} bookings on selected date</p>
                    )}
                  </div>
                  <button
                    onClick={() => openModal(facility)}
                    disabled={!selectedDate}
                    className={`px-6 py-3 rounded-lg font-medium transition ${selectedDate
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

        {/* Bookings on selected date (aggregated) */}
        <div className="bg-white p-8 rounded-2xl shadow-lg mt-8 mb-12">
          <h3 className="text-2xl font-bold text-gray-800 mb-6">Bookings on {selectedDate?.toLocaleDateString()}</h3>
          <BookingsList selectedDate={selectedDate} />
        </div>

        {/* Upcoming Bookings */}
        <div className="bg-white p-8 rounded-2xl shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-gray-800">My Upcoming Bookings</h3>
            <button onClick={() => setSelectedDate(new Date())} className="text-sm text-blue-600 hover:text-blue-800 font-medium transition">Today</button>
          </div>

          {myBookings.length === 0 ? (
            <div className="text-center text-gray-500 py-12">No upcoming bookings. Book a facility to see it here!</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {myBookings.map(b => (
                <div key={b._id} className="bg-white rounded-xl shadow-md hover:shadow-2xl hover:scale-105 transition-all duration-300 overflow-hidden border border-gray-100">

                  <div className="p-6 flex flex-col justify-between h-full">
                    <div>
                      <div className="text-lg font-bold text-gray-800 mb-2">{b.facility?.name || 'Facility'}</div>
                      <div className="text-xs font-medium text-gray-500 mb-3">
                        {new Date(b.start).toLocaleDateString()}
                      </div>
                      <div className="text-sm font-medium text-gray-700 mb-3">
                        <svg className="inline w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00-.293.707l-2.828 2.829a1 1 0 101.415 1.415L9 10.414V6z" /></svg>
                        {new Date(b.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} — {new Date(b.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <p className="text-sm text-gray-600 mt-2 min-h-12">{b.purpose || 'No description'}</p>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedFacility(b.facility);
                        setIsModalOpen(true);
                        setSelectedDate(new Date(b.start));
                      }}
                      className="mt-4 w-full px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-medium transition-all duration-200 shadow-md hover:shadow-lg"
                    >
                      Book Similar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Booking Modal - Pass selected facility and date */}
      <BookFacilityModal
        isOpen={isModalOpen}
        onClose={closeModal}
        facility={selectedFacility}
        selectedDate={selectedDate}
        initialStartTime={selectedFacility && selectedDate ? new Date(selectedDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }).replace(':', ':') : ''}
        initialEndTime={''}
      />

      <Toast
        isVisible={toast.isVisible}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, isVisible: false })}
      />
    </div>
  );
}

export default FacilityBookingPage;

function BookingsList({ selectedDate }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedDate) return;
    const fetch = async () => {
      try {
        setLoading(true);
        const dateStr = selectedDate.toISOString().slice(0, 10);
        const res = await api.get(`/api/bookings?date=${dateStr}`);
        setBookings(res.data.bookings || []);
      } catch (err) {
        console.error('Failed to fetch bookings for date', err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [selectedDate]);

  if (!selectedDate) return <div className="text-gray-500 text-center py-4">Select a date to view bookings.</div>;
  if (loading) return <div className="text-gray-500 text-center py-4">Loading bookings...</div>;
  if (!bookings.length) return <div className="text-gray-500 text-center py-4">No bookings on this date.</div>;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {bookings.map(b => (
        <div key={b._id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 border border-gray-100 overflow-hidden">
          <div className="p-4">
            <div className="font-bold text-gray-800 mb-2">{b.facility?.name || 'Facility'}</div>
            <div className="flex items-center text-sm text-gray-600 mb-2">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00-.293.707l-2.828 2.829a1 1 0 101.415 1.415L9 10.414V6z" /></svg>
              {new Date(b.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} — {new Date(b.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
            <div className="text-xs text-gray-500 mb-2">By: {b.user?.username || b.user?.email || 'User'}</div>
            {b.purpose && <div className="text-sm text-gray-600">{b.purpose}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}