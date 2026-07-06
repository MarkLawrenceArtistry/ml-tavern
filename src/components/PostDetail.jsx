// ============================================================
// FILE: src/components/PostDetail.jsx
// ============================================================
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { containsProfanity } from '../lib/profanity';
import Markdown from './Markdown';

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

// ===================================================================
// CommentRow
// ===================================================================
function CommentRow({ comment, boardType, currentUserId, isAdmin, onDelete }) {
  const [showReport, setShowReport] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleReport = async (reason) => {
    if (!currentUserId) return;
    setReporting(true);
    try {
      const { error } = await supabase.from('reports').insert({
        reporter_id: currentUserId,
        target_type: 'comment',
        board_type: boardType,
        target_id: comment.id,
        reason,
      });
      if (error) {
        alert('Report failed: ' + error.message);
        return;
      }
      setShowReport(false);
      alert('Report submitted.');
    } catch (err) {
      alert('Report failed: ' + (err.message || 'Unknown error'));
    } finally {
      setReporting(false);
    }
  };

  const handleDelete = async () => {
    if (!isAdmin) return;
    if (!window.confirm('Delete this comment?')) return;
    setDeleting(true);
    const { error } = await supabase.from('comments').delete().eq('id', comment.id);
    if (!error) onDelete(comment.id);
    setDeleting(false);
  };

  return (
    <div className="bg-white/[0.02] border border-white/5 rounded-lg p-4 group">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <Link
            to={`/user/${comment.user_id}`}
            className="text-sm font-bold text-tavern-accent hover:underline"
          >
            {comment.profiles?.ign || 'Unknown'}
          </Link>
          <span className="text-white/20 shrink-0">·</span>
          <span className="text-xs text-white/30 shrink-0">
            {new Date(comment.created_at).toLocaleDateString()}
          </span>
        </div>

        <div className="flex items-center gap-0.5 shrink-0">
          {/* Report — visible to other users */}
          {currentUserId && currentUserId !== comment.user_id && (
            <div className="relative">
              <button
                onClick={() => setShowReport(!showReport)}
                className="p-1.5 rounded-lg text-white/25 hover:text-white/60 hover:bg-white/5 transition-all"
                title="Report comment"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                  <line x1="4" y1="22" x2="4" y2="15" />
                </svg>
              </button>

              {showReport && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowReport(false)} />
                  <div className="absolute right-0 top-full mt-1 w-44 bg-[#1a1a1a] border border-white/10 rounded-lg shadow-2xl z-50 overflow-hidden">
                    {['Spam', 'Harassment', 'Inappropriate', 'Misinformation', 'Other'].map((r) => (
                      <button
                        key={r}
                        onClick={() => handleReport(r)}
                        disabled={reporting}
                        className="block w-full text-left px-4 py-2.5 text-sm text-white/70 hover:bg-white/10 hover:text-white transition-colors disabled:opacity-50"
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Delete — admin only */}
          {isAdmin && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="p-1.5 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-40"
              title="Delete comment"
            >
              {deleting ? (
                <div className="w-3.5 h-3.5 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              )}
            </button>
          )}
        </div>
      </div>

      <p className="text-sm text-white/70 leading-relaxed whitespace-pre-wrap break-words">
        {comment.content}
      </p>
    </div>
  );
}

// ===================================================================
// PostDetail
// ===================================================================
export default function PostDetail() {
  const { boardType, postId } = useParams();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [commentError, setCommentError] = useState('');

  const cfg = CFG[boardType];

  useEffect(() => {
    fetchPost();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId, boardType]);

  const fetchPost = async () => {
    if (!cfg) { setLoading(false); return; }
    setLoading(true);
    setPost(null);
    setComments([]);
    setNewComment('');
    setCommentError('');

    const { data: pd } = await supabase
      .from(cfg.table)
      .select('*, profiles:user_id(ign, id)')
      .eq('id', postId)
      .maybeSingle();

    if (!pd) {
      setLoading(false);
      return;
    }

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
      await supabase.from('upvotes').delete().eq('user_id', user.id).eq('target_id', post.id).eq('target_type', 'post').eq('board_type', boardType);
      setPost((p) => ({ ...p, upvote_count: p.upvote_count - 1, has_upvoted: false }));
    } else {
      await supabase.from('upvotes').insert({ user_id: user.id, target_id: post.id, target_type: 'post', board_type: boardType });
      setPost((p) => ({ ...p, upvote_count: p.upvote_count + 1, has_upvoted: true }));
    }
  };

  // ---------- BOOKMARK ----------
  const handleBookmark = async () => {
    if (!user) return;
    if (post.has_bookmarked) {
      await supabase.from('bookmarks').delete().eq('user_id', user.id).eq('post_id', post.id).eq('board_type', boardType);
      setPost((p) => ({ ...p, has_bookmarked: false }));
    } else {
      await supabase.from('bookmarks').insert({ user_id: user.id, post_id: post.id, board_type: boardType });
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

  // ---------- DELETE POST (admin) ----------
  const handleDeletePost = async () => {
    if (!isAdmin) return;
    if (!window.confirm(`Delete "${post.title}"? This cannot be undone.`)) return;
    const { error } = await supabase.from(cfg.table).delete().eq('id', post.id);
    if (!error) navigate(cfg.route);
    else alert('Delete failed: ' + error.message);
  };

  // ---------- DELETE COMMENT (admin) ----------
  const handleDeleteComment = (commentId) => {
    setComments((prev) => prev.filter((c) => c.id !== commentId));
  };

  // ---------- COMMENT ----------
  const handleComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    const trimmed = newComment.trim();
    if (trimmed.length < 1) {
      setCommentError('Comment cannot be empty.');
      return;
    }
    if (containsProfanity(trimmed)) {
      setCommentError('Your comment contains inappropriate language. Please remove it and try again.');
      return;
    }

    setSubmitting(true);
    setCommentError('');

    const { data, error } = await supabase
      .from('comments')
      .insert({
        user_id: user.id,
        board_type: boardType,
        post_id: postId,
        content: trimmed,
      })
      .select('*, profiles:user_id(ign, id)')
      .single();

    if (error) {
      // Handles rate limit P0001 and any other DB errors
      setCommentError(error.message);
      setSubmitting(false);
      return;
    }

    if (data) {
      setComments((prev) => [...prev, data]);
      setNewComment('');
    }
    setSubmitting(false);
  };

  // ---------- REPORT POST ----------
  const handleReport = async (reason) => {
    if (!user || user.id === post.user_id) return;
    setReporting(true);
    try {
      const { error } = await supabase.from('reports').insert({
        reporter_id: user.id,
        target_type: 'post',
        board_type: boardType,
        target_id: postId,
        reason,
      });
      if (error) {
        alert('Report failed: ' + error.message);
        return;
      }
      setShowReport(false);
      alert('Report submitted.');
    } catch (err) {
      alert('Report failed: ' + (err.message || 'Unknown error'));
    } finally {
      setReporting(false);
    }
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
        <Link to={cfg?.route || '/feed'} className="text-tavern-accent hover:underline text-sm">
          ← Back to {cfg?.tag || 'feed'}
        </Link>
      </div>
    );
  }

  // ===== RENDER =====
  return (
    <div className="max-w-3xl mx-auto">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-white/50 hover:text-white mb-6 transition-colors"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Back
      </button>

      {/* Post card */}
      <div className="bg-white/[0.03] border border-white/10 rounded-xl p-5 sm:p-6">
        {/* Tag + pinned + admin actions */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${cfg.color}`}>
            {cfg.tag}
          </span>
          {post.pinned && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded border bg-tavern-accent/20 text-tavern-accent border-tavern-accent/30">
              PINNED
            </span>
          )}
          {isAdmin && (
            <>
              <button
                onClick={handlePin}
                className="text-[10px] font-bold px-2 py-0.5 rounded border border-white/10 text-white/30 hover:text-tavern-accent hover:border-tavern-accent/30 transition-colors"
              >
                {post.pinned ? 'UNPIN' : 'PIN'}
              </button>
              <button
                onClick={handleDeletePost}
                className="text-[10px] font-bold px-2 py-0.5 rounded border border-white/10 text-white/30 hover:text-red-400 hover:border-red-500/30 transition-colors"
              >
                DELETE POST
              </button>
            </>
          )}
        </div>

        {/* Author + date */}
        <div className="flex items-center gap-2 mb-3">
          <Link to={`/user/${post.user_id}`} className="text-sm font-bold text-tavern-accent hover:underline">
            {post.profiles?.ign || 'Unknown'}
          </Link>
          <span className="text-white/20">·</span>
          <span className="text-xs text-white/30">{new Date(post.created_at).toLocaleDateString()}</span>
        </div>

        {/* Title */}
        <h1 className="text-xl sm:text-2xl font-extrabold text-white mb-4">{post.title}</h1>

        {/* Content */}
        <div className="mb-6">
          <Markdown content={post.content} />
        </div>

        {/* Action bar */}
        <div className="flex items-center gap-2 pt-4 border-t border-white/10 flex-wrap">
          <button
            onClick={handleUpvote}
            disabled={!user || user.id === post.user_id}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              post.has_upvoted
                ? 'bg-tavern-accent/20 text-tavern-accent'
                : 'text-white/40 hover:text-white hover:bg-white/5'
            } disabled:opacity-30 disabled:pointer-events-none`}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill={post.has_upvoted ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2.5">
              <path d="M12 19V5M5 12l7-7 7 7" />
            </svg>
            {post.upvote_count}
          </button>

          <button
            onClick={handleBookmark}
            disabled={!user}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              post.has_bookmarked
                ? 'text-tavern-accent'
                : 'text-white/40 hover:text-white hover:bg-white/5'
            } disabled:opacity-30 disabled:pointer-events-none`}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill={post.has_bookmarked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
            {post.has_bookmarked ? 'Saved' : 'Save'}
          </button>

          <div className="flex-1" />

          {user && user.id !== post.user_id && (
            <div className="relative">
              <button
                onClick={() => setShowReport(!showReport)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-white/30 hover:text-white hover:bg-white/5 transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                  <line x1="4" y1="22" x2="4" y2="15" />
                </svg>
                Report
              </button>

              {showReport && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowReport(false)} />
                  <div className="absolute right-0 bottom-full mb-2 w-48 bg-[#1a1a1a] border border-white/10 rounded-lg shadow-2xl z-50 overflow-hidden">
                    {['Spam', 'Harassment', 'Inappropriate', 'Misinformation', 'Other'].map((r) => (
                      <button
                        key={r}
                        onClick={() => handleReport(r)}
                        disabled={reporting}
                        className="block w-full text-left px-4 py-2.5 text-sm text-white/70 hover:bg-white/10 hover:text-white transition-colors disabled:opacity-50"
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ===== COMMENTS SECTION ===== */}
      <div className="mt-8">
        <h2 className="text-lg font-bold text-white mb-4">Comments ({comments.length})</h2>

        {user ? (
          <form onSubmit={handleComment} className="mb-6">
            <textarea
              value={newComment}
              onChange={(e) => {
                setNewComment(e.target.value);
                setCommentError('');
              }}
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
            {commentError && (
              <p className="text-sm text-red-400 font-medium mt-2">{commentError}</p>
            )}
          </form>
        ) : (
          <p className="text-sm text-white/30 mb-6">
            <Link to="/login" className="text-tavern-accent hover:underline">Log in</Link> to comment.
          </p>
        )}

        {comments.length === 0 ? (
          <p className="text-white/20 text-sm text-center py-8">No comments yet. Be the first!</p>
        ) : (
          <div className="space-y-3">
            {comments.map((c) => (
              <CommentRow
                key={c.id}
                comment={c}
                boardType={boardType}
                currentUserId={user?.id}
                isAdmin={isAdmin}
                onDelete={handleDeleteComment}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}