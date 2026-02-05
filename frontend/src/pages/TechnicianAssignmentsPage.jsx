import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../utils/auth';
import api from '../services/api';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import ViewEditRequestModal from '../components/ViewEditRequestModal';
import Toast from '../components/Toast';

function TechnicianAssignmentsPage() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  const [search, setSearch] = useState('');
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [expandedTechnicians, setExpandedTechnicians] = useState({});
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState({ isVisible: false, message: '', type: 'success' });

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
      const res = await api.get('/api/maintenance/requests/all');
      const assignedRequests = (res.data.data || []).filter(req => req.assignedTo);
      setRequests(assignedRequests);
    } catch (err) {
      setError('Failed to load technician assignments');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestUpdated = () => {
    setIsViewModalOpen(false);
    fetchRequests();
  };

  const toggleTechnician = (technicianId) => {
    setExpandedTechnicians(prev => ({
      ...prev,
      [technicianId]: !prev[technicianId]
    }));
  };

  const filteredRequests = requests.filter(req =>
    req.title?.toLowerCase().includes(search.toLowerCase()) ||
    req.description?.toLowerCase().includes(search.toLowerCase()) ||
    req.location?.toLowerCase().includes(search.toLowerCase()) ||
    (req.assignedTo?.firstName + ' ' + req.assignedTo?.lastName).toLowerCase().includes(search.toLowerCase()) ||
    req.assignedTo?.username?.toLowerCase().includes(search.toLowerCase()) ||
    (req.submittedBy?.firstName + ' ' + req.submittedBy?.lastName).toLowerCase().includes(search.toLowerCase())
  );

  const groupedByTechnician = {};
  filteredRequests.forEach(req => {
    const technicianId = req.assignedTo?._id;
    const technicianName = `${req.assignedTo?.firstName} ${req.assignedTo?.lastName}`;

    if (!groupedByTechnician[technicianId]) {
      groupedByTechnician[technicianId] = {
        name: technicianName,
        username: req.assignedTo?.username,
        inProgress: [],
        completed: []
      };
    }

    if (req.status === 'In Progress') {
      groupedByTechnician[technicianId].inProgress.push(req);
    } else if (req.status === 'Completed') {
      groupedByTechnician[technicianId].completed.push(req);
    }
  });

  const getPriorityStyles = (priority) => {
    const styles = {
      Critical: 'bg-red-200 text-red-800',
      High: 'bg-orange-200 text-orange-800',
      Medium: 'bg-yellow-200 text-yellow-800',
      Low: 'bg-green-200 text-green-800'
    };
    return styles[priority] || styles.Low;
  };

  return (
    <div className="flex h-screen bg-gray-50 flex-col">
      <div className="flex-1 overflow-auto">
        <div className="p-6 lg:p-8 max-w-6xl mx-auto w-full">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Technician Assignments</h1>
            <p className="text-gray-600 mt-1">Manage and track technician task assignments</p>
          </div>

          <div className="mb-6">
            <input
              type="text"
              placeholder="Search by technician, request, or location..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-24">
              <p className="text-gray-600">Loading assignments...</p>
            </div>
          ) : Object.keys(groupedByTechnician).length === 0 ? (
            <div className="flex items-center justify-center py-24 bg-white rounded-lg border border-gray-200">
              <p className="text-gray-600">
                {search ? 'No matching assignments found' : 'No technician assignments yet'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {Object.entries(groupedByTechnician).map(([technicianId, technician]) => (
                <TechnicianAccordion
                  key={technicianId}
                  technicianId={technicianId}
                  technician={technician}
                  isExpanded={expandedTechnicians[technicianId]}
                  onToggle={toggleTechnician}
                  onViewRequest={(requestId) => {
                    setSelectedRequestId(requestId);
                    setIsViewModalOpen(true);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>


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
    </div >
  );

  function TechnicianAccordion({ technicianId, technician, isExpanded, onToggle, onViewRequest }) {
    const totalAssigned = technician.inProgress.length + technician.completed.length;

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <button
          onClick={() => onToggle(technicianId)}
          className="w-full p-6 hover:bg-gray-50 transition duration-200 text-left"
        >
          <div className="flex justify-between items-center gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h3 className="text-xl font-bold text-gray-900">{technician.name}</h3>
                <span className="text-gray-600 text-sm">@{technician.username}</span>
              </div>

              <div className="flex flex-wrap gap-6 mt-3 text-sm">
                <div>
                  <span className="text-gray-600">Total Assigned:</span>
                  <span className="ml-2 font-semibold text-gray-900">{totalAssigned}</span>
                </div>
                <div>
                  <span className="text-gray-600">In Progress:</span>
                  <span className="ml-2 font-semibold text-blue-600">{technician.inProgress.length}</span>
                </div>
                <div>
                  <span className="text-gray-600">Completed:</span>
                  <span className="ml-2 font-semibold text-green-600">{technician.completed.length}</span>
                </div>
              </div>
            </div>

            <div className="flex-shrink-0">
              <svg
                className={`w-5 h-5 text-gray-700 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''
                  }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>
          </div>
        </button>

        {isExpanded && (
          <div className="border-t border-gray-200 p-6 bg-gray-50">
            {technician.inProgress.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2.5 h-2.5 bg-blue-500 rounded-full"></div>
                  <h4 className="text-lg font-semibold text-blue-700">
                    In Progress ({technician.inProgress.length})
                  </h4>
                </div>
                <div className="space-y-3">
                  {technician.inProgress.map(req => (
                    <RequestCard
                      key={req._id}
                      request={req}
                      isCompleted={false}
                      onView={onViewRequest}
                      getPriorityStyles={getPriorityStyles}
                    />
                  ))}
                </div>
              </div>
            )}

            {technician.completed.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2.5 h-2.5 bg-green-500 rounded-full"></div>
                  <h4 className="text-lg font-semibold text-green-700">
                    Completed ({technician.completed.length})
                  </h4>
                </div>
                <div className="space-y-3">
                  {technician.completed.map(req => (
                    <RequestCard
                      key={req._id}
                      request={req}
                      isCompleted={true}
                      onView={onViewRequest}
                      getPriorityStyles={getPriorityStyles}
                    />
                  ))}
                </div>
              </div>
            )}

            {technician.inProgress.length === 0 && technician.completed.length === 0 && (
              <p className="text-gray-500 text-center py-6">No assignments</p>
            )}
          </div>
        )}
      </div>
    );
  }

  function RequestCard({ request, isCompleted, onView, getPriorityStyles }) {
    return (
      <div className={`bg-white p-5 rounded-lg border transition ${isCompleted
        ? 'border-green-200 hover:border-green-400 opacity-75'
        : 'border-blue-200 hover:border-blue-400'
        }`}>
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1">
            <h5 className="text-base font-semibold text-gray-900">{request.title}</h5>
            <p className="text-gray-600 text-sm mt-1">{request.description}</p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-xs">
              <div>
                <strong className="text-gray-700">Location:</strong>
                <p className="text-gray-600 mt-1">{request.location}</p>
              </div>
              <div>
                <strong className="text-gray-700">Type:</strong>
                <p className="text-gray-600 mt-1">{request.type}</p>
              </div>
              <div>
                <strong className="text-gray-700">Priority:</strong>
                <span className={`inline-block mt-1 px-2 py-1 rounded text-xs font-medium ${getPriorityStyles(request.priority)}`}>
                  {request.priority}
                </span>
              </div>
              <div>
                <strong className="text-gray-700">{isCompleted ? 'Completed' : 'Submitted'} on:</strong>
                <p className="text-gray-600 mt-1">
                  {new Date(isCompleted ? request.updatedAt : request.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={() => onView(request._id)}
            className={`px-3 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition ${isCompleted
              ? 'bg-gray-600 hover:bg-gray-700 text-white'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
          >
            View Details
          </button>
        </div>
      </div>
    );
  }
}

export default TechnicianAssignmentsPage;
