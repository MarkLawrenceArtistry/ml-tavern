import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import TrainerCard from '../components/TrainerCard';

export default function PublicProfile() {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*, user_roles(role)')
        .eq('id', id)
        .single();
        
      setProfile(data);
      setLoading(false);
    };
    fetchProfile();
  }, [id]);

  if (loading) return <div className="text-center py-20 text-white/50">Loading profile...</div>;
  if (!profile) return <div className="text-center py-20 text-white/50">User not found.</div>;

  const initials = (profile.ign || '??').substring(0, 2).toUpperCase();

  return (
    <div className="max-w-4xl mx-auto py-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-12">
        {/* Avatar Circle */}
        <div className="w-28 h-28 rounded-full bg-tavern-accent/20 border-4 border-tavern-accent flex items-center justify-center shrink-0">
          <span className="text-4xl font-extrabold text-tavern-accent">{initials}</span>
        </div>

        {/* Info */}
        <div className="text-center md:text-left">
          <h1 className="text-4xl font-extrabold text-white mb-2">{profile.ign || 'Unknown'}</h1>
          <div className="flex flex-wrap gap-2 justify-center md:justify-start mb-4">
            <span className="px-3 py-1 bg-white/10 text-white/70 rounded-full text-xs font-bold">
              {profile.user_roles?.role === 'admin' ? 'Admin' : 'Player'}
            </span>
            {profile.main_role && <span className="px-3 py-1 bg-tavern-accent/20 text-tavern-accent rounded-full text-xs font-bold">{profile.main_role}</span>}
            {profile.current_team && <span className="px-3 py-1 bg-white/10 text-white/70 rounded-full text-xs font-bold">{profile.current_team}</span>}
          </div>
          <p className="text-white/50 max-w-xl">{profile.description || 'No description provided.'}</p>
        </div>
      </div>

      {/* Trainer Card Preview */}
      <h2 className="text-xl font-bold text-white mb-6 border-b border-white/10 pb-2">MLBB ID Card</h2>
      <div className="flex justify-center mb-16">
        <TrainerCard profile={profile} />
      </div>
    </div>
  );
}