import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../utils/auth';
import api from '../services/api';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import NewRequestModal from '../components/NewRequestModal';
import ViewEditRequestModal from '../components/ViewEditRequestModal';
import Toast from '../components/Toast';

function TechnicianMaintenancePage() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState(null);

  const [myRequests, setMyRequests] = useState([]);
  const [assignedRequests, setAssignedRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [toast, setToast] = useState({ isVisible: false, message: '', type: 'success' });

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'technician') {
      navigate('/dashboard');
      return;
    }
    fetchAll();
  }, [navigate]);

  const fetchAll = async () => {
    setLoading(true);
    setError('');
    try {
      const [mineRes, assignedRes] = await Promise.all([
        api.get('/api/maintenance/requests'),
        api.get('/api/maintenance/requests/assigned')
      ]);
      setMyRequests(mineRes.data.data || []);
      setAssignedRequests(assignedRes.data.data || []);
    } catch (err) {
      setError('Failed to load requests');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredMy = myRequests
    .filter((req) =>
      req.title?.toLowerCase().includes(search.toLowerCase()) ||
      req.description?.toLowerCase().includes(search.toLowerCase()) ||
      req.location?.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      const statusOrder = { 'Pending': 0, 'In Progress': 1, 'Completed': 2 };
      return (statusOrder[a.status] || 3) - (statusOrder[b.status] || 3);
    });

  const filteredAssigned = assignedRequests
    .filter((req) =>
      req.title?.toLowerCase().includes(search.toLowerCase()) ||
      req.description?.toLowerCase().includes(search.toLowerCase()) ||
      req.location?.toLowerCase().includes(search.toLowerCase()) ||
      (req.submittedBy?.firstName + ' ' + req.submittedBy?.lastName).toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      const statusOrder = { 'Pending': 0, 'In Progress': 1, 'Completed': 2 };
      return (statusOrder[a.status] || 3) - (statusOrder[b.status] || 3);
    });

  const handleRequestCreated = () => {
    setIsModalOpen(false);
    fetchAll();
  };

  const handleRequestUpdated = () => {
    setIsViewModalOpen(false);
    fetchAll();
  };

  const showToast = (message, type = 'success') => {
    setToast({ isVisible: true, message, type });
  };

  const handleMarkCompleted = async (requestId) => {
    if (window.confirm('Mark this task as completed?')) {
      try {
        await api.patch(`/api/maintenance/requests/${requestId}/status`, {
          status: 'Completed'
        });
        showToast('Task marked as completed!', 'success');
        fetchAll();
      } catch (err) {
        showToast('Failed to mark task as completed: ' + (err.response?.data?.message || err.message), 'error');
      }
    }
  };

  return (
    <div className="flex">
      <Sidebar />

      <div className="ml-64 flex-1 pt-16 bg-gray-50 min-h-screen">
        <TopBar user={currentUser} />

        <div className="p-8 max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-gray-800">Technician Panel</h2>
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition shadow-md"
            >
              Submit New Request
            </button>
          </div>

          <div className="mb-8">
            <input
              type="text"
              placeholder="Search by title, description, location, or user..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-5 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
            />
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg mb-8 text-center">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-center py-16">
              <p className="text-gray-600 text-xl">Loading requests...</p>
            </div>
          ) : (
            <>
              <section className="mb-12">
                <h3 className="text-2xl font-bold text-gray-800 mb-4">My Requests</h3>
                {filteredMy.length === 0 ? (
                  <div className="text-center py-8 bg-white rounded-2xl shadow-lg">
                    <p className="text-gray-500">No requests found.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {filteredMy.map((req) => (
                      <div key={req._id} className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition duration-300 border border-gray-100">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="text-xl font-bold text-gray-800">{req.title}</h4>
                            <p className="text-gray-600 mt-2">{req.description}</p>
                            <div className="mt-4 text-sm text-gray-600">{req.location} • {req.type}</div>
                          </div>

                          <div className="flex flex-col items-end gap-4 ml-8">
                            <span className={`px-5 py-2 rounded-full text-base font-bold ${
                              req.status === 'Completed' ? 'bg-green-100 text-green-800' :
                              req.status === 'Pending' ? 'bg-red-100 text-red-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {req.status}
                            </span>
                            <button
                              onClick={() => { setSelectedRequestId(req._id); setIsViewModalOpen(true); }}
                              className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm"
                            >
                              View
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section>
                <h3 className="text-2xl font-bold text-gray-800 mb-4">Assigned Tasks</h3>
                {filteredAssigned.length === 0 ? (
                  <div className="text-center py-8 bg-white rounded-2xl shadow-lg">
                    <p className="text-gray-500">No assigned tasks.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {filteredAssigned.map((req) => (
                      <div key={req._id} className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition duration-300 border border-gray-100">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-4 mb-3">
                              <h4 className="text-xl font-bold text-gray-800">{req.title}</h4>
                              <span className="text-sm text-gray-600">Submitted by: {req.submittedBy?.firstName} {req.submittedBy?.lastName}</span>
                            </div>
                            <p className="text-gray-600 mt-2">{req.description}</p>
                            <div className="mt-4 text-sm text-gray-600">{req.location} • {req.type}</div>
                          </div>

                          <div className="flex flex-col items-end gap-4 ml-8">
                            <span className={`px-5 py-2 rounded-full text-base font-bold ${
                              req.status === 'Completed' ? 'bg-green-100 text-green-800' :
                              req.status === 'Pending' ? 'bg-red-100 text-red-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {req.status}
                            </span>
                            <div className="flex gap-2">
                              <button
                                onClick={() => { setSelectedRequestId(req._id); setIsViewModalOpen(true); }}
                                className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
                              >
                                View
                              </button>
                              {req.status !== 'Completed' && (
                                <button
                                  onClick={() => handleMarkCompleted(req._id)}
                                  className="px-3 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700"
                                >
                                  Completed
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </div>

      <NewRequestModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onRequestCreated={handleRequestCreated}
      />

      <ViewEditRequestModal
        isOpen={isViewModalOpen}
        onClose={() => { setIsViewModalOpen(false); setSelectedRequestId(null); }}
        requestId={selectedRequestId}
        onRequestUpdated={handleRequestUpdated}
      />

      <Toast
        isVisible={toast.isVisible}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, isVisible: false })}
      />
    </div>
  );
}

export default TechnicianMaintenancePage;
