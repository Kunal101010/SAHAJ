import { useState } from 'react';
import api from '../services/api';
import ModalWrapper from './ModalWrapper';
import { useToast } from '../context/ToastContext';

function AddFacilityModal({ isOpen, onClose, onSuccess }) {
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    capacity: '',
    location: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // if (!isOpen) return null; // ModalWrapper handles this

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
    
    // Real-time validation for description word count
    if (name === 'description') {
      const wordCount = value.trim().split(/\s+/).filter(word => word.length > 0).length;
      if (wordCount > 200) {
        setErrors(prev => ({ ...prev, description: 'Description cannot exceed 200 words' }));
      }
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Facility name is required';
    }
    
    if (!formData.capacity || formData.capacity < 1) {
      newErrors.capacity = 'Capacity must be at least 1';
    }
    
    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    }
    
    if (formData.description) {
      const wordCount = formData.description.trim().split(/\s+/).filter(word => word.length > 0).length;
      if (wordCount > 200) {
        newErrors.description = 'Description cannot exceed 200 words';
      }
    }
    
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    setLoading(true);
    try {
      await api.post('/api/admin/facilities', formData);
      showToast('Facility added successfully!', 'success');
      onSuccess();
      onClose();
      setFormData({ name: '', capacity: '', location: '', description: '' });
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to add facility';
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} title="Add New Facility">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <input name="name" placeholder="Facility Name *" value={formData.name} onChange={handleChange} className="w-full px-4 py-3 border rounded-lg" />
          {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
        </div>
        <div>
          <input name="capacity" type="number" placeholder="Capacity *" value={formData.capacity} onChange={handleChange} min="1" className="w-full px-4 py-3 border rounded-lg" />
          {errors.capacity && <p className="text-red-500 text-sm mt-1">{errors.capacity}</p>}
        </div>
        <div>
          <input name="location" placeholder="Location *" value={formData.location} onChange={handleChange} className="w-full px-4 py-3 border rounded-lg" />
          {errors.location && <p className="text-red-500 text-sm mt-1">{errors.location}</p>}
        </div>
        <div>
          <textarea 
            name="description" 
            placeholder="Description (optional - max 200 words)" 
            value={formData.description} 
            onChange={handleChange} 
            rows="4" 
            className={`w-full px-4 py-3 border rounded-lg resize-none ${errors.description ? 'border-red-500' : ''}`}
          />
          <div className="flex justify-between items-center mt-1">
            <span className="text-sm text-gray-500">
              {formData.description.trim().split(/\s+/).filter(word => word.length > 0).length} / 200 words
            </span>
            {errors.description && <p className="text-red-500 text-sm">{errors.description}</p>}
          </div>
        </div>
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