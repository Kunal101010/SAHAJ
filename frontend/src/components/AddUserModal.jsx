import { useState } from 'react';
import api from '../services/api';
import ModalWrapper from './ModalWrapper';

function AddUserModal({ isOpen, onClose }) {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phone: '0000000000',
    password: '',
    firstName: '',
    lastName: '',
    role: 'employee'
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/api/admin/users', formData);
      alert('User created successfully!');
      onClose();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} title="Add New User" maxWidth="max-w-lg">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Same fields as signup but with role dropdown */}
        <input name="firstName" placeholder="First Name" onChange={handleChange} required className="w-full px-4 py-3 border rounded-lg" />
        <input name="lastName" placeholder="Last Name" onChange={handleChange} required className="w-full px-4 py-3 border rounded-lg" />
        <input name="username" placeholder="Username" onChange={handleChange} required className="w-full px-4 py-3 border rounded-lg" />
        <input name="email" type="email" placeholder="Email" onChange={handleChange} required className="w-full px-4 py-3 border rounded-lg" />
        <input name="phone" placeholder="Phone" value={formData.phone} onChange={handleChange} className="w-full px-4 py-3 border rounded-lg" />
        <input name="password" type="password" placeholder="Password" onChange={handleChange} required minLength="8" className="w-full px-4 py-3 border rounded-lg" />
        <select name="role" value={formData.role} onChange={handleChange} className="w-full px-4 py-3 border rounded-lg">
          <option value="employee">Employee</option>
          <option value="technician">Technician</option>
          <option value="manager">Manager</option>
          <option value="admin">Admin</option>
        </select>
        <div className="flex justify-end space-x-4 pt-4">
          <button type="button" onClick={onClose} className="px-6 py-3 bg-gray-200 rounded-lg">Cancel</button>
          <button type="submit" disabled={loading} className="px-6 py-3 bg-green-600 text-white rounded-lg">
            {loading ? 'Creating...' : 'Create User'}
          </button>
        </div>
      </form>
    </ModalWrapper>
  );
}

export default AddUserModal;