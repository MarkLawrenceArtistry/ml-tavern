// ============================================================
// FILE: src/pages/MapPlanner.jsx
// ============================================================
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import heroData from '../data/heroes.json';

/* ── Helpers ── */
const getProxyUrl = (url) =>
  `https://images.weserv.nl/?url=${encodeURIComponent(url)}&w=80&h=80&fit=cover&t=square`;

function getHeroPortrait(name) {
  if (!Array.isArray(heroData) || !name) return null;
  return heroData.find((h) => h.hero_name?.toLowerCase() === name.toLowerCase())?.portrait || null;
}

/* ═══════════════════════════════════════════════════════════════
   CAMP COORDINATES — DO NOT MIRROR. Each side uses its own coords.
   x = % from LEFT, y = % from TOP of minimap image
   ═══════════════════════════════════════════════════════════════ */

const BLUE_PATH = [
  { id: 'tf', name: 'Thunder Fenrir',  x: 25.28, y: 51.68, type: 'blue',  time: '0:00', gold: '100g', tip: 'Grants Purple Buff (Thunder Morale) — drastic cooldown reduction and mana/energy cost cut. Absolutely essential for energy-hungry or spam-heavy assassins. Smite the large Fenrir to secure.' },
  { id: 'sl', name: 'Scaled Lizard',   x: 16.33, y: 42.51, type: 'small', time: '0:22', gold: '~85g',  tip: 'Basic green camp near Blue Buff. Gives a solid chunk of EXP and health recovery upon defeat. Pull toward your next camp to save travel time.' },
  { id: 'sc', name: 'Scavenger Crab',  x: 39.15, y: 38.93, type: 'crab',  time: '1:05', gold: '36g+',  tip: 'Starts as a small "Little Crab" and scales up at the 3-minute mark into a larger Scavenger Crab. Securing it gives a passive gold-per-second buff to snowball your laners.' },
  { id: 'fb', name: 'Fire Beetle',    x: 18.57, y: 26.40, type: 'gold',  time: '2:10', gold: '~90g',  tip: 'Killing the main Beetle spawns smaller Crammers that survive up to 30 seconds. Great for AoE heroes — clear fast so Crammers don\'t disrupt your lane. First clear complete!' },
  { id: 'mf', name: 'Molten Fiend',   x: 46.09, y: 78.08, type: 'red',   time: '1:30', gold: '120g', tip: 'Grants Orange Buff (Soul of Lava) — true damage burn and heavy slow on basic attacks and skills. Your primary ganking tool. Smite to secure if the enemy is near.' },
  { id: 'lg', name: 'Lava Golem',     x: 50.11, y: 73.60, type: 'small', time: '1:50', gold: '~80g',  tip: 'Large defense-oriented green camp near Red Buff. Rewards a basic healing buff and gold. Good sustain before you look for a gank at level 4.' },
  { id: 'lw', name: 'Lithowanderer',   x: 61.74, y: 81.21, type: 'litho', time: '0:45', gold: '—',     tip: 'Spawns in the river early. Defeating it gives a small mana-regen aura and spawns a Stone Roamer scout that patrols the river for team vision. Don\'t skip this — free vision is huge.' },
];

const RED_PATH = [
  { id: 'mf', name: 'Molten Fiend',   x: 46.31, y: 78.08, type: 'red',   time: '0:00', gold: '120g', tip: 'Grants Orange Buff (Soul of Lava) — true damage burn and heavy slow on hit. Strong for early gank-oriented starts. Smite the large Fiend to secure it.' },
  { id: 'lg', name: 'Lava Golem',     x: 50.11, y: 73.60, type: 'small', time: '1:50', gold: '~80g',  tip: 'Large defense-oriented green camp near Red Buff. Rewards a basic healing buff and gold. Good sustain before you look for a gank at level 4.' },
  { id: 'fb', name: 'Fire Beetle',    x: 62.19, y: 81.43, type: 'gold',  time: '2:10', gold: '~90g',  tip: 'Killing the main Beetle spawns smaller Crammers that survive up to 30 seconds. Great for AoE heroes — clear fast so Crammers don\'t disrupt your lane. First clear complete!' },
  { id: 'sc', name: 'Scavenger Crab',  x: 81.66, y: 73.83, type: 'crab',  time: '1:05', gold: '36g+',  tip: 'Starts as a small "Little Crab" and scales up at the 3-minute mark into a larger Scavenger Crab. Securing it gives a passive gold-per-second buff to snowball your laners.' },
  { id: 'tf', name: 'Thunder Fenrir',  x: 25.28, y: 51.68, type: 'blue',  time: '0:00', gold: '100g', tip: 'Grants Purple Buff (Thunder Morale) — drastic cooldown reduction and mana/energy cost cut. Absolutely essential for energy-hungry or spam-heavy assassins. Smite the large Fenrir to secure.' },
  { id: 'sl', name: 'Scaled Lizard',   x: 16.33, y: 42.51, type: 'small', time: '0:22', gold: '~85g',  tip: 'Basic green camp near Blue Buff. Gives a solid chunk of EXP and health recovery upon defeat. Pull toward your next camp to save travel time.' },
  { id: 'lw', name: 'Lithowanderer',   x: 38.93, y: 38.93, type: 'litho', time: '1:05', gold: '—',     tip: 'Spawns in the river early. Gives a mana-regen aura and spawns a Stone Roamer scout for team vision. Free vision is massive — always worth picking up on your way across.' },
];

