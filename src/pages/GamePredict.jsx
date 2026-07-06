// ============================================================
// FILE: src/pages/GamePredict.jsx
// ============================================================
import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { safeToPng } from '../lib/safeToPng';
import MatchupCard from '../components/MatchupCard';
import heroData from '../data/heroes.json';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

const getProxyUrl = (url) => `https://images.weserv.nl/?url=${encodeURIComponent(url)}&w=100&h=100&fit=cover&t=square`;
const getHeroImg = (name) => {
  if (!Array.isArray(heroData) || !name) return null;
  return heroData.find(h => h.hero_name?.toLowerCase() === name.toLowerCase())?.portrait || null;
};

const ROLES = [
  { key: 'gold', label: 'GOLD LANE' },
  { key: 'mid', label: 'MID LANE' },
  { key: 'jungle', label: 'JUNGLE' },
  { key: 'roam', label: 'ROAM' },
  { key: 'exp', label: 'EXP LANE' }
];

const FREE_DAILY_LIMIT = 3;

const MOCK_TEXT = `## SCORE: 2 - 1 YOUR TEAM\n\n### HOW?: THE REASON\n- *Macro:* Your team's pick composition has a stronger mid-game power spike. The combination of crowd control and burst damage creates favorable engage conditions around the 4-8 minute window where most games are decided.\n- *Micro:* Individual lane matchups favor your side in 3 out of 5 roles. The gold lane and jungle specifically can generate leads that snowball into map control.\n- **Key Advantage:** Your roam hero provides more pick potential, allowing your team to force fights on your terms rather than reacting to the enemy.\n\n### WHAT TO DO?: THE SOLUTION\n- *Early Game:* Secure first turtle at all costs. Place deep vision in enemy jungle to track their jungler's pathing. Do not overextend without knowledge of enemy roamer position.\n- *Mid Game:* Rotate as a unit of 3-4 and contest every objective. Use your gold lane's wave clear to create side-lane pressure while the rest of the team groups for turtles.\n- *Late Game:* Bait out key enemy ultimates before committing to a full team fight. Focus fire priority must be enforced — do not tunnel vision on tanks.\n- **Critical Moment:** The 8-minute turtle is the turning point. Winning this fight gives your team enough gold to end the game within the next two pushes.\n\n### META: TIPS AND TRICKS\n- *Wave Management:* Freeze waves near your towers in the early game to deny enemy jungle farm and create gank opportunities.\n- *Item Timing:* Rush defense items if behind. A single anti-burst item can completely neutralize the enemy's win condition.\n- **Map Awareness:** Keep timers on every jungle camp. Knowing exactly when the enemy jungler is available for ganks prevents unnecessary deaths.\n- *Revive Strategy:* In Game 3 scenarios, adjust your ban phase to target the enemy's most impactful hero from the previous game rather than blindly banning meta picks.`;

function HeroIcon({ name }) {
  const [err, setErr] = useState(false);
  const imgUrl = getHeroImg(name);
  if (!imgUrl || err) return <span className="text-xs text-white/40 w-8 h-8 flex items-center justify-center bg-white/5 rounded">{name?.substring(0,2)}</span>;
  return <img src={getProxyUrl(imgUrl)} alt={name} className="w-8 h-8 rounded object-cover border border-white/10" onError={() => setErr(true)} />;
}

