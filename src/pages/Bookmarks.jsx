// ============================================================
// FILE: src/pages/Bookmarks.jsx
// ============================================================
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import PostCard from '../components/PostCard';

// Maps board_type to table name and display tag
const TAG_MAP = {
  pilot: { table: 'pilot_posts', tag: 'Pilot Service' },
  buy_sell: { table: 'buy_sell_posts', tag: 'Buy and Sell' },
  esports: { table: 'esports_posts', tag: 'LF Team' },
};

export default function Bookmarks() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchBookmarks = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    try {
      // 1. Get all bookmark rows for this user
      const { data: bookmarks } = await supabase
        .from('bookmarks')
        .select('post_id, board_type, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!bookmarks || bookmarks.length === 0) {
        setPosts([]);
        setLoading(false);
        return;
      }

      // 2. Group post IDs by board_type
      const groups = { pilot: [], buy_sell: [], esports: [] };
      bookmarks.forEach((b) => {
        if (groups[b.board_type]) {
          groups[b.board_type].push(b.post_id);
        }
      });

      // 3. Fetch actual posts from each table
      const allPosts = [];
      for (const [type, ids] of Object.entries(groups)) {
        if (ids.length === 0) continue;

        const { data } = await supabase
          .from(TAG_MAP[type].table)
          .select('*, profiles:user_id(ign, id)')
          .in('id', ids);

        if (!data || data.length === 0) continue;

        // Fetch upvote counts + comments for these posts
        const pids = data.map((p) => p.id);
        const [upRes, cmRes] = await Promise.all([
          supabase
            .from('upvotes')
            .select('target_id, user_id')
            .eq('target_type', 'post')
            .in('target_id', pids),
          supabase.from('comments').select('post_id').in('post_id', pids),
        ]);

        const upvoteCount = {};
        const userUpvoted = new Set();
        (upRes.data || []).forEach((u) => {
          upvoteCount[u.target_id] = (upvoteCount[u.target_id] || 0) + 1;
          if (u.user_id === user.id) userUpvoted.add(u.target_id);
        });

        const commentCount = {};
        (cmRes.data || []).forEach((c) => {
          commentCount[c.post_id] = (commentCount[c.post_id] || 0) + 1;
        });

        allPosts.push(
          ...data.map((p) => ({
            ...p,
            tag: TAG_MAP[type].tag,
            board_type: type,
            upvote_count: upvoteCount[p.id] || 0,
            has_upvoted: userUpvoted.has(p.id),
            has_bookmarked: true, // They're all bookmarked by definition
            comment_count: commentCount[p.id] || 0,
          }))
        );
      }

      // 4. Sort by bookmark time (most recent first)
      const bookmarkTime = new Map(
        bookmarks.map((b) => [b.post_id, b.created_at])
      );
      allPosts.sort(
        (a, b) =>
          new Date(bookmarkTime.get(b.id)) -
          new Date(bookmarkTime.get(a.id))
      );

      setPosts(allPosts);
    } catch (err) {
      console.error('Bookmarks fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchBookmarks();
  }, [fetchBookmarks]);

  // ---- Handlers ----
  const handleBookmarkChange = (id, hasBookmarked) => {
    // If user un-bookmarked, remove from list immediately
    if (!hasBookmarked) {
      setPosts((prev) => prev.filter((p) => p.id !== id));
    }
  };

  const handleUpvoteChange = (id, delta, hasUpvoted) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              upvote_count: (p.upvote_count || 0) + delta,
              has_upvoted: hasUpvoted,
            }
          : p
      )
    );
  };

  // ---- Render ----
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-6">
        Bookmarks
      </h1>

      {loading ? (
        <div className="text-center py-16 text-white/40">
          <div className="inline-block w-6 h-6 border-2 border-tavern-accent border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-sm">Loading bookmarks...</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-4xl mb-4">🔖</div>
          <p className="text-white/30 text-lg font-bold mb-1">
            No bookmarks yet
          </p>
          <p className="text-white/20 text-sm">
            Bookmark posts to find them easily later
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((p) => (
            <PostCard
              key={`${p.board_type}-${p.id}`}
              post={p}
              onUpvoteChange={handleUpvoteChange}
              onBookmarkChange={handleBookmarkChange}
            />
          ))}
        </div>
      )}
    </div>
  );
}