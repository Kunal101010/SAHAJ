import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../services/api';
import StatCard from '../components/StatCard';
import BarChartComponent from '../components/BarChartComponent';
import PieChartComponent from '../components/PieChartComponent';
import LineChartComponent from '../components/LineChartComponent';


function ReportsAnalyticsPage() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ total: 0, pending: 0, inProgress: 0, completed: 0 });
    const [categoryData, setCategoryData] = useState([]);
    const [statusData, setStatusData] = useState([]);
    const [trendData, setTrendData] = useState([]);

    useEffect(() => {
        fetchReportData();
    }, []);

    const fetchReportData = async () => {
        try {
            setLoading(true);
            const [statsRes, categoryRes, statusRes, trendRes] = await Promise.all([
                api.get('/api/maintenance/stats'),
                api.get('/api/maintenance/by-category'),
                api.get('/api/maintenance/status-distribution'),
                api.get('/api/maintenance/monthly-trend')
            ]);

            setStats(statsRes.data.data);

            setCategoryData(
                categoryRes.data.data
                    .map(item => ({ name: item._id, value: item.count }))
                    .sort((a, b) => b.value - a.value)
            );

            setStatusData(
                statusRes.data.data.map(item => ({ name: item._id, value: item.count }))
            );

            setTrendData(trendRes.data.data); // Passed directly to LineChartComponent which handles mapping

        } catch (err) {
            console.error('Failed to fetch report data', err);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = () => {
        window.print();
    };

    return (
        <div className="bg-gray-50 min-h-screen p-6 lg:p-8 print:p-0 print:bg-white print:m-0">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-between items-center mb-8 print:mb-4"
            >
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
                    <p className="text-gray-600 mt-1">Comprehensive view of system performance and metrics</p>
                </div>
                <button
                    onClick={handleExport}
                    className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 shadow-sm transition flex items-center gap-2 print:hidden"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Export Report
                </button>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 print:grid-cols-4 print:gap-4 print:mb-4"
            >
                <div className="print:break-inside-avoid print:shadow-none print:border print:border-gray-200 rounded-lg">
                    <StatCard title="Total Requests" value={stats.total} icon="📝" color="blue" />
                </div>
                <div className="print:break-inside-avoid print:shadow-none print:border print:border-gray-200 rounded-lg">
                    <StatCard title="Completed" value={stats.completed} icon="✅" color="green" />
                </div>
                <div className="print:break-inside-avoid print:shadow-none print:border print:border-gray-200 rounded-lg">
                    <StatCard title="Pending" value={stats.pending} icon="⏳" color="red" />
                </div>
                <div className="print:break-inside-avoid print:shadow-none print:border print:border-gray-200 rounded-lg">
                    <StatCard title="In Progress" value={stats.inProgress} icon="⚙️" color="yellow" />
                </div>
            </motion.div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8 print:grid-cols-2 print:gap-4 print:mb-4">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="print:break-inside-avoid print:shadow-none print:border print:border-gray-200 rounded-lg"
                >
                    <LineChartComponent data={trendData} />
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="print:break-inside-avoid print:shadow-none print:border print:border-gray-200 rounded-lg"
                >
                    <BarChartComponent data={categoryData} />
                </motion.div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mb-8 print:break-inside-avoid print:shadow-none print:border print:border-gray-200 rounded-lg"
            >
                <PieChartComponent data={statusData} />
            </motion.div>

        </div>
    );
}

export default ReportsAnalyticsPage;
