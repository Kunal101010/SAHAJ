import { useState } from 'react';
import api from '../services/api';
import ModalWrapper from './ModalWrapper';

function AddFacilityModal({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    capacity: '',
    location: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);

  // if (!isOpen) return null; // ModalWrapper handles this

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
    <ModalWrapper isOpen={isOpen} onClose={onClose} title="Add New Facility">
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
    </ModalWrapper>
  );
}

export default AddFacilityModal;