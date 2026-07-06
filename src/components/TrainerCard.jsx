// ============================================================
// FILE: src/components/TrainerCard.jsx
// ============================================================
import { forwardRef, useState, useEffect } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import heroData from '../data/heroes.json';
import mlbbLogo from '../images/mlbb-logo.png';

const getProxyUrl = (url) => {
  if (!url) return null;
  return `https://images.weserv.nl/?url=${encodeURIComponent(url)}&w=150&h=150&fit=cover&t=square`;
};

const getHeroImg = (name) => {
  if (!Array.isArray(heroData) || !name) return null;
  const hero = heroData.find((h) => h.hero_name && h.hero_name.toLowerCase() === name.toLowerCase());
  return hero ? hero.portrait : null;
};

const TrainerCard = forwardRef(({ profile, hideDownload }, ref) => {
  const heroes = [profile.main_hero_1, profile.main_hero_2, profile.main_hero_3].filter(Boolean);

  const [safeImages, setSafeImages] = useState({});

  useEffect(() => {
    let isMounted = true;
    const loadImages = async () => {
      const needed = [profile.main_hero_1, profile.main_hero_2, profile.main_hero_3, profile.hate_hero, profile.love_hero].filter(Boolean);
      const fetched = {};
      for (const name of needed) {
        const imgUrl = getHeroImg(name);
        if (!imgUrl) continue;
        try {
          const res = await fetch(getProxyUrl(imgUrl));
          if (!res.ok) continue;
          const blob = await res.blob();
          const base64 = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(blob);
          });
          if (isMounted && base64) fetched[name] = base64;
        } catch (e) {
          // silent
        }
      }
      if (isMounted) setSafeImages((prev) => ({ ...prev, ...fetched }));
    };
    loadImages();
    return () => {
      isMounted = false;
    };
  }, [profile.main_hero_1, profile.main_hero_2, profile.main_hero_3, profile.hate_hero, profile.love_hero]);

  const getSafeSrc = (name) => safeImages[name] || null;

  const card = (
    <div
      ref={ref}
      id="trainer-card-img"
      className="w-full max-w-[600px] h-[300px] bg-gray-900 border border-gray-700 rounded-lg overflow-hidden flex font-sans text-white relative"
      style={{ fontFamily: "'Open Sans', sans-serif" }}
    >
      {/* LEFT PANEL — splash art background */}
      <div className="w-[38%] relative overflow-hidden">
        {/* Splash art */}
        <img
          src="/splash.jpg"
          alt=""
          className="absolute inset-0 w-full h-full object-cover object-center"
          crossOrigin="anonymous"
        />
        {/* Dark gradient overlays for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/20" />

        {/* Content */}
        <div className="relative z-10 w-full h-full p-6 flex flex-col justify-center items-center text-center">
          <p className="text-[10px] tracking-[0.2em] text-white/60 font-bold mb-2">ESPORTS CARD</p>
          <h2
            className="text-4xl font-extrabold leading-none break-words text-white"
            style={{ textShadow: '0 2px 8px rgba(0,0,0,0.7), 0 0 2px rgba(0,0,0,0.9)' }}
          >
            {profile.ign || 'UNKNOWN'}
          </h2>
          <div className="mt-4 w-16 h-0.5 bg-white/30 mx-auto"></div>
          <p className="mt-3 text-xs text-white/90 font-medium tracking-wide" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>
            {profile.current_team || 'FREE AGENT'}
          </p>
          {profile.description && (
            <p
              className="mt-4 text-[10px] text-white/70 leading-snug italic line-clamp-4"
              style={{ textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}
            >
              &quot;{profile.description}&quot;
            </p>
          )}
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="w-[62%] p-5 flex flex-col justify-between bg-gray-900 relative">
        <img src={mlbbLogo} alt="" className="absolute top-4 right-4 h-4 w-auto object-contain opacity-40 brightness-0 invert pointer-events-none" />
        <div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs mb-4">
            <div>
              <p className="text-gray-500 font-bold" style={{ fontSize: '9px' }}>CLASS</p>
              <p className="font-bold text-tavern-accent">{profile.main_role || '---'}</p>
            </div>
            <div>
              <p className="text-gray-500 font-bold" style={{ fontSize: '9px' }}>SPECIAL</p>
              <p className="font-bold">{profile.second_role || '---'}</p>
            </div>
            <div>
              <p className="text-gray-500 font-bold" style={{ fontSize: '9px' }}>ESPORTS</p>
              <p className="font-bold truncate">{profile.favorite_esports_team || '---'}</p>
            </div>
            <div>
              <p className="text-gray-500 font-bold" style={{ fontSize: '9px' }}>ACTIVE SINCE</p>
              <p className="font-bold">{profile.started_playing_month || '??'} {profile.started_playing_day || '??'}</p>
            </div>
          </div>
          <div className="mb-4">
            <p className="text-gray-500 font-bold tracking-wider mb-1.5" style={{ fontSize: '9px' }}>MAIN ARSENAL</p>
            <div className="flex gap-2">
              {heroes.length > 0 ? heroes.map((hero, i) => (
                <div key={i} className="w-10 h-10 rounded bg-gray-800 border border-gray-700 overflow-hidden shrink-0 flex items-center justify-center">
                  {getSafeSrc(hero) ? <img src={getSafeSrc(hero)} alt={hero} className="w-full h-full object-cover" /> : <span className="text-[8px] text-gray-500 text-center leading-tight px-0.5">{hero}</span>}
                </div>
              )) : <p className="text-xs text-gray-600 font-bold">EMPTY</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <MetaBlock label="HATE MATCHUP" name={profile.hate_hero} color="text-red-400" border="border-red-500/30" getSafeSrc={getSafeSrc} />
            <MetaBlock label="WANT AS TEAMMATE" name={profile.love_hero} color="text-green-400" border="border-green-500/30" getSafeSrc={getSafeSrc} />
          </div>
        </div>
        <div className="mt-auto border-t border-gray-700 pt-2 flex justify-between items-end">
          <div>
            <p className="text-[8px] text-gray-600 uppercase tracking-widest">Verified Player</p>
            <p className="text-xs font-bold text-gray-300">mlbb-tavern.site</p>
          </div>
          <div className="bg-white p-1 rounded-sm">
            <QRCodeCanvas value="https://mlbb-tavern.site" size={36} bgColor="#ffffff" fgColor="#000000" level="L" />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full h-[180px]">
      <div
        className="p-5 rounded-md border border-gray-50/10 flex justify-center items-center sm:transform-none transform origin-top-left"
        style={{ transform: 'scale(0.56)', width: '178.6%' }}
      >
        <div>
          {card}
        </div>
      </div>
    </div>
  );
});

function MetaBlock({ label, name, color, border, getSafeSrc }) {
  return (
    <div className={`border ${border} rounded p-1.5 flex items-center gap-2 bg-black/30`}>
      <div className="w-7 h-7 rounded bg-gray-800 border border-gray-700 overflow-hidden shrink-0 flex items-center justify-center">
        {getSafeSrc(name) ? <img src={getSafeSrc(name)} alt={name} className="w-full h-full object-cover" /> : <span className="text-[7px] text-gray-500">...</span>}
      </div>
      <div className="min-w-0">
        <p className="text-[7px] text-gray-500 font-bold leading-none">{label}</p>
        <p className={`text-[10px] font-bold ${color} leading-tight truncate`}>{name || '---'}</p>
      </div>
    </div>
  );
}

TrainerCard.displayName = 'TrainerCard';
export default TrainerCard;