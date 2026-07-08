// ============================================================
// FILE: src/pages/PracticeDraft.jsx
// ============================================================
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import heroData from '../data/heroes.json';

/* ── Constants ─────────────────────────────────────────────── */
const STEPS = [
  { type: 'user_ban',  count: 5, label: 'Ban Phase',       sub: 'Ban 5 heroes' },
  { type: 'ai_ban',    count: 5, label: 'Ban Phase',       sub: 'AI is banning...' },
  { type: 'user_pick', count: 1, label: 'Pick Phase — Round 1', sub: 'Pick 1 hero' },
  { type: 'ai_pick',   count: 2, label: 'Pick Phase — Round 1', sub: 'AI is picking...' },
  { type: 'user_pick', count: 2, label: 'Pick Phase — Round 2', sub: 'Pick 2 heroes' },
  { type: 'ai_pick',   count: 2, label: 'Pick Phase — Round 2', sub: 'AI is picking...' },
  { type: 'user_pick', count: 2, label: 'Pick Phase — Round 3', sub: 'Pick 2 heroes' },
  { type: 'ai_pick',   count: 1, label: 'Pick Phase — Round 3', sub: 'AI final pick...' },
];

const ROLE_META = {
  gold:    { label: 'GOLD', color: 'text-amber-400',  bg: 'bg-amber-500/15', border: 'border-amber-500/30' },
  mid:     { label: 'MID',  color: 'text-purple-400', bg: 'bg-purple-500/15', border: 'border-purple-500/30' },
  jungle:  { label: 'JGL',  color: 'text-green-400',  bg: 'bg-green-500/15',  border: 'border-green-500/30' },
  exp:     { label: 'EXP',  color: 'text-orange-400', bg: 'bg-orange-500/15', border: 'border-orange-500/30' },
  roam:    { label: 'ROAM', color: 'text-cyan-400',   bg: 'bg-cyan-500/15',   border: 'border-cyan-500/30' },
};

const getProxyUrl = (url) =>
  url
    ? `https://images.weserv.nl/?url=${encodeURIComponent(url)}&w=100&h=100&fit=cover&t=square`
    : null;

const normalizeRole = (r) => {
  if (!r) return null;
  const l = r.toLowerCase();
  if (l.includes('gold') || l.includes('marksm')) return 'gold';
  if (l.includes('mid') || l.includes('mage')) return 'mid';
  if (l.includes('jungl') || l.includes('jgl')) return 'jungle';
  if (l.includes('exp') || l.includes('explan')) return 'exp';
  if (l.includes('roam') || l.includes('support') || l.includes('tank')) return 'roam';
  return null;
};

/* ── Gemini response parser ────────────────────────────────── */
function parseHeroList(text) {
  if (!text) return null;
  const match = text.match(/\[[\s\S]*?\]/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[0]);
    return parsed.filter(Boolean).map((h) => String(h).trim());
  } catch {
    return null;
  }
}

function matchHeroName(name, pool) {
  if (!name) return null;
  const n = name.toLowerCase().trim();
  // Exact match first
  const exact = pool.find((h) => h.hero_name?.toLowerCase() === n);
  if (exact) return exact.hero_name;
  // Contains match
  const contains = pool.find(
    (h) =>
      h.hero_name?.toLowerCase().includes(n) || n.includes(h.hero_name?.toLowerCase())
  );
  return contains?.hero_name || null;
}

