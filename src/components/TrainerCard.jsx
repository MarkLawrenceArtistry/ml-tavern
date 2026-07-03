import { forwardRef, useState } from 'react';
import { toPng } from 'html-to-image';
import { QRCodeSVG } from 'qrcode.react';
import heroData from '../data/heroes.json';

const TrainerCard = forwardRef(({ profile, hideDownload }, ref) => {
  const handleDownload = async () => {
    if (!ref.current) return;
    try {
      const dataUrl = await toPng(ref.current, { cacheBust: true, pixelRatio: 3 });
      const link = document.createElement('a');
      link.download = `MLBB-ID-${profile.ign || 'card'}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to download image', err);
    }
  };

  const initials = (profile.ign || '??').substring(0, 2).toUpperCase();
  
  // Helper to find hero portrait safely
    // Helper to find hero portrait safely
  const getHeroImg = (name) => {
    if (!Array.isArray(heroData) || !name) return null;
    const hero = heroData.find(h => h.hero_name && h.hero_name.toLowerCase() === name.toLowerCase());
    return hero ? hero.portrait : null;
  };

  const mainHeroes = [profile.main_hero_1, profile.main_hero_2, profile.main_hero_3].filter(Boolean);

  return (
    <div className="flex flex-col items-center gap-4">
      {!hideDownload && (
        <button onClick={handleDownload} className="flex items-center gap-2 px-4 py-2 rounded-md bg-tavern-accent hover:bg-red-700 text-white text-sm font-bold transition-colors">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
          Download ID Card
        </button>
      )}

      {/* VERTICAL FLAT CARD */}
      <div 
        ref={ref}
        className="w-[360px] bg-gray-900 border-2 border-gray-600 rounded-sm overflow-hidden font-sans text-white"
        style={{ fontFamily: "'Open Sans', sans-serif" }}
      >
        {/* Header */}
        <div className="bg-tavern-accent px-4 py-3 flex items-center justify-between">
          <h2 className="text-sm font-extrabold tracking-widest">MLBB IDENTITY CARD</h2>
          <span className="text-xs font-bold text-white/80">ML TAVERN</span>
        </div>

        <div className="p-5">
          {/* Top Section: Identity & Main Stats */}
          <div className="flex gap-5 mb-6 border-b border-gray-700 pb-6">
            <div className="flex flex-col items-center w-24 shrink-0">
              <div className="w-20 h-20 rounded-full border-4 border-gray-600 flex items-center justify-center bg-gray-800">
                <span className="text-3xl font-extrabold text-white">{initials}</span>
              </div>
              <h3 className="text-lg font-extrabold text-center mt-2 leading-tight">{profile.ign || 'UNKNOWN'}</h3>
            </div>

            <div className="flex-1 grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
              <div>
                <p className="text-gray-500 font-bold uppercase" style={{fontSize: '10px'}}>Class</p>
                <p className="font-bold text-tavern-accent">{profile.main_role || '---'}</p>
              </div>
              <div>
                <p className="text-gray-500 font-bold uppercase" style={{fontSize: '10px'}}>Special</p>
                <p className="font-bold">{profile.second_role || '---'}</p>
              </div>
              <div>
                <p className="text-gray-500 font-bold uppercase" style={{fontSize: '10px'}}>Esports</p>
                <p className="font-bold truncate">{profile.favorite_esports_team || '---'}</p>
              </div>
              <div>
                <p className="text-gray-500 font-bold uppercase" style={{fontSize: '10px'}}>Active Since</p>
                <p className="font-bold">{profile.started_playing_month || '??'} {profile.started_playing_day || '??'}</p>
              </div>
              {profile.current_team && (
                <div className="col-span-2">
                  <p className="text-gray-500 font-bold uppercase" style={{fontSize: '10px'}}>Current Team</p>
                  <p className="font-bold">{profile.current_team}</p>
                </div>
              )}
            </div>
          </div>

          {/* Middle Section: Heroes & Meta */}
          <div className="mb-6">
            <p className="text-gray-500 font-bold uppercase mb-2" style={{fontSize: '10px'}}>Main Arsenal</p>
            <div className="flex gap-3 mb-4">
              {mainHeroes.length > 0 ? mainHeroes.map((hero, i) => (
                <HeroIcon key={i} name={hero} imgUrl={getHeroImg(hero)} />
              )) : (
                <p className="text-sm text-gray-600 font-bold">EMPTY</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-500 font-bold uppercase mb-1" style={{fontSize: '10px'}}>Nemesis</p>
                <div className="h-14 bg-gray-800 border border-gray-700 rounded flex items-center justify-center px-2">
                  <HeroIcon name={profile.hate_hero} imgUrl={getHeroImg(profile.hate_hero)} small />
                </div>
              </div>
              <div>
                <p className="text-gray-500 font-bold uppercase mb-1" style={{fontSize: '10px'}}>Synergy</p>
                <div className="h-14 bg-gray-800 border border-gray-700 rounded flex items-center justify-center px-2">
                  <HeroIcon name={profile.love_hero} imgUrl={getHeroImg(profile.love_hero)} small />
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Section: QR & Link */}
          <div className="border-t border-gray-700 pt-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest">Verified Player</p>
              <p className="text-sm font-bold text-gray-400">ml-tavern.vercel.app</p>
            </div>
            <div className="bg-white p-1.5 rounded-sm">
              <QRCodeSVG value="https://ml-tavern.vercel.app" size={50} bgColor="#ffffff" fgColor="#000000" level="L" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

// Sub-component for Hero Images
function HeroIcon({ name, imgUrl, small }) {
  const [error, setError] = useState(false);
  
  if (!name || error || !imgUrl) {
    return <span className={`${small ? 'text-xs' : 'text-sm'} font-bold text-gray-400`}>{name || '---'}</span>;
  }

  return (
    <div className={`${small ? 'w-8 h-8' : 'w-12 h-12'} rounded border border-gray-600 bg-gray-800 overflow-hidden shrink-0`}>
      <img 
        src={imgUrl} 
        alt={name}
        className="w-full h-full object-cover object-top"
        onError={() => setError(true)}
      />
    </div>
  );
}

export default TrainerCard;