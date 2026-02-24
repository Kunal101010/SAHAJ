// src/components/ViewEditRequestModal.jsx
import { useState, useEffect } from 'react';
import api from '../services/api';
import { getCurrentUser } from '../utils/auth';
// import Toast from './Toast';
import { useToast } from '../context/ToastContext';
import ModalWrapper from './ModalWrapper';

function ViewEditRequestModal({ isOpen, onClose, requestId, onRequestUpdated }) {
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    title: '',
    type: '',
    priority: '',
    location: '',
    description: '',
    status: '',
  });
  const [technicians, setTechnicians] = useState([]);
  const [selectedTechnician, setSelectedTechnician] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  // Removed local toast state

  const user = getCurrentUser();

  useEffect(() => {
    if (isOpen && requestId) {
      fetchRequest();
      // Fetch technicians for admin/manager
      if (['manager', 'admin'].includes(user?.role)) {
        fetchTechnicians();
      }
    }
  }, [isOpen, requestId]);

  const fetchTechnicians = async () => {
    try {
      const res = await api.get('/api/maintenance/technicians');
      setTechnicians(res.data.data || []);
    } catch (err) {
      console.error('Error fetching technicians:', err);
    }
  };

  const fetchRequest = async () => {
    setLoading(true);
    setError('');
    setIsEditing(false);
    try {
      console.log('Fetching request with ID:', requestId);
      console.log('Current user:', user);
      const res = await api.get(`/api/maintenance/requests/${requestId}`);
      console.log('Request data:', res.data.data);
      setFormData(res.data.data);
      setSelectedTechnician(res.data.data.assignedTo?._id || '');
    } catch (err) {
      console.error('Error fetching request:', err);
      setError(err.response?.data?.message || 'Failed to load request details');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAssignTechnician = async () => {
    if (!selectedTechnician) {
      showToast('Please select a technician', 'warning');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.patch(`/api/maintenance/requests/${requestId}/assign`, {
        technicianId: selectedTechnician
      });
      showToast('Technician assigned successfully!', 'success');
      fetchRequest();
      if (onRequestUpdated) onRequestUpdated();
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to assign technician';
      setError(errorMsg);
      showToast(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      // Employees and technicians cannot update status, so remove it from the payload
      const updateData = { ...formData };
      if (user?.role === 'employee' || user?.role === 'technician') {
        delete updateData.status;
      }

      await api.patch(`/api/maintenance/requests/${requestId}`, updateData);
      showToast('Request updated successfully!', 'success');
      setIsEditing(false);
      if (onRequestUpdated) onRequestUpdated();
      onClose();
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to update request';
      setError(errorMsg);
      showToast(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  // if (!isOpen) return null; // ModalWrapper handles this

  const canEdit =
    (['employee', 'technician'].includes(user?.role) &&
      formData.status === 'Pending' &&
      formData.submittedBy?._id === user?.id) ||
    ['manager', 'admin'].includes(user?.role);

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} title="Request Details">
      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-center py-8 text-gray-600">Loading details...</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              name="title"
              type="text"
              value={formData.title || ''}
              onChange={handleChange}
              disabled={!isEditing}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <select
              name="type"
              value={formData.type || ''}
              onChange={handleChange}
              disabled={!isEditing}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            >
              <option value="Electrical">Electrical</option>
              <option value="Plumbing">Plumbing</option>
              <option value="HVAC">HVAC</option>
              <option value="IT">IT</option>
              <option value="Cleaning">Cleaning</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Priority
            </label>
            <select
              name="priority"
              value={formData.priority || ''}
              onChange={handleChange}
              disabled={!isEditing}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <input
              name="location"
              type="text"
              value={formData.location || ''}
              onChange={handleChange}
              disabled={!isEditing}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description || ''}
              onChange={handleChange}
              rows={4}
              disabled={!isEditing}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 resize-none"
            />
          </div>

          {/* Status - Technician cannot edit */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              name="status"
              value={formData.status || 'Pending'}
              onChange={handleChange}
              disabled={!isEditing || user?.role === 'employee' || user?.role === 'technician'}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            >
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          {/* Assign Technician (Manager/Admin only) */}
          {['manager', 'admin'].includes(user?.role) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Assign Technician
              </label>
              {formData.status === 'Completed' ? (
                <div className="p-3 bg-gray-100 border border-gray-300 rounded-lg text-gray-600 italic">
                  This request is marked as <strong>Completed</strong> and cannot be reassigned.
                </div>
              ) : (
                <div className="flex gap-2">
                  <select
                    value={selectedTechnician}
                    onChange={(e) => setSelectedTechnician(e.target.value)}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a technician...</option>
                    {technicians.map((tech) => (
                      <option key={tech._id} value={tech._id}>
                        {tech.firstName} {tech.lastName} ({tech.username})
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleAssignTechnician}
                    disabled={loading || !selectedTechnician}
                    className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium disabled:opacity-50"
                  >
                    Assign
                  </button>
                </div>
              )}
              {formData.assignedTo && (
                <p className="text-sm text-green-600 mt-2">
                  Assigned to: {formData.assignedTo.firstName} {formData.assignedTo.lastName}
                </p>
              )}
            </div>
          )}

          {/* Buttons */}
          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition font-medium"
            >
              Close
            </button>

            {canEdit && !isEditing && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition font-medium"
              >
                Edit
              </button>
            )}

            {isEditing && (
              <>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    fetchRequest();
                  }}
                  className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
                >
                  Cancel Edit
                </button>
              </>
            )}
          </div>
        </form>
      )}
    </ModalWrapper>
  );
}

export default ViewEditRequestModal;