/* ── Sub-components ────────────────────────────────────────── */
function HeroMini({ name, status, size = 'md' }) {
  const [imgErr, setImgErr] = useState(false);
  const hero = heroData.find((h) => h.hero_name === name);
  const role = normalizeRole(hero?.role || hero?.hero_role);
  const meta = role ? ROLE_META[role] : null;
  const proxy = getProxyUrl(hero?.portrait);

  const sizes = {
    sm: 'w-11 h-11',
    md: 'w-14 h-14 sm:w-16 sm:h-16',
    lg: 'w-20 h-20',
  };

  const ring =
    status === 'user'
      ? 'ring-2 ring-blue-400 ring-offset-1 ring-offset-[#191919]'
      : status === 'ai'
      ? 'ring-2 ring-red-400 ring-offset-1 ring-offset-[#191919]'
      : status === 'banned'
      ? 'ring-2 ring-red-500/40'
      : '';

  return (
    <div className="flex flex-col items-center gap-1">
      {meta && (
        <span className={`text-[7px] sm:text-[8px] font-black tracking-widest ${meta.color}`}>
          {meta.label}
        </span>
      )}
      <div
        className={`${sizes[size]} rounded-lg border border-white/10 overflow-hidden bg-white/5 relative ${ring} ${
          status === 'banned' ? 'opacity-40 grayscale' : ''
        }`}
      >
        {proxy && !imgErr ? (
          <img
            src={proxy}
            alt={name}
            crossOrigin="anonymous"
            className="w-full h-full object-cover"
            loading="lazy"
            onError={() => setImgErr(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[10px] text-white/30 font-bold">
            {name?.substring(0, 2)}
          </div>
        )}
        {status === 'banned' && (
          <div className="absolute inset-0 bg-red-600/25 flex items-center justify-center">
            <svg className="w-5 h-5 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </div>
        )}
      </div>
      <span className="text-[9px] sm:text-[10px] text-white/50 truncate max-w-[64px] sm:max-w-[72px] text-center leading-tight">
        {name}
      </span>
    </div>
  );
}

function SlotPlaceholder({ pulse = false }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg border-2 border-dashed border-white/10 bg-white/[0.02] flex items-center justify-center">
        <svg className={`w-5 h-5 text-white/10 ${pulse ? 'animate-pulse' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </div>
      <span className="text-[9px] text-white/15 w-16 text-center">&nbsp;</span>
    </div>
  );
}

function TeamPanel({ label, bans, picks, side, aiThinking }) {
  const isUser = side === 'user';
  const accent = isUser ? 'text-blue-400' : 'text-red-400';
  const borderAccent = isUser ? 'border-blue-500/20' : 'border-red-500/20';
  const bgAccent = isUser ? 'bg-blue-500/[0.03]' : 'bg-red-500/[0.03]';

  return (
    <div className={`rounded-xl border ${borderAccent} ${bgAccent} p-3 sm:p-4`}>
      <h3 className={`text-[11px] sm:text-xs font-black uppercase tracking-[0.2em] ${accent} mb-3`}>
        {label}
      </h3>

      {/* Bans */}
      {bans.length > 0 && (
        <div className="mb-3">
          <p className="text-[9px] text-white/25 font-bold uppercase tracking-widest mb-2">Bans</p>
          <div className="flex flex-wrap gap-1.5">
            {bans.map((name, i) => (
              <HeroMini key={`ban-${i}`} name={name} status="banned" size="sm" />
            ))}
          </div>
        </div>
      )}

      {/* Picks */}
      <div>
        <p className="text-[9px] text-white/25 font-bold uppercase tracking-widest mb-2">
          Picks ({picks.length}/5)
        </p>
        <div className="flex flex-wrap gap-2">
          {picks.map((name, i) => (
            <HeroMini key={`pick-${i}`} name={name} status={isUser ? 'user' : 'ai'} />
          ))}
          {Array.from({ length: Math.max(0, 5 - picks.length) }).map((_, i) => (
            <SlotPlaceholder key={`slot-${i}`} pulse={aiThinking && !isUser} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ThinkingDots() {
  return (
    <span className="inline-flex gap-0.5 ml-1">
      <span className="w-1 h-1 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '0ms' }} />
      <span className="w-1 h-1 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '150ms' }} />
      <span className="w-1 h-1 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '300ms' }} />
    </span>
  );
}

/* ── Main Component ────────────────────────────────────────── */
export default function PracticeDraft() {
  const { user } = useAuth();
  const gridRef = useRef(null);

  const [step, setStep] = useState(-1); // -1 = idle
  const [userBans, setUserBans] = useState([]);
  const [aiBans, setAiBans] = useState([]);
  const [userPicks, setUserPicks] = useState([]);
  const [aiPicks, setAiPicks] = useState([]);
  const [stepCount, setStepCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dailyUsed, setDailyUsed] = useState(false);
  const [checkingLimit, setCheckingLimit] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [showRules, setShowRules] = useState(false);

  const isComplete = step >= STEPS.length;
  const currentStep = step >= 0 && step < STEPS.length ? STEPS[step] : null;
  const isUserTurn = currentStep?.type.startsWith('user');
  const isAiTurn = currentStep?.type.startsWith('ai');

  /* ── Check daily limit on mount ── */
  useEffect(() => {
    if (!user) return;
    supabase
      .from('draft_sessions')
      .select('id')
      .eq('user_id', user.id)
      .gte('created_at', new Date().toISOString().split('T')[0])
      .limit(1)
      .then(({ data }) => {
        if (data && data.length > 0) setDailyUsed(true);
      })
      .catch(() => {})
      .finally(() => setCheckingLimit(false));
  }, [user]);

  /* ── Derived hero pool ── */
  const allBanned = useMemo(() => [...userBans, ...aiBans], [userBans, aiBans]);
  const allPicked = useMemo(() => [...userPicks, ...aiPicks], [userPicks, aiPicks]);
  const unavailable = useMemo(() => [...allBanned, ...allPicked], [allBanned, allPicked]);

  const filteredHeroes = useMemo(() => {
    let pool = heroData;
    if (!Array.isArray(pool)) return [];
    if (search.trim()) {
      const q = search.toLowerCase();
      pool = pool.filter((h) => h.hero_name?.toLowerCase().includes(q));
    }
    if (roleFilter !== 'all') {
      pool = pool.filter((h) => normalizeRole(h.role || h.hero_role) === roleFilter);
    }
    return pool;
  }, [search, roleFilter]);

  const hasRoleData = useMemo(() => {
    if (!Array.isArray(heroData) || heroData.length === 0) return false;
    return heroData.some((h) => normalizeRole(h.role || h.hero_role));
  }, []);

  /* ── Handle hero click ── */
  const handleHeroClick = useCallback(
    (hero) => {
      if (!isUserTurn || loading) return;
      const name = hero.hero_name;
      if (!name || unavailable.includes(name)) return;

      if (currentStep.type === 'user_ban') {
        setUserBans((prev) => [...prev, name]);
      } else {
        setUserPicks((prev) => [...prev, name]);
      }

      const next = stepCount + 1;
      setStepCount(next);

      if (next >= currentStep.count) {
        setTimeout(() => {
          setStepCount(0);
          setStep((s) => s + 1);
        }, 350);
      }
    },
    [isUserTurn, loading, currentStep, stepCount, unavailable]
  );

  /* ── Call Gemini when it's AI's turn ── */
  useEffect(() => {
    if (!isAiTurn) return;
    let cancelled = false;

    const callGemini = async () => {
      setLoading(true);
      setError('');

      const availablePool = heroData.filter(
        (h) => h.hero_name && !unavailable.includes(h.hero_name)
      );
      const availableNames = availablePool.map((h) => h.hero_name);

      let prompt = '';
      if (currentStep.type === 'ai_ban') {
        prompt = `You are a Mobile Legends: Bang Bang expert drafter in a ranked draft.

The user has banned these heroes: ${userBans.join(', ')}

Here are ALL available heroes that can still be banned:
 ${availableNames.join(', ')}

Ban 5 heroes. Choose heroes that are:
- Currently strong in the ranked meta
- Versatile and difficult to counter
- Would limit the opponent's drafting options

Return ONLY a JSON array of exactly 5 hero names from the available list above. No explanation, no markdown formatting, just the array.
Example: ["Hero A", "Hero B", "Hero C", "Hero D", "Hero E"]`;
      } else {
        prompt = `You are a Mobile Legends: Bang Bang expert drafter in a ranked draft.

Banned heroes: ${allBanned.join(', ')}
User's team so far (${userPicks.length}/5): ${userPicks.join(', ') || 'none'}
AI's team so far (${aiPicks.length}/5): ${aiPicks.join(', ') || 'none'}

Available heroes to pick from:
 ${availableNames.join(', ')}

AI needs to pick ${currentStep.count} more hero(es). Consider:
- Counter-picking the user's heroes
- Synergy with AI's existing team
- Role balance across gold, mid, jungle, exp, and roam lanes
- Meta strength and win conditions

Return ONLY a JSON array of exactly ${currentStep.count} hero name(s) from the available list above. No explanation, no markdown formatting, just the array.`;
      }

      try {
        const { data, error: fnError } = await supabase.functions.invoke('gemini-draft', {
          body: { prompt },
        });

        if (fnError) throw fnError;
        if (data?.error) throw new Error(data.error);

        const rawNames = parseHeroList(data?.heroes || data?.text || '');
        if (!rawNames || rawNames.length === 0) throw new Error('AI returned invalid data');

        const valid = [];
        const invalid = [];
        for (const n of rawNames) {
          const matched = matchHeroName(n, availablePool);
          if (matched) valid.push(matched);
          else invalid.push(n);
        }

        if (currentStep.type === 'ai_ban') {
          setAiBans(valid);
          if (valid.length < 5 && invalid.length > 0) {
            setError(`AI suggested unknown heroes: ${invalid.join(', ')}. Only ${valid.length}/5 bans applied.`);
          }
        } else {
          setAiPicks((prev) => [...prev, ...valid]);
          if (valid.length < currentStep.count && invalid.length > 0) {
            setError(`AI suggested unknown heroes: ${invalid.join(', ')}. Only ${valid.length}/${currentStep.count} picks applied.`);
          }
        }

        if (!cancelled) {
          setStepCount(0);
          setStep((s) => s + 1);
        }
      } catch (err) {
        if (!cancelled) {
          setError('AI failed to respond. ' + (err.message || 'Unknown error'));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    // Small delay so UI updates before the loading state
    const timer = setTimeout(callGemini, 600);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]); // Only re-run when step changes to an AI step

  /* ── Start draft ── */
  const handleStart = async () => {
    setLoading(true);
    setError('');
    try {
      // Check limit
      const { data: existing } = await supabase
        .from('draft_sessions')
        .select('id')
        .eq('user_id', user.id)
        .gte('created_at', new Date().toISOString().split('T')[0])
        .limit(1);

      if (existing && existing.length > 0) {
        setDailyUsed(true);
        return;
      }

      // Create session
      const { error: insertErr } = await supabase.from('draft_sessions').insert({
        user_id: user.id,
      });
      if (insertErr) throw insertErr;

      setDailyUsed(true);
      setUserBans([]);
      setAiBans([]);
      setUserPicks([]);
      setAiPicks([]);
      setStepCount(0);
      setStep(0);
      setSearch('');
      setRoleFilter('all');
    } catch (err) {
      setError('Failed to start draft: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  /* ── Reset to idle ── */
  const handleReset = () => {
    setStep(-1);
    setUserBans([]);
    setAiBans([]);
    setUserPicks([]);
    setAiPicks([]);
    setStepCount(0);
    setError('');
    setSearch('');
    setRoleFilter('all');
  };

  /* ── How it works modal ── */
  function RulesModal() {
    if (!showRules) return null;
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowRules(false)} />
        <div className="relative bg-[#141414] border border-white/10 rounded-2xl shadow-2xl max-w-md w-full max-h-[85vh] overflow-y-auto z-10">
          <div className="sticky top-0 bg-[#141414] border-b border-white/10 px-6 py-4 flex items-center justify-between z-10">
            <h2 className="text-lg font-extrabold text-white">How Drafting Works</h2>
            <button
              onClick={() => setShowRules(false)}
              className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <div className="px-6 py-5 space-y-4 text-sm text-white/60 leading-relaxed">
            <div>
              <h3 className="text-white font-bold mb-1">Ban Phase</h3>
              <p>You ban 5 heroes, then the AI bans 5 heroes.</p>
            </div>
            <div>
              <h3 className="text-white font-bold mb-1">Pick Phase</h3>
              <ul className="list-disc list-inside space-y-1 text-white/50">
                <li>You pick <strong className="text-white/70">1</strong> → AI picks <strong className="text-white/70">2</strong></li>
                <li>You pick <strong className="text-white/70">2</strong> → AI picks <strong className="text-white/70">2</strong></li>
                <li>You pick <strong className="text-white/70">2</strong> → AI picks <strong className="text-white/70">1</strong></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-bold mb-1">Tips</h3>
              <ul className="list-disc list-inside space-y-1 text-white/50">
                <li>Think about team composition and role balance</li>
                <li>Ban heroes that counter your planned strategy</li>
                <li>Pay attention to what the AI bans — it reveals its strategy</li>
                <li>Use the search bar to find heroes quickly</li>
              </ul>
            </div>
            <div className="pt-2 border-t border-white/5 text-center">
              <p className="text-xs text-white/25">You get 1 practice draft per day.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── RENDER ──────────────────────────────────────────────── */

  // Loading / checking state
  if (checkingLimit) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="inline-block w-6 h-6 border-2 border-tavern-accent border-t-transparent rounded-full animate-spin mr-3" />
        <span className="text-white/50">Loading...</span>
      </div>
    );
  }

  // ── IDLE SCREEN ──
  if (step === -1) {
    return (
      <div className="max-w-lg mx-auto pt-12 sm:pt-20 text-center">
        <div className="mb-6">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-tavern-accent/20 to-tavern-accent/5 border border-tavern-accent/20 flex items-center justify-center">
            <svg className="w-10 h-10 text-tavern-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">Practice Drafting</h1>
          <p className="text-sm text-white/40 leading-relaxed max-w-sm mx-auto">
            Simulate a ranked game draft against AI. Ban and pick heroes to build the best team composition.
          </p>
        </div>

        {dailyUsed ? (
          <div className="bg-white/[0.03] border border-white/10 rounded-xl p-6 mb-6">
            <div className="text-3xl mb-3">⏰</div>
            <p className="text-white/50 text-sm mb-1">Daily limit reached</p>
            <p className="text-white/25 text-xs">Come back tomorrow for another practice draft!</p>
          </div>
        ) : (
          <button
            onClick={handleStart}
            disabled={loading}
            className="w-full py-3.5 bg-tavern-accent text-white font-bold rounded-xl hover:bg-tavern-accent/80 transition-colors text-sm disabled:opacity-50 disabled:pointer-events-none mb-4"
          >
            {loading ? 'Starting...' : 'Start Draft'}
          </button>
        )}

        <button
          onClick={() => setShowRules(true)}
          className="text-xs text-white/30 hover:text-white/60 transition-colors underline underline-offset-2"
        >
          How does drafting work?
        </button>

        {error && (
          <p className="mt-4 text-xs text-red-400/80 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2.5">
            {error}
          </p>
        )}

        <RulesModal />
      </div>
    );
  }

  // ── COMPLETE SCREEN ──
  if (isComplete) {
    return (
      <div className="max-w-2xl mx-auto pt-8 sm:pt-12">
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">Draft Complete</h1>
          <p className="text-sm text-white/40">Review both team compositions below.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <TeamPanel label="Your Team" bans={userBans} picks={userPicks} side="user" />
          <TeamPanel label="AI Team" bans={aiBans} picks={aiPicks} side="ai" />
        </div>

        <div className="text-center">
          <p className="text-xs text-white/25 mb-4">
            You've used your daily practice draft. Come back tomorrow!
          </p>
          <button
            onClick={handleReset}
            className="px-6 py-2.5 bg-white/10 text-white/70 font-semibold rounded-lg hover:bg-white/15 transition-colors text-sm"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  // ── DRAFTING SCREEN ──
  return (
    <div className="max-w-5xl mx-auto">
      {/* Phase Header */}
      <div className="mb-5">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-xl sm:text-2xl font-extrabold text-white">
            {currentStep?.label}
          </h1>
          {isAiTurn && <ThinkingDots />}
        </div>
        <p className="text-sm text-white/40">
          {isUserTurn
            ? `${currentStep.sub} (${stepCount}/${currentStep.count})`
            : currentStep?.sub}
        </p>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-4 px-4 py-2.5 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400/80 flex items-start gap-2">
          <svg className="w-4 h-4 mt-0.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Team Panels */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
        <TeamPanel
          label="Your Team"
          bans={userBans}
          picks={userPicks}
          side="user"
          aiThinking={false}
        />
        <TeamPanel
          label="AI Team"
          bans={aiBans}
          picks={aiPicks}
          side="ai"
          aiThinking={isAiTurn}
        />
      </div>

      {/* Hero Pool */}
      <div className="bg-white/[0.03] border border-white/10 rounded-xl p-3 sm:p-4">
        {/* Search + Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mb-3">
          <div className="relative flex-1">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search heroes..."
              className="input-style pl-9 !py-2 text-xs"
            />
          </div>

          {hasRoleData && (
            <div className="flex gap-1 flex-wrap">
              {[
                { key: 'all', label: 'All' },
                { key: 'gold', label: 'GOLD' },
                { key: 'mid', label: 'MID' },
                { key: 'jungle', label: 'JGL' },
                { key: 'exp', label: 'EXP' },
                { key: 'roam', label: 'ROAM' },
              ].map((f) => (
                <button
                  key={f.key}
                  onClick={() => setRoleFilter(f.key)}
                  className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold tracking-wider transition-colors ${
                    roleFilter === f.key
                      ? 'bg-tavern-accent/20 text-tavern-accent border border-tavern-accent/30'
                      : 'bg-white/5 text-white/30 border border-white/10 hover:bg-white/10 hover:text-white/50'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Hero Grid */}
        <div
          ref={gridRef}
          className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-1.5 sm:gap-2 max-h-[50vh] overflow-y-auto pr-1"
        >
          {filteredHeroes.map((hero) => {
            const name = hero.hero_name;
            if (!name) return null;
            const isUnavailable = unavailable.includes(name);
            const isBanned = allBanned.includes(name);
            const isUserPicked = userPicks.includes(name);
            const isAiPicked = aiPicks.includes(name);

            let status = 'available';
            if (isBanned) status = 'banned';
            else if (isUserPicked) status = 'user';
            else if (isAiPicked) status = 'ai';
            else if (isUnavailable) status = 'unavailable';

            const canClick = isUserTurn && status === 'available' && !loading;

            return (
              <HeroGridCard
                key={name}
                hero={hero}
                status={status}
                canClick={canClick}
                onClick={() => handleHeroClick(hero)}
              />
            );
          })}
          {filteredHeroes.length === 0 && (
            <div className="col-span-full py-12 text-center text-white/25 text-sm">
              No heroes found
            </div>
          )}
        </div>

        {/* Grid footer info */}
        <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-[10px] text-white/20">
          <span>{filteredHeroes.length} heroes shown</span>
          <span>
            {isUserTurn
              ? `Click a hero to ${currentStep.type === 'user_ban' ? 'ban' : 'pick'}`
              : isAiTurn
              ? 'Waiting for AI...'
              : ''}
          </span>
        </div>
      </div>

      {/* Abort button */}
      <div className="mt-4 text-center">
        <button
          onClick={handleReset}
          className="text-xs text-white/20 hover:text-white/50 transition-colors underline underline-offset-2"
        >
          Abort Draft
        </button>
      </div>

      <RulesModal />
    </div>
  );
}

/* ── Hero Grid Card (separate for performance) ─────────────── */
function HeroGridCard({ hero, status, canClick, onClick }) {
  const [imgErr, setImgErr] = useState(false);
  const proxy = getProxyUrl(hero.portrait);

  const statusClass =
    status === 'available'
      ? 'border-white/10 hover:border-tavern-accent/60 hover:bg-tavern-accent/10 cursor-pointer'
      : status === 'banned'
      ? 'border-red-500/30 opacity-30 grayscale'
      : status === 'user'
      ? 'border-blue-500/50 bg-blue-500/10'
      : status === 'ai'
      ? 'border-red-500/50 bg-red-500/10'
      : 'border-white/5 opacity-20';

  return (
    <button
      onClick={canClick ? onClick : undefined}
      disabled={!canClick}
      className={`relative aspect-square rounded-lg border-2 overflow-hidden bg-white/5 transition-all duration-150 hover:scale-105 active:scale-95 ${statusClass} disabled:hover:scale-100`}
      title={hero.hero_name}
    >
      {proxy && !imgErr ? (
        <img
          src={proxy}
          alt={hero.hero_name}
          crossOrigin="anonymous"
          className="w-full h-full object-cover"
          loading="lazy"
          onError={() => setImgErr(true)}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-[9px] text-white/25 font-bold">
          {hero.hero_name?.substring(0, 2)}
        </div>
      )}
      {status === 'banned' && (
        <div className="absolute inset-0 bg-red-600/30 flex items-center justify-center">
          <svg className="w-4 h-4 text-red-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </div>
      )}
      {status === 'user' && (
        <div className="absolute bottom-0 inset-x-0 bg-blue-500/80 text-[7px] font-bold text-white text-center py-0.5 leading-none">
          YOU
        </div>
      )}
      {status === 'ai' && (
        <div className="absolute bottom-0 inset-x-0 bg-red-500/80 text-[7px] font-bold text-white text-center py-0.5 leading-none">
          AI
        </div>
      )}
    </button>
  );
}