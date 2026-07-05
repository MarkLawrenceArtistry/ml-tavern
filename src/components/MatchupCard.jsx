// ==================== MatchupCard.jsx ====================
import { forwardRef, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import heroData from '../data/heroes.json';

const getProxyUrl = (url) => `https://images.weserv.nl/?url=${encodeURIComponent(url)}&w=120&h=120&fit=cover&t=square`;
const getHeroImg = (name) => {
  if (!Array.isArray(heroData) || !name) return null;
  return heroData.find(h => h.hero_name?.toLowerCase() === name.toLowerCase())?.portrait || null;
};

const ROLE_LABELS = {
  gold: 'GOLD',
  mid: 'MID',
  jungle: 'JGL',
  roam: 'ROAM',
  exp: 'EXP'
};

function HeroPortrait({ name, role, borderColor, accentColor }) {
  const [err, setErr] = useState(false);
  const imgUrl = getHeroImg(name);
  const label = ROLE_LABELS[role] || role?.toUpperCase() || '';

  return (
    <div className="flex flex-col items-center gap-1">
      <span
        className="text-[7px] sm:text-[8px] md:text-[9px] font-bold uppercase tracking-widest leading-none"
        style={{ color: accentColor }}
      >
        {label}
      </span>
      {!imgUrl || err ? (
        <div className={`w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-md border-2 ${borderColor} bg-gray-900 flex items-center justify-center text-[10px] sm:text-xs text-white/30 font-bold`}>
          {name?.substring(0, 2)}
        </div>
      ) : (
        <img
          src={getProxyUrl(imgUrl)}
          alt={name}
          crossOrigin="anonymous"
          className={`w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-md border-2 ${borderColor} object-cover`}
          onError={() => setErr(true)}
        />
      )}
    </div>
  );
}

const extractScores = (rawText) => {
  const fallback = { yourScore: 0, enemyScore: 0 };
  if (!rawText) return fallback;
  const match = rawText.match(/(\d+)\s*[-–—]\s*(\d+)/);
  if (!match) return fallback;
  return { yourScore: parseInt(match[1]), enemyScore: parseInt(match[2]) };
};

const extractWinner = (rawText) => {
  if (!rawText) return null;
  if (rawText.includes('YOUR TEAM')) return 'YOUR TEAM';
  if (rawText.includes('ENEMY TEAM')) return 'ENEMY TEAM';
  return 'UNKNOWN';
};

const WinBars = ({ filled }) => (
  <div className="flex gap-1.5 sm:gap-2 justify-center mb-4 sm:mb-6">
    {[1, 2, 3].map(i => (
      <div
        key={i}
        className={`h-1 sm:h-1.5 w-10 sm:w-16 rounded-sm border-2 transition-colors duration-300 ${
          i <= filled ? 'bg-white border-white' : 'border-white/20 bg-transparent'
        }`}
      />
    ))}
  </div>
);

const MatchupCard = forwardRef(({ yourTeam, enemyTeam, winnerText }, ref) => {
  // Use entries to preserve role keys
  const team1Entries = Object.entries(yourTeam).filter(([, v]) => Boolean(v));
  const team2Entries = Object.entries(enemyTeam).filter(([, v]) => Boolean(v));
  const cleanWinner = extractWinner(winnerText) || "UNKNOWN";
  const { yourScore, enemyScore } = extractScores(winnerText);

  return (
    <div
      ref={ref}
      id="matchup-card-img"
      className="w-full bg-black border border-gray-800 rounded-sm overflow-hidden font-sans text-white shadow-2xl"
      style={{ fontFamily: "'Open Sans', sans-serif" }}
    >
      {/* Winner Banner */}
      <div className="bg-gradient-to-b from-gray-900 via-black to-gray-950 px-4 sm:px-8 py-6 sm:py-10 text-center border-b border-gray-800">
        <p className="text-[9px] sm:text-[11px] text-gray-500 uppercase tracking-[0.3em] sm:tracking-[0.4em] mb-2 sm:mb-3">Match Prediction</p>
        <h2
          className="text-3xl sm:text-4xl md:text-6xl font-black uppercase tracking-tight text-white leading-none"
          style={{ textShadow: '0 0 20px rgba(255, 36, 0, 0.4)' }}
        >
          {cleanWinner}
        </h2>
        {(yourScore > 0 || enemyScore > 0) && (
          <p className="mt-3 sm:mt-4 text-xl sm:text-2xl md:text-3xl font-black text-white/80 tracking-widest tabular-nums">
            {yourScore} <span className="text-white/30 mx-1">-</span> {enemyScore}
          </p>
        )}
      </div>

      {/* Matchup Grid */}
      <div className="px-4 sm:px-8 py-6 sm:py-10 bg-gradient-to-b from-gray-900/50 to-black">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 md:gap-6 items-start">

          {/* Blue Side */}
          <div className="text-center">
            <WinBars filled={yourScore} />
            <h3 className="text-blue-400 font-black text-[10px] sm:text-sm md:text-base uppercase tracking-[0.2em] sm:tracking-[0.3em] mb-3 sm:mb-6">
              Blue Side (Your Team)
            </h3>
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
              {team1Entries.map(([role, hero]) => (
                <HeroPortrait
                  key={role}
                  name={hero}
                  role={role}
                  borderColor="border-blue-500/50"
                  accentColor="rgba(96, 165, 250, 0.7)"
                />
              ))}
            </div>
          </div>

          {/* VS Badge */}
          <div className="flex items-center justify-center py-1 md:py-0 md:-my-4">
            <div className="flex md:hidden w-full items-center">
              <div className="flex-1 h-px bg-white/10" />
              <div className="w-12 h-12 sm:w-14 sm:h-14 mx-3 rounded-md border-2 border-white/20 bg-gray-900 flex items-center justify-center shadow-lg shadow-black/50 shrink-0">
                <span className="text-lg sm:text-xl font-black text-white/60 tracking-wider">VS</span>
              </div>
              <div className="flex-1 h-px bg-white/10" />
            </div>
            <div className="hidden md:flex flex-col items-center">
              <div className="w-px h-8 bg-white/10" />
              <div className="w-16 h-16 rounded-md border-2 border-white/20 bg-gray-900 flex items-center justify-center shadow-lg shadow-black/50">
                <span className="text-2xl font-black text-white/60 tracking-wider">VS</span>
              </div>
              <div className="w-px h-8 bg-white/10" />
            </div>
          </div>

          {/* Red Side */}
          <div className="text-center">
            <WinBars filled={enemyScore} />
            <h3 className="text-red-500 font-black text-[10px] sm:text-sm md:text-base uppercase tracking-[0.2em] sm:tracking-[0.3em] mb-3 sm:mb-6">
              Red Side (Enemy Team)
            </h3>
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
              {team2Entries.map(([role, hero]) => (
                <HeroPortrait
                  key={role}
                  name={hero}
                  role={role}
                  borderColor="border-red-500/50"
                  accentColor="rgba(248, 113, 113, 0.7)"
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer / Branding */}
      <div className="px-4 sm:px-8 py-3 sm:py-5 border-t border-gray-800 bg-black/50 flex justify-between items-center">
        <div className="flex items-center justify-center gap-2">
          <div className="bg-white p-0.5 rounded-sm">
            <QRCodeCanvas
              value="https://ml-tavern.vercel.app"
              size={24}
              bgColor="#ffffff"
              fgColor="#000000"
              level="L"
            />
          </div>
        </div>
        <p className="text-[9px] sm:text-[10px] font-bold text-white/30">ml-tavern.vercel.app</p>
      </div>
    </div>
  );
});

MatchupCard.displayName = 'MatchupCard';
export default MatchupCard;