// ============================================================
// FILE: src/pages/Featured.jsx
// ============================================================
import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import PostCard from '../components/PostCard';

const TABLES = [
  { name: 'pilot_posts', tag: 'Pilot Service', type: 'pilot' },
  { name: 'buy_sell_posts', tag: 'Buy and Sell', type: 'buy_sell' },
  { name: 'esports_posts', tag: 'LF Team', type: 'esports' },
];

export default function Featured() {
  const { user, isAdmin } = useAuth();
  const [searchParams] = useSearchParams();
  const tagFilter = searchParams.get('tag') || null;
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchFeatured = useCallback(async () => {
    setLoading(true);

    try {
      const tables = tagFilter
        ? TABLES.filter((t) => t.tag === tagFilter)
        : TABLES;

      // Fetch pinned posts from each relevant table
      const queries = tables.map(async (table) => {
        const { data } = await supabase
          .from(table.name)
          .select('*, profiles:user_id(ign, id)')
          .eq('pinned', true)
          .order('created_at', { ascending: false });

        return (data || []).map((p) => ({
          ...p,
          tag: table.tag,
          board_type: table.type,
        }));
      });

      const results = await Promise.all(queries);
      let allPosts = results.flat().sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );

      // Bulk-fetch stats
      if (allPosts.length > 0) {
        const ids = allPosts.map((p) => p.id);

        const promises = [
          supabase
            .from('upvotes')
            .select('target_id, user_id')
            .eq('target_type', 'post')
            .in('target_id', ids),
          supabase.from('comments').select('post_id').in('post_id', ids),
        ];

        // Only fetch bookmarks if user is logged in
        if (user) {
          promises.push(
            supabase
              .from('bookmarks')
              .select('post_id')
              .eq('user_id', user.id)
              .in('post_id', ids)
          );
        }

        const [upRes, cmRes, bmRes] = await Promise.all(promises);

        const upvoteCount = {};
        const userUpvoted = new Set();
        (upRes.data || []).forEach((u) => {
          upvoteCount[u.target_id] = (upvoteCount[u.target_id] || 0) + 1;
          if (user && u.user_id === user.id) userUpvoted.add(u.target_id);
        });

        const userBookmarked = new Set(
          (bmRes?.data || []).map((b) => b.post_id)
        );

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
    } catch (err) {
      console.error('Featured fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [tagFilter, user]);

  useEffect(() => {
    fetchFeatured();
  }, [fetchFeatured]);

  // ---- Handlers ----
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

  const handleBookmarkChange = (id, hasBookmarked) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, has_bookmarked: hasBookmarked } : p
      )
    );
  };

  const handlePinChange = (id, pinned) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, pinned } : p))
    );
  };

  // ---- Subtitle ----
  const subtitle = tagFilter
    ? `Featured ${tagFilter} Posts`
    : 'All Featured Posts';

  // ---- Render ----
  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <span className="text-2xl">⭐</span>
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Featured
          </h1>
          <p className="text-sm text-white/40">{subtitle}</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-white/40">
          <div className="inline-block w-6 h-6 border-2 border-tavern-accent border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-sm">Loading...</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-4xl mb-4">⭐</div>
          <p className="text-white/30 text-lg font-bold mb-1">
            No featured posts
          </p>
          <p className="text-white/20 text-sm">
            Admins can pin posts to feature them here
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
              onPinChange={handlePinChange}
            />
          ))}
        </div>
      )}
    </div>
  );
}