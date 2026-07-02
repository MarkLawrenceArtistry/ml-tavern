import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function Layout({ isAdmin = false }) {
  return (
    <div className="min-h-screen bg-tavern-dark">
      <Sidebar isAdmin={isAdmin} />
      
      {/* Main Content Area */}
      <main className="md:ml-64 pt-20 md:pt-8 p-6 min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}