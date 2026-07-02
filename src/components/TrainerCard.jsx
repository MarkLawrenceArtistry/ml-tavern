import { forwardRef } from 'react';
import { toPng } from 'html-to-image';

const TrainerCard = forwardRef(({ profile }, ref) => {
  const handleDownload = async () => {
    if (!ref.current) return;
    try {
      const dataUrl = await toPng(ref.current, { cacheBust: true, pixelRatio: 2 });
      const link = document.createElement('a');
      link.download = `MLBB-Trainer-${profile.ign || 'card'}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to download image', err);
    }
  };

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Download Button */}
      <button
        onClick={handleDownload}
        className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-tavern-accent hover:bg-red-700 text-white font-bold transition-colors"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="7 10 12 15 17 10"></polyline>
          <line x1="12" y1="15" x2="12" y2="3"></line>
        </svg>
        Download as PNG
      </button>

      {/* The Retro Card Itself */}
      <div 
        ref={ref}
        className="w-[380px] bg-gray-900 border-4 border-double border-gray-600 rounded-sm shadow-2xl font-sans text-white overflow-hidden"
        style={{ imageRendering: 'pixelated' }}
      >
        {/* Header */}
        <div className="bg-tavern-accent p-3 text-center border-b-4 border-gray-800">
          <h2 className="text-2xl font-extrabold tracking-widest text-white" style={{ textShadow: '2px 2px 0px #000' }}>
            TRAINER CARD
          </h2>
        </div>

        <div className="p-5 flex gap-5">
          {/* Left Column: ID & Details */}
          <div className="flex-1 space-y-3 text-sm">
            <div>
              <p className="text-gray-400 text-xs font-bold">ID / IGN</p>
              <p className="text-xl font-extrabold break-all">{profile.ign || '---'}</p>
            </div>
            
            <div>
              <p className="text-gray-400 text-xs font-bold">MAIN ROLE</p>
              <p className="font-bold text-tavern-accent">{profile.main_role || '---'}</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs font-bold">2ND ROLE</p>
              <p className="font-bold">{profile.second_role || '---'}</p>
            </div>
            
            <div>
              <p className="text-gray-400 text-xs font-bold">PLAYING SINCE</p>
              <p className="font-bold">{profile.started_playing_month || '??'} {profile.started_playing_day || '??'}</p>
            </div>
            
            <div>
              <p className="text-gray-400 text-xs font-bold">FAV ESPORTS TEAM</p>
              <p className="font-bold italic">{profile.favorite_esports_team || '---'}</p>
            </div>
          </div>

          {/* Right Column: Heroes & Matchups */}
          <div className="w-[160px] space-y-4 border-l-4 border-dashed border-gray-700 pl-4">
            <div>
              <p className="text-gray-400 text-xs font-bold mb-1">MAIN HEROES</p>
              <ul className="space-y-1 text-sm font-bold text-tavern-light">
                <li>• {profile.main_hero_1 || '---'}</li>
                <li>• {profile.main_hero_2 || '---'}</li>
                <li>• {profile.main_hero_3 || '---'}</li>
              </ul>
            </div>
            
            <div className="bg-gray-800/50 p-2 rounded border border-gray-700">
              <p className="text-gray-400 text-xs font-bold">HATE MATCHUP</p>
              <p className="text-red-500 font-extrabold text-lg text-center">✕ {profile.hate_hero || '---'}</p>
            </div>

            <div className="bg-gray-800/50 p-2 rounded border border-gray-700">
              <p className="text-gray-400 text-xs font-bold">LOVE TEAMMATE</p>
              <p className="text-green-400 font-extrabold text-lg text-center">♥ {profile.love_hero || '---'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default TrainerCard;