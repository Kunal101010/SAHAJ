import { useState } from 'react';
import api from '../services/api';

function AddFacilityModal({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    capacity: '',
    location: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/api/admin/facilities', formData);
      alert('Facility added successfully!');
      onSuccess();
      onClose();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add facility');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-white/70 backdrop-blur-md" onClick={onClose} />
      <div className="relative bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md mx-4">
        <h2 className="text-2xl font-bold mb-6">Add New Facility</h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          <input name="name" placeholder="Facility Name *" onChange={handleChange} required className="w-full px-4 py-3 border rounded-lg" />
          <input name="capacity" type="number" placeholder="Capacity *" onChange={handleChange} required min="1" className="w-full px-4 py-3 border rounded-lg" />
          <input name="location" placeholder="Location *" onChange={handleChange} required className="w-full px-4 py-3 border rounded-lg" />
          <textarea name="description" placeholder="Description" onChange={handleChange} rows="4" className="w-full px-4 py-3 border rounded-lg resize-none" />
          <div className="flex justify-end space-x-4 pt-4">
            <button type="button" onClick={onClose} className="px-6 py-3 bg-gray-200 rounded-lg">Cancel</button>
            <button type="submit" disabled={loading} className="px-6 py-3 bg-green-600 text-white rounded-lg">
              {loading ? 'Adding...' : 'Add Facility'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddFacilityModal;