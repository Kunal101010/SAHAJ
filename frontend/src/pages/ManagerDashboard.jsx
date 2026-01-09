import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../utils/auth';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import api from '../services/api';
import StatCard from '../components/StatCard';

function ManagerDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(getCurrentUser());
  const [stats, setStats] = useState({
    totalMaintenanceRequests: 0,
    pendingMaintenanceRequests: 0,
    totalBookings: 0,
    totalFacilities: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !['manager', 'admin'].includes(user.role)) {
      navigate('/dashboard');
      return;
    }
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const [mainRes, bookRes, facRes] = await Promise.all([
        api.get('/api/maintenance'),
        api.get('/api/bookings/me'),
        api.get('/api/facilities'),
      ]);

      const mainRequests = mainRes.data.data || [];
      const bookings = bookRes.data.bookings || [];
      const facilities = facRes.data.facilities || [];

      setStats({
        totalMaintenanceRequests: mainRequests.length,
        pendingMaintenanceRequests: mainRequests.filter(r => r.status === 'Pending').length,
        totalBookings: bookings.length,
        totalFacilities: facilities.length,
      });
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex relative">
      <Sidebar />

      <div className="ml-64 flex-1 pt-16 bg-gray-50 min-h-screen">
        <TopBar user={user} />

        <div className="p-8 max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-800 mb-8">Manager Dashboard</h2>

          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading stats...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard
                title="Total Maintenance Requests"
                value={stats.totalMaintenanceRequests}
                icon="🔧"
                color="bg-blue-50"
              />
              <StatCard
                title="Pending Requests"
                value={stats.pendingMaintenanceRequests}
                icon="⏳"
                color="bg-yellow-50"
              />
              <StatCard
                title="Total Bookings"
                value={stats.totalBookings}
                icon="📅"
                color="bg-green-50"
              />
              <StatCard
                title="Total Facilities"
                value={stats.totalFacilities}
                icon="🏢"
                color="bg-purple-50"
              />
            </div>
          )}

          {/* Quick Links */}
          <div className="bg-white p-8 rounded-2xl shadow-lg">
            <h3 className="text-xl font-bold text-gray-800 mb-6">Quick Links</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <a
                href="/maintenance-requests"
                className="block p-4 border border-gray-200 rounded-lg hover:shadow-md transition"
              >
                <h4 className="font-semibold text-gray-800">View Maintenance Requests</h4>
                <p className="text-sm text-gray-600">Manage and track all maintenance requests</p>
              </a>
              <a
                href="/facility-booking"
                className="block p-4 border border-gray-200 rounded-lg hover:shadow-md transition"
              >
                <h4 className="font-semibold text-gray-800">View Bookings</h4>
                <p className="text-sm text-gray-600">View all facility bookings</p>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ManagerDashboard;