/* ── Hero-based path variation: ONLY changes order, times, and tips. NEVER touches coordinates. ── */
function getPathForHero(heroName, side) {
  const base = side === 'blue' ? BLUE_PATH.map((c) => ({ ...c })) : RED_PATH.map((c) => ({ ...c }));
  const hash = heroName.split('').reduce((a, c) => a + c.charCodeAt(0), 0);

  if (hash % 3 === 0) {
    // "Fast river" — swap step 2 (Lizard) and step 3 (Crab) so you hit river earlier
    const lizard = { ...base[1] };
    const crab = { ...base[2] };
    base[1] = { ...crab, time: '0:18', tip: 'Rush Scavenger Crab early to establish river control and gold advantage before the enemy jungler arrives. You\'ll clear Scaled Lizard on the way back.' };
    base[2] = { ...lizard, time: '0:42', tip: 'Scaled Lizard (~85g). Clear on the way back from the river. Slightly less optimal XP order but faster river presence for early ganks and vision fights.' };
  } else if (hash % 3 === 1) {
    // "Efficient clear" — swap step 6 (Golem) and step 7 (Litho) so you grab vision before finishing
    const golem = { ...base[5] };
    const litho = { ...base[6] };
    base[5] = { ...litho, time: '1:42', tip: 'Grab Lithowanderer on the way to your final camp. Stone Roamer vision will help your team spot the enemy jungler while you finish clearing.' };
    base[6] = { ...golem, time: '1:58', tip: 'Lava Golem (~80g). Last camp of the clear — the healing buff helps sustain you for the gank you\'re about to make.' };
  } else {
    // Default — add extra detail to Litho tip
    base[6].tip += ' Note: Stone Roamer vision lasts a while, so even if you take it late in the clear, your team benefits for minutes afterward.';
  }

  return base;
}

const CAMP_DOT_COLOR = {
  blue: '#8866ff',
  red: '#ff4444',
  gold: '#ffcc00',
  small: '#44bb77',
  crab: '#ff8844',
  litho: '#66ccff',
};

