// ============================================================
// FILE: src/pages/Feed.jsx
// ============================================================
import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import PostCard from '../components/PostCard';

const PAGE_SIZE = 10;
const FETCH_LIMIT = 100;

const TABLES = [
  { name: 'pilot_posts', tag: 'Pilot Service', type: 'pilot' },
  { name: 'buy_sell_posts', tag: 'Buy and Sell', type: 'buy_sell' },
  { name: 'esports_posts', tag: 'LF Team', type: 'esports' },
];

const TAG_TO_TABLE = { 'Pilot Service': 'pilot_posts', 'Buy and Sell': 'buy_sell_posts', 'LF Team': 'esports_posts' };

const TITLE_DESCRIPTIONS = {
  'Pilot Services': 'Promote your services here in MLBB Tavern.',
  'Esports Team Finder': 'Find that perfect team! or member..',
  'Buy & Sell Market': 'Promote your products here in MLBB Tavern.',
};

function PostFormModal({ open, onClose, preselectedTag, editPost, onSaved }) {
  const { user } = useAuth();
  const isEdit = Boolean(editPost);
  const [tag, setTag] = useState(preselectedTag || 'Pilot Service');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [pilotWarning, setPilotWarning] = useState(null);

  useEffect(() => {
    if (!open) return;
    if (isEdit && editPost) {
      setTag(editPost.tag || preselectedTag || 'Pilot Service');
      setTitle(editPost.title || '');
      setContent(editPost.content || '');
    } else {
      setTag(preselectedTag || 'Pilot Service');
      setTitle('');
      setContent('');
    }
    setError('');
    setPilotWarning(null);
  }, [open, preselectedTag, isEdit, editPost]);

  if (!open) return null;

  const checkPilotExisting = async () => {
    if (tag !== 'Pilot Service' || isEdit) return false;
    const { data } = await supabase
      .from('pilot_posts')
      .select('id, title')
      .eq('user_id', user.id)
      .limit(1);
    return data && data.length > 0 ? data[0] : null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (title.length < 5 || title.length > 150) { setError('Title must be 5-150 characters.'); return; }
    if (content.length < 20 || content.length > 5000) { setError('Content must be 20-5000 characters.'); return; }
    setSubmitting(true); setError('');

    if (!isEdit) {
      const existing = await checkPilotExisting();
      if (existing) {
        setSubmitting(false);
        setPilotWarning(existing);
        return;
      }
    }

    const payload = { title: title.trim(), content: content.trim() };
    const table = TAG_TO_TABLE[tag];

    let err;
    if (isEdit) {
      ({ error: err } = await supabase.from(table).update(payload).eq('id', editPost.id));
    } else {
      ({ error: err } = await supabase.from(table).insert({ user_id: user.id, ...payload }));
    }

    if (err) { setError(err.message); setSubmitting(false); return; }
    setSubmitting(false); onClose(); onSaved?.();
  };

  const handleGoToEdit = () => {
    if (!pilotWarning) return;
    onClose();
    onSaved?.('edit', pilotWarning.id);
  };

  const isFeed = !preselectedTag;

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-lg bg-[#1a1a1a] border border-white/10 rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-[#1a1a1a] border-b border-white/10 px-5 py-4 flex items-center justify-between z-10">
          <h2 className="text-lg font-bold text-white">{isEdit ? 'Edit Post' : 'Create Post'}</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>

        {pilotWarning && (
          <div className="mx-5 mt-4 bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
            <p className="text-amber-300 text-sm font-bold mb-1">You already have a Pilot Service post</p>
            <p className="text-white/50 text-xs mb-3">Each user can have one Pilot Service post. You can edit your existing post instead.</p>
            <div className="flex gap-2">
              <button onClick={handleGoToEdit} className="px-3 py-1.5 rounded-md bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold hover:bg-amber-500/30 transition-colors">Edit Existing Post</button>
              <button onClick={() => setPilotWarning(null)} className="px-3 py-1.5 rounded-md bg-white/5 border border-white/10 text-white/40 text-xs font-medium hover:bg-white/10 transition-colors">Cancel</button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {isFeed && !isEdit && (
            <div>
              <label className="block text-xs font-bold text-white/50 uppercase tracking-wider mb-2">Category</label>
              <div className="grid grid-cols-3 gap-2">
                {Object.keys(TAG_TO_TABLE).map(t => (
                  <button key={t} type="button" onClick={() => setTag(t)}
                    className={`px-3 py-2.5 rounded-lg text-xs font-bold border transition-colors text-center ${tag === t ? 'bg-tavern-accent/20 border-tavern-accent/40 text-tavern-accent' : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div>
            <label className="block text-xs font-bold text-white/50 uppercase tracking-wider mb-2">Title</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Enter title..." maxLength={150} className="input-style" />
            <p className="text-[10px] text-white/20 mt-1 text-right">{title.length}/150</p>
          </div>
          <div>
            <label className="block text-xs font-bold text-white/50 uppercase tracking-wider mb-2">Content (Markdown supported)</label>
            <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Write your post..." rows={8} maxLength={5000} className="input-style resize-none" />
            <p className="text-[10px] text-white/20 mt-1 text-right">{content.length}/5000</p>
          </div>
          {error && <p className="text-sm text-red-400 font-medium">{error}</p>}
          <button type="submit" disabled={submitting} className="w-full py-3 bg-tavern-accent text-white font-bold rounded-lg hover:bg-tavern-accent/80 transition-colors disabled:opacity-50">
            {submitting ? (isEdit ? 'Saving...' : 'Posting...') : (isEdit ? 'Save Changes' : 'Post')}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────
   Feed (the one App.jsx actually imports)
   ──────────────────────────────────────────── */
export default function Feed({ tagFilter = null, title = 'Feed', showCreateButton = true }) {
  const { user, isAdmin } = useAuth();
  const [posts, setPosts] = useState([]);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [featuredCount, setFeaturedCount] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editingPost, setEditingPost] = useState(null);

  /* ── Online count ── */
  const [onlineCount, setOnlineCount] = useState('...');
  const onlineRef = useRef(null);

  useEffect(() => {
    const fetchOnline = async () => {
      try {
        const { data, error } = await supabase.rpc('get_online_count');
        if (!error && data !== null) setOnlineCount(data);
        else setOnlineCount(0);
      } catch {
        setOnlineCount(0);
      }
    };
    fetchOnline();
    onlineRef.current = setInterval(fetchOnline, 30000);
    return () => clearInterval(onlineRef.current);
  }, []);

  /* ── Fetch posts ── */
  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const tables = tagFilter ? TABLES.filter(t => t.tag === tagFilter) : TABLES;
      const sanitize = (s) => s.replace(/[%_\\]/g, '\\$&');

      const queries = tables.map(async (table) => {
        let q = supabase.from(table.name).select('*, profiles:user_id(ign, id)')
          .order('pinned', { ascending: false }).order('created_at', { ascending: false }).limit(FETCH_LIMIT);
        if (activeSearch) {
          const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(activeSearch);
          if (isUuid) {
            q = q.eq('id', activeSearch);
          } else {
            q = q.or(`title.ilike.%${sanitize(activeSearch)}%,content.ilike.%${sanitize(activeSearch)}%`);
          }
        }
        const { data } = await q;
        return (data || []).map(p => ({ ...p, tag: table.tag, board_type: table.type }));
      });

      const results = await Promise.all(queries);
      let allPosts = results.flat().sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return new Date(b.created_at) - new Date(a.created_at);
      });

      if (allPosts.length > 0) {
        const ids = allPosts.map(p => p.id);
        const [upRes, bmRes, cmRes] = await Promise.all([
          supabase.from('upvotes').select('target_id, user_id').eq('target_type', 'post').in('target_id', ids),
          user ? supabase.from('bookmarks').select('post_id').eq('user_id', user.id).in('post_id', ids) : { data: [] },
          supabase.from('comments').select('post_id').in('post_id', ids),
        ]);
        const uc = {}, uu = new Set();
        (upRes.data || []).forEach(u => { uc[u.target_id] = (uc[u.target_id] || 0) + 1; if (user && u.user_id === user.id) uu.add(u.target_id); });
        const ub = new Set((bmRes.data || []).map(b => b.post_id));
        const cc = {};
        (cmRes.data || []).forEach(c => { cc[c.post_id] = (cc[c.post_id] || 0) + 1; });
        allPosts = allPosts.map(p => ({ ...p, upvote_count: uc[p.id] || 0, has_upvoted: uu.has(p.id), has_bookmarked: ub.has(p.id), comment_count: cc[p.id] || 0 }));
      }

      setPosts(allPosts);
      setVisibleCount(PAGE_SIZE);

      const fqs = tables.map(async (t) => {
        const { count } = await supabase.from(t.name).select('*', { count: 'exact', head: true }).eq('pinned', true);
        return count || 0;
      });
      setFeaturedCount((await Promise.all(fqs)).reduce((a, b) => a + b, 0));
    } catch (err) { console.error('Feed fetch error:', err); }
    finally { setLoading(false); }
  }, [tagFilter, activeSearch, user]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const handleSearch = (e) => { e.preventDefault(); setActiveSearch(searchInput.trim()); };
  const handleClear = () => { setSearchInput(''); setActiveSearch(''); };
  const handleUpvoteChange = (id, delta, hasUpvoted) => { setPosts(prev => prev.map(p => p.id === id ? { ...p, upvote_count: (p.upvote_count || 0) + delta, has_upvoted: hasUpvoted } : p)); };
  const handleBookmarkChange = (id, hasBookmarked) => { setPosts(prev => prev.map(p => p.id === id ? { ...p, has_bookmarked: hasBookmarked } : p)); };
  const handlePinChange = (id, pinned) => { setPosts(prev => prev.map(p => p.id === id ? { ...p, pinned } : p)); };
  const handleDelete = (id) => { setPosts(prev => prev.filter(p => p.id !== id)); };

  const handleEdit = (postId) => {
    const post = posts.find(p => p.id === postId);
    if (post) { setEditingPost(post); setShowModal(true); }
  };

  const handleModalSaved = (action, postId) => {
    if (action === 'edit' && postId) {
      const post = posts.find(p => p.id === postId);
      if (post) { setEditingPost(post); return; }
      const findAndEdit = async () => {
        const { data } = await supabase.from('pilot_posts').select('*').eq('id', postId).single();
        if (data) { setEditingPost({ ...data, tag: 'Pilot Service', board_type: 'pilot' }); setShowModal(true); }
      };
      findAndEdit();
      return;
    }
    setEditingPost(null);
    fetchPosts();
  };

  const handleCreateClick = () => { setEditingPost(null); setShowModal(true); };

  const visible = posts.slice(0, visibleCount);
  const hasMore = visibleCount < posts.length;
  const featuredLink = tagFilter ? `/featured?tag=${encodeURIComponent(tagFilter)}` : '/featured';
  const titleDescription = TITLE_DESCRIPTIONS[title] || '';

  return (
    <div className="max-w-3xl mx-auto">
      {/* ── Title row with online pill ── */}
      <div className="flex items-center gap-3 flex-wrap mb-1">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">{title}</h1>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-xs font-bold text-emerald-400">
          <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
          {onlineCount} online
        </span>
      </div>
      {titleDescription && <p className="text-white/40 mb-4">{titleDescription}</p>}
      {!titleDescription && <div className="mb-4" />}
      <a href="https://www.effectivecpmnetwork.com/fnx0xvqu?key=08df4561e4fa415c0059c5a689bf2832">Click here to download JUNGLE/CORE course!</a>

      {featuredCount > 0 && (
        <Link to={featuredLink} className="block mb-6">
          <div className="flex items-center justify-between px-4 py-3 bg-tavern-accent/10 border border-tavern-accent/20 rounded-xl hover:bg-tavern-accent/20 transition-colors">
            <div className="flex items-center gap-2.5">
              <span className="text-lg">⭐</span>
              <span className="text-sm font-bold text-white">{featuredCount} Featured Post{featuredCount !== 1 ? 's' : ''}</span>
            </div>
            <svg className="w-4 h-4 text-tavern-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
          </div>
        </Link>
      )}

      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
            <input
              type="text"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="Search by title, content, or ID..."
              className="input-style !pl-10"
            />
          </div>
          <button type="submit" className="px-4 sm:px-5 py-2.5 bg-tavern-accent text-white text-sm font-bold rounded-lg hover:bg-tavern-accent/80 transition-colors shrink-0">Search</button>
          {activeSearch && (
            <button type="button" onClick={handleClear} className="px-3 py-2.5 bg-white/5 border border-white/10 text-white/60 text-sm font-medium rounded-lg hover:bg-white/10 transition-colors shrink-0">Clear</button>
          )}
        </div>
        {activeSearch && <p className="text-xs text-white/30 mt-2">Showing results for &quot;{activeSearch}&quot;</p>}
      </form>

      {showCreateButton && user && (
        <button onClick={handleCreateClick} className="w-full mb-6 py-3 border-2 border-dashed border-white/10 rounded-xl text-white/40 text-sm font-bold hover:border-tavern-accent/40 hover:text-tavern-accent transition-colors">
          + Create Post
        </button>
      )}

      {loading ? (
        <div className="text-center py-16 text-white/40">
          <div className="inline-block w-6 h-6 border-2 border-tavern-accent border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-sm">Loading posts...</p>
        </div>
      ) : visible.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-white/30 text-lg font-bold mb-1">No posts found</p>
          <p className="text-white/20 text-sm">{activeSearch ? 'Try a different search term' : 'Be the first to create a post!'}</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {visible.map(p => (
              <PostCard key={`${p.board_type}-${p.id}`} post={p}
                onUpvoteChange={handleUpvoteChange} onBookmarkChange={handleBookmarkChange}
                onPinChange={handlePinChange} onDelete={handleDelete} onEdit={handleEdit} />
            ))}
          </div>
          {hasMore && (
            <div className="text-center mt-6">
              <button onClick={() => setVisibleCount(v => v + PAGE_SIZE)}
                className="px-6 py-2.5 bg-white/5 border border-white/10 text-white/70 text-sm font-medium rounded-lg hover:bg-white/10 hover:text-white transition-colors">
                Load More ({posts.length - visibleCount} remaining)
              </button>
            </div>
          )}
        </>
      )}

      <PostFormModal
        open={showModal}
        onClose={() => { setShowModal(false); setEditingPost(null); }}
        preselectedTag={tagFilter}
        editPost={editingPost}
        onSaved={handleModalSaved}
      />
    </div>
  );
}