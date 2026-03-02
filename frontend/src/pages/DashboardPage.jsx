// src/pages/DashboardPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../utils/auth';
import api from '../services/api';
import { useSocket } from '../context/SocketContext';
// import Sidebar from '../components/Sidebar';
// import TopBar from '../components/TopBar';
import StatCard from '../components/StatCard';
import BarChartComponent from '../components/BarChartComponent';
import PieChartComponent from '../components/PieChartComponent';
import RecentActivityTable from '../components/RecentActivityTable';

// Loading Skeleton Components
const StatCardSkeleton = () => (
  <div className="bg-white p-6 rounded-xl shadow-lg animate-pulse">
    <div className="flex items-center justify-between">
      <div>
        <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
        <div className="h-8 bg-gray-200 rounded w-12"></div>
      </div>
      <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
    </div>
  </div>
);

const ChartSkeleton = () => (
  <div className="bg-white p-6 rounded-xl shadow-lg animate-pulse">
    <div className="h-4 bg-gray-200 rounded w-32 mb-4"></div>
    <div className="h-64 bg-gray-200 rounded"></div>
  </div>
);

const TableSkeleton = () => (
  <div className="bg-white p-6 rounded-xl shadow-lg animate-pulse">
    <div className="h-4 bg-gray-200 rounded w-40 mb-4"></div>
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center space-x-4">
          <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

function DashboardPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(getCurrentUser());
  const [initialLoading, setInitialLoading] = useState(true);

  const [stats, setStats] = useState({ total: 0, pending: 0, inProgress: 0, completed: 0 });
  const [categoryData, setCategoryData] = useState([]);
  const [statusData, setStatusData] = useState([]);
  const [recent, setRecent] = useState([]);

  // Fetch data when component loads
  const socket = useSocket();

  useEffect(() => {
    if (!user) {
      navigate('/login'); // Redirect if not logged in
      return;
    }
    fetchDashboardData();
  }, []);

  // Listen for real-time updates
  useEffect(() => {
    if (!socket) return;

    const handleUpdate = () => {
      fetchDashboardData();
    };

    socket.on('request_created', handleUpdate);
    socket.on('request_updated', handleUpdate);
    socket.on('request_assigned', handleUpdate);
    socket.on('request_status_updated', handleUpdate); // Assuming this event exists or covered by request_updated

    return () => {
      socket.off('request_created', handleUpdate);
      socket.off('request_updated', handleUpdate);
      socket.off('request_assigned', handleUpdate);
      socket.off('request_status_updated', handleUpdate);
    };
  }, [socket]);

  const fetchDashboardData = async () => {
    try {
      // Don't show skeleton on real-time updates, only on initial load
      if (initialLoading) {
        setInitialLoading(true);
      }
      
      // Fetch all required data in parallel for better performance
      const [statsRes, categoryRes, statusRes, recentRes] = await Promise.all([
        api.get('/api/maintenance/stats'),              // Count of Total, Pending, etc.
        api.get('/api/maintenance/by-category'),        // Breakdown by HVAC, Plumbing, etc.
        api.get('/api/maintenance/status-distribution'),// Breakdown by Pending, Done, etc.
        api.get('/api/maintenance/recent')              // Last 5 requests
      ]);

      // Update State variables which will re-render the UI
      setStats(statsRes.data.data);

      // Format data for the charts
      setCategoryData(
        categoryRes.data.data
          .map(item => ({ name: item._id, value: item.count }))
          .sort((a, b) => b.value - a.value)
      );
      setStatusData(statusRes.data.data.map(item => ({ name: item._id, value: item.count })));
      setRecent(recentRes.data.data);
    } catch (err) {
      console.error('Failed to fetch dashboard data', err);
    } finally {
      setInitialLoading(false);
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen p-6">
      <h2 className="text-2xl font-bold mb-6">Overview of facility maintenance and operations</h2>

      {/* Stat Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {initialLoading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard title="Total Requests" value={stats.total} />
            <StatCard title="Pending" value={stats.pending} />
            <StatCard title="In Progress" value={stats.inProgress} />
            <StatCard title="Completed" value={stats.completed} />
          </>
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        {initialLoading ? (
          <>
            <ChartSkeleton />
            <ChartSkeleton />
          </>
        ) : (
          <>
            <BarChartComponent data={categoryData} />
            <PieChartComponent data={statusData} />
          </>
        )}
      </div>

      {/* Recent Activity */}
      {initialLoading ? (
        <TableSkeleton />
      ) : (
        <RecentActivityTable data={recent} />
      )}
    </div>
  );
}

export default DashboardPage;