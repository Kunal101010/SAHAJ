import { useState, useEffect } from 'react';  // ← Add useEffect
import api from '../services/api';
import ModalWrapper from './ModalWrapper';

function EditFacilityModal({ isOpen, onClose, facility, onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    capacity: '',
    location: '',
    description: '',
    isActive: true
  });
  const [loading, setLoading] = useState(false);

  // ← ADD THIS useEffect to load old data when facility changes
  useEffect(() => {
    if (facility) {
      setFormData({
        name: facility.name || '',
        capacity: facility.capacity || '',
        location: facility.location || '',
        description: facility.description || '',
        isActive: facility.isActive !== false
      });
    }
  }, [facility]);

  // if (!isOpen || !facility) return null; // ModalWrapper handles isOpen. We check facility inside.

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.patch(`/api/admin/facilities/${facility._id}`, formData);
      alert('Facility updated successfully!');
      onSuccess();
      onClose();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update facility');
    } finally {
      setLoading(false);
    }
  };

  if (!facility) return null;

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} title={`Edit Facility: ${facility.name}`}>
      <form onSubmit={handleSubmit} className="space-y-5">
        <input name="name" value={formData.name} onChange={handleChange} required className="w-full px-4 py-3 border rounded-lg" />
        <input name="capacity" type="number" value={formData.capacity} onChange={handleChange} required min="1" className="w-full px-4 py-3 border rounded-lg" />
        <input name="location" value={formData.location} onChange={handleChange} required className="w-full px-4 py-3 border rounded-lg" />
        <textarea name="description" value={formData.description} onChange={handleChange} rows="4" className="w-full px-4 py-3 border rounded-lg resize-none" />
        <label className="flex items-center space-x-3">
          <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleChange} className="h-5 w-5" />
          <span>Active</span>
        </label>
        <div className="flex justify-end space-x-4 pt-4">
          <button type="button" onClick={onClose} className="px-6 py-3 bg-gray-200 rounded-lg">Cancel</button>
          <button type="submit" disabled={loading} className="px-6 py-3 bg-blue-600 text-white rounded-lg">
            {loading ? 'Updating...' : 'Update Facility'}
          </button>
        </div>
      </form>
    </ModalWrapper>
  );
}

export default EditFacilityModal;