// src/components/Sidebar.jsx
import { Link } from 'react-router-dom';
import { getCurrentUser } from '../utils/auth';

function Sidebar() {
  const user = getCurrentUser();

  const isAdmin = user?.role === 'admin';
  const isManager = user?.role === 'manager';

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', roles: ['employee', 'technician', 'manager', 'admin'] },
    { name: 'Maintenance Requests', path: '/maintenance-requests', roles: ['employee', 'manager', 'admin'] },
    { name: 'Technician Tasks', path: '/technician-tasks', roles: ['technician', 'manager', 'admin'] },
    { name: 'Facility Booking', path: '/facility-booking', roles: ['employee', 'manager', 'admin'] },
    { name: 'Reports & Analytics', path: '/reports-analytics', roles: ['manager', 'admin'] },
    { name: 'Notifications', path: '/notifications', roles: ['employee', 'technician', 'manager', 'admin'] },
    { name: 'Settings', path: '/settings', roles: ['employee', 'technician', 'manager', 'admin'] },
  ];

  // Admin-only items
  const adminItems = [
    { name: 'User Management', path: '/admin/users' },
    { name: 'Facility Management', path: '/admin/facilities' },
    { name: 'Requests Management', path: '/admin/maintenance' },
  ];

  // Manager-only items
  const managerItems = [
    { name: 'Manager Dashboard', path: '/manager/dashboard' },
    { name: 'Requests Management', path: '/manager/maintenance' },
    { name: 'Bookings Overview', path: '/manager/bookings' },
  ];

  const filteredMenu = menuItems.filter(item => 
    item.roles.includes(user?.role || '')
  );

  return (
    <div className="bg-gray-50 w-64 h-screen fixed top-0 left-0 flex flex-col border-r border-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-800">SAHAJ/FMS</h1>
        <p className="text-sm text-gray-600">Facility Management System</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto">
        {filteredMenu.map((item) => (
          <Link
            key={item.name}
            to={item.path}
            className="block py-3 px-4 mb-1 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition font-medium"
          >
            {item.name}
          </Link>
        ))}

        {/* Admin Section */}
        {isAdmin && (
          <>
            <div className="my-6 border-t border-gray-300 pt-6">
              
            </div>
            {adminItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className="block py-3 px-4 mb-1 text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-lg transition font-medium"
              >
                {item.name}
              </Link>
            ))}
          </>
        )}

        {/* Manager Section */}
        {isManager && (
          <>
            <div className="my-6 border-t border-gray-300 pt-6">
              
            </div>
            {managerItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className="block py-3 px-4 mb-1 text-gray-700 hover:bg-orange-50 hover:text-orange-600 rounded-lg transition font-medium"
              >
                {item.name}
              </Link>
            ))}
          </>
        )}
      </nav>

      {/* User Info at Bottom */}
      {user && (
        <div className="p-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">Logged in as:</p>
          <p className="font-bold text-gray-800">{user.username}</p>
          <p className="text-xs text-gray-500 capitalize">{user.role}</p>
        </div>
      )}
    </div>
  );
}

export default Sidebar;