import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import Layout from './components/Layout';
import PrivateRoute from './components/PrivateRoute';
import MaintenanceRequestsPage from './pages/MaintenanceRequestsPage';
import FacilityBookingPage from './pages/FacilityBookingPage';
import SettingsPage from './pages/SettingsPage';
import AdminUsersPage from './pages/AdminUsersPage';
import AdminFacilitiesPage from './pages/AdminFacilitiesPage';
import ManagerDashboard from './pages/ManagerDashboard';
import ManagerMaintenancePage from './pages/ManagerMaintenancePage';
import ManagerBookingsPage from './pages/ManagerBookingsPage';
import TechnicianMaintenancePage from './pages/TechnicianMaintenancePage';
import TechnicianAssignmentsPage from './pages/TechnicianAssignmentsPage';

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
        className="min-h-screen"
      >
        <Routes location={location} key={location.pathname}>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

          {/* Protected routes with layout */}
          <Route element={<PrivateRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/maintenance-requests" element={<MaintenanceRequestsPage />} />
              <Route path="/facility-booking" element={<FacilityBookingPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/admin/users" element={<AdminUsersPage />} />
              <Route path="/admin/facilities" element={<AdminFacilitiesPage />} />
              <Route path="/admin/maintenance" element={<ManagerMaintenancePage />} />
              <Route path="/admin/technician-assignments" element={<TechnicianAssignmentsPage />} />
              <Route path="/manager/dashboard" element={<ManagerDashboard />} />
              <Route path="/manager/maintenance" element={<ManagerMaintenancePage />} />
              <Route path="/manager/bookings" element={<ManagerBookingsPage />} />
              <Route path="/manager/technician-assignments" element={<TechnicianAssignmentsPage />} />
              <Route path="/technician/maintenance" element={<TechnicianMaintenancePage />} />
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<LoginPage />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

function App() {
  return (
    <Router>
      <AnimatedRoutes />
    </Router>
  );
}

export default App;