import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user, isAdmin } = useAuth();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      const { data } = await supabase.from('site_analytics').select('*').single();
      if (data) setStats(data);
    };
    fetchStats();
  }, []);

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-white">Dashboard</h1>
        <p className="text-white/40 mt-1">Welcome back to ML Tavern</p>
      </div>

      {stats ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <KPICard title="Total Users" value={stats.total_users} />
          <KPICard title="Forum Posts" value={stats.total_pilot_posts + stats.total_buy_sell_posts + stats.total_esports_posts} />
          <KPICard title="Total Comments" value={stats.total_comments} />
          <KPICard title="Total Upvotes" value={stats.total_upvotes} />
          {isAdmin && <KPICard title="Pending Reports" value={stats.pending_reports} danger />}
        </div>
      ) : (
        <div className="h-24 bg-white/5 border border-white/10 rounded-xl animate-pulse mb-10" />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <QuickLink to="/pilots" title="Pilot Services" desc="Find or advertise piloting services." />
        <QuickLink to="/market" title="Buy & Sell" desc="Trade accounts and merch." />
        <QuickLink to="/teams" title="Team Finder" desc="LFG for ranked or tournaments." />
        <QuickLink to="/bracket" title="Bracket Maker" desc="Create local tournament brackets." />
      </div>
    </div>
  );
}

function KPICard({ title, value, danger }) {
  return (
    <div className={`p-5 rounded-xl border ${danger ? 'bg-red-500/10 border-red-500/20' : 'bg-white/5 border-white/10'}`}>
      <p className="text-xs font-semibold text-white/40 uppercase tracking-wider">{title}</p>
      <p className={`text-2xl font-extrabold mt-1 ${danger ? 'text-red-400' : 'text-white'}`}>{value}</p>
    </div>
  );
}

function QuickLink({ to, title, desc }) {
  return (
    <Link to={to} className="block p-5 rounded-xl border border-white/10 bg-white/5 hover:border-tavern-accent/50 transition-all group">
      <h3 className="font-bold text-white group-hover:text-tavern-accent transition-colors">{title}</h3>
      <p className="text-sm text-white/40 mt-1">{desc}</p>
    </Link>
  );
}