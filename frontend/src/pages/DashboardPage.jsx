// src/pages/DashboardPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../utils/auth';
import api from '../services/api';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import StatCard from '../components/StatCard';
import BarChartComponent from '../components/BarChartComponent';
import PieChartComponent from '../components/PieChartComponent';
import RecentActivityTable from '../components/RecentActivityTable';

function DashboardPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(getCurrentUser());

  const [stats, setStats] = useState({ total: 0, pending: 0, inProgress: 0, completed: 0 });
  const [categoryData, setCategoryData] = useState([]);
  const [statusData, setStatusData] = useState([]);
  const [recent, setRecent] = useState([]);

  // Fetch data when component loads
  useEffect(() => {
    if (!user) {
      navigate('/login'); // Redirect if not logged in
      return;
    }
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
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
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen p-6">
      <h2 className="text-2xl font-bold mb-6">Overview of facility maintenance and operations</h2>

      {/* Stat Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Requests" value={stats.total} />
        <StatCard title="Pending" value={stats.pending} />
        <StatCard title="In Progress" value={stats.inProgress} />
        <StatCard title="Completed" value={stats.completed} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <BarChartComponent data={categoryData} />
        <PieChartComponent data={statusData} />
      </div>

      <RecentActivityTable data={recent} />
    </div>
  );
}

export default DashboardPage;