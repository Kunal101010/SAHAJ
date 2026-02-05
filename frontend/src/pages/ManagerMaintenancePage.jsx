import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../utils/auth';
import api from '../services/api';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import NewRequestModal from '../components/NewRequestModal';
import ViewEditRequestModal from '../components/ViewEditRequestModal';
import Toast from '../components/Toast';

function ManagerMaintenancePage() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState(null);

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [toast, setToast] = useState({ isVisible: false, message: '', type: 'success' });

  const isAdmin = currentUser?.role === 'admin';
  const isManager = currentUser?.role === 'manager';

  useEffect(() => {
    if (!currentUser || !['admin', 'manager'].includes(currentUser?.role)) {
      navigate('/dashboard');
      return;
    }
    fetchRequests();
  }, [navigate]);

  const fetchRequests = async () => {
    setLoading(true);
    setError('');
    try {
      // Fetch all requests for admin/manager
      const res = await api.get('/api/maintenance/requests/all');
      setRequests(res.data.data || []);
    } catch (err) {
      setError('Failed to load requests');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredRequests = requests
    .filter((req) =>
      req.title?.toLowerCase().includes(search.toLowerCase()) ||
      req.description?.toLowerCase().includes(search.toLowerCase()) ||
      req.location?.toLowerCase().includes(search.toLowerCase()) ||
      (req.submittedBy?.firstName + ' ' + req.submittedBy?.lastName).toLowerCase().includes(search.toLowerCase()) ||
      req.submittedBy?.username?.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      const statusOrder = { 'Pending': 0, 'In Progress': 1, 'Completed': 2 };
      return (statusOrder[a.status] || 3) - (statusOrder[b.status] || 3);
    });

  const handleRequestCreated = () => {
    setIsModalOpen(false);
    fetchRequests();
  };

  const handleRequestUpdated = () => {
    setIsViewModalOpen(false);
    fetchRequests();
  };

  const showToast = (message, type = 'success') => {
    setToast({ isVisible: true, message, type });
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="p-8 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800">All Maintenance Requests</h2>
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
        ) : filteredRequests.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl shadow-lg">
            <p className="text-gray-500 text-xl">
              {search ? 'No matching requests found.' : 'No requests found.'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredRequests.map((req) => (
              <div
                key={req._id}
                className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition duration-300 border border-gray-100"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-3">
                      <h3 className="text-2xl font-bold text-gray-800">{req.title}</h3>
                      <span className="text-sm text-gray-600">
                        <strong>Submitted by: {req.submittedBy?.firstName} {req.submittedBy?.lastName}</strong>
                      </span>
                    </div>
                    <p className="text-gray-600 mt-3 text-lg">{req.description}</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 text-sm">
                      <div><strong className="text-gray-700">Location:</strong> <span className="ml-2 text-gray-600">{req.location}</span></div>
                      <div><strong className="text-gray-700">Type:</strong> <span className="ml-2 text-gray-600">{req.type}</span></div>
                      <div>
                        <strong className="text-gray-700">Priority:</strong>
                        <span className={`ml-2 px-3 py-1 rounded-full text-xs font-bold ${req.priority === 'Critical' ? 'bg-red-200 text-red-800' :
                            req.priority === 'High' ? 'bg-orange-200 text-orange-800' :
                              req.priority === 'Medium' ? 'bg-yellow-200 text-yellow-800' :
                                'bg-green-200 text-green-800'
                          }`}>
                          {req.priority}
                        </span>
                      </div>
                      <div><strong className="text-gray-700">Submitted:</strong> <span className="ml-2 text-gray-600">{new Date(req.createdAt).toLocaleDateString()}</span></div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-4 ml-8">
                    <span className={`px-5 py-2 rounded-full text-base font-bold ${req.status === 'Completed' ? 'bg-green-100 text-green-800' :
                        req.status === 'Pending' ? 'bg-red-100 text-red-800' :
                          'bg-blue-100 text-blue-800'
                      }`}>
                      {req.status}
                    </span>
                    <button
                      onClick={() => {
                        setSelectedRequestId(req._id);
                        setIsViewModalOpen(true);
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-sm"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <NewRequestModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onRequestCreated={handleRequestCreated}
      />

      <ViewEditRequestModal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedRequestId(null);
        }}
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

export default ManagerMaintenancePage;
