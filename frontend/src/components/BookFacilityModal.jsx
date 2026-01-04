import { useState } from 'react';

function BookFacilityModal({ isOpen, onClose }) {
  const [formData, setFormData] = useState({
    facility: '',
    date: '',
    startTime: '',
    endTime: '',
    purpose: '',
  });

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Booking Submitted:', formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="absolute inset-0 bg-white/70 backdrop-blur-md"
        onClick={onClose}
      />

      <div className="relative bg-white p-8 rounded-2xl shadow-2xl w-full max-w-lg mx-4">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Book a Facility</h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <select
            name="facility"
            value={formData.facility}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Facility *</option>
            <option>Conference Room A</option>
            <option>Meeting Room B</option>
            <option>Auditorium</option>
            <option>Training Room</option>
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
            <input
              name="startTime"
              type="time"
              placeholder="Start Time"
              value={formData.startTime}
              onChange={handleChange}
              required
              className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              name="endTime"
              type="time"
              placeholder="End Time"
              value={formData.endTime}
              onChange={handleChange}
              required
              className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <textarea
            name="purpose"
            placeholder="Purpose of booking *"
            value={formData.purpose}
            onChange={handleChange}
            rows={4}
            required
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
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
            >
              Confirm Booking
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default BookFacilityModal;