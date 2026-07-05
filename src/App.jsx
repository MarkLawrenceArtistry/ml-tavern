// ============================================================
// FILE: src/App.jsx
// ============================================================
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Auth from './pages/Auth';
import Home from './pages/Home';
import Feed from './pages/Feed';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Admin from './pages/Admin';
import BracketMaker from './pages/BracketMaker';
import Bookmarks from './pages/Bookmarks';
import Featured from './pages/Featured';
import PublicProfile from './pages/PublicProfile';
import GamePredict from './pages/GamePredict';

function ProtectedRoutes() {
  const { user, isAdmin, loading } = useAuth();

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center text-white/50">
      <div className="inline-block w-6 h-6 border-2 border-tavern-accent border-t-transparent rounded-full animate-spin mr-3" />
      Loading...
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;

  return (
    <Routes>
      <Route element={<Layout isAdmin={isAdmin} />}>
        <Route path="/feed" element={<Feed />} />
        <Route path="/pilots" element={<Feed tagFilter="Pilot Service" title="Pilot Services" />} />
        <Route path="/market" element={<Feed tagFilter="Buy and Sell" title="Buy & Sell Market" />} />
        <Route path="/teams" element={<Feed tagFilter="LF Team" title="Esports Team Finder" />} />
        <Route path="/bookmarks" element={<Bookmarks />} />
        <Route path="/featured" element={<Featured />} />
        <Route path="/bracket" element={<BracketMaker />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/user/:id" element={<PublicProfile />} />
        <Route path="/predict" element={<GamePredict />} />
        {isAdmin && <Route path="/admin" element={<Admin />} />}
        <Route path="/dashboard" element={<Navigate to="/feed" replace />} />
        <Route path="*" element={<Navigate to="/feed" replace />} />
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