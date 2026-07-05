// ============================================================
// FILE: src/components/PostDetail.jsx
// ============================================================
import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import Markdown from './Markdown';

// Board type config: display name, route back, database table, tag badge color
const CFG = {
  pilot: {
    tag: 'Pilot Service',
    route: '/pilots',
    table: 'pilot_posts',
    color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  },
  buy_sell: {
    tag: 'Buy and Sell',
    route: '/market',
    table: 'buy_sell_posts',
    color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  },
  esports: {
    tag: 'LF Team',
    route: '/teams',
    table: 'esports_posts',
    color: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  },
};

export default function PostDetail({ postId, boardType }) {
  const { user, isAdmin } = useAuth();
  const [, setSearchParams] = useSearchParams();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showReport, setShowReport] = useState(false);

  const cfg = CFG[boardType];

  // Fetch post + comments on mount
  useEffect(() => {
    fetchPost();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId, boardType]);

  const fetchPost = async () => {
    setLoading(true);
    setPost(null);
    setComments([]);
    setNewComment('');

    // 1. Fetch the post itself
    const { data: pd } = await supabase
      .from(cfg.table)
      .select('*, profiles:user_id(ign, id)')
      .eq('id', postId)
      .maybeSingle();

    if (!pd) {
      setLoading(false);
      return;
    }

    // 2. Fetch upvote count + whether current user upvoted
    const [upRes, bmRes] = await Promise.all([
      supabase
        .from('upvotes')
        .select('user_id')
        .eq('target_id', postId)
        .eq('target_type', 'post')
        .eq('board_type', boardType),
      user
        ? supabase
            .from('bookmarks')
            .select('id')
            .eq('user_id', user.id)
            .eq('post_id', postId)
            .eq('board_type', boardType)
            .maybeSingle()
        : { data: null },
    ]);

    const upvotes = upRes.data || [];
    setPost({
      ...pd,
      tag: cfg.tag,
      board_type: boardType,
      upvote_count: upvotes.length,
      has_upvoted: user ? upvotes.some((u) => u.user_id === user.id) : false,
      has_bookmarked: !!bmRes.data,
    });

    // 3. Fetch comments
    const { data: cd } = await supabase
      .from('comments')
      .select('*, profiles:user_id(ign, id)')
      .eq('post_id', postId)
      .eq('board_type', boardType)
      .order('created_at', { ascending: true });

    setComments(cd || []);
    setLoading(false);
  };

  // ---------- UPVOTE ----------
  const handleUpvote = async () => {
    if (!user || user.id === post.user_id) return;

    if (post.has_upvoted) {
      await supabase
        .from('upvotes')
        .delete()
        .eq('user_id', user.id)
        .eq('target_id', post.id)
        .eq('target_type', 'post')
        .eq('board_type', boardType);
      setPost((p) => ({
        ...p,
        upvote_count: p.upvote_count - 1,
        has_upvoted: false,
      }));
    } else {
      await supabase.from('upvotes').insert({
        user_id: user.id,
        target_id: post.id,
        target_type: 'post',
        board_type: boardType,
      });
      setPost((p) => ({
        ...p,
        upvote_count: p.upvote_count + 1,
        has_upvoted: true,
      }));
    }
  };

  // ---------- BOOKMARK ----------
  const handleBookmark = async () => {
    if (!user) return;

    if (post.has_bookmarked) {
      await supabase
        .from('bookmarks')
        .delete()
        .eq('user_id', user.id)
        .eq('post_id', post.id)
        .eq('board_type', boardType);
      setPost((p) => ({ ...p, has_bookmarked: false }));
    } else {
      await supabase.from('bookmarks').insert({
        user_id: user.id,
        post_id: post.id,
        board_type: boardType,
      });
      setPost((p) => ({ ...p, has_bookmarked: true }));
    }
  };

  // ---------- PIN (admin) ----------
  const handlePin = async () => {
    if (!isAdmin) return;
    const newVal = !post.pinned;
    await supabase.from(cfg.table).update({ pinned: newVal }).eq('id', post.id);
    setPost((p) => ({ ...p, pinned: newVal }));
  };

  // ---------- COMMENT ----------
  const handleComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;
    setSubmitting(true);

    const { data } = await supabase
      .from('comments')
      .insert({
        user_id: user.id,
        board_type: boardType,
        post_id: postId,
        content: newComment.trim(),
      })
      .select('*, profiles:user_id(ign, id)')
      .single();

    if (data) {
      setComments((prev) => [...prev, data]);
      setNewComment('');
    }
    setSubmitting(false);
  };

  // ---------- REPORT ----------
  const handleReport = async (reason) => {
    if (!user || user.id === post.user_id) return;
    await supabase.from('reports').insert({
      reporter_id: user.id,
      target_type: 'post',
      board_type: boardType,
      target_id: postId,
      reason,
    });
    setShowReport(false);
    alert('Report submitted.');
  };

  // ===== LOADING STATE =====
  if (loading) {
    return (
      <div className="text-center py-20 text-white/40">
        <div className="inline-block w-6 h-6 border-2 border-tavern-accent border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-sm">Loading post...</p>
      </div>
    );
  }

  // ===== NOT FOUND STATE =====
  if (!post) {
    return (
      <div className="text-center py-20">
        <p className="text-white/30 text-lg font-bold mb-3">Post not found</p>
        <Link to={cfg.route} className="text-tavern-accent hover:underline text-sm">
          ← Back to {cfg.tag}
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Back button */}
      <button
        onClick={() => setSearchParams({})}
        className="flex items-center gap-2 text-sm text-white/50 hover:text-white mb-6 transition-colors"
      >
        <svg
          className="w-4 h-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Back
      </button>

      {/* Post card */}
      <div className="bg-white/[0.03] border border-white/10 rounded-xl p-5 sm:p-6">
        {/* Tag + pinned + admin pin */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded border ${cfg.color}`}
          >
            {cfg.tag}
          </span>
          {post.pinned && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded border bg-tavern-accent/20 text-tavern-accent border-tavern-accent/30">
              PINNED
            </span>
          )}
          {isAdmin && (
            <button
              onClick={handlePin}
              className="text-[10px] font-bold px-2 py-0.5 rounded border border-white/10 text-white/30 hover:text-tavern-accent hover:border-tavern-accent/30 transition-colors"
            >
              {post.pinned ? 'UNPIN' : 'PIN'}
            </button>
          )}
        </div>

        {/* Author + date */}
        <div className="flex items-center gap-2 mb-3">
          <Link
            to={`/user/${post.user_id}`}
            className="text-sm font-bold text-tavern-accent hover:underline"
          >
            {post.profiles?.ign || 'Unknown'}
          </Link>
          <span className="text-white/20">·</span>
          <span className="text-xs text-white/30">
            {new Date(post.created_at).toLocaleDateString()}
          </span>
        </div>

        {/* Title */}
        <h1 className="text-xl sm:text-2xl font-extrabold text-white mb-4">
          {post.title}
        </h1>

        {/* Content (Markdown) */}
        <div className="mb-6">
          <Markdown content={post.content} />
        </div>

        {/* Action bar */}
        <div className="flex items-center gap-2 pt-4 border-t border-white/10 flex-wrap">
          {/* Upvote */}
          <button
            onClick={handleUpvote}
            disabled={!user || user.id === post.user_id}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              post.has_upvoted
                ? 'bg-tavern-accent/20 text-tavern-accent'
                : 'text-white/40 hover:text-white hover:bg-white/5'
            } disabled:opacity-30 disabled:pointer-events-none`}
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill={post.has_upvoted ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M12 19V5M5 12l7-7 7 7" />
            </svg>
            {post.upvote_count}
          </button>

          {/* Bookmark */}
          <button
            onClick={handleBookmark}
            disabled={!user}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              post.has_bookmarked
                ? 'text-tavern-accent'
                : 'text-white/40 hover:text-white hover:bg-white/5'
            } disabled:opacity-30 disabled:pointer-events-none`}
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
            {post.has_bookmarked ? 'Saved' : 'Save'}
          </button>

          <div className="flex-1" />

          {/* Report */}
          {user && user.id !== post.user_id && (
            <div className="relative">
              <button
                onClick={() => setShowReport(!showReport)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-white/30 hover:text-white hover:bg-white/5 transition-colors"
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
                Report
              </button>

              {showReport && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowReport(false)}
                  />
                  <div className="absolute right-0 bottom-full mb-2 w-48 bg-[#1a1a1a] border border-white/10 rounded-lg shadow-2xl z-50 overflow-hidden">
                    {['Spam', 'Harassment', 'Inappropriate', 'Misinformation', 'Other'].map(
                      (r) => (
                        <button
                          key={r}
                          onClick={() => handleReport(r)}
                          className="block w-full text-left px-4 py-2.5 text-sm text-white/70 hover:bg-white/10 hover:text-white transition-colors"
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

      {/* ===== COMMENTS SECTION ===== */}
      <div className="mt-8">
        <h2 className="text-lg font-bold text-white mb-4">
          Comments ({comments.length})
        </h2>

        {/* Add comment form (only for logged-in users) */}
        {user ? (
          <form onSubmit={handleComment} className="mb-6">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              rows={3}
              maxLength={2000}
              className="input-style resize-none mb-2"
            />
            <div className="flex justify-between items-center">
              <p className="text-[10px] text-white/20">{newComment.length}/2000</p>
              <button
                type="submit"
                disabled={submitting || !newComment.trim()}
                className="px-4 py-2 bg-tavern-accent text-white text-sm font-bold rounded-lg hover:bg-tavern-accent/80 transition-colors disabled:opacity-50 disabled:pointer-events-none"
              >
                {submitting ? 'Posting...' : 'Comment'}
              </button>
            </div>
          </form>
        ) : (
          <p className="text-sm text-white/30 mb-6">
            <Link to="/login" className="text-tavern-accent hover:underline">
              Log in
            </Link>{' '}
            to leave a comment.
          </p>
        )}

        {/* Comments list */}
        {comments.length === 0 ? (
          <p className="text-white/20 text-sm text-center py-8">
            No comments yet. Be the first!
          </p>
        ) : (
          <div className="space-y-3">
            {comments.map((c) => (
              <div
                key={c.id}
                className="bg-white/[0.02] border border-white/5 rounded-lg p-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Link
                    to={`/user/${c.user_id}`}
                    className="text-sm font-bold text-tavern-accent hover:underline"
                  >
                    {c.profiles?.ign || 'Unknown'}
                  </Link>
                  <span className="text-white/20">·</span>
                  <span className="text-xs text-white/30">
                    {new Date(c.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-white/70 leading-relaxed whitespace-pre-wrap break-words">
                  {c.content}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}