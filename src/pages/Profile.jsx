import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import TrainerCard from '../components/TrainerCard';

const MLBB_ROLES = ['Gold Lane', 'Mid Lane', 'Jungle', 'Roam', 'EXP Lane'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function Profile() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  
  const [profile, setProfile] = useState({
    ign: '',
    description: '',
    current_team: '',
    main_hero_1: '',
    main_hero_2: '',
    main_hero_3: '',
    main_role: '',
    second_role: '',
    hate_hero: '',
    love_hero: '',
    favorite_esports_team: '',
    started_playing_month: '',
    started_playing_day: '',
  });

  useEffect(() => {
    if (user) fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (error) console.error(error);
    if (data) setProfile(data);
    setLoading(false);
  };

  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    const { error } = await supabase
      .from('profiles')
      .update(profile)
      .eq('id', user.id);

    if (error) {
      setMessage('Failed to save profile.');
    } else {
      setMessage('Profile saved successfully!');
    }
    setSaving(false);
  };

  if (loading) return <div className="text-center py-20 text-white/50">Loading profile...</div>;

  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-3xl font-extrabold text-white mb-8">Trainer Card Settings</h1>

      {/* TOP: Live Preview */}
      <div className="flex justify-center items-start mb-16 bg-white/5 border border-white/10 rounded-xl p-8">
        <TrainerCard profile={profile} hideDownload />
      </div>

      {/* BOTTOM: Edit Form */}
      <div className="max-w-2xl mx-auto">
        <h2 className="text-xl font-bold text-white mb-6 border-b border-white/10 pb-2">Edit Details</h2>
        
        <form onSubmit={handleSave} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1">In-Game Name (IGN)</label>
            <input type="text" name="ign" value={profile.ign} onChange={handleChange} className="input-style" placeholder="e.g. ProPlayer123" />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/70 mb-1">Bio / Description</label>
            <textarea name="description" value={profile.description} onChange={handleChange} className="input-style resize-none h-20" placeholder="Tell us about yourself..." />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/70 mb-1">Current Team</label>
            <input type="text" name="current_team" value={profile.current_team} onChange={handleChange} className="input-style" placeholder="e.g. Team Azura" />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/70 mb-1">Main Heroes (Must match JSON names exactly for icons)</label>
            <div className="grid grid-cols-3 gap-3">
              <input type="text" name="main_hero_1" value={profile.main_hero_1} onChange={handleChange} className="input-style" placeholder="Hero 1" />
              <input type="text" name="main_hero_2" value={profile.main_hero_2} onChange={handleChange} className="input-style" placeholder="Hero 2" />
              <input type="text" name="main_hero_3" value={profile.main_hero_3} onChange={handleChange} className="input-style" placeholder="Hero 3" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1">Main Role</label>
              <select name="main_role" value={profile.main_role} onChange={handleChange} className="input-style">
                <option value="">Select Role</option>
                {MLBB_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1">Second Role</label>
              <select name="second_role" value={profile.second_role} onChange={handleChange} className="input-style">
                <option value="">Select Role</option>
                {MLBB_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1">Hate Matchup</label>
              <input type="text" name="hate_hero" value={profile.hate_hero} onChange={handleChange} className="input-style" placeholder="e.g. Fanny" />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1">Love Teammate</label>
              <input type="text" name="love_hero" value={profile.love_hero} onChange={handleChange} className="input-style" placeholder="e.g. Angela" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/70 mb-1">Favorite MLBB Esports Team</label>
            <input type="text" name="favorite_esports_team" value={profile.favorite_esports_team} onChange={handleChange} className="input-style" placeholder="e.g. Blacklist International" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1">Started Playing (Month)</label>
              <select name="started_playing_month" value={profile.started_playing_month} onChange={handleChange} className="input-style">
                <option value="">Select Month</option>
                {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1">Started Playing (Year)</label>
              <input type="text" name="started_playing_day" value={profile.started_playing_day} onChange={handleChange} className="input-style" placeholder="e.g. 2018" />
            </div>
          </div>

          {message && (
            <p className={`text-sm font-semibold ${message.includes('Failed') ? 'text-red-400' : 'text-green-400'}`}>
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 rounded-lg bg-tavern-accent hover:bg-red-700 text-white font-bold transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </form>
      </div>
    </div>
  );
}