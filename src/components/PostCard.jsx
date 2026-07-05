// ============================================================
// FILE: src/components/PostCard.jsx
// ============================================================
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

// Color configs for each tag
const TAG_CONFIG = {
  'Pilot Service': {
    color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    route: '/pilots',
  },
  'Buy and Sell': {
    color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    route: '/market',
  },
  'LF Team': {
    color: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    route: '/teams',
  },
};

function timeAgo(dateString) {
  const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 2592000) return `${Math.floor(seconds / 86400)}d ago`;
  return new Date(dateString).toLocaleDateString();
}

export default function PostCard({ post, onBookmarkChange, onUpvoteChange, onPinChange }) {
  const { user, isAdmin } = useAuth();
  const [showReport, setShowReport] = useState(false);
  const [reporting, setReporting] = useState(false);

  const tc = TAG_CONFIG[post.tag] || TAG_CONFIG['Pilot Service'];
  const postLink = `${tc.route}?post=${post.id}`;

  // ---------- UPVOTE ----------
  const handleUpvote = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user || user.id === post.user_id) return;

    if (post.has_upvoted) {
      await supabase
        .from('upvotes')
        .delete()
        .eq('user_id', user.id)
        .eq('target_id', post.id)
        .eq('target_type', 'post')
        .eq('board_type', post.board_type);
      onUpvoteChange?.(post.id, -1, false);
    } else {
      await supabase.from('upvotes').insert({
        user_id: user.id,
        target_id: post.id,
        target_type: 'post',
        board_type: post.board_type,
      });
      onUpvoteChange?.(post.id, 1, true);
    }
  };

  // ---------- BOOKMARK ----------
  const handleBookmark = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return;

    if (post.has_bookmarked) {
      await supabase
        .from('bookmarks')
        .delete()
        .eq('user_id', user.id)
        .eq('post_id', post.id)
        .eq('board_type', post.board_type);
      onBookmarkChange?.(post.id, false);
    } else {
      await supabase.from('bookmarks').insert({
        user_id: user.id,
        post_id: post.id,
        board_type: post.board_type,
      });
      onBookmarkChange?.(post.id, true);
    }
  };

  // ---------- PIN (admin only) ----------
  const handlePin = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAdmin) return;

    const tableMap = {
      pilot: 'pilot_posts',
      buy_sell: 'buy_sell_posts',
      esports: 'esports_posts',
    };
    const newVal = !post.pinned;
    await supabase
      .from(tableMap[post.board_type])
      .update({ pinned: newVal })
      .eq('id', post.id);
    onPinChange?.(post.id, newVal);
  };

  // ---------- REPORT ----------
  const handleReport = async (reason) => {
    if (!user || user.id === post.user_id) return;
    setReporting(true);
    try {
      await supabase.from('reports').insert({
        reporter_id: user.id,
        target_type: 'post',
        board_type: post.board_type,
        target_id: post.id,
        reason,
      });
    } catch (err) {
      // silent
    }
    setReporting(false);
    setShowReport(false);
    alert('Report submitted.');
  };

  return (
    <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4 sm:p-5 hover:bg-white/[0.05] transition-colors group relative">
      {/* Top row: tag badge + pinned badge + admin pin button */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${tc.color}`}>
          {post.tag}
        </span>
        {post.pinned && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded border bg-tavern-accent/20 text-tavern-accent border-tavern-accent/30">
            PINNED
          </span>
        )}
        <div className="flex-1 min-w-0" />
        {isAdmin && (
          <button
            onClick={handlePin}
            className="text-[10px] font-bold px-2 py-0.5 rounded border border-white/10 text-white/30 hover:text-tavern-accent hover:border-tavern-accent/30 transition-colors opacity-0 group-hover:opacity-100"
          >
            {post.pinned ? 'UNPIN' : 'PIN'}
          </button>
        )}
      </div>

      {/* Author + time */}
      <div className="flex items-center gap-2 mb-2">
        <Link
          to={`/user/${post.user_id}`}
          onClick={(e) => e.stopPropagation()}
          className="text-sm font-bold text-tavern-accent hover:underline truncate"
        >
          {post.profiles?.ign || 'Unknown'}
        </Link>
        <span className="text-white/20 shrink-0">·</span>
        <span className="text-xs text-white/30 shrink-0">
          {timeAgo(post.created_at)}
        </span>
      </div>

      {/* Title + content preview */}
      <Link to={postLink} className="block">
        <h3 className="text-base sm:text-lg font-bold text-white mb-1.5 group-hover:text-tavern-accent transition-colors line-clamp-2">
          {post.title}
        </h3>
        <p className="text-sm text-white/50 line-clamp-3 leading-relaxed">
          {post.content}
        </p>
      </Link>

      {/* Action bar */}
      <div className="flex items-center gap-1 mt-4 pt-3 border-t border-white/5">
        {/* Upvote */}
        <button
          onClick={handleUpvote}
          disabled={!user || user.id === post.user_id}
          className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            post.has_upvoted
              ? 'bg-tavern-accent/20 text-tavern-accent'
              : 'text-white/40 hover:text-white hover:bg-white/5'
          } disabled:opacity-30 disabled:pointer-events-none`}
        >
          <svg
            className="w-3.5 h-3.5"
            viewBox="0 0 24 24"
            fill={post.has_upvoted ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path d="M12 19V5M5 12l7-7 7 7" />
          </svg>
          <span>{post.upvote_count || 0}</span>
        </button>

        {/* Comments */}
        <Link
          to={postLink}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium text-white/40 hover:text-white hover:bg-white/5 transition-colors"
        >
          <svg
            className="w-3.5 h-3.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <span>{post.comment_count || 0}</span>
        </Link>

        <div className="flex-1" />

        {/* Bookmark */}
        <button
          onClick={handleBookmark}
          disabled={!user}
          className={`p-1.5 rounded-lg transition-colors ${
            post.has_bookmarked
              ? 'text-tavern-accent'
              : 'text-white/30 hover:text-white hover:bg-white/5'
          } disabled:opacity-30 disabled:pointer-events-none`}
          title={post.has_bookmarked ? 'Remove bookmark' : 'Bookmark'}
        >
          <svg
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill={post.has_bookmarked ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
          </svg>
        </button>

        {/* Report (only for other users' posts) */}
        {user && user.id !== post.user_id && (
          <div className="relative">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowReport(!showReport);
              }}
              className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/5 transition-colors"
            >
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                <line x1="4" y1="22" x2="4" y2="15" />
              </svg>
            </button>

            {showReport && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowReport(false);
                  }}
                />
                <div className="absolute right-0 bottom-full mb-2 w-48 bg-[#1a1a1a] border border-white/10 rounded-lg shadow-2xl z-50 overflow-hidden">
                  {['Spam', 'Harassment', 'Inappropriate', 'Misinformation', 'Other'].map(
                    (r) => (
                      <button
                        key={r}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleReport(r);
                        }}
                        disabled={reporting}
                        className="block w-full text-left px-4 py-2.5 text-sm text-white/70 hover:bg-white/10 hover:text-white transition-colors disabled:opacity-50"
                      >
                        {r}
                      </button>
                    )
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}