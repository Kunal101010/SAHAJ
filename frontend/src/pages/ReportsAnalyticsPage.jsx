import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../services/api';
import StatCard from '../components/StatCard';
import BarChartComponent from '../components/BarChartComponent';
import PieChartComponent from '../components/PieChartComponent';
import LineChartComponent from '../components/LineChartComponent';


function ReportsAnalyticsPage() {
    const [loading, setLoading] = useState(true);
    // Maintenance Stats
    const [stats, setStats] = useState({ total: 0, pending: 0, inProgress: 0, completed: 0 });
    const [categoryData, setCategoryData] = useState([]);
    const [statusData, setStatusData] = useState([]);
    const [trendData, setTrendData] = useState([]);

    // Booking Stats
    const [bookingStats, setBookingStats] = useState({ total: 0 });
    const [bookingByFacility, setBookingByFacility] = useState([]);
    const [bookingTrend, setBookingTrend] = useState([]);
    const [bookingStatusData, setBookingStatusData] = useState([]);

    useEffect(() => {
        fetchReportData();
    }, []);

    const fetchReportData = async () => {
        try {
            setLoading(true);
            const [
                statsRes,
                categoryRes,
                statusRes,
                trendRes,
                bookingRes
            ] = await Promise.all([
                api.get('/api/maintenance/stats'),
                api.get('/api/maintenance/by-category'),
                api.get('/api/maintenance/status-distribution'),
                api.get('/api/maintenance/monthly-trend'),
                api.get('/api/bookings/stats')
            ]);

            // Maintenance Data
            setStats(statsRes.data.data);

            setCategoryData(
                categoryRes.data.data
                    .map(item => ({ name: item._id, value: item.count }))
                    .sort((a, b) => b.value - a.value)
            );

            setStatusData(
                statusRes.data.data.map(item => ({ name: item._id, value: item.count }))
            );

            setTrendData(trendRes.data.data);

            // Booking Data
            if (bookingRes.data && bookingRes.data.data) {
                const bData = bookingRes.data.data;
                setBookingStats({ total: bData.total });
                setBookingByFacility(bData.byFacility); // Already formatted {name, value}
                setBookingTrend(bData.trend); // Already formatted {name, bookings}
                setBookingStatusData(bData.byStatus); // Already formatted {name, value}
            }

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

            {/* --- Maintenance Section --- */}
            <div className="mb-12 print:break-inside-avoid">
                <h2 className="text-xl font-bold text-gray-800 mb-6 border-b pb-2">Maintenance Overview</h2>

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

                {/* Maintenance Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8 print:grid-cols-2 print:gap-4 print:mb-4">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="print:break-inside-avoid print:shadow-none print:border print:border-gray-200 rounded-lg"
                    >
                        <LineChartComponent data={trendData} title="Maintenance Request Trends" lineName="Requests" />
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
                    <PieChartComponent data={statusData} title="Maintenance Status" />
                </motion.div>
            </div>

            {/* --- Booking Section --- */}
            <div className="print:break-inside-avoid">
                <h2 className="text-xl font-bold text-gray-800 mb-6 border-b pb-2">Facility Booking Overview</h2>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 print:grid-cols-4 print:gap-4 print:mb-4"
                >
                    <div className="print:break-inside-avoid print:shadow-none print:border print:border-gray-200 rounded-lg">
                        <StatCard title="Total Bookings" value={bookingStats.total} icon="📅" color="purple" />
                    </div>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8 print:grid-cols-2 print:gap-4 print:mb-4">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.6 }}
                        className="print:break-inside-avoid print:shadow-none print:border print:border-gray-200 rounded-lg"
                    >
                        <LineChartComponent data={bookingTrend} title="Booking Trends (Monthly)" lineName="Bookings" />
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.7 }}
                        className="print:break-inside-avoid print:shadow-none print:border print:border-gray-200 rounded-lg"
                    >
                        <BarChartComponent data={bookingByFacility} title="Bookings by Facility" />
                    </motion.div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 }}
                        className="print:break-inside-avoid print:shadow-none print:border print:border-gray-200 rounded-lg"
                    >
                        <PieChartComponent data={bookingStatusData} title="Booking Status" />
                    </motion.div>
                </div>
            </div>

        </div>
    );
}

export default ReportsAnalyticsPage;
