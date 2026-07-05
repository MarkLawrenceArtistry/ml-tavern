import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Auth from './pages/Auth';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Admin from './pages/Admin';
import BracketMaker from './pages/BracketMaker';
import Board from './pages/Board';
import PublicProfile from './pages/PublicProfile'; // <-- The new import
import GamePredict from './pages/GamePredict';

function ProtectedRoutes() {
  const { user, isAdmin, loading } = useAuth();

  if (loading) return <div className="min-h-screen flex items-center justify-center text-white/50">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <Routes>
      <Route element={<Layout isAdmin={isAdmin} />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/pilots" element={<Board tableName="pilot_posts" boardType="pilot" title="Pilot Services" />} />
        <Route path="/market" element={<Board tableName="buy_sell_posts" boardType="buy_sell" title="Buy & Sell Market" />} />
        <Route path="/teams" element={<Board tableName="esports_posts" boardType="esports" title="Esports Team Finder" />} />
        <Route path="/bracket" element={<BracketMaker />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />
        
        {/* HERE IS THE NEW PUBLIC PROFILE ROUTE */}
        <Route path="/user/:id" element={<PublicProfile />} />
        <Route path="/predict" element={<GamePredict />} />
        
        {isAdmin && <Route path="/admin" element={<Admin />} />}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Auth />} />
        <Route path="/*" element={<ProtectedRoutes />} />
      </Routes>
    </AuthProvider>
  );
}