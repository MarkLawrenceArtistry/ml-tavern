// ============================================================
// FILE: src/pages/Feed.jsx
// ============================================================
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import PostCard from '../components/PostCard';
import PostDetail from '../components/PostDetail';

// ---- Constants ----
const TABLES = [
  { name: 'pilot_posts', tag: 'Pilot Service', type: 'pilot' },
  { name: 'buy_sell_posts', tag: 'Buy and Sell', type: 'buy_sell' },
  { name: 'esports_posts', tag: 'LF Team', type: 'esports' },
];

const TAG_TO_TABLE = {
  'Pilot Service': 'pilot_posts',
  'Buy and Sell': 'buy_sell_posts',
  'LF Team': 'esports_posts',
};

const TAG_TO_TYPE = {
  'Pilot Service': 'pilot',
  'Buy and Sell': 'buy_sell',
  'LF Team': 'esports',
};

const PAGE_SIZE = 10;
const FETCH_LIMIT = 100;

function sanitizeLike(str) {
  return str.replace(/[%_\\]/g, '\\$&');
}

// ===================================================================
// MAIN COMPONENT
// ===================================================================
export default function Feed({ tagFilter = null, title = 'Feed' }) {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const postId = searchParams.get('post');

  // ALL hooks MUST be declared before ANY conditional return.
  // Breaking this rule causes infinite re-render / black screen.
  const [posts, setPosts] = useState([]);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [featuredCount, setFeaturedCount] = useState(0);
  const [sortBy, setSortBy] = useState('newest');

  // Create modal state
  const [showCreate, setShowCreate] = useState(false);
  const [createTag, setCreateTag] = useState(tagFilter || 'Pilot Service');
  const [createTitle, setCreateTitle] = useState('');
  const [createContent, setCreateContent] = useState('');
  const [createError, setCreateError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Whether we should show PostDetail instead of the feed list
  const isDetailView = !!(postId && tagFilter && TAG_TO_TYPE[tagFilter]);

  // ---- Fetch all posts ----
  const fetchPosts = useCallback(async () => {
    const activeTables = tagFilter
      ? TABLES.filter((t) => t.tag === tagFilter)
      : TABLES;

    setLoading(true);
    try {
      const queries = activeTables.map(async (table) => {
        let q = supabase
          .from(table.name)
          .select('*, profiles:user_id(ign, id)')
          .order('pinned', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(FETCH_LIMIT);

        if (activeSearch) {
          const safe = sanitizeLike(activeSearch);
          q = q.or(`title.ilike.%${safe}%,content.ilike.%${safe}%`);
        }

        const { data } = await q;
        return (data || []).map((p) => ({
          ...p,
          tag: table.tag,
          board_type: table.type,
        }));
      });

      const results = await Promise.all(queries);
      let allPosts = results.flat();

      if (allPosts.length > 0) {
        const ids = allPosts.map((p) => p.id);

        const [upRes, bmRes, cmRes] = await Promise.all([
          supabase
            .from('upvotes')
            .select('target_id, user_id')
            .eq('target_type', 'post')
            .in('target_id', ids),
          user
            ? supabase
                .from('bookmarks')
                .select('post_id')
                .eq('user_id', user.id)
                .in('post_id', ids)
            : { data: [] },
          supabase.from('comments').select('post_id').in('post_id', ids),
        ]);

        const upvoteCount = {};
        const userUpvoted = new Set();
        (upRes.data || []).forEach((u) => {
          upvoteCount[u.target_id] = (upvoteCount[u.target_id] || 0) + 1;
          if (user && u.user_id === user.id) {
            userUpvoted.add(u.target_id);
          }
        });

        const userBookmarked = new Set((bmRes.data || []).map((b) => b.post_id));

        const commentCount = {};
        (cmRes.data || []).forEach((c) => {
          commentCount[c.post_id] = (commentCount[c.post_id] || 0) + 1;
        });

        allPosts = allPosts.map((p) => ({
          ...p,
          upvote_count: upvoteCount[p.id] || 0,
          has_upvoted: userUpvoted.has(p.id),
          has_bookmarked: userBookmarked.has(p.id),
          comment_count: commentCount[p.id] || 0,
        }));
      }

      setPosts(allPosts);
      setVisibleCount(PAGE_SIZE);

      // Count featured (pinned) posts
      const featuredQueries = activeTables.map(async (t) => {
        const { count } = await supabase
          .from(t.name)
          .select('*', { count: 'exact', head: true })
          .eq('pinned', true);
        return count || 0;
      });
      const counts = await Promise.all(featuredQueries);
      setFeaturedCount(counts.reduce((a, b) => a + b, 0));
    } catch (err) {
      console.error('Feed fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [tagFilter, activeSearch, user]);

  // Only fetch when NOT showing post detail
  useEffect(() => {
    if (isDetailView) return;
    fetchPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchPosts, isDetailView]);

  // ---- Sort the posts client-side ----
  const sortedPosts = useMemo(() => {
    const sorted = [...posts];
    switch (sortBy) {
      case 'oldest':
        return sorted.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      case 'upvoted':
        return sorted.sort((a, b) => (b.upvote_count || 0) - (a.upvote_count || 0));
      case 'commented':
        return sorted.sort((a, b) => (b.comment_count || 0) - (a.comment_count || 0));
      case 'newest':
      default:
        return sorted.sort((a, b) => {
          if (a.pinned && !b.pinned) return -1;
          if (!a.pinned && b.pinned) return 1;
          return new Date(b.created_at) - new Date(a.created_at);
        });
    }
  }, [posts, sortBy]);

  // ---- Search (form-based only) ----
  const handleSearch = (e) => {
    e.preventDefault();
    setActiveSearch(searchInput.trim());
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setActiveSearch('');
  };

  // ---- Optimistic state updates from PostCard ----
  const handleUpvoteChange = (id, delta, hasUpvoted) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, upvote_count: (p.upvote_count || 0) + delta, has_upvoted: hasUpvoted }
          : p
      )
    );
  };

  const handleBookmarkChange = (id, hasBookmarked) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, has_bookmarked: hasBookmarked } : p))
    );
  };

  const handlePinChange = (id, pinned) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, pinned } : p))
    );
  };

  const handleDelete = (id) => {
    setPosts((prev) => prev.filter((p) => p.id !== id));
  };

  // ---- Create post ----
  const resetCreateForm = () => {
    setCreateTag(tagFilter || 'Pilot Service');
    setCreateTitle('');
    setCreateContent('');
    setCreateError('');
  };

  const openCreateModal = () => {
    resetCreateForm();
    setShowCreate(true);
  };

  const closeCreateModal = () => {
    setShowCreate(false);
    resetCreateForm();
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();

    if (createTitle.length < 5 || createTitle.length > 150) {
      setCreateError('Title must be between 5 and 150 characters.');
      return;
    }
    if (createContent.length < 20 || createContent.length > 5000) {
      setCreateError('Content must be between 20 and 5000 characters.');
      return;
    }

    setSubmitting(true);
    setCreateError('');

    const tableName = TAG_TO_TABLE[createTag];
    const { error } = await supabase.from(tableName).insert({
      user_id: user.id,
      title: createTitle.trim(),
      content: createContent.trim(),
    });

    if (error) {
      setCreateError(error.message);
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
    closeCreateModal();
    fetchPosts();
  };

  // ---- Pagination ----
  const visiblePosts = sortedPosts.slice(0, visibleCount);
  const hasMore = visibleCount < sortedPosts.length;
  const remainingCount = sortedPosts.length - visibleCount;

  // ---- Featured link ----
  const featuredLink = tagFilter
    ? `/featured?tag=${encodeURIComponent(tagFilter)}`
    : '/featured';

  // ================================================================
  // RENDER — no early returns before here, all hooks are above
  // ================================================================
  return (
    <div className="max-w-3xl mx-auto">
      {isDetailView ? (
        <PostDetail postId={postId} boardType={TAG_TO_TYPE[tagFilter]} />
      ) : (
        <>
          {/* Page title */}
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-4">{title}</h1>

          {/* Featured banner */}
          {featuredCount > 0 && (
            <Link to={featuredLink} className="block mb-6">
              <div className="flex items-center justify-between px-4 py-3 bg-tavern-accent/10 border border-tavern-accent/20 rounded-xl hover:bg-tavern-accent/20 transition-colors">
                <div className="flex items-center gap-2.5">
                  <span className="text-lg">⭐</span>
                  <span className="text-sm font-bold text-white">
                    {featuredCount} Featured Post{featuredCount !== 1 ? 's' : ''}
                  </span>
                </div>
                <svg className="w-4 h-4 text-tavern-accent shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
            </Link>
          )}

          {/* Search bar — FORM BASED */}
          <form onSubmit={handleSearch} className="mb-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search posts..."
                  className="input-style pl-10"
                />
              </div>
              <button
                type="submit"
                className="px-4 sm:px-5 py-2.5 bg-tavern-accent text-white text-sm font-bold rounded-lg hover:bg-tavern-accent/80 transition-colors shrink-0"
              >
                Search
              </button>
              {activeSearch && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="px-3 py-2.5 bg-white/5 border border-white/10 text-white/60 text-sm font-medium rounded-lg hover:bg-white/10 transition-colors shrink-0"
                >
                  Clear
                </button>
              )}
            </div>
            {activeSearch && (
              <p className="text-xs text-white/30 mt-2">Showing results for &quot;{activeSearch}&quot;</p>
            )}
          </form>

          {/* Sort dropdown */}
          <div className="flex items-center gap-2 mb-6">
            <svg className="w-3.5 h-3.5 text-white/30 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="4" y1="6" x2="20" y2="6" />
              <line x1="4" y1="12" x2="14" y2="12" />
              <line x1="4" y1="18" x2="8" y2="18" />
            </svg>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="input-style !w-auto !py-1.5 !px-3 text-xs min-w-[150px]"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="upvoted">Most Upvoted</option>
              <option value="commented">Most Commented</option>
            </select>
            <span className="text-xs text-white/20">
              {posts.length} post{posts.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Create post button */}
          {user && (
            <button
              onClick={openCreateModal}
              className="w-full mb-6 py-3 border-2 border-dashed border-white/10 rounded-xl text-white/40 text-sm font-bold hover:border-tavern-accent/40 hover:text-tavern-accent transition-colors"
            >
              + Create Post
            </button>
          )}

          {/* LOADING */}
          {loading && (
            <div className="text-center py-16 text-white/40">
              <div className="inline-block w-6 h-6 border-2 border-tavern-accent border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-sm">Loading posts...</p>
            </div>
          )}

          {/* EMPTY */}
          {!loading && visiblePosts.length === 0 && (
            <div className="text-center py-16">
              <p className="text-white/30 text-lg font-bold mb-1">No posts found</p>
              <p className="text-white/20 text-sm">
                {activeSearch ? 'Try a different search term' : 'Be the first to create a post!'}
              </p>
            </div>
          )}

          {/* POST LIST */}
          {!loading && visiblePosts.length > 0 && (
            <>
              <div className="space-y-3">
                {visiblePosts.map((p) => (
                  <PostCard
                    key={`${p.board_type}-${p.id}`}
                    post={p}
                    onUpvoteChange={handleUpvoteChange}
                    onBookmarkChange={handleBookmarkChange}
                    onPinChange={handlePinChange}
                    onDelete={handleDelete}
                  />
                ))}
              </div>

              {hasMore && (
                <div className="text-center mt-6">
                  <button
                    onClick={() => setVisibleCount((v) => v + PAGE_SIZE)}
                    className="px-6 py-2.5 bg-white/5 border border-white/10 text-white/70 text-sm font-medium rounded-lg hover:bg-white/10 hover:text-white transition-colors"
                  >
                    Load More ({remainingCount} remaining)
                  </button>
                </div>
              )}
            </>
          )}

          {/* CREATE POST MODAL */}
          {showCreate && (
            <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
              <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={closeCreateModal} />
              <div className="relative w-full sm:max-w-lg bg-[#1a1a1a] border border-white/10 rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-[#1a1a1a] border-b border-white/10 px-5 py-4 flex items-center justify-between z-10">
                  <h2 className="text-lg font-bold text-white">Create Post</h2>
                  <button onClick={closeCreateModal} className="p-1 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
                <form onSubmit={handleCreateSubmit} className="p-5 space-y-4">
                  {!tagFilter && (
                    <div>
                      <label className="block text-xs font-bold text-white/50 uppercase tracking-wider mb-2">Category</label>
                      <div className="grid grid-cols-3 gap-2">
                        {Object.keys(TAG_TO_TABLE).map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => setCreateTag(t)}
                            className={`px-3 py-2.5 rounded-lg text-xs font-bold border transition-colors text-center ${
                              createTag === t
                                ? 'bg-tavern-accent/20 border-tavern-accent/40 text-tavern-accent'
                                : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'
                            }`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-bold text-white/50 uppercase tracking-wider mb-2">Title</label>
                    <input
                      type="text"
                      value={createTitle}
                      onChange={(e) => setCreateTitle(e.target.value)}
                      placeholder="Enter title..."
                      maxLength={150}
                      className="input-style"
                    />
                    <p className="text-[10px] text-white/20 mt-1 text-right">{createTitle.length}/150</p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-white/50 uppercase tracking-wider mb-2">Content (Markdown supported)</label>
                    <textarea
                      value={createContent}
                      onChange={(e) => setCreateContent(e.target.value)}
                      placeholder="Write your post..."
                      rows={8}
                      maxLength={5000}
                      className="input-style resize-none"
                    />
                    <p className="text-[10px] text-white/20 mt-1 text-right">{createContent.length}/5000</p>
                  </div>
                  {createError && <p className="text-sm text-red-400 font-medium">{createError}</p>}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 bg-tavern-accent text-white font-bold rounded-lg hover:bg-tavern-accent/80 transition-colors disabled:opacity-50 disabled:pointer-events-none"
                  >
                    {submitting ? 'Posting...' : 'Post'}
                  </button>
                </form>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}