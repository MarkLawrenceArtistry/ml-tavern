import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Auth from './pages/Auth';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Board from './pages/Board';
import BracketMaker from './pages/BracketMaker';
import Admin from './pages/Admin';

const Placeholder = ({ title }) => (
  <div className="flex items-center justify-center h-[60vh]">
    <h1 className="text-4xl font-bold text-white/20">{title}</h1>
  </div>
);

function ProtectedRoutes() {
  const { user, isAdmin, loading } = useAuth();

  if (loading) return <div className="min-h-screen flex items-center justify-center text-white">Loading...</div>;
  
  if (!user) return <Navigate to="/login" replace />;

  return (
    <Routes>
      <Route element={<Layout isAdmin={isAdmin} />}>
        <Route path="/" element={<Placeholder title="Home" />} />
        <Route path="/pilots" element={<Board tableName="pilot_posts" boardType="pilot" title="Pilot Services" />} />
        <Route path="/market" element={<Board tableName="buy_sell_posts" boardType="buy_sell" title="Buy & Sell Market" />} />
        <Route path="/teams" element={<Board tableName="esports_posts" boardType="esports" title="Esports Team Finder" />} />
        <Route path="/bracket" element={<BracketMaker />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />
        {isAdmin && <Route path="/admin" element={<Admin />} />}
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Auth />} />
        <Route path="/*" element={<ProtectedRoutes />} />
      </Routes>
    </AuthProvider>
  );
}