/* ── Hero Grid ── */
function HeroGrid({ selected, onSelect }) {
  const [search, setSearch] = useState('');
  const filtered = search
    ? heroData.filter((h) => h.hero_name?.toLowerCase().includes(search.toLowerCase()))
    : heroData;

  return (
    <div>
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search hero..."
        className="input-style mb-3"
      />
      <div className="grid grid-cols-6 sm:grid-cols-8 gap-1.5 max-h-56 overflow-y-auto pr-1">
        {filtered.map((h) => {
          const url = h.portrait ? getProxyUrl(h.portrait) : null;
          return (
            <button
              key={h.hero_name}
              onClick={() => onSelect(h.hero_name)}
              title={h.hero_name}
              className={`aspect-square rounded-lg overflow-hidden border-2 transition-all duration-150 ${
                selected === h.hero_name
                  ? 'border-tavern-accent scale-105 shadow-lg shadow-tavern-accent/20'
                  : 'border-white/10 hover:border-white/30 opacity-70 hover:opacity-100'
              }`}
            >
              {url ? (
                <img
                  src={url}
                  alt={h.hero_name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.parentElement.innerHTML = `<span class="text-[8px] text-white/30 flex items-center justify-center h-full">${(h.hero_name || '?').substring(0, 3)}</span>`;
                  }}
                />
              ) : (
                <span className="text-[8px] text-white/30 flex items-center justify-center h-full">
                  {(h.hero_name || '?').substring(0, 3)}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ── Main Component ── */
export default function MapPlanner() {
  const { user } = useAuth();
  const [phase, setPhase] = useState('setup');
  const [selectedHero, setSelectedHero] = useState('');
  const [startSide, setStartSide] = useState('blue');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [hasGeneratedToday, setHasGeneratedToday] = useState(false);
  const [path, setPath] = useState([]);
  const [activeStep, setActiveStep] = useState(0);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('prediction_usage')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('used_at', new Date(Date.now() - 86400000).toISOString())
      .then(({ count }) => {
        setHasGeneratedToday((count || 0) >= 2);
      });
  }, [user]);

  useEffect(() => {
    if (!playing || phase !== 'map' || path.length === 0) return;
    const maxStep = path.length - 1;
    const timer = setInterval(() => {
      setActiveStep((prev) => {
        if (prev >= maxStep) {
          setPlaying(false);
          return maxStep;
        }
        return prev + 1;
      });
    }, 2000);
    return () => clearInterval(timer);
  }, [playing, phase, path.length]);

  const handleGenerate = async () => {
    if (!selectedHero) { setError('Select a hero first.'); return; }
    if (hasGeneratedToday) { setError('Daily limit reached. Come back tomorrow!'); return; }

    setGenerating(true);
    setError('');

    const { error: dbErr } = await supabase.from('prediction_usage').insert({ user_id: user.id });
    if (dbErr) {
      setError(dbErr.message);
      setGenerating(false);
      return;
    }

    setHasGeneratedToday(true);
    setPath(getPathForHero(selectedHero, startSide));
    setActiveStep(0);
    setPlaying(false);
    setPhase('map');
    setGenerating(false);
  };

  const handleUpdatePath = () => {
    if (!selectedHero) return;
    setPath(getPathForHero(selectedHero, startSide));
    setActiveStep(0);
    setPlaying(false);
  };

  const handleBack = () => {
    setPhase('setup');
    setPlaying(false);
  };

  const sideColor = startSide === 'blue' ? '#4488ff' : '#ff4444';
  const heroImg = selectedHero ? getProxyUrl(getHeroPortrait(selectedHero) || '') : null;
  const currentCamp = path[activeStep];
  const maxStep = path.length - 1;
  const visitedLine = path
    .slice(0, activeStep + 1)
    .filter((c) => c.x >= 0)
    .map((c) => `${c.x},${c.y}`)
    .join(' ');

  /* ===================== SETUP ===================== */
  if (phase === 'setup') {
    return (
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">Jungle Path Planner</h1>
        <p className="text-sm text-white/40 mb-8">Pick a hero and get an AI-suggested first clear path covering all 7 jungle objectives.</p>

        <div className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-white/40 uppercase tracking-wider mb-2">
              Select Hero
            </label>
            {selectedHero && (
              <div className="flex items-center gap-3 mb-3 px-3 py-2 bg-white/[0.03] border border-white/10 rounded-lg">
                {heroImg ? (
                  <img src={heroImg} alt={selectedHero} className="w-8 h-8 rounded-full border border-white/20 object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-xs text-white/30">
                    {selectedHero.substring(0, 2)}
                  </div>
                )}
                <span className="text-sm font-bold text-white">{selectedHero}</span>
                <button onClick={() => setSelectedHero('')} className="ml-auto text-white/20 hover:text-white/50 transition-colors">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                </button>
              </div>
            )}
            <HeroGrid selected={selectedHero} onSelect={setSelectedHero} />
          </div>

          <div>
            <label className="block text-xs font-bold text-white/40 uppercase tracking-wider mb-2">
              Starting Side
            </label>
            <div className="grid grid-cols-2 gap-3">
              {['blue', 'red'].map((side) => (
                <button
                  key={side}
                  onClick={() => setStartSide(side)}
                  className={`px-4 py-3 rounded-xl text-sm font-bold border transition-colors text-left ${
                    startSide === side
                      ? side === 'blue'
                        ? 'bg-blue-500/15 border-blue-500/40 text-blue-400'
                        : 'bg-red-500/15 border-red-500/40 text-red-400'
                      : 'bg-white/[0.03] border-white/10 text-white/50 hover:bg-white/[0.06]'
                  }`}
                >
                  <div className="font-bold capitalize">{side} Side Start</div>
                  <div className="text-[11px] mt-0.5 opacity-60">
                    Thunder Fenrir → Molten Fiend
                  </div>
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-red-400 font-medium">{error}</p>}

          <button
            onClick={handleGenerate}
            disabled={generating || !selectedHero || hasGeneratedToday}
            className="w-full py-3.5 bg-tavern-accent text-white font-bold rounded-xl hover:bg-tavern-accent/80 transition-colors text-sm disabled:opacity-40"
          >
            {generating ? 'Generating...' : hasGeneratedToday ? 'Daily Limit Reached' : 'Generate Path'}
          </button>

          <p className="text-[11px] text-white/15 text-center">2 generations per day (shared with Game Predict)</p>
          <a className='text-white/40 text-xs my-5' href="https://www.effectivecpmnetwork.com/fnx0xvqu?key=08df4561e4fa415c0059c5a689bf2832">Click here to download JUNGLE/CORE course!</a>

        </div>
      </div>
    );
  }

  /* ===================== MAP VIEW ===================== */
  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={handleBack}
          className="shrink-0 p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <div className="min-w-0">
          <h1 className="text-xl font-extrabold text-white truncate">
            {selectedHero} — {startSide === 'blue' ? 'Blue' : 'Red'} Path
          </h1>
          <p className="text-xs text-white/30">AI-suggested first clear route · {path.length} objectives</p>
        </div>
      </div>

      {/* ── Minimap ── */}
      <div className="relative w-full max-w-lg mx-auto aspect-square rounded-xl overflow-hidden border border-white/10 bg-[#0a0a0a]">
        <img
          src="/minimap.png"
          alt="Minimap"
          className="absolute inset-0 w-full h-full object-cover"
          onError={(e) => { e.target.style.display = 'none'; }}
        />
        <div className="absolute inset-0 bg-black/25" />

        <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full" preserveAspectRatio="none" style={{ zIndex: 2 }}>
          {visitedLine && (
            <polyline
              points={visitedLine}
              fill="none"
              stroke={sideColor}
              strokeWidth="0.35"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.8"
            />
          )}
          {activeStep < maxStep && (
            <polyline
              points={path.slice(activeStep + 1).filter((c) => c.x >= 0).map((c) => `${c.x},${c.y}`).join(' ')}
              fill="none"
              stroke="rgba(255,255,255,0.12)"
              strokeWidth="0.25"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="1.2 1"
            />
          )}
          {path.map((camp, i) => {
            if (camp.x < 0) return null;
            return (
              <g key={camp.id + i}>
                {i === activeStep && (
                  <circle cx={camp.x} cy={camp.y} r="2.5" fill="none" stroke={sideColor} strokeWidth="0.3" opacity="0.5">
                    <animate attributeName="r" from="2" to="4" dur="1.5s" repeatCount="indefinite" />
                    <animate attributeName="opacity" from="0.6" to="0" dur="1.5s" repeatCount="indefinite" />
                  </circle>
                )}
                <circle
                  cx={camp.x}
                  cy={camp.y}
                  r={i === activeStep ? 1.4 : i < activeStep ? 1.0 : 0.7}
                  fill={i <= activeStep ? (CAMP_DOT_COLOR[camp.type] || '#888') : 'rgba(255,255,255,0.2)'}
                  stroke={i === activeStep ? '#fff' : 'none'}
                  strokeWidth="0.3"
                />
                <text
                  x={camp.x}
                  y={camp.y - (i === activeStep ? 2.8 : 2)}
                  textAnchor="middle"
                  fill={i === activeStep ? '#fff' : 'rgba(255,255,255,0.35)'}
                  fontSize={i === activeStep ? '3.2' : '2.2'}
                  fontWeight="bold"
                  fontFamily="sans-serif"
                >
                  {i + 1}
                </text>
              </g>
            );
          })}
        </svg>

        {currentCamp && currentCamp.x >= 0 && heroImg && (
          <div
            className="absolute z-10 transition-all duration-700 ease-in-out"
            style={{
              left: `${currentCamp.x}%`,
              top: `${currentCamp.y}%`,
              transform: 'translate(-50%, -50%)',
              filter: `drop-shadow(0 0 6px ${sideColor}) drop-shadow(0 0 12px ${sideColor})`,
            }}
          >
            <div
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-white overflow-hidden bg-[#111]"
              style={{ boxShadow: `0 0 0 3px ${sideColor}40` }}
            >
              <img src={heroImg} alt={selectedHero} className="w-full h-full object-cover" />
            </div>
          </div>
        )}

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10 z-0">
          <span className="text-2xl font-black text-white">MINIMAP</span>
        </div>
      </div>

      {/* ── Step Indicators ── */}
      <div className="flex items-center justify-center gap-1.5 sm:gap-2 mt-5 flex-wrap">
        {path.map((camp, i) => (
          <button
            key={camp.id + i}
            onClick={() => { setActiveStep(i); setPlaying(false); }}
            className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full border-2 transition-all duration-300 flex items-center justify-center text-xs font-bold shrink-0 ${
              i === activeStep
                ? 'bg-tavern-accent border-tavern-accent text-white scale-110 shadow-lg shadow-tavern-accent/30'
                : i < activeStep
                ? 'bg-white/15 border-white/25 text-white/60'
                : 'bg-transparent border-white/10 text-white/20 hover:border-white/25 hover:text-white/40'
            }`}
            title={camp.name !== '—' ? camp.name : undefined}
          >
            {i + 1}
          </button>
        ))}
        <button
          onClick={() => {
            if (activeStep >= maxStep && !playing) setActiveStep(0);
            setPlaying(!playing);
          }}
          className="ml-1.5 w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:bg-white/10 hover:text-white transition-colors shrink-0"
          title={playing ? 'Pause' : 'Play'}
        >
          {playing ? (
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" /></svg>
          ) : (
            <svg className="w-3.5 h-3.5 ml-0.5" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3" /></svg>
          )}
        </button>
      </div>

      {/* ── Step Info Panel ── */}
      {currentCamp && (
        <div className="mt-4 p-4 bg-white/[0.03] border border-white/10 rounded-xl">
          <div className="flex items-center gap-3 mb-3 flex-wrap">
            <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">
              Step {activeStep + 1}/{path.length}
            </span>
            <span className="text-white/10">·</span>
            <span className="text-sm font-bold text-white">{currentCamp.name}</span>
            {currentCamp.gold && currentCamp.gold !== '—' && (
              <span className="text-[10px] font-mono font-bold text-white/30 bg-white/5 px-1.5 py-0.5 rounded">
                {currentCamp.gold}
              </span>
            )}
            <span
              className="ml-auto text-xs font-mono font-bold px-2 py-0.5 rounded-full"
              style={{
                color: CAMP_DOT_COLOR[currentCamp.type] || '#888',
                backgroundColor: `${CAMP_DOT_COLOR[currentCamp.type] || '#888'}15`,
              }}
            >
              {currentCamp.time}
            </span>
          </div>
          <p className="text-sm text-white/50 leading-relaxed">{currentCamp.tip}</p>
          <div className="mt-4 flex gap-1">
            {path.map((c, i) => (
              <div
                key={c.id + i}
                className="h-1 flex-1 rounded-full transition-colors duration-300"
                style={{
                  backgroundColor: i <= activeStep ? sideColor : 'rgba(255,255,255,0.08)',
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Change settings ── */}
      <div className="mt-5 p-4 bg-white/[0.02] border border-white/5 rounded-xl">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <label className="block text-[10px] font-bold text-white/30 uppercase tracking-wider mb-1.5">Hero</label>
            <select value={selectedHero} onChange={(e) => setSelectedHero(e.target.value)} className="input-style text-sm">
              <option value="">Change hero...</option>
              {heroData
                .filter((h) => h.hero_name)
                .sort((a, b) => a.hero_name.localeCompare(b.hero_name))
                .map((h) => (
                  <option key={h.hero_name} value={h.hero_name}>{h.hero_name}</option>
                ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-[10px] font-bold text-white/30 uppercase tracking-wider mb-1.5">Side</label>
            <select value={startSide} onChange={(e) => setStartSide(e.target.value)} className="input-style text-sm">
              <option value="blue">Blue Side</option>
              <option value="red">Red Side</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={handleUpdatePath}
              disabled={!selectedHero}
              className="px-5 py-2.5 bg-white/5 border border-white/10 text-white/60 text-sm font-bold rounded-lg hover:bg-white/10 hover:text-white transition-colors disabled:opacity-30 whitespace-nowrap"
            >
              Update
            </button>
          </div>
        </div>
      </div>

      {/* ── Legend ── */}
      <div className="mt-4 p-4 bg-white/[0.02] border border-white/5 rounded-xl">
        <h3 className="text-xs font-bold text-white/30 mb-3">Camp Types</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {[
            { label: 'Thunder Fenrir', sub: 'Purple Buff · CDR', color: '#8866ff' },
            { label: 'Molten Fiend', sub: 'Orange Buff · True DMG', color: '#ff4444' },
            { label: 'Scaled Lizard', sub: 'Green camp · HP/EXP', color: '#44bb77' },
            { label: 'Lava Golem', sub: 'Green camp · Heal', color: '#44bb77' },
            { label: 'Lithowanderer', sub: 'Walkie Grass · Vision', color: '#66ccff' },
            { label: 'Scavenger Crab', sub: 'Gold Crab · GPS', color: '#ff8844' },
            { label: 'Fire Beetle', sub: 'Crammer spawn · AoE', color: '#ffcc00' },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
              <div className="min-w-0">
                <p className="text-[11px] text-white/60 font-semibold truncate">{item.label}</p>
                <p className="text-[9px] text-white/25 truncate">{item.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}