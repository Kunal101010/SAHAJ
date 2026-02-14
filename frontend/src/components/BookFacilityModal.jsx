import { useState, useEffect } from 'react';
import api from '../services/api';
import AlertModal from './AlertModal';
import ModalWrapper from './ModalWrapper';

function BookFacilityModal({ isOpen, onClose, facility, selectedDate, initialStartTime, initialEndTime }) {
  const [facilities, setFacilities] = useState([]);
  const [formData, setFormData] = useState({
    facilityId: '',
    date: '',
    startTime: '',
    endTime: '',
    purpose: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [bookedSlots, setBookedSlots] = useState([]);
  const [alertState, setAlertState] = useState({
    isOpen: false,
    message: '',
    type: 'error'
  });

  useEffect(() => {
    if (!isOpen) return;
    setAlertState({ isOpen: false, message: '', type: 'error' });
    setError('');

    const fetchFacilities = async () => {
      try {
        const res = await api.get('/api/facilities');
        setFacilities(res.data.facilities || []);
      } catch (err) {
        console.error('Fetch facilities failed', err);
      }
    };
    fetchFacilities();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    if (facility) {
      setFormData((prev) => ({ ...prev, facilityId: facility._id }));
    }
    if (selectedDate) {
      const dateStr = (selectedDate instanceof Date)
        ? selectedDate.toISOString().slice(0, 10)
        : (selectedDate || '').slice(0, 10);
      setFormData((prev) => ({ ...prev, date: dateStr }));

      if (facility && facility._id) {
        const fetchBooked = async () => {
          try {
            const res = await api.get(`/api/bookings/facility/${facility._id}?date=${dateStr}`);
            setBookedSlots(res.data.bookings || []);
          } catch (err) {
            console.error('Failed to fetch booked slots', err);
          }
        };
        fetchBooked();
      }
    }
    if (initialStartTime) setFormData(prev => ({ ...prev, startTime: initialStartTime }));
    if (initialEndTime) setFormData(prev => ({ ...prev, endTime: initialEndTime }));
  }, [isOpen, facility, selectedDate, initialStartTime, initialEndTime]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const showAlert = (message, type = 'error') => {
    setAlertState({ isOpen: true, message, type });
  };

  const closeAlert = () => {
    setAlertState({ ...alertState, isOpen: false });
    if (alertState.type === 'success') {
      onClose();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const { facilityId, date, startTime, endTime, purpose } = formData;
      if (!facilityId || !date || !startTime || !endTime) {
        showAlert('Please fill all required fields');
        return;
      }

      const todayStr = new Date().toISOString().split('T')[0];

      if (date < todayStr) {
        showAlert(`Error: Cannot book for a past date (${date}). Please select today or a future date.`);
        return;
      }

      const start = new Date(`${date}T${startTime}`);
      const end = new Date(`${date}T${endTime}`);

      const startHour = start.getHours();
      const endHour = end.getHours();
      const endMin = end.getMinutes();

      if (startHour < 9 || startHour >= 17) {
        showAlert('Facility is open from 9:00 AM to 5:00 PM.');
        return;
      }

      if (endHour > 17 || (endHour === 17 && endMin > 0)) {
        showAlert('Facility closes at 5:00 PM.');
        return;
      }

      if (start >= end) {
        showAlert('End time must be after start time.');
        return;
      }

      const overlaps = bookedSlots.some(b => {
        const bs = new Date(b.start).getTime();
        const be = new Date(b.end).getTime();
        return (start.getTime() < be && end.getTime() > bs);
      });

      if (overlaps) {
        showAlert('Error: Selected time overlaps with an existing booking. Please choose a different time.');
        return;
      }

      setLoading(true);

      const res = await api.post('/api/bookings', {
        facilityId,
        start,
        end,
        purpose,
      });

      if (res.data && res.data.success) {
        showAlert('Success: Booking created successfully!', 'success');
      }
    } catch (err) {
      console.error('Booking error', err);
      const msg = err.response?.data?.message || 'Booking failed';
      showAlert(`Error: ${msg}`);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const formatTime12h = (timeStr) => {
    if (!timeStr) return '';
    const [h, m] = timeStr.split(':');
    let hour = parseInt(h, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12;
    if (hour === 0) hour = 12;
    return `${hour}:${m} ${ampm}`;
  };

  const generateTimeSlots = () => {
    const slots = [];
    for (let h = 9; h <= 17; h++) {
      for (let m = 0; m < 60; m += 30) {
        if (h === 17 && m > 0) break;
        const hh = String(h).padStart(2, '0');
        const mm = String(m).padStart(2, '0');
        slots.push(`${hh}:${mm}`);
      }
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  const isSlotDisabled = (slot) => {
    if (!formData.date) return false;
    const slotDate = new Date(`${formData.date}T${slot}`);
    return bookedSlots.some(b => {
      const bs = new Date(b.start).getTime();
      const be = new Date(b.end).getTime();
      return (slotDate.getTime() >= bs && slotDate.getTime() < be);
    });
  };

  const filteredEndSlots = () => {
    if (!formData.startTime) return timeSlots;
    const startMs = new Date(`${formData.date}T${formData.startTime}`).getTime();

    return timeSlots.filter(s => {
      const endMs = new Date(`${formData.date}T${s}`).getTime();
      if (endMs <= startMs) return false;

      const overlap = bookedSlots.some(b => {
        const bs = new Date(b.start).getTime();
        const be = new Date(b.end).getTime();
        return (startMs < be && endMs > bs);
      });
      return !overlap;
    });
  };

  return (
    <>
      <ModalWrapper isOpen={isOpen} onClose={onClose} title="Book a Facility" maxWidth="max-w-lg">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <select
            name="facilityId"
            value={formData.facilityId}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Facility *</option>
            {facilities.map((f) => (
              <option key={f._id} value={f._id}>{f.name}</option>
            ))}
          </select>

          <input
            name="date"
            type="date"
            value={formData.date}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">Start Time</label>
              <select
                name="startTime"
                value={formData.startTime}
                onChange={handleChange}
                required
                className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select start</option>
                {timeSlots.map(s => {
                  const label = formatTime12h(s);
                  const disabled = isSlotDisabled(s);
                  return (
                    <option key={s} value={s} disabled={disabled}>
                      {label}{disabled ? ' (Booked)' : ''}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">End Time</label>
              <select
                name="endTime"
                value={formData.endTime}
                onChange={handleChange}
                required
                className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select end</option>
                {filteredEndSlots().map(s => (
                  <option key={s} value={s}>{formatTime12h(s)}</option>
                ))}
              </select>
            </div>
          </div>

          {bookedSlots.length > 0 && (
            <div className="bg-gray-50 border border-gray-200 p-3 rounded">
              <h4 className="font-medium mb-2">Booked slots on selected date</h4>
              <ul className="text-sm text-gray-700">
                {bookedSlots.map((b) => (
                  <li key={b._id}>
                    {new Date(b.start).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })} -
                    {new Date(b.end).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })}
                    <span className="text-xs text-gray-500 ml-1">(by {b.user?.username || 'User'})</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <textarea
            name="purpose"
            placeholder="Purpose of booking (optional)"
            value={formData.purpose}
            onChange={handleChange}
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />

          <div className="flex justify-end space-x-4 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50"
            >
              {loading ? 'Booking...' : 'Confirm Booking'}
            </button>
          </div>
        </form>
      </ModalWrapper>

      <AlertModal
        isOpen={alertState.isOpen}
        message={alertState.message}
        type={alertState.type}
        onClose={closeAlert}
      />
    </>
  );
}

export default BookFacilityModal;