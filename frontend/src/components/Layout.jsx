import { Outlet, Link } from 'react-router-dom';
import { getCurrentUser, logoutUser } from '../utils/auth';

function Layout() {
  const user = getCurrentUser();

  return (
    <>
      {user && (
        <nav className="">
          <div className="max-w-6xl mx-auto flex justify-between items-center">
            <Link to="/dashboard" className="text-2xl font-bold">
              Sahaj App
            </Link>
            <div className="flex items-center space-x-6">
              <span>
                Hello, <strong>{user.firstName || user.username}</strong> ({user.role})
              </span>
              <button
                onClick={logoutUser}
                className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition"
              >
                Logout
              </button>
            </div>
          </div>
        </nav>
      )}
      <Outlet /> {/* This renders the current page */}
    </>
  );
}

export default Layout;