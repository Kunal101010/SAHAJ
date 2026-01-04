import { useState } from 'react';
import api from '../services/api';

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

  if (!isOpen) return null;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-white/70 backdrop-blur-md" onClick={onClose} />
      <div className="relative bg-white p-8 rounded-2xl shadow-2xl w-full max-w-lg mx-4">
        <h2 className="text-2xl font-bold mb-6">Add New User</h2>
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
      </div>
    </div>
  );
}

export default AddUserModal;