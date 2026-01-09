import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../utils/auth';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import api from '../services/api';

function ManagerMaintenancePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(getCurrentUser());
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  useEffect(() => {
    if (!user || !['manager', 'admin'].includes(user.role)) {
      navigate('/dashboard');
      return;
    }
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/maintenance');
      setRequests(res.data.data || []);
      applyFilters(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch maintenance requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = (data) => {
    let filtered = data;
    if (statusFilter !== 'all') {
      filtered = filtered.filter(r => r.status === statusFilter);
    }
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(r => r.priority === priorityFilter);
    }
    setFilteredRequests(filtered);
  };

  useEffect(() => {
    applyFilters(requests);
  }, [statusFilter, priorityFilter, requests]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'In Progress':
        return 'bg-blue-100 text-blue-800';
      case 'Completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Critical':
        return 'text-red-600';
      case 'High':
        return 'text-orange-600';
      case 'Medium':
        return 'text-yellow-600';
      case 'Low':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="flex relative">
      <Sidebar />

      <div className="ml-64 flex-1 pt-16 bg-gray-50 min-h-screen">
        <TopBar user={user} />

        <div className="p-8 max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-800 mb-8">Maintenance Requests</h2>

          {/* Filters */}
          <div className="bg-white p-6 rounded-2xl shadow-lg mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Priority</option>
                  <option value="Critical">Critical</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
            </div>
          </div>

          {/* Requests List */}
          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading maintenance requests...</div>
          ) : (
            <div className="space-y-4">
              {filteredRequests.length === 0 ? (
                <div className="bg-white p-12 rounded-2xl shadow-lg text-center text-gray-500">
                  No maintenance requests found.
                </div>
              ) : (
                filteredRequests.map(request => (
                  <div key={request._id} className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition">
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
                      <div>
                        <p className="text-sm text-gray-600">Title</p>
                        <p className="font-bold text-gray-800">{request.title}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Type</p>
                        <p className="font-medium text-gray-800">{request.type}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Location</p>
                        <p className="font-medium text-gray-800">{request.location}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Priority</p>
                        <p className={`font-bold ${getPriorityColor(request.priority)}`}>{request.priority}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Status</p>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(request.status)}`}>
                          {request.status}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Submitted By</p>
                        <p className="font-medium text-gray-800">{request.submittedBy?.username || 'Unknown'}</p>
                      </div>
                    </div>
                    {request.description && (
                      <p className="text-sm text-gray-600 mt-4">{request.description}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ManagerMaintenancePage;
