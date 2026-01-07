import { useState, useEffect } from 'react';
import api from '../services/api';

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

  useEffect(() => {
    if (!isOpen) return;
    // fetch facilities
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

  // Prefill when modal opens with facility or selectedDate
  useEffect(() => {
    if (!isOpen) return;
    if (facility) {
      setFormData((prev) => ({ ...prev, facilityId: facility._id }));
    }
    if (selectedDate) {
      // selectedDate may be a Date object or YYYY-MM-DD string
      const dateStr = (selectedDate instanceof Date)
        ? selectedDate.toISOString().slice(0, 10)
        : (selectedDate || '').slice(0, 10);
      setFormData((prev) => ({ ...prev, date: dateStr }));

      // fetch booked slots for this facility/date
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
    // prefill times if provided
    if (initialStartTime) setFormData(prev => ({ ...prev, startTime: initialStartTime }));
    if (initialEndTime) setFormData(prev => ({ ...prev, endTime: initialEndTime }));
  }, [isOpen, facility, selectedDate]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      setLoading(true);

      const { facilityId, date, startTime, endTime, purpose } = formData;
      if (!facilityId || !date || !startTime || !endTime) {
        setError('Please fill all required fields');
        setLoading(false);
        return;
      }

      const start = new Date(`${date}T${startTime}`);
      const end = new Date(`${date}T${endTime}`);

      // Final overlap check on client as UX guard
      const overlaps = bookedSlots.some(b => {
        const bs = new Date(b.start).getTime();
        const be = new Date(b.end).getTime();
        return (start.getTime() < be && end.getTime() > bs);
      });

      if (overlaps) {
        setError('Selected time overlaps with an existing booking. Please choose a different time.');
        setLoading(false);
        return;
      }

      const res = await api.post('/api/bookings', {
        facilityId,
        start,
        end,
        purpose,
      });

      if (res.data && res.data.success) {
        onClose();
      }
    } catch (err) {
      console.error('Booking error', err);
      setError(err.response?.data?.message || 'Booking failed');
    } finally {
      setLoading(false);
    }
  };

  // Time slot helpers: generate 30-min increments
  const generateTimeSlots = (intervalMins = 30) => {
    const slots = [];
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += intervalMins) {
        const hh = String(h).padStart(2, '0');
        const mm = String(m).padStart(2, '0');
        slots.push(`${hh}:${mm}`);
      }
    }
    return slots;
  };

  const timeSlots = generateTimeSlots(30);

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
      // ensure range [startMs, endMs) does not overlap any booked slot
      const overlap = bookedSlots.some(b => {
        const bs = new Date(b.start).getTime();
        const be = new Date(b.end).getTime();
        return (startMs < be && endMs > bs);
      });
      return !overlap;
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-white/70 backdrop-blur-md"
        onClick={onClose}
      />

      <div className="relative bg-white p-8 rounded-2xl shadow-2xl w-full max-w-lg mx-4">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Book a Facility</h2>

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
            <select
              name="startTime"
              value={formData.startTime}
              onChange={handleChange}
              required
              className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select start</option>
              {timeSlots.map(s => (
                <option key={s} value={s} disabled={isSlotDisabled(s)}>{s}{isSlotDisabled(s) ? ' (booked)' : ''}</option>
              ))}
            </select>

            <select
              name="endTime"
              value={formData.endTime}
              onChange={handleChange}
              required
              className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select end</option>
              {filteredEndSlots().map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {bookedSlots.length > 0 && (
            <div className="bg-gray-50 border border-gray-200 p-3 rounded">
              <h4 className="font-medium mb-2">Booked slots on selected date</h4>
              <ul className="text-sm text-gray-700">
                {bookedSlots.map((b) => (
                  <li key={b._id}>{new Date(b.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(b.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} by {b.user?.username || b.user?.email || 'User'}</li>
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
      </div>
    </div>
  );
}

export default BookFacilityModal;