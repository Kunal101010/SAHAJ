import { useState } from 'react';
import api from '../services/api';
// import Toast from './Toast'; // Removed local Toast
import { useToast } from '../context/ToastContext';
import ModalWrapper from './ModalWrapper';

function NewRequestModal({ isOpen, onClose, onRequestCreated }) {
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    title: '',
    type: '',
    priority: '',
    location: '',
    description: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Removed local toast state

  // if (!isOpen) return null; // ModalWrapper handles this

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.post('/api/maintenance/requests', formData);
      showToast('Request submitted successfully!', 'success');
      onClose();
      setFormData({
        title: '',
        type: '',
        priority: '',
        location: '',
        description: '',
      });
      if (onRequestCreated) onRequestCreated();
      else window.location.reload();
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to submit request';
      setError(errorMsg);
      showToast(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} title="Submit Maintenance Request">
      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <input
          name="title"
          type="text"
          placeholder="Issue Title *"
          value={formData.title}
          onChange={handleChange}
          required
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <select
          name="type"
          value={formData.type}
          onChange={handleChange}
          required
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select Issue Type *</option>
          <option>Electrical</option>
          <option>Plumbing</option>
          <option>HVAC</option>
          <option>IT</option>
          <option>Cleaning</option>
          <option>Other</option>
        </select>

        <select
          name="priority"
          value={formData.priority}
          onChange={handleChange}
          required
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select Priority *</option>
          <option>Low</option>
          <option>Medium</option>
          <option>High</option>
          <option>Critical</option>
        </select>

        <input
          name="location"
          type="text"
          placeholder="Location (e.g., Building A, Room 301) *"
          value={formData.location}
          onChange={handleChange}
          required
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <textarea
          name="description"
          placeholder="Provide details about the issue *"
          value={formData.description}
          onChange={handleChange}
          rows={5}
          required
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />

        <div className="flex justify-end space-x-4 pt-6">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50"
          >
            {loading ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>
      </form>
    </ModalWrapper>
  );
}

export default NewRequestModal;