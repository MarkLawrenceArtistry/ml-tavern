import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

export default function NotificationBell() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const intervalRef = useRef(null);

  const fetchNotifs = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('notifications')
      .select('id, type, read, created_at, profiles!notifications_actor_id_fkey(ign)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);
      
    if (data) setNotifications(data);
  };

  useEffect(() => {
    if (!user) return;

    // Fetch immediately on mount
    fetchNotifs();

    // Poll every 15 seconds
    intervalRef.current = setInterval(fetchNotifs, 15000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [user]);

  const markAsRead = async (notifId) => {
    await supabase.from('notifications').update({ read: true }).eq('id', notifId);
    setNotifications((prev) =>
      prev.map((n) => (n.id === notifId ? { ...n, read: true } : n))
    );
  };

  const unreadCount = notifications.filter((n) => !n.read).length;
const boardRoutes = { pilot: '/pilots', buy_sell: '/market', esports: '/teams' };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="relative p-2 rounded-lg hover:bg-white/10 transition-colors"
      >
        <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-tavern-accent text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-12 w-80 bg-tavern-dark border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
            <div className="p-4 border-b border-white/10 font-bold text-white">
              Notifications
            </div>
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="p-4 text-sm text-white/40 text-center">No notifications yet</p>
              ) : (
                notifications.map((n) => {
                  const route = boardRoutes[n.board_type] || '/dashboard';
                  return (
                  <Link 
                    key={n.id} 
                    to={`${route}?post=${n.post_id}`}
                    onClick={() => !n.read && markAsRead(n.id)}
                    className={`block p-4 border-b border-white/5 cursor-pointer transition-colors hover:bg-white/5 ${
                      !n.read ? 'bg-white/5' : ''
                    }`}
                  >
                    <p className="text-sm text-white">
                      <span className="font-bold text-tavern-accent">{n.profiles?.ign || 'Someone'}</span>
                      {n.type === 'comment' ? ' commented on your post.' : ' upvoted your post.'}
                    </p>
                    <p className="text-xs text-white/30 mt-1">
                      {new Date(n.created_at).toLocaleDateString()}
                    </p>
                  </Link>
                  )
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}