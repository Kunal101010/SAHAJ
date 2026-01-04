// src/pages/AdminFacilitiesPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../utils/auth';
import api from '../services/api';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import AddFacilityModal from '../components/AddFacilityModal';
import EditFacilityModal from '../components/EditFacilityModal';

function AdminFacilitiesPage() {
  const navigate = useNavigate();

  const [facilities, setFacilities] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingFacility, setEditingFacility] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    const user = getCurrentUser();
    if (!user || user.role !== 'admin') {
      navigate('/dashboard');
      return;
    }

    fetchFacilities();
  }, [navigate]); // ← Only stable dependency

  const fetchFacilities = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/admin/facilities');
      setFacilities(res.data.data || []);
    } catch (err) {
      alert('Failed to load facilities');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredFacilities = facilities.filter(f =>
    f.name.toLowerCase().includes(search.toLowerCase()) ||
    f.location.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this facility?')) return;
    try {
      await api.delete(`/api/admin/facilities/${id}`);
      fetchFacilities();
      alert('Facility deleted successfully');
    } catch (err) {
      alert('Failed to delete facility');
    }
  };

  const user = getCurrentUser(); // For TopBar

  return (
    <div className="flex">
      <Sidebar />
      <div className="ml-64 flex-1 pt-16 bg-gray-50 min-h-screen">
        <TopBar user={user} />

        <div className="p-8 max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-gray-800">Facility Management</h2>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition shadow-md"
            >
              Add New Facility
            </button>
          </div>

          <div className="mb-8">
            <input
              type="text"
              placeholder="Search facilities by name or location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-5 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
            />
          </div>

          {loading ? (
            <p className="text-center py-12 text-gray-600">Loading facilities...</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredFacilities.map((f) => (
                <div key={f._id} className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition">
                  <h3 className="text-xl font-bold text-gray-800 mb-3">{f.name}</h3>
                  <p className="text-gray-600 mb-1"><strong>Capacity:</strong> {f.capacity}</p>
                  <p className="text-gray-600 mb-1"><strong>Location:</strong> {f.location}</p>
                  <p className="text-gray-600 mb-4"><strong>Description:</strong> {f.description || 'N/A'}</p>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium mb-4 block ${
                    f.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {f.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <div className="flex space-x-4">
                    <button
                      onClick={() => setEditingFacility(f)}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(f._id)}
                      className="text-red-600 hover:text-red-800 font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
              {filteredFacilities.length === 0 && (
                <p className="col-span-full text-center py-12 text-gray-600">
                  No facilities found. Add one to get started!
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      <AddFacilityModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={fetchFacilities}
      />

      <EditFacilityModal
        isOpen={!!editingFacility}
        onClose={() => setEditingFacility(null)}
        facility={editingFacility}
        onSuccess={fetchFacilities}
      />
    </div>
  );
}

export default AdminFacilitiesPage;