import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function Layout({ isAdmin = false }) {
  return (
    <div className="min-h-screen bg-tavern-dark">
      <Sidebar isAdmin={isAdmin} />
      <main className="md:ml-56 pt-20 md:pt-8 px-4 md:px-8 pb-8 min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}