import { UserIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { logoutUser } from '../utils/auth';
import NotificationBell from './NotificationBell';

function TopBar({ user }) {
  const navigate = useNavigate();

  const goToSettings = () => {
    navigate('/settings');
  };

  return (
    <div className="bg-white h-16 fixed top-0 right-0 left-64 z-10 flex items-center justify-end px-8 shadow-sm print:hidden">
      <div className="flex items-center space-x-6">
        {/* Notification Bell */}
        <NotificationBell />

        {/* User Section - Clickable to Settings */}
        <button
          onClick={goToSettings}
          className="flex items-center space-x-3 hover:bg-gray-100 rounded-lg px-3 py-2 transition"
        >
          {/* User Icon */}
          <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
            <UserIcon className="h-6 w-6 text-blue-600" />
          </div>

          {/* Highlighted Username */}
          <span className="text-lg font-bold text-gray-800">
            {user?.username || 'User'}
          </span>
        </button>

        {/* Logout Button */}
        <button
          onClick={logoutUser}
          className="text-blue-600 hover:text-blue-800 font-medium transition underline-offset-2 hover:underline"
        >
          Logout
        </button>
      </div>
    </div>
  );
}

export default TopBar;