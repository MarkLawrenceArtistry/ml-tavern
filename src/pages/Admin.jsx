// ============================================================
// FILE: src/pages/Admin.jsx
// ============================================================
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

function KPICard({ label, value, sub, accent = false }) {
  return (
    <div className={`p-5 rounded-xl border ${accent ? 'bg-tavern-accent/10 border-tavern-accent/20' : 'bg-white/[0.03] border-white/[0.06]'}`}>
      <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">{label}</p>
      <p className={`text-3xl font-black tabular-nums ${accent ? 'text-tavern-accent' : 'text-white'}`}>{value}</p>
      {sub && <p className="text-xs text-white/30 mt-1">{sub}</p>}
    </div>
  );
}

function MiniBar({ label, value, max, color }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-white/50 w-24 shrink-0 truncate">{label}</span>
      <div className="flex-1 h-5 bg-white/5 rounded-md overflow-hidden">
        <div className="h-full rounded-md transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs font-bold text-white/70 tabular-nums w-10 text-right">{value}</span>
    </div>
  );
}

export default function Admin() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // KPI data
  const [kpis, setKpis] = useState({
    totalUsers: 0,
    newUsersToday: 0,
    newUsersWeek: 0,
    totalPosts: 0,
    pilotPosts: 0,
    marketPosts: 0,
    teamPosts: 0,
    totalUpvotes: 0,
    totalBookmarks: 0,
    totalComments: 0,
    pendingReports: 0,
    featuredPosts: 0,
  });

  // Lists
  const [recentUsers, setRecentUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [loadingAction, setLoadingAction] = useState(null);

  const fetchKPIs = async () => {
    setLoading(true);
    try {
      const [
        usersRes, usersTodayRes, usersWeekRes,
        pilotRes, marketRes, teamRes,
        upvotesRes, bookmarksRes, commentsRes,
        reportsRes, featuredRes,
        recentUsersRes,
      ] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', new Date(Date.now() - 86400000).toISOString()),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', new Date(Date.now() - 604800000).toISOString()),
        supabase.from('pilot_posts').select('id', { count: 'exact', head: true }),
        supabase.from('buy_sell_posts').select('id', { count: 'exact', head: true }),
        supabase.from('esports_posts').select('id', { count: 'exact', head: true }),
        supabase.from('upvotes').select('id', { count: 'exact', head: true }),
        supabase.from('bookmarks').select('id', { count: 'exact', head: true }),
        supabase.from('comments').select('id', { count: 'exact', head: true }),
        supabase.from('reports').select('id, reason, created_at, reporter:profiles!reports_reporter_id_fkey(ign), target_type, board_type, target_id').order('created_at', { ascending: false }).limit(20),
        supabase.from('pilot_posts').select('id', { count: 'exact', head: true }).eq('pinned', true),
        supabase.from('profiles').select('ign, id, created_at').order('created_at', { ascending: false }).limit(8),
      ]);

      const c = (r) => r.count || 0;
      setKpis({
        totalUsers: c(usersRes),
        newUsersToday: c(usersTodayRes),
        newUsersWeek: c(usersWeekRes),
        totalPosts: c(pilotRes) + c(marketRes) + c(teamRes),
        pilotPosts: c(pilotRes),
        marketPosts: c(marketRes),
        teamPosts: c(teamRes),
        totalUpvotes: c(upvotesRes),
        totalBookmarks: c(bookmarksRes),
        totalComments: c(commentsRes),
        pendingReports: reportsRes.data?.length || 0,
        featuredPosts: c(featuredRes),
      });

      setReports(reportsRes.data || []);
      setRecentUsers(recentUsersRes.data || []);
    } catch (err) {
      console.error('Admin KPI fetch error:', err);
    }
    setLoading(false);
  };

  useEffect(() => { fetchKPIs(); }, []);

  const handleDismissReport = async (reportId) => {
    setLoadingAction(reportId);
    await supabase.from('reports').delete().eq('id', reportId);
    setReports(prev => prev.filter(r => r.id !== reportId));
    setKpis(prev => ({ ...prev, pendingReports: Math.max(0, prev.pendingReports - 1) }));
    setLoadingAction(null);
  };

  const TABS = [
    { key: 'overview', label: 'Overview' },
    { key: 'reports', label: `Reports${kpis.pendingReports > 0 ? ` (${kpis.pendingReports})` : ''}` },
    { key: 'users', label: 'Users' },
  ];

  const maxPosts = Math.max(kpis.pilotPosts, kpis.marketPosts, kpis.teamPosts, 1);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto flex items-center justify-center h-64">
        <div className="inline-block w-6 h-6 border-2 border-tavern-accent border-t-transparent rounded-full animate-spin mr-3" />
        <span className="text-white/40 text-sm">Loading admin panel...</span>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-white mb-1">Admin Panel</h1>
        <p className="text-white/40 text-sm">Manage your community.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-8 border-b border-white/5">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-4 py-3 text-sm font-bold transition-colors relative -mb-px ${
              activeTab === t.key
                ? 'text-tavern-accent'
                : 'text-white/30 hover:text-white/60'
            }`}
          >
            {t.label}
            {activeTab === t.key && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-tavern-accent rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* ===== OVERVIEW ===== */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* KPI Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KPICard label="Total Users" value={kpis.totalUsers} sub={`+${kpis.newUsersToday} today, +${kpis.newUsersWeek} this week`} accent />
            <KPICard label="Total Posts" value={kpis.totalPosts} sub={`${kpis.featuredPosts} featured`} />
            <KPICard label="Engagement" value={kpis.totalUpvotes + kpis.totalComments} sub={`${kpis.totalUpvotes} upvotes, ${kpis.totalComments} comments`} />
            <KPICard label="Pending Reports" value={kpis.pendingReports} sub={kpis.pendingReports > 0 ? 'Needs attention' : 'All clear'} accent={kpis.pendingReports > 0} />
          </div>

          {/* Secondary KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KPICard label="Pilot Posts" value={kpis.pilotPosts} />
            <KPICard label="Market Posts" value={kpis.marketPosts} />
            <KPICard label="Team Posts" value={kpis.teamPosts} />
            <KPICard label="Bookmarks" value={kpis.totalBookmarks} />
          </div>

          {/* Posts by Category */}
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-6">
            <h3 className="text-sm font-bold text-white/50 uppercase tracking-wider mb-5">Posts by Category</h3>
            <div className="space-y-3">
              <MiniBar label="Pilot Service" value={kpis.pilotPosts} max={maxPosts} color="#3b82f6" />
              <MiniBar label="Buy & Sell" value={kpis.marketPosts} max={maxPosts} color="#10b981" />
              <MiniBar label="LF Team" value={kpis.teamPosts} max={maxPosts} color="#f59e0b" />
            </div>
          </div>

          {/* Recent Users */}
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-6">
            <h3 className="text-sm font-bold text-white/50 uppercase tracking-wider mb-4">Recent Users</h3>
            <div className="space-y-2">
              {recentUsers.length === 0 ? (
                <p className="text-white/20 text-sm">No users yet.</p>
              ) : (
                recentUsers.map(u => (
                  <div key={u.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-xs font-bold text-white/30">
                        {(u.ign || '?').substring(0, 2).toUpperCase()}
                      </div>
                      <span className="text-sm text-white/70 font-medium">{u.ign || 'Unknown'}</span>
                    </div>
                    <span className="text-xs text-white/20">
                      {new Date(u.created_at).toLocaleDateString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===== REPORTS ===== */}
      {activeTab === 'reports' && (
        <div className="space-y-3">
          {reports.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-white/20 text-lg font-bold mb-1">No reports</p>
              <p className="text-white/15 text-sm">Everything looks good.</p>
            </div>
          ) : (
            reports.map(r => (
              <div key={r.id} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5 flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-xs font-bold text-white/30 uppercase">{r.target_type}</span>
                    <span className="text-white/10">·</span>
                    <span className="text-xs text-white/30">{r.board_type}</span>
                    <span className="text-white/10">·</span>
                    <span className="text-xs text-white/20">ID: {r.target_id}</span>
                  </div>
                  <p className="text-sm text-white/70 mb-1">&quot;{r.reason}&quot;</p>
                  <p className="text-xs text-white/25">
                    Reported by <span className="text-white/40">{r.reporter?.ign || 'Unknown'}</span> · {new Date(r.created_at).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => handleDismissReport(r.id)}
                  disabled={loadingAction === r.id}
                  className="shrink-0 px-3 py-1.5 text-xs font-bold rounded-lg bg-white/5 border border-white/10 text-white/40 hover:bg-white/10 hover:text-white transition-colors disabled:opacity-40"
                >
                  {loadingAction === r.id ? '...' : 'Dismiss'}
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* ===== USERS ===== */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-6">
            <h3 className="text-sm font-bold text-white/50 uppercase tracking-wider mb-4">User Growth</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-black text-white">{kpis.totalUsers}</p>
                <p className="text-xs text-white/30 mt-1">Total</p>
              </div>
              <div>
                <p className="text-2xl font-black text-green-400">+{kpis.newUsersToday}</p>
                <p className="text-xs text-white/30 mt-1">Today</p>
              </div>
              <div>
                <p className="text-2xl font-black text-blue-400">+{kpis.newUsersWeek}</p>
                <p className="text-xs text-white/30 mt-1">This Week</p>
              </div>
            </div>
          </div>

          <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-6">
            <h3 className="text-sm font-bold text-white/50 uppercase tracking-wider mb-4">All Recent Users</h3>
            <div className="space-y-2">
              {recentUsers.map(u => (
                <div key={u.id} className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center text-xs font-bold text-white/30">
                      {(u.ign || '?').substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm text-white/80 font-medium">{u.ign || 'Unknown'}</p>
                      <p className="text-[10px] text-white/20 font-mono">{u.id.substring(0, 12)}...</p>
                    </div>
                  </div>
                  <span className="text-xs text-white/25 shrink-0">
                    {new Date(u.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}