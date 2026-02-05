import { Outlet } from 'react-router-dom';
import { getCurrentUser } from '../utils/auth';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

function Layout() {
  const user = getCurrentUser();

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 ml-64 print:ml-0">
        <TopBar user={user} />
        <main className="pt-16 print:pt-0">
          <Outlet /> {/* This renders the current page */}
        </main>
      </div>
    </div>
  );
}

export default Layout;