function PredictLoader({ step }) {
  const steps = ["Validating", "Connecting", "Analyzing", "Formatting"];
  return (
    <div className="flex items-start justify-center py-4">
      {steps.map((s, i) => {
        const stepNum = i + 1;
        const isDone = step > stepNum;
        const isActive = step === stepNum;
        return (
          <div key={i} className="flex items-center">
            <div className="flex flex-col items-center w-20">
              <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${isDone ? 'bg-green-500 border-green-500' : isActive ? 'border-tavern-accent' : 'border-white/20'}`}>
                {isDone && <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>}
                {isActive && <div className="w-2 h-2 bg-tavern-accent rounded-full animate-pulse" />}
              </div>
              <span className={`text-[9px] mt-1.5 font-bold uppercase tracking-wider transition-colors duration-500 text-center ${isDone ? 'text-green-400' : isActive ? 'text-white' : 'text-white/30'}`}>{s}</span>
            </div>
            {i < steps.length - 1 && <div className={`w-10 h-0.5 mx-1 -mt-3.5 transition-colors duration-500 ${step > stepNum ? 'bg-green-500' : 'bg-white/10'}`} />}
          </div>
        );
      })}
    </div>
  );
}

function AnalysisOutput({ content }) {
  const formatInline = (text) => {
    let formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-white/90">$1</strong>');
    formatted = formatted.replace(/\*(.*?)\*/g, '<em class="italic text-white/80 font-medium">$1</em>');
    return formatted;
  };

  const lines = content.split('\n');

  return (
    <div className="space-y-1 text-sm sm:text-base break-words">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={idx} className="h-4" />;

        if (trimmed.startsWith('## WINNER:') || trimmed.startsWith('## SCORE:')) {
          const raw = trimmed.replace('## WINNER:', '').replace('## SCORE:', '').trim();
          const scoreMatch = raw.match(/(\d+)\s*[-–—]\s*(\d+)/);
          const scoreStr = scoreMatch ? `${scoreMatch[1]} - ${scoreMatch[2]}` : null;
          const teamStr = scoreMatch
            ? raw.replace(scoreMatch[0], '').trim().replace(/^[-–—]\s*/, '')
            : raw;

          return (
            <div key={idx} className="bg-tavern-accent/10 border border-tavern-accent/30 rounded-lg p-6 sm:p-8 text-center my-6 sm:my-10">
              <p className="text-[10px] sm:text-xs text-tavern-accent font-bold uppercase tracking-[0.3em] mb-3">Match Prediction</p>
              {scoreStr && (
                <p className="text-5xl sm:text-6xl font-black text-white leading-none mb-3 tabular-nums tracking-wider">
                  {scoreStr}
                </p>
              )}
              <h2 className="text-xl sm:text-2xl font-extrabold text-tavern-accent leading-tight uppercase tracking-wide">
                {teamStr}
              </h2>
            </div>
          );
        }

        if (trimmed.startsWith('###')) {
          const title = trimmed.replace('###', '').trim();
          return (
            <h3
              key={idx}
              className="text-lg sm:text-xl font-black text-white mt-10 mb-4 pb-2.5 border-b-2 border-white/10 uppercase tracking-wide leading-tight"
            >
              {title}
            </h3>
          );
        }

        if (trimmed.startsWith('- ')) {
          let text = trimmed.substring(2);

          const italicLabelMatch = text.match(/^\*(.*?)\*:\s*([\s\S]*)/);
          if (italicLabelMatch) {
            const label = italicLabelMatch[1];
            const rest = italicLabelMatch[2].trim();

            if (label.length < 30) {
              return (
                <div key={idx} className="pl-4 border-l-2 border-red-500/30 mb-5 py-1">
                  <div className="mb-2">
                    <span className="inline-block text-[10px] sm:text-xs font-bold uppercase tracking-widest text-red-400 bg-red-400/10 border border-red-400/20 px-2.5 py-1 rounded">
                      {label}
                    </span>
                  </div>
                  <p
                    className="text-white/60 leading-relaxed text-sm sm:text-base"
                    dangerouslySetInnerHTML={{ __html: formatInline(rest) }}
                  />
                </div>
              );
            }

            return (
              <div key={idx} className="pl-4 border-l-2 border-white/10 mb-4 py-1">
                <p className="font-bold text-white/90 text-sm sm:text-base mb-1.5 leading-snug">{label}:</p>
                <p
                  className="text-white/60 leading-relaxed text-sm sm:text-base"
                  dangerouslySetInnerHTML={{ __html: formatInline(rest) }}
                />
              </div>
            );
          }

          const boldLabelMatch = text.match(/^\*\*(.*?)\*\*:\s*([\s\S]*)/);
          if (boldLabelMatch) {
            const label = boldLabelMatch[1];
            const rest = boldLabelMatch[2].trim();
            return (
              <div key={idx} className="pl-4 border-l-2 border-white/10 mb-4 py-1">
                <p className="font-bold text-white/90 text-sm sm:text-base mb-1.5 leading-snug">{label}:</p>
                <p
                  className="text-white/60 leading-relaxed text-sm sm:text-base"
                  dangerouslySetInnerHTML={{ __html: formatInline(rest) }}
                />
              </div>
            );
          }

          return (
            <p
              key={idx}
              className="text-white/60 leading-relaxed pl-4 border-l-2 border-white/10 mb-2.5 text-sm sm:text-base"
              dangerouslySetInnerHTML={{ __html: formatInline(text) }}
            />
          );
        }

        return (
          <p
            key={idx}
            className="text-white/50 leading-relaxed mb-2.5 text-sm sm:text-base"
            dangerouslySetInnerHTML={{ __html: formatInline(trimmed) }}
          />
        );
      })}
    </div>
  );
}

function RateLimitBanner({ retrySeconds, onRetry, onOffline }) {
  return (
    <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 mb-3">
      <div className="flex items-start gap-3">
        <div className="shrink-0 mt-0.5 w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
          <svg className="w-4 h-4 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-amber-300 font-bold text-sm mb-1">Rate limit reached</p>
          <p className="text-white/50 text-xs leading-relaxed mb-3">
            The free AI tier has a limited number of requests. You can wait for the cooldown to end, or generate an offline prediction instantly.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={onRetry}
              disabled={retrySeconds > 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold hover:bg-amber-500/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {retrySeconds > 0 ? (
                <>
                  <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2v4m0 12v4m-7.07-3.93l2.83-2.83m8.48-8.48l2.83-2.83M2 12h4m12 0h4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83"/></svg>
                  Retry in {retrySeconds}s
                </>
              ) : (
                <>
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
                  Retry Now
                </>
              )}
            </button>
            <button
              onClick={onOffline}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white/5 border border-white/20 text-white/60 text-xs font-bold hover:bg-white/10 hover:text-white transition-colors"
            >
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
              Use Offline Prediction
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PageNotice({ onDismiss }) {
  return (
    <div className="bg-blue-500/8 border border-blue-500/20 rounded-lg px-4 py-3 mb-4 flex items-start gap-3">
      <svg className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
      <p className="text-white/40 text-xs leading-relaxed flex-1">
        Predictions are powered by <span className="text-blue-400/80 font-semibold">Google Gemini AI</span>. Free users get <span className="text-white/60 font-semibold">{FREE_DAILY_LIMIT} per day</span>. Hit a limit? An <span className="text-white/60 font-semibold">offline prediction</span> is always available.{' '}
        <Link to="/donate" className="text-tavern-accent/80 hover:text-tavern-accent underline underline-offset-2">Support the project</Link>.
      </p>
      <button onClick={onDismiss} className="shrink-0 text-white/20 hover:text-white/50 transition-colors mt-0.5">
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
      </button>
    </div>
  );
}

function PremiumGate({ dailyCount }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-tavern-accent/10 border border-tavern-accent/20 flex items-center justify-center mb-6">
        <svg className="w-8 h-8 text-tavern-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      </div>
      <h2 className="text-xl font-extrabold text-white mb-2">Daily Limit Reached</h2>
      <p className="text-white/40 text-sm mb-1">You&apos;ve used <span className="text-tavern-accent font-bold">{dailyCount}/{FREE_DAILY_LIMIT}</span> free predictions today</p>
      <p className="text-white/25 text-xs mb-8 max-w-xs">Free predictions reset at midnight. Support the project to help cover API costs.</p>

      <div className="w-full max-w-xs space-y-3">
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 text-left">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">⚡</span>
            <span className="text-sm font-bold text-white">Unlimited Predictions</span>
          </div>
          <p className="text-xs text-white/30 leading-relaxed">Remove the daily cap entirely. Predict as many matchups as you want, anytime.</p>
          <div className="mt-3 flex items-center gap-2">
            <span className="text-[10px] font-bold text-white/20 uppercase tracking-wider">Coming Soon</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-white/20 font-bold">PREMIUM</span>
          </div>
        </div>

        <Link
          to="/donate"
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-white/5 border border-white/10 text-sm font-bold text-white/60 hover:bg-white/10 hover:text-white transition-all"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
          Support the Developer
        </Link>
      </div>
    </div>
  );
}

export default function GamePredict() {
  const { user } = useAuth();
  const [yourTeam, setYourTeam] = useState({ gold: '', mid: '', jungle: '', roam: '', exp: '' });
  const [enemyTeam, setEnemyTeam] = useState({ gold: '', mid: '', jungle: '', roam: '', exp: '' });
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState('');
  const [analysis, setAnalysis] = useState('');
  const [winnerText, setWinnerText] = useState('');
  const [noticeDismissed, setNoticeDismissed] = useState(false);
  const [rateLimit, setRateLimit] = useState(null);
  const [limitReached, setLimitReached] = useState(false);

  const [isPremium, setIsPremium] = useState(false);
  const [dailyCount, setDailyCount] = useState(0);

  const cancelRef = useRef(false);
  const hasAutoTriggered = useRef(false);
  const isPredictingRef = useRef(false);
  const firstLoadDone = useRef(false);

  // Fetch premium status and daily count
  const fetchUsage = useCallback(async () => {
    if (!user) return;
    try {
      const { data: profile } = await supabase.from('profiles').select('premium').eq('id', user.id).single();
      if (profile) setIsPremium(profile.premium || false);

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { count } = await supabase
        .from('prediction_usage')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('used_at', today.toISOString());
      setDailyCount(count || 0);
    } catch (err) {
      console.error('Usage fetch error:', err);
    }
  }, [user]);

  useEffect(() => { fetchUsage(); }, [fetchUsage]);

  // Countdown timer for rate limit retry
  useEffect(() => {
    if (!rateLimit || rateLimit.retrySeconds === null || rateLimit.retrySeconds <= 0) return;
    const timer = setTimeout(() => {
      setRateLimit(prev => prev ? { ...prev, retrySeconds: prev.retrySeconds - 1 } : null);
    }, 1000);
    return () => clearTimeout(timer);
  }, [rateLimit?.retrySeconds]);

  // On mount: randomly pick 10 unique heroes and assign to both teams
  useEffect(() => {
    if (!Array.isArray(heroData) || heroData.length < 10) return;

    const shuffled = [...heroData].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, 10);
    const roles = ['gold', 'mid', 'jungle', 'roam', 'exp'];

    const yt = {};
    const et = {};
    roles.forEach((role, i) => {
      yt[role] = selected[i].hero_name;
      et[role] = selected[i + 5].hero_name;
    });

    setYourTeam(yt);
    setEnemyTeam(et);
  }, []);

  const isFormValid = Object.values(yourTeam).every(Boolean) && Object.values(enemyTeam).every(Boolean);
  const allSelectedHeroes = [...Object.values(yourTeam).filter(Boolean), ...Object.values(enemyTeam).filter(Boolean)];
  const showCancel = loadingStep > 0 || analysis || limitReached;

  // Auto-trigger prediction once heroes are filled in
  useEffect(() => {
    if (hasAutoTriggered.current) return;
    if (!isFormValid) return;
    if (loadingStep > 0 || analysis) return;

    hasAutoTriggered.current = true;
    const timer = setTimeout(() => {
      handlePredict({ preventDefault: () => {} });
    }, 600);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFormValid, loadingStep, analysis]);

  const handleTeamChange = (isYourTeam, role, value) => {
    if (isYourTeam) setYourTeam(prev => ({ ...prev, [role]: value }));
    else setEnemyTeam(prev => ({ ...prev, [role]: value }));
  };

  const parseRateLimitError = (msg) => {
    const isRateLimit = /quota|rate.?limit|exceeded|429/i.test(msg);
    const retryMatch = msg.match(/retry in ([\d.]+)s/i);
    const retrySeconds = retryMatch ? Math.ceil(parseFloat(retryMatch[1])) : 30;
    return isRateLimit ? { retrySeconds } : null;
  };

  const handleOfflinePredict = () => {
    setRateLimit(null);
    setError('');
    setLimitReached(false);
    setWinnerText(MOCK_TEXT);
    setAnalysis(MOCK_TEXT);
  };

  const handlePredict = async (e) => {
    e.preventDefault();
    if (isPredictingRef.current) return;

    setError(''); setAnalysis(''); setWinnerText('');
    setRateLimit(null); setLimitReached(false);
    cancelRef.current = false;
    isPredictingRef.current = true;

    const team1Arr = Object.values(yourTeam).filter(Boolean);
    const team2Arr = Object.values(enemyTeam).filter(Boolean);

    if (team1Arr.length < 5 || team2Arr.length < 5) {
      isPredictingRef.current = false;
      return setError('Please select a hero for all 5 roles on both teams.');
    }
    if (new Set([...team1Arr, ...team2Arr]).size !== 10) {
      isPredictingRef.current = false;
      return setError('Duplicate heroes detected.');
    }

    try {
      setLoadingStep(1);
      await new Promise(res => setTimeout(res, 300));
      if (cancelRef.current) { setLoadingStep(0); isPredictingRef.current = false; return; }

      setLoadingStep(2);

      if (!firstLoadDone.current) {
        // ── FIRST LOAD: mock data, no API call, no usage count ──
        firstLoadDone.current = true;
        await new Promise(res => setTimeout(res, 3000));
        if (cancelRef.current) { setLoadingStep(0); isPredictingRef.current = false; return; }

        setLoadingStep(3);
        await new Promise(res => setTimeout(res, 400));
        if (cancelRef.current) { setLoadingStep(0); isPredictingRef.current = false; return; }

        setLoadingStep(4);
        await new Promise(res => setTimeout(res, 200));
        if (cancelRef.current) { setLoadingStep(0); isPredictingRef.current = false; return; }

        setWinnerText(MOCK_TEXT);
        setAnalysis(MOCK_TEXT);
        setLoadingStep(0);
      } else {
        // ── CHECK DAILY LIMIT ──
        if (!isPremium && dailyCount >= FREE_DAILY_LIMIT) {
          setLoadingStep(0);
          setLimitReached(true);
          isPredictingRef.current = false;
          return;
        }

        // ── SUBSEQUENT: real Gemini API call ──
        const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
        if (!API_KEY) throw new Error("API key not configured.");

        const prompt = `You are an expert MLBB esports analyst. Analyze this Best of 3 series.
Your Team: Gold: ${yourTeam.gold}, Mid: ${yourTeam.mid}, Jungle: ${yourTeam.jungle}, Roam: ${yourTeam.roam}, EXP: ${yourTeam.exp}
Enemy Team: Gold: ${enemyTeam.gold}, Mid: ${enemyTeam.mid}, Jungle: ${enemyTeam.jungle}, Roam: ${enemyTeam.roam}, EXP: ${enemyTeam.exp}

Predict the final score and detail exactly HOW the winning team secures victories in a Best of 3 matchup. Provide highly detailed, step-by-step macro and micro strategy.

You MUST use EXACTLY this format:
## SCORE: (e.g., "Score: 2 - 1 YOUR TEAM" or "Score: 1 - 2 ENEMY TEAM")
### HOW?: THE REASON
### WHAT TO DO?: THE SOLUTION
### META: TIPS AND TRICKS`;

        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        if (cancelRef.current) { setLoadingStep(0); isPredictingRef.current = false; return; }

        const data = await res.json();
        if (data.error) throw new Error(data.error.message);
        if (!data.candidates || !data.candidates[0]) throw new Error("AI returned an empty response.");

        setLoadingStep(3);
        await new Promise(res => setTimeout(res, 400));
        if (cancelRef.current) { setLoadingStep(0); isPredictingRef.current = false; return; }

        setLoadingStep(4);
        await new Promise(res => setTimeout(res, 200));
        if (cancelRef.current) { setLoadingStep(0); isPredictingRef.current = false; return; }

        const rawText = data.candidates[0].content.parts[0].text;
        setWinnerText(rawText);
        setAnalysis(rawText);
        setLoadingStep(0);

        // ── INCREMENT USAGE (non-premium only) ──
        if (!isPremium) {
          await supabase.from('prediction_usage').insert({ user_id: user.id });
          setDailyCount(c => c + 1);
        }
      }
    } catch (err) {
      if (!cancelRef.current) {
        const parsed = parseRateLimitError(err.message || '');
        if (parsed) {
          setRateLimit(parsed);
          setError('');
        } else {
          setError(err.message || "Failed to generate prediction.");
        }
      }
      setLoadingStep(0);
    } finally {
      isPredictingRef.current = false;
    }
  };

  const handleCancel = () => {
    cancelRef.current = true;
    isPredictingRef.current = false;
    setLoadingStep(0);
    setError('');
    setRateLimit(null);
    setAnalysis('');
    setWinnerText('');
    setLimitReached(false);
    setYourTeam({ gold: '', mid: '', jungle: '', roam: '', exp: '' });
    setEnemyTeam({ gold: '', mid: '', jungle: '', roam: '', exp: '' });
    hasAutoTriggered.current = false;
  };

  const HeroSlot = ({ isYourTeam, role, label, value, allSelectedHeroes }) => {
    const availableHeroes = heroData.filter(h => !allSelectedHeroes.includes(h.hero_name) || h.hero_name === value);
    return (
      <div>
        <label className="block text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1">{label}</label>
        <div className="flex items-center gap-3">
          <select value={value} onChange={(e) => handleTeamChange(isYourTeam, role, e.target.value)} className="input-style flex-1">
            <option value="">Select Hero...</option>
            {availableHeroes.map(h => <option key={h.hero_name} value={h.hero_name}>{h.hero_name}</option>)}
          </select>
          {value && <HeroIcon name={value} />}
        </div>
      </div>
    );
  };

  const remaining = Math.max(0, FREE_DAILY_LIMIT - dailyCount);

  return (
    <div className="max-w-6xl mx-auto">

      {/* ── PAGE NOTICE ── */}
      {!noticeDismissed && <PageNotice onDismiss={() => setNoticeDismissed(true)} />}

      <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-7rem)]">

        {/* LEFT COLUMN: Form */}
        <div className="w-full lg:w-[45%] flex flex-col shrink-0">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-extrabold text-white mb-1">Game Predict</h1>
              <p className="text-white/40 text-sm">Assign heroes to roles to predict the outcome.</p>
            </div>
            {showCancel && (
              <button
                type="button"
                onClick={handleCancel}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold uppercase tracking-wider hover:bg-red-500/20 hover:border-red-500/50 transition-all shrink-0"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
                Cancel
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto pr-2 space-y-3 pb-4">
            <div className="bg-white/5 border border-tavern-accent/20 rounded-xl p-5">
              <h2 className="text-sm font-bold text-tavern-accent mb-4 uppercase tracking-wider">Your Team</h2>
              <div className="space-y-2">
                {ROLES.map(r => (
                  <HeroSlot key={r.key} isYourTeam={true} role={r.key} label={r.label} value={yourTeam[r.key]} allSelectedHeroes={allSelectedHeroes} />
                ))}
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
              <h2 className="text-sm font-bold text-white/50 mb-4 uppercase tracking-wider">Enemy Team</h2>
              <div className="space-y-2">
                {ROLES.map(r => (
                  <HeroSlot key={r.key} isYourTeam={false} role={r.key} label={r.label} value={enemyTeam[r.key]} allSelectedHeroes={allSelectedHeroes} />
                ))}
              </div>
            </div>
          </div>

          {/* FIXED AT BOTTOM */}
          <div className="pt-2 mt-2 border-t border-white/10 shrink-0 bg-tavern-dark">
            {loadingStep > 0 && <PredictLoader step={loadingStep} />}

            {/* ── RATE LIMIT BANNER ── */}
            {rateLimit && !loadingStep && (
              <RateLimitBanner
                retrySeconds={rateLimit.retrySeconds}
                onRetry={() => handlePredict({ preventDefault: () => {} })}
                onOffline={handleOfflinePredict}
              />
            )}

            <div className="flex gap-2 mt-2">
              <button
                type="button"
                onClick={handlePredict}
                disabled={loadingStep > 0 || !isFormValid}
                className="flex-1 py-3 rounded-lg bg-tavern-accent hover:bg-red-700 text-white font-bold transition-colors disabled:opacity-50"
              >
                {loadingStep > 0 ? "Processing..." : "Generate Prediction"}
              </button>
              {showCancel && (
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-5 py-3 rounded-lg bg-white/5 border border-white/20 text-white/60 font-bold hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 transition-all"
                >
                  Cancel
                </button>
              )}
            </div>
            
            {/* Usage counter */}
            {!isPremium && (
              <p className="text-[10px] text-white/20 text-center mt-2">
                {dailyCount}/{FREE_DAILY_LIMIT} free predictions used today
                {remaining > 0 && remaining <= 1 && <span className="text-amber-400/60 ml-1">— 1 remaining</span>}
              </p>
            )}
            {isPremium && (
              <p className="text-[10px] text-tavern-accent/40 text-center mt-1 flex items-center justify-center gap-1">
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                Premium — Unlimited predictions
              </p>
            )}
            
            {error && <p className="text-red-400 text-xs text-center mt-2 font-medium">{error}</p>}
          </div>
        </div>

        {/* RIGHT COLUMN: Output */}
        <div className="w-full lg:w-[55%] lg:sticky lg:top-24 lg:self-start bg-white/2 border border-white/5 rounded-xl p-4">
          {!analysis && !loadingStep && !rateLimit && !limitReached && (
            <div className="flex items-center justify-center h-full text-white/20 text-sm">
              Prediction output will appear here...
            </div>
          )}
          
          {limitReached && <PremiumGate dailyCount={dailyCount} />}
          
          {loadingStep > 0 && !analysis && !limitReached && (
            <div className="flex flex-col items-center justify-center h-64 text-white/30">
              <svg className="animate-spin h-8 w-8 text-tavern-accent mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
              <p className="text-sm font-medium">AI is thinking...</p>
            </div>
          )}
          
          {analysis && (
            <div className="lg:max-h-[85vh] lg:overflow-y-auto pr-1">
              <MatchupCard
                yourTeam={yourTeam}
                enemyTeam={enemyTeam}
                winnerText={winnerText}
              />
              <div className="flex gap-2 mt-6 mb-6">
                <button
                  onClick={async () => {
                    const el = document.getElementById('matchup-card-img');
                    if (!el) return alert('Card not ready');
                    try {
                      const dataUrl = await safeToPng(el);
                      const link = document.createElement('a');
                      link.download = `MLBB-Prediction-${Date.now()}.png`;
                      link.href = dataUrl;
                      link.click();
                    } catch (err) {
                      alert('Failed to generate image.');
                      console.error(err);
                    }
                  }}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border border-white/20 text-sm font-bold text-white/60 hover:text-white hover:border-white/40 transition-colors"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                  Download
                </button>
                <button
                  onClick={handleCancel}
                  className="flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-lg border border-red-500/30 text-sm font-bold text-red-400 hover:bg-red-500/10 hover:border-red-500/50 transition-all"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
                  Cancel
                </button>
              </div>

              <AnalysisOutput content={analysis} />
            </div>
          )}
        </div>

      </div>
    </div>
  );
}