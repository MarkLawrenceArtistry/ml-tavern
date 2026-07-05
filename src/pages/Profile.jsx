import { useState, useEffect, useRef } from 'react';
import { toPng } from 'html-to-image';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import TrainerCard from '../components/TrainerCard';

const MLBB_ROLES = ['Gold Lane', 'Mid Lane', 'Jungle', 'Roam', 'EXP Lane'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function Profile() {
  const { user } = useAuth();
  const cardRef = useRef(); // Ref to capture the card for download
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
        card_color: '#FF2400',
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

  // Download logic moved here so we can put the button outside the card
  const handleDownload = async () => {
    if (!cardRef.current) return;
    try {
      const dataUrl = await toPng(cardRef.current, { cacheBust: true, pixelRatio: 3 });
      const link = document.createElement('a');
      link.download = `MLBB-ID-${profile.ign || 'card'}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to download image', err);
    }
  };

  if (loading) return <div className="text-center py-20 text-white/50">Loading profile...</div>;

  return (
    <div className="max-w-6xl mx-auto py-8">
        <h1 className="text-3xl font-extrabold text-white mb-10">Esports Card Settings</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        
        {/* LEFT DIV: Trainer Card + Download Button */}
        <div className="flex flex-col items-center">
          <div className="lg:sticky lg:top-24">
            {/* Pass ref here to capture the card, hideDownload to remove internal button */}
            <TrainerCard ref={cardRef} profile={profile} hideDownload />
            
            {/* The Download Button exactly at the bottom of the card */}
            <button 
              onClick={handleDownload} 
              className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-md bg-tavern-accent hover:bg-red-700 text-white text-sm font-bold transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              Download as PNG
            </button>
          </div>
        </div>

        {/* RIGHT DIV: The Edit Form */}
        <div className="w-full max-w-xl">
          <h2 className="text-xl font-bold text-white mb-6 border-b border-white/10 pb-2">Edit Details</h2>
          
          <form onSubmit={handleSave} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1">In-Game Name (IGN)</label>
              <input type="text" name="ign" value={profile.ign} onChange={handleChange} className="input-style" placeholder="e.g. ProPlayer123" />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/70 mb-1">ID No. / Bio / Description</label>
              <textarea name="description" value={profile.description} onChange={handleChange} className="input-style resize-none h-20" placeholder="Tell us about yourself..." />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/70 mb-1">Current Team</label>
              <input type="text" name="current_team" value={profile.current_team} onChange={handleChange} className="input-style" placeholder="e.g. Team Azura" />
            </div>

                      <div>
            <label className="block text-sm font-medium text-white/70 mb-1">Card Accent Color</label>
            <div className="flex items-center gap-3">
              <input type="color" name="card_color" value={profile.card_color} onChange={handleChange} className="w-10 h-10 rounded cursor-pointer bg-transparent border-0" />
              <input type="text" name="card_color" value={profile.card_color} onChange={handleChange} className="input-style w-32" placeholder="#FF2400" />
            </div>
          </div>

            <div>
              <label className="block text-sm font-medium text-white/70 mb-1">Main Heroes (type the name of the hero!)</label>
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
    </div>
  );
}