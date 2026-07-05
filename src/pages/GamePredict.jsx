import { useState, useEffect, useRef } from 'react';
import { toPng } from 'html-to-image';
import MatchupCard from '../components/MatchupCard';
import heroData from '../data/heroes.json'

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

// COMPLETELY REBUILT: Handles **bold**, *italic*, *Label:* pills, score extraction, proper typography
function AnalysisOutput({ content }) {
  const formatInline = (text) => {
    // Bold **text**
    let formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-white/90">$1</strong>');
    // Italic *text* (for inline emphasis that isn't a label)
    formatted = formatted.replace(/\*(.*?)\*/g, '<em class="italic text-white/80 font-medium">$1</em>');
    return formatted;
  };

  const lines = content.split('\n');

  return (
    <div className="space-y-1 text-sm sm:text-base break-words">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={idx} className="h-4" />;

        // --- SCORE / WINNER BLOCK ---
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

        // --- SECTION HEADERS (###) ---
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

        // --- BULLET POINTS (- ...) ---
        if (trimmed.startsWith('- ')) {
          let text = trimmed.substring(2);

          // Pattern 1: *ShortLabel*: rest → Red pill badge
          const italicLabelMatch = text.match(/^\*(.*?)\*:\s*([\s\S]*)/);
          if (italicLabelMatch) {
            const label = italicLabelMatch[1];
            const rest = italicLabelMatch[2].trim();

            // Short keyword labels get the pill treatment
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

            // Long italic labels (e.g. "*The Ultimate Counter (Lolita vs Miya):*") → just bold it
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

          // Pattern 2: **BoldLabel**: rest → White bold sub-header
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

          // Pattern 3: Plain bullet
          return (
            <p
              key={idx}
              className="text-white/60 leading-relaxed pl-4 border-l-2 border-white/10 mb-2.5 text-sm sm:text-base"
              dangerouslySetInnerHTML={{ __html: formatInline(text) }}
            />
          );
        }

        // --- PLAIN PARAGRAPH ---
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

export default function GamePredict() {
  const [yourTeam, setYourTeam] = useState({ gold: '', mid: '', jungle: '', roam: '', exp: '' });
  const [enemyTeam, setEnemyTeam] = useState({ gold: '', mid: '', jungle: '', roam: '', exp: '' });
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState('');
  const [analysis, setAnalysis] = useState('');
  const [winnerText, setWinnerText] = useState('');

  const handleTeamChange = (isYourTeam, role, value) => {
    if (isYourTeam) setYourTeam(prev => ({ ...prev, [role]: value }));
    else setEnemyTeam(prev => ({ ...prev, [role]: value }));
  };

  const handlePredict = async (e) => {
    e.preventDefault();
    setError(''); setAnalysis(''); setWinnerText('');

    const team1Arr = Object.values(yourTeam).filter(Boolean);
    const team2Arr = Object.values(enemyTeam).filter(Boolean);

    if (team1Arr.length < 5 || team2Arr.length < 5) return setError('Please select a hero for all 5 roles on both teams.');
    if (new Set([...team1Arr, ...team2Arr]).size !== 10) return setError('Duplicate heroes detected.');

    try {
      setLoadingStep(1);
      await new Promise(res => setTimeout(res, 300));
      setLoadingStep(2);

      const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

      if (!API_KEY) {
        await new Promise(res => setTimeout(res, 3000));
        setLoadingStep(0);
        const mockText = `## SCORE: 2 - 1 YOUR TEAM\n\n### PHASE 1: EARLY GAME (0-4 MINS)\n- *Macro:* Focus on securing the first turtle and establishing jungle vision dominance. Do not contest the first crab if Eudora is missing.\n- *Micro:* Bruno must play extremely safe. Do not push past the river. Freeze the lane near your Tier 1 tower.\n- *Key Detail:* If Eudora gets an early ambush kill on Bruno, Fanny will uncontested take the Blue Buff and snowball out of control.\n\n### PHASE 2: MID GAME (4-8 MINS)\n- *Macro:* Hayabusa out-tempos Bane in the jungle. Force side-lane objectives while Bane is farming. Split push to draw enemies away from Turtle.\n- *Micro:* Saber needs to find picks on Rafaela or Miya during lane rotations. Use Skill 2 combo over walls.\n- **Jungle Tracking:** Always keep a ward on the enemy Blue Buff pit after the 4-minute mark.\n\n### PHASE 3: LATE GAME (8+ MINS)\n- *Macro:* Group as 5 and force Lord fights. Your team comp is significantly stronger in 5v5 front-to-back engagements.\n- *Micro:* Lolita must time her Skill 2 exactly when Miya activates her Ultimate. This single interaction wins or loses the late-game team fight.\n- **Win Condition:** Bait out Fanny's cables before engaging. Once Fanny is locked down, collapse on the backline immediately.`;
        setWinnerText(mockText);
        setAnalysis(mockText);
      } else {
        const prompt = `You are an expert MLBB esports analyst. Analyze this Best of 3 series.
Your Team: Gold: ${yourTeam.gold}, Mid: ${yourTeam.mid}, Jungle: ${yourTeam.jungle}, Roam: ${yourTeam.roam}, EXP: ${yourTeam.exp}
Enemy Team: Gold: ${enemyTeam.gold}, Mid: ${enemyTeam.mid}, Jungle: ${enemyTeam.jungle}, Roam: ${enemyTeam.roam}, EXP: ${enemyTeam.exp}

Predict the final score and detail exactly HOW the winning team secures victories in a Best of 3 matchup. Provide highly detailed, step-by-step macro and micro strategy.

You MUST use EXACTLY this format:
## SCORE: (e.g., "Score: 2 - 1 YOUR TEAM" or "Score: 1 - 2 ENEMY TEAM")
### HOW?: THE REASON
### WHAT TO DO?: THE SOLUTION
### META: TIPS AND TRICKS`;

        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });

        const data = await res.json();
        if (data.error) throw new Error(data.error.message);
        if (!data.candidates || !data.candidates[0]) throw new Error("AI returned an empty response.");

        setLoadingStep(3);
        await new Promise(res => setTimeout(res, 400));
        setLoadingStep(4);
        await new Promise(res => setTimeout(res, 200));

        const rawText = data.candidates[0].content.parts[0].text;
        setWinnerText(rawText);
        setAnalysis(rawText);
        setLoadingStep(0);
      }
    } catch (err) {
      setError(err.message || "Failed to generate prediction.");
      setLoadingStep(0);
    }
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

  const allSelectedHeroes = [...Object.values(yourTeam).filter(Boolean), ...Object.values(enemyTeam).filter(Boolean)];
  const isFormValid = Object.values(yourTeam).every(Boolean) && Object.values(enemyTeam).every(Boolean);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-7rem)]">

        {/* LEFT COLUMN: Form */}
        <div className="w-full lg:w-[45%] flex flex-col shrink-0">
          <div className="mb-3">
            <h1 className="text-2xl font-extrabold text-white mb-1">Game Predict</h1>
            <p className="text-white/40 text-sm">Assign heroes to roles to predict the outcome.</p>
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
            <button
              type="button"
              onClick={handlePredict}
              disabled={loadingStep > 0 || !isFormValid}
              className="w-full py-3 rounded-lg bg-tavern-accent hover:bg-red-700 text-white font-bold transition-colors disabled:opacity-50 mt-2"
            >
              {loadingStep > 0 ? "Processing..." : "Generate Prediction"}
            </button>
            {error && <p className="text-red-400 text-xs text-center mt-2 font-medium">{error}</p>}
          </div>
        </div>

        {/* RIGHT COLUMN: Output */}
        <div className="w-full lg:w-[55%] lg:sticky lg:top-24 lg:self-start bg-white/2 border border-white/5 rounded-xl p-4">
          {!analysis && !loadingStep && (
            <div className="flex items-center justify-center h-full text-white/20 text-sm">
              Prediction output will appear here...
            </div>
          )}
          {loadingStep > 0 && !analysis && (
            <div className="flex flex-col items-center justify-center h-full text-white/30">
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
              <button
                onClick={async () => {
                  const el = document.getElementById('matchup-card-img');
                  if (!el) return alert('Card not ready');
                  try {
                    const dataUrl = await toPng(el, { cacheBust: true, pixelRatio: 2 });
                    const link = document.createElement('a');
                    link.download = `MLBB-Prediction-${Date.now()}.png`;
                    link.href = dataUrl;
                    link.click();
                  } catch (err) {
                    alert('Failed to generate image.');
                    console.error(err);
                  }
                }}
                className="w-full mb-6 flex items-center justify-center gap-2 py-2.5 rounded-lg border border-white/20 text-sm font-bold text-white/60 hover:text-white hover:border-white/40 transition-colors mt-6"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                Download Matchup Report
              </button>

              <AnalysisOutput content={analysis} />
            </div>
          )}
        </div>

      </div>
    </div>
  );
}