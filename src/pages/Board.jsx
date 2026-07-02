import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import Markdown from '../components/Markdown';

export default function Board({ tableName, boardType, title }) {
  const { user } = useAuth();
  
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [userUpvotes, setUserUpvotes] = useState(new Set());

  // Form States
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ title: '', content: '' });
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  
  // Comment State
  const [commentText, setCommentText] = useState('');

    useEffect(() => {
        // 1. CRITICAL: Reset all form states when switching between boards
        setShowForm(false);
        setIsEditing(false);
        setFormData({ title: '', content: '' });
        setSelectedPost(null);
        setComments([]);
        setFormError('');

        // 2. Fetch data for the new board
        fetchPosts();
        if (user) fetchUserUpvotes();
        
        // 3. Pilot Specific: Check if user already has a post to edit
        if (user && boardType === 'pilot') {
        supabase.from('pilot_posts').select('*').eq('user_id', user.id).maybeSingle()
            .then(({ data }) => {
            if (data) {
                setFormData({ title: data.title, content: data.content });
                setIsEditing(true);
                setShowForm(true);
            }
            });
        }
    }, [boardType, user]);

  const fetchPosts = async () => {
    setLoading(true);
    const { data } = await supabase
      .from(tableName)
      .select(`*, profiles(ign)`)
      .order('created_at', { ascending: false });
      
    if (data) setPosts(data);
    setLoading(false);
  };

  const fetchUserUpvotes = async () => {
    const { data } = await supabase
      .from('upvotes')
      .select('target_id, target_type')
      .eq('user_id', user.id);
      
    if (data) {
      const upvoteSet = new Set(data.map(u => `${u.target_type}-${u.target_id}`));
      setUserUpvotes(upvoteSet);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');

    if (isEditing) {
      const { error } = await supabase.from(tableName).update(formData).eq('user_id', user.id);
      if (error) setFormError(error.message);
      else fetchPosts();
    } else {
      const { error } = await supabase.from(tableName).insert([{ ...formData, user_id: user.id }]);
      if (error) {
        // Catch DB limits (Pilot: 1 post, Buy/Sell: 1 per day)
        setFormError(error.message);
      } else {
        setFormData({ title: '', content: '' });
        setShowForm(false);
        fetchPosts();
      }
    }
    setFormLoading(false);
  };

  const handleUpvote = async (targetType, targetId) => {
    if (!user) return alert("You must be logged in to upvote.");
    const key = `${targetType}-${targetId}`;
    const isUpvoted = userUpvotes.has(key);

    // Optimistic UI update
    const newUpvotes = new Set(userUpvotes);
    if (isUpvoted) newUpvotes.delete(key); else newUpvotes.add(key);
    setUserUpvotes(newUpvotes);

    if (isUpvoted) {
      await supabase.from('upvotes').delete().eq('user_id', user.id).eq('target_type', targetType).eq('target_id', targetId);
    } else {
      await supabase.from('upvotes').insert([{ user_id: user.id, target_type: targetType, target_id: targetId, board_type: boardType }]);
    }
  };

  const handleReport = async (targetType, targetId) => {
    if (!user) return;
    if (!window.confirm("Report this content? You can only submit 1 report per day.")) return;

    const { error } = await supabase.from('reports').insert([{
      reporter_id: user.id, target_type: targetType, target_id: targetId, board_type: boardType
    }]);

    if (error) alert(error.message); // Triggers daily limit error from DB
    else alert("Report submitted successfully.");
  };

  const openComments = async (post) => {
    setSelectedPost(post);
    const { data } = await supabase
      .from('comments')
      .select('*, profiles(ign)')
      .eq('board_type', boardType)
      .eq('post_id', post.id)
      .order('created_at', { ascending: true });
    if (data) setComments(data);
  };

  const addComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    
    const { data, error } = await supabase.from('comments').insert([{
      user_id: user.id, board_type: boardType, post_id: selectedPost.id, content: commentText
    }]).select('*, profiles(ign)').single();

    if (!error && data) {
      setComments([...comments, data]);
      setCommentText('');
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-extrabold text-white">{title}</h1>
        
        {/* Pilot logic: Hide 'Create' if editing, Others: show toggle */}
        {(boardType !== 'pilot' || !isEditing) && (
          <button 
            onClick={() => { setShowForm(!showForm); setFormError(''); }}
            className="px-5 py-2.5 rounded-lg bg-tavern-accent hover:bg-red-700 text-white font-bold transition-colors"
          >
            {showForm ? 'Cancel' : 'New Post'}
          </button>
        )}
      </div>

      {/* Create / Edit Form */}
      {showForm && (
        <form onSubmit={handleFormSubmit} className="mb-8 bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
          <h2 className="text-xl font-bold">{isEditing ? 'Edit Your Post' : 'Create Post'}</h2>
          <div>
            <label className="block text-sm text-white/70 mb-1">Title</label>
            <input type="text" required minLength={5} maxLength={150} value={formData.title} 
              onChange={e => setFormData({...formData, title: e.target.value})} className="input-style" placeholder="Title (5-150 chars)" />
          </div>
          <div>
            <label className="block text-sm text-white/70 mb-1">Content (Supports Markdown)</label>
            <textarea required minLength={20} maxLength={5000} rows={6} value={formData.content} 
              onChange={e => setFormData({...formData, content: e.target.value})} className="input-style resize-none" placeholder="Write your post here... (**bold**, *italic*, - lists)" />
          </div>
          
          {formError && <p className="text-red-400 text-sm font-semibold">{formError}</p>}
          
          <button type="submit" disabled={formLoading} className="w-full py-3 rounded-lg bg-tavern-accent hover:bg-red-700 text-white font-bold disabled:opacity-50">
            {formLoading ? 'Saving...' : (isEditing ? 'Update Post' : 'Publish Post')}
          </button>
        </form>
      )}

      {/* Post List or Detail View */}
      {!selectedPost ? (
        <div className="space-y-4">
          {loading ? <p className="text-white/40 text-center py-10">Loading posts...</p> : 
            posts.length === 0 ? <p className="text-white/40 text-center py-10">No posts yet. Be the first!</p> :
            posts.map(post => (
              <PostCard 
                key={post.id} post={post} boardType={boardType} 
                userUpvotes={userUpvotes} handleUpvote={handleUpvote} 
                handleReport={handleReport} openComments={openComments} 
              />
            ))
          }
        </div>
      ) : (
        <div>
          <button onClick={() => setSelectedPost(null)} className="mb-6 text-tavern-accent font-bold hover:underline flex items-center gap-2">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            Back to {title}
          </button>
          
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">{selectedPost.title}</h2>
                <p className="text-sm text-white/40">by {selectedPost.profiles?.ign || 'Unknown'} • {new Date(selectedPost.created_at).toLocaleDateString()}</p>
              </div>
              <button onClick={() => handleReport('post', selectedPost.id)} className="text-xs text-white/30 hover:text-red-400 transition-colors">Report</button>
            </div>
            
            <div className="mb-6 border-b border-white/10 pb-6">
              <Markdown content={selectedPost.content} />
            </div>

            <button onClick={() => handleUpvote('post', selectedPost.id)} 
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${userUpvotes.has(`post-${selectedPost.id}`) ? 'bg-tavern-accent/20 border-tavern-accent text-tavern-accent' : 'border-white/10 hover:border-white/30 text-white/60'}`}>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
              Upvote
            </button>
          </div>

          {/* Comments Section */}
          <div className="mt-8 space-y-4">
            <h3 className="text-xl font-bold text-white">Comments ({comments.length})</h3>
            
            <form onSubmit={addComment} className="flex gap-3">
              <input type="text" required minLength={1} maxLength={2000} value={commentText} 
                onChange={e => setCommentText(e.target.value)} className="input-style flex-1" placeholder="Add a comment..." />
              <button type="submit" className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-lg font-bold text-white transition-colors">Post</button>
            </form>

            {comments.map(c => (
              <div key={c.id} className="bg-white/5 border border-white/10 rounded-lg p-4 flex justify-between items-start">
                <div className="flex-1">
                  <p className="text-sm font-bold text-white mb-1">{c.profiles?.ign || 'Unknown'} <span className="font-normal text-white/30 text-xs ml-2">{new Date(c.created_at).toLocaleDateString()}</span></p>
                  <p className="text-white/80 text-sm">{c.content}</p>
                </div>
                <div className="flex items-center gap-4 ml-4 shrink-0">
                  <button onClick={() => handleUpvote('comment', c.id)} className={`text-sm transition-colors ${userUpvotes.has(`comment-${c.id}`) ? 'text-tavern-accent' : 'text-white/30 hover:text-white'}`}>
                    <svg className="w-4 h-4 inline mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
                  </button>
                  <button onClick={() => handleReport('comment', c.id)} className="text-xs text-white/30 hover:text-red-400 transition-colors">Report</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Isolated Post Card Component for the List View
function PostCard({ post, boardType, userUpvotes, handleUpvote, handleReport, openComments }) {
  const upvoteKey = `post-${post.id}`;
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-5 hover:border-white/20 transition-colors cursor-pointer"
         onClick={() => openComments(post)}>
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-bold text-white">{post.title}</h3>
        <button onClick={(e) => { e.stopPropagation(); handleReport('post', post.id); }} className="text-xs text-white/20 hover:text-red-400 transition-colors">Report</button>
      </div>
      <p className="text-sm text-white/40 mb-4">by {post.profiles?.ign || 'Unknown'} • {new Date(post.created_at).toLocaleDateString()}</p>
      
      <div className="text-white/70 text-sm line-clamp-2 mb-4">
        <Markdown content={post.content} />
      </div>

      <div className="flex items-center gap-4" onClick={e => e.stopPropagation()}>
        <button onClick={() => handleUpvote('post', post.id)} 
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${userUpvotes.has(upvoteKey) ? 'bg-tavern-accent/20 border-tavern-accent text-tavern-accent' : 'border-white/20 hover:border-tavern-accent text-white/80 hover:text-tavern-accent'}`}>
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
          Upvote
        </button>
        <span className="text-sm text-white/30">Click to view comments</span>
      </div>
    </div>
  );
}