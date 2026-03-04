// src/pages/FacilityBookingPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../utils/auth';
import api from '../services/api';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import BookFacilityModal from '../components/BookFacilityModal';
import Toast from '../components/Toast';

function FacilityBookingPage() {
  const navigate = useNavigate();
  const user = getCurrentUser();

  const [facilities, setFacilities] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFacility, setSelectedFacility] = useState(null);

  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Redirect if not logged in or technician
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (user.role === 'technician') {
      navigate('/dashboard');
      return;
    }
    fetchFacilities();
  }, [navigate, user]);

  const fetchFacilities = async () => {
    try {
      const res = await api.get('/api/facilities');
      setFacilities(res.data.data || res.data.facilities || []);
    } catch (err) {
      console.error(err);
      setToast({ show: true, message: 'Failed to load facilities', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const openModal = (facility) => {
    setSelectedFacility(facility);
    setIsModalOpen(true);
  };

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  // Calendar helpers
  const currentMonth = selectedDate.getMonth();
  const currentYear = selectedDate.getFullYear();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDay = new Date(currentYear, currentMonth, 1).getDay();

  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);

  const goPrevMonth = () => {
    setSelectedDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const goNextMonth = () => {
    setSelectedDate(new Date(currentYear, currentMonth + 1, 1));
  };

  return (
    <div className="flex">
      <Sidebar />
      <div className=" flex-1 pt-16 bg-gray-50 min-h-screen">
        <TopBar user={user} />

        <div className="p-8 w-full">
          <h2 className="text-3xl font-bold text-gray-800 mb-8">Facility Booking</h2>

          {/* Calendar */}
          <div className="bg-white p-6 rounded-2xl shadow-lg mb-2">
            <div className="flex justify-between items-center mb-6">
              <button onClick={goPrevMonth} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">← Previous</button>
              <h3 className="text-2xl font-semibold">
                {selectedDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
              </h3>
              <button onClick={goNextMonth} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Next →</button>
            </div>

            <div className="grid grid-cols-7 gap-2 text-center text-sm font-medium text-gray-600 mb-3">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d}>{d}</div>)}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {days.map((day, index) => (
                <button
                  key={index}
                  onClick={() => day && setSelectedDate(new Date(currentYear, currentMonth, day))}
                  className={`p-4 rounded-xl transition-all ${
                    day === null ? '' :
                    selectedDate.getDate() === day &&
                    selectedDate.getMonth() === currentMonth &&
                    selectedDate.getFullYear() === currentYear
                      ? 'bg-blue-600 text-white font-bold shadow-md'
                      : 'hover:bg-blue-100'
                  }`}
                >
                  {day || ''}
                </button>
              ))}
            </div>
          </div>

          {/* Facilities */}
          <h3 className="text-2xl font-semibold mb-6">Available Facilities</h3>

          {loading ? (
            <p className="text-center py-12 text-gray-600">Loading facilities...</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {facilities.map((facility) => (
                <div key={facility._id} className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all">
                  <h4 className="text-2xl font-bold text-gray-800 mb-3">{facility.name}</h4>
                  <p className="text-gray-600 mb-2">Capacity: <span className="font-medium">{facility.capacity}</span> people</p>
                  <p className="text-gray-600 mb-6">Location: <span className="font-medium">{facility.location}</span></p>

                  <button
                    onClick={() => openModal(facility)}
                    className="w-full bg-blue-600 text-white py-4 rounded-xl font-semibold hover:bg-blue-700 transition shadow-md"
                  >
                    Book Now
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Booking Modal */}
      <BookFacilityModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        facility={selectedFacility}
        selectedDate={selectedDate}
      />

      {/* Toast Notification */}
      <Toast
        isVisible={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ show: false, message: '', type: 'success' })}
      />
    </div>
  );
}

export default FacilityBookingPage;