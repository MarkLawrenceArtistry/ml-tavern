import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const TABS = ['Analytics', 'Users', 'Error Finder', 'Moderation', 'Logs'];

export default function Admin() {
  const [activeTab, setActiveTab] = useState('Analytics');
  const [analytics, setAnalytics] = useState(null);
  const [errors, setErrors] = useState([]);
  const [reports, setReports] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    
    // Run all fetches in parallel
    const [analyticsRes, usersRes, errorsRes, reportsRes, logsRes] = await Promise.all([
        supabase.from('site_analytics').select('*').single(),
        supabase.from('profiles').select('*, user_roles!user_roles_user_id_fkey(role)').order('created_at', { ascending: false }),
        supabase.from('error_logs').select('*').order('created_at', { ascending: false }).limit(50),
        supabase.from('reports').select('*, reporter:profiles!reports_reporter_id_fkey(ign)').order('created_at', { ascending: false }).limit(50),
        supabase.from('admin_logs').select('*').order('created_at', { ascending: false }).limit(50),
    ]);

    if (analyticsRes.data) setAnalytics(analyticsRes.data);
    if (errorsRes.data) setErrors(errorsRes.data);
    if (reportsRes.data) setReports(reportsRes.data);
    if (logsRes.data) setLogs(logsRes.data);
    if (usersRes.data) setUsers(usersRes.data);
    
    setLoading(false);
  };

  const handleUpdateReportStatus = async (reportId, newStatus) => {
    await supabase.from('reports').update({ status: newStatus }).eq('id', reportId);
    setReports(reports.map(r => r.id === reportId ? { ...r, status: newStatus } : r));
  };

  const statusColor = (status) => {
    switch(status) {
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'reviewed': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'actioned': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'dismissed': return 'bg-white/10 text-white/40 border-white/10';
      default: return '';
    }
  };

  if (loading) return <div className="text-center py-20 text-white/50">Loading Admin Dashboard...</div>;

    const handleDeleteReportedPost = async (report) => {
    if (!window.confirm('Permanently delete this post?')) return;
    
    const { error } = await supabase
      .from(`${report.board_type}_posts`) // e.g., pilot_posts
      .delete()
      .eq('id', report.target_id);
      
    if (error) {
      alert('Failed to delete post.');
    } else {
      handleUpdateReportStatus(report.id, 'actioned');
      alert('Post deleted successfully.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-extrabold text-white mb-8">Admin Dashboard</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 border-b border-white/10 pb-4">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 rounded-t-lg font-bold text-sm transition-colors ${
              activeTab === tab 
                ? 'bg-tavern-accent text-white' 
                : 'text-white/50 hover:text-white hover:bg-white/5'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Analytics Tab */}
      {activeTab === 'Analytics' && analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard title="Total Users" value={analytics.total_users} />
          <StatCard title="Total Posts" value={analytics.total_pilot_posts + analytics.total_buy_sell_posts + analytics.total_esports_posts} />
          <StatCard title="Total Comments" value={analytics.total_comments} />
          <StatCard title="Total Upvotes" value={analytics.total_upvotes} />
          <StatCard title="New Users (7d)" value={analytics.new_users_this_week} highlight />
          <StatCard 
            title="Pending Reports" 
            value={analytics.pending_reports} 
            highlight={analytics.pending_reports > 0} 
            danger 
          />
          <StatCard 
            title="Errors (24h)" 
            value={analytics.errors_last_24h} 
            highlight={analytics.errors_last_24h > 0} 
            danger 
          />
        </div>
      )}

      {/* Error Finder Tab */}
      {activeTab === 'Error Finder' && (
        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/5 text-white/50 uppercase text-xs tracking-wider">
              <tr>
                <th className="px-6 py-4">Time</th>
                <th className="px-6 py-4">Message</th>
                <th className="px-6 py-4">URL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {errors.length === 0 ? (
                <tr><td colSpan="3" className="px-6 py-10 text-center text-white/30">No errors caught!</td></tr>
              ) : (
                errors.map(err => (
                  <tr key={err.id} className="hover:bg-white/5">
                    <td className="px-6 py-4 text-white/40 whitespace-nowrap">{new Date(err.created_at).toLocaleString()}</td>
                    <td className="px-6 py-4 text-red-400 font-mono text-xs">{err.error_message}</td>
                    <td className="px-6 py-4 text-white/50 truncate max-w-xs">{err.url || 'N/A'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Moderation Tab */}
      {activeTab === 'Moderation' && (
        <div className="space-y-4">
          {reports.length === 0 ? (
            <div className="text-center py-10 text-white/30">No reports submitted yet.</div>
          ) : (
            reports.map(report => (
              <div key={report.id} className="bg-white/5 border border-white/10 rounded-xl p-5 flex flex-col md:flex-row justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xs font-bold text-white/40 uppercase">Target:</span>
                    <span className="text-white font-semibold">{report.target_type}</span>
                    <span className="text-xs text-white/20">({report.target_id})</span>
                  </div>
                  <p className="text-sm text-white/60 mb-2">
                    <span className="text-tavern-accent font-bold">{report.reporter?.ign || 'Unknown'}</span> reported: "{report.reason || 'No reason provided'}"
                  </p>
                  <p className="text-xs text-white/30">{new Date(report.created_at).toLocaleString()}</p>
                </div>
                
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${statusColor(report.status)}`}>
                    {report.status}
                  </span>
                  
                    {report.status === 'pending' && (
                    <div className="flex gap-2 ml-2">
                      <button onClick={() => handleUpdateReportStatus(report.id, 'dismissed')} className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded text-xs font-bold text-white transition-colors">Acknowledge</button>
                      <button onClick={() => handleDeleteReportedPost(report)} className="px-3 py-1.5 bg-red-600 hover:bg-red-700 rounded text-xs font-bold text-white transition-colors">Delete Post</button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Logs Tab */}
      {activeTab === 'Logs' && (
        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/5 text-white/50 uppercase text-xs tracking-wider">
              <tr>
                <th className="px-6 py-4">Time</th>
                <th className="px-6 py-4">Action</th>
                <th className="px-6 py-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {logs.length === 0 ? (
                <tr><td colSpan="3" className="px-6 py-10 text-center text-white/30">No admin actions logged yet.</td></tr>
              ) : (
                logs.map(log => (
                  <tr key={log.id} className="hover:bg-white/5">
                    <td className="px-6 py-4 text-white/40 whitespace-nowrap">{new Date(log.created_at).toLocaleString()}</td>
                    <td className="px-6 py-4 text-white font-mono text-xs">{log.action}</td>
                    <td className="px-6 py-4 text-white/50 text-xs truncate max-w-md">
                      {log.details ? JSON.stringify(log.details) : 'N/A'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'Users' && (
        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/5 text-white/50 uppercase text-xs tracking-wider">
              <tr>
                <th className="px-6 py-4">User ID</th>
                <th className="px-6 py-4">IGN</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {users.length === 0 ? (
                <tr><td colSpan="4" className="px-6 py-10 text-center text-white/30">No users found.</td></tr>
              ) : (
                users.map(u => (
                  <tr key={u.id} className="hover:bg-white/5">
                    <td className="px-6 py-4 text-white/40 font-mono text-xs">{u.id.substring(0, 12)}...</td>
                    <td className="px-6 py-4 text-white font-semibold">{u.ign || 'Not set'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${u.user_roles?.role === 'admin' ? 'bg-tavern-accent/20 text-tavern-accent' : 'bg-white/10 text-white/50'}`}>
                        {u.user_roles?.role || 'user'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-white/40">{new Date(u.created_at).toLocaleDateString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// Reusable Stat Card Component
function StatCard({ title, value, highlight = false, danger = false }) {
  return (
    <div className={`p-6 rounded-xl border transition-colors ${
      danger 
        ? 'bg-red-500/10 border-red-500/20' 
        : highlight 
          ? 'bg-tavern-accent/10 border-tavern-accent/20' 
          : 'bg-white/5 border-white/10'
    }`}>
      <p className="text-sm text-white/50 mb-1">{title}</p>
      <p className={`text-3xl font-extrabold ${danger ? 'text-red-400' : highlight ? 'text-tavern-accent' : 'text-white'}`}>
        {value}
      </p>
    </div>
  );
}