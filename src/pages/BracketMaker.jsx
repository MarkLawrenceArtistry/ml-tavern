// ============================================================
// FILE: src/pages/BracketMaker.jsx
// ============================================================
import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { exportNodeToPng } from '../lib/exportImage';

// ---- Helpers ----
function nextPow2(n) {
  if (n <= 2) return 2;
  let p = 2;
  while (p < n) p *= 2;
  return p;
}

function roundNames(count) {
  if (count === 1) return ['Final'];
  if (count === 2) return ['Semifinals', 'Final'];
  if (count === 3) return ['Quarterfinals', 'Semifinals', 'Final'];
  if (count === 4) return ['Round of 16', 'Quarterfinals', 'Semifinals', 'Final'];
  if (count === 5) return ['Round of 32', 'Round of 16', 'Quarterfinals', 'Semifinals', 'Final'];
  return Array.from({ length: count }, (_, i) => {
    if (i === count - 1) return 'Final';
    if (i === count - 2) return 'Semifinals';
    if (i === count - 3) return 'Quarterfinals';
    return `Round ${i + 1}`;
  });
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function parseNames(text) {
  return text.split('\n').map((s) => s.trim()).filter((s) => s.length > 0);
}

// ---- Single Elimination Generator ----
function genSingleElim(teams, doShuffle) {
  const sorted = doShuffle ? shuffle(teams) : [...teams];
  const size = nextPow2(sorted.length);
  const nRounds = Math.log2(size);
  const seeded = new Array(size).fill(null);
  sorted.forEach((t, i) => (seeded[i] = t));

  const names = roundNames(nRounds);
  const rounds = [];

  // First round: pair i with (size-1-i) — byes always face a real team
  const first = [];
  for (let i = 0; i < size / 2; i++) {
    const t1 = seeded[i];
    const t2 = seeded[size - 1 - i];
    const isBye = t1 === null || t2 === null;
    first.push({
      team1: t1,
      team2: t2,
      score1: '',
      score2: '',
      winner: isBye ? (t1 ? 'team1' : t2 ? 'team2' : null) : null,
      bye: isBye,
    });
  }
  rounds.push({ name: names[0], matches: first });

  for (let r = 1; r < nRounds; r++) {
    const ms = [];
    const count = size / Math.pow(2, r + 1);
    for (let m = 0; m < count; m++) {
      const p1 = rounds[r - 1].matches[m * 2];
      const p2 = rounds[r - 1].matches[m * 2 + 1];
      const t1 = p1?.winner ? p1[p1.winner] : null;
      const t2 = p2?.winner ? p2[p2.winner] : null;
      const isBye = t1 === null || t2 === null;
      ms.push({
        team1: t1,
        team2: t2,
        score1: '',
        score2: '',
        winner: isBye ? (t1 ? 'team1' : t2 ? 'team2' : null) : null,
        bye: isBye,
      });
    }
    rounds.push({ name: names[r], matches: ms });
  }
  return rounds;
}

// ---- Round Robin Generator ----
function genRoundRobin(teams) {
  const n = teams.length;
  if (n < 2) return { rounds: [] };
  const hasBye = n % 2 !== 0;
  const eff = hasBye ? [...teams, null] : [...teams];
  const sz = eff.length;
  const fixed = eff[0];
  const rot = eff.slice(1);
  const rounds = [];
  const numR = sz - 1;

  for (let r = 0; r < numR; r++) {
    const matches = [];
    for (let m = 0; m < sz / 2; m++) {
      const a = m === 0 ? fixed : rot[m - 1];
      const b = rot[sz - 2 - m];
      if (a && b) {
        matches.push({ team1: a, team2: b, score1: '', score2: '', winner: null });
      }
    }
    rounds.push({ name: `Round ${r + 1}`, matches });
    rot.push(rot.shift());
  }
  return { rounds };
}

function calcStandings(rounds) {
  const map = {};
  rounds.forEach((r) =>
    r.matches.forEach((m) => {
      [m.team1, m.team2].forEach((t) => {
        if (t && !map[t]) map[t] = { team: t, w: 0, l: 0, played: 0 };
      });
    })
  );
  rounds.forEach((r) =>
    r.matches.forEach((m) => {
      if (!m.winner || !map[m.team1] || !map[m.team2]) return;
      map[m.team1].played++;
      map[m.team2].played++;
      if (m.winner === 'team1') {
        map[m.team1].w++;
        map[m.team2].l++;
      } else {
        map[m.team2].w++;
        map[m.team1].l++;
      }
    })
  );
  return Object.values(map).sort((a, b) => b.w - a.w || a.l - b.l);
}

// ---- Responsive dimensions hook ----
function useDims() {
  const [d, setD] = useState({ mw: 164, mh: 88, cw: 24, mg: 10, fs: 12 });
  useEffect(() => {
    const up = () => {
      const w = window.innerWidth;
      if (w < 420) setD({ mw: 115, mh: 74, cw: 14, mg: 6, fs: 10 });
      else if (w < 640) setD({ mw: 138, mh: 80, cw: 18, mg: 8, fs: 11 });
      else setD({ mw: 164, mh: 88, cw: 24, mg: 10, fs: 12 });
    };
    up();
    window.addEventListener('resize', up);
    return () => window.removeEventListener('resize', up);
  }, []);
  return d;
}

// ---- Position math ----
function matchTop(ri, mi, mh, mg) {
  if (ri === 0) return mi * (mh + mg);
  const a = matchTop(ri - 1, mi * 2, mh, mg) + mh / 2;
  const b = matchTop(ri - 1, mi * 2 + 1, mh, mg) + mh / 2;
  return (a + b) / 2 - mh / 2;
}

// ---- Match Card (Single Elim) ----
function BrackMatch({ match, ri, mi, dims, onWin, onScore, top, left }) {
  const { mw, mh, fs } = dims;
  const t1w = match.winner === 'team1';
  const t2w = match.winner === 'team2';
  const hasW = !!match.winner;
  // KEY FIX: bye is now recalculated live, not just from initial generation
  const isBye = !(match.team1 && match.team2);
  const canPick = !isBye;

  function Slot({ side, isW }) {
    const isByeSide = isBye && !match[side];
    const sk = side === 'team1' ? 'score1' : 'score2';
    return (
      <div
        className={`flex items-center border-b border-white/[0.04] last:border-b-0 transition-colors select-none ${
          isW
            ? 'bg-tavern-accent/20'
            : hasW
            ? 'opacity-25'
            : canPick && !isByeSide
            ? 'cursor-pointer hover:bg-white/[0.05]'
            : ''
        }`}
        style={{ height: mh / 2 }}
        onClick={() => canPick && !isByeSide && onWin(ri, mi, side)}
      >
        <span
          className="flex-1 min-w-0 truncate px-2"
          style={{
            fontSize: fs + 'px',
            color: isByeSide
              ? 'rgba(255,255,255,0.15)'
              : isW
              ? '#fff'
              : 'rgba(255,255,255,0.65)',
            fontWeight: isW ? 700 : 400,
            fontStyle: isByeSide ? 'italic' : 'normal',
          }}
        >
          {isByeSide ? 'BYE' : match[side] || 'TBD'}
        </span>
        <input
          type="text"
          value={match[sk]}
          onChange={(e) =>
            onScore(ri, mi, sk, e.target.value.replace(/[^0-9-]/g, ''))
          }
          className="w-7 text-center bg-transparent border border-white/10 rounded-sm focus:border-tavern-accent/40 outline-none shrink-0 tabular-nums disabled:opacity-20"
          style={{
            fontSize: Math.max(fs - 2, 9) + 'px',
            color: 'rgba(255,255,255,0.45)',
            height: mh / 2 - 8,
            marginRight: 4,
          }}
          placeholder="-"
          onClick={(e) => e.stopPropagation()}
          maxLength={3}
          disabled={isByeSide}
        />
        {canPick && !isByeSide && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onWin(ri, mi, side);
            }}
            className="shrink-0 flex items-center justify-center transition-colors mr-1.5 rounded"
            style={{
              width: mh / 2 - 10,
              height: mh / 2 - 10,
            }}
            title="Advance this team"
          >
            {isW ? (
              <svg
                className="w-3 h-3"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#FF2400"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <svg
                className="w-3 h-3"
                viewBox="0 0 24 24"
                fill="none"
                stroke="rgba(255,255,255,0.15)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            )}
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className="absolute bg-white/[0.03] border border-white/10 rounded-lg overflow-hidden"
      style={{ width: mw, height: mh, top, left }}
    >
      <Slot side="team1" isW={t1w} />
      <Slot side="team2" isW={t2w} />
    </div>
  );
}

// ---- SVG Connectors ----
function Connectors({ bracket, dims }) {
  const { mw, mh, cw, mg } = dims;
  const paths = [];
  for (let r = 0; r < bracket.length - 1; r++) {
    for (let m = 0; m < bracket[r + 1].matches.length; m++) {
      const xOut = r * (mw + cw) + mw;
      const xMid = xOut + cw / 2;
      const xIn = (r + 1) * (mw + cw);
      const y1 = matchTop(r, m * 2, mh, mg) + mh / 2;
      const y2 = matchTop(r, m * 2 + 1, mh, mg) + mh / 2;
      const yN = matchTop(r + 1, m, mh, mg) + mh / 2;
      paths.push(
        `M${xOut},${y1} H${xMid}`,
        `M${xOut},${y2} H${xMid}`,
        `M${xMid},${y1} V${y2}`,
        `M${xMid},${yN} H${xIn}`
      );
    }
  }
  const w = bracket.length * mw + (bracket.length - 1) * cw;
  const h = bracket[0].matches.length * (mh + mg) - mg;
  return (
    <svg
      className="absolute top-0 left-0 pointer-events-none"
      width={w}
      height={h}
    >
      <path
        d={paths.join(' ')}
        fill="none"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ---- Robin Match Card ----
function RobinMatch({ match, ri, mi, onWin, onScore }) {
  const t1w = match.winner === 'team1';
  const t2w = match.winner === 'team2';
  const canPick = !!(match.team1 && match.team2);

  function Slot({ side, isW }) {
    const sk = side === 'team1' ? 'score1' : 'score2';
    return (
      <div
        className={`flex items-center gap-2 px-3 py-2.5 transition-colors select-none ${
          isW
            ? 'bg-tavern-accent/20'
            : match.winner
            ? 'opacity-25'
            : canPick
            ? 'cursor-pointer hover:bg-white/[0.05]'
            : ''
        }`}
        onClick={() => canPick && onWin(ri, mi, side)}
      >
        <span
          className={`flex-1 min-w-0 truncate text-sm ${
            isW ? 'text-white font-bold' : 'text-white/70'
          }`}
        >
          {match[side]}
        </span>
        <input
          type="text"
          value={match[sk]}
          onChange={(e) =>
            onScore(ri, mi, sk, e.target.value.replace(/[^0-9-]/g, ''))
          }
          className="w-8 text-center text-xs text-white/50 bg-white/[0.04] border border-white/10 rounded px-1 py-1 outline-none focus:border-tavern-accent/40 tabular-nums shrink-0"
          placeholder="-"
          onClick={(e) => e.stopPropagation()}
          maxLength={3}
        />
        {canPick && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onWin(ri, mi, side);
            }}
            className="shrink-0 w-6 h-6 rounded flex items-center justify-center transition-colors"
            style={{
              background: isW
                ? 'rgba(255,36,0,0.3)'
                : 'rgba(255,255,255,0.04)',
            }}
            title="Advance"
          >
            {isW ? (
              <svg
                className="w-3 h-3"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#FF2400"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <svg
                className="w-3 h-3"
                viewBox="0 0 24 24"
                fill="none"
                stroke="rgba(255,255,255,0.15)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            )}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white/[0.03] border border-white/10 rounded-lg overflow-hidden">
      <Slot side="team1" isW={t1w} />
      <div className="h-px bg-white/[0.06] relative">
        <span className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 text-[8px] font-bold text-white/10 bg-[#111] px-1.5 leading-none tracking-widest">
          VS
        </span>
      </div>
      <Slot side="team2" isW={t2w} />
    </div>
  );
}

// ===================================================================
export default function BracketMaker() {
  const [phase, setPhase] = useState('setup');
  const [mode, setMode] = useState('single');
  const [name, setName] = useState('Tournament');
  const [namesText, setNamesText] = useState('');
  const [doShuffle, setDoShuffle] = useState(false);
  const [bracket, setBracket] = useState(null);
  const [robin, setRobin] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');
  const imgRef = useRef(null);
  const dims = useDims();

  const participants = useMemo(() => parseNames(namesText), [namesText]);

  const handleGenerate = () => {
    setError('');
    if (participants.length < 2) {
      setError('Enter at least 2 participants.');
      return;
    }
    if (mode === 'single') {
      if (participants.length > 64) {
        setError('Maximum 64 participants for single elimination.');
        return;
      }
      setBracket(genSingleElim(participants, doShuffle));
      setRobin(null);
    } else {
      if (participants.length > 16) {
        setError('Maximum 16 participants for round robin.');
        return;
      }
      setRobin(genRoundRobin(participants));
      setBracket(null);
    }
    setPhase('bracket');
  };

  const handleBack = () => {
    setPhase('setup');
    setBracket(null);
    setRobin(null);
  };

  // ---- Single elim: advance winner ----
  const handleBrackWin = useCallback((ri, mi, side) => {
    setBracket((prev) => {
      if (!prev) return prev;
      const u = prev.map((r) => ({
        ...r,
        matches: r.matches.map((m) => ({ ...m })),
      }));
      const m = u[ri].matches[mi];
      // Toggle: click same side again to deselect
      m.winner = m.winner === side ? null : side;
      const wn = m.winner ? m[m.winner] : '';

      // Propagate to next round
      const nr = ri + 1;
      if (nr < u.length) {
        const nm = Math.floor(mi / 2);
        const slot = mi % 2 === 0 ? 'team1' : 'team2';
        u[nr].matches[nm][slot] = wn;
        u[nr].matches[nm].winner = null;
        // *** THE FIX: recalculate bye based on whether BOTH teams are now present ***
        u[nr].matches[nm].bye = !(
          u[nr].matches[nm].team1 && u[nr].matches[nm].team2
        );

        // Clear everything further downstream
        for (let r = nr + 1; r < u.length; r++) {
          u[r].matches.forEach((x) => {
            x.team1 = '';
            x.team2 = '';
            x.score1 = '';
            x.score2 = '';
            x.winner = null;
            x.bye = true;
          });
        }
      }
      return u;
    });
  }, []);

  const handleBrackScore = useCallback((ri, mi, key, val) => {
    setBracket((prev) => {
      if (!prev) return prev;
      const u = prev.map((r) => ({
        ...r,
        matches: r.matches.map((m) => ({ ...m })),
      }));
      u[ri].matches[mi][key] = val;
      return u;
    });
  }, []);

  // ---- Robin handlers ----
  const handleRobinWin = useCallback((ri, mi, side) => {
    setRobin((prev) => {
      if (!prev) return prev;
      const u = prev.rounds.map((r) => ({
        ...r,
        matches: r.matches.map((m) => ({ ...m })),
      }));
      u[ri].matches[mi].winner =
        u[ri].matches[mi].winner === side ? null : side;
      return { rounds: u };
    });
  }, []);

  const handleRobinScore = useCallback((ri, mi, key, val) => {
    setRobin((prev) => {
      if (!prev) return prev;
      const u = prev.rounds.map((r) => ({
        ...r,
        matches: r.matches.map((m) => ({ ...m })),
      }));
      u[ri].matches[mi][key] = val;
      return { rounds: u };
    });
  }, []);

  // ---- Download ----
  const handleDownload = async () => {
    if (!imgRef.current) return;
    setDownloading(true);
    try {
      const dataUrl = await exportNodeToPng(imgRef.current);
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `${name || 'bracket'}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error('Export failed:', err);
      alert('Export failed. Try again.');
    } finally {
      setDownloading(false);
    }
  };

  // ---- Derived ----
  const bracketSize = bracket ? nextPow2(participants.length) : 0;
  const byeCount = bracketSize - participants.length;
  const finalMatch = bracket?.[bracket.length - 1]?.matches[0];
  const champ = finalMatch?.winner ? finalMatch[finalMatch.winner] : null;
  const standings = robin ? calcStandings(robin.rounds) : [];
  const hasData = bracket || robin;

  // ================================================================
  // SETUP PHASE
  // ================================================================
  if (phase === 'setup') {
    return (
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-8">
          Bracket Maker
        </h1>

        <div className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-white/40 uppercase tracking-wider mb-2">
              Tournament Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter name..."
              className="input-style"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-white/40 uppercase tracking-wider mb-2">
              Mode
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setMode('single')}
                className={`px-4 py-3 rounded-xl text-sm font-bold border transition-colors text-left ${
                  mode === 'single'
                    ? 'bg-tavern-accent/15 border-tavern-accent/40 text-tavern-accent'
                    : 'bg-white/[0.03] border-white/10 text-white/50 hover:bg-white/[0.06]'
                }`}
              >
                <div className="font-bold">Single Elimination</div>
                <div className="text-[11px] mt-0.5 opacity-60">
                  Bracket knockout
                </div>
              </button>
              <button
                onClick={() => setMode('robin')}
                className={`px-4 py-3 rounded-xl text-sm font-bold border transition-colors text-left ${
                  mode === 'robin'
                    ? 'bg-tavern-accent/15 border-tavern-accent/40 text-tavern-accent'
                    : 'bg-white/[0.03] border-white/10 text-white/50 hover:bg-white/[0.06]'
                }`}
              >
                <div className="font-bold">Round Robin</div>
                <div className="text-[11px] mt-0.5 opacity-60">
                  Everyone plays everyone
                </div>
              </button>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-white/40 uppercase tracking-wider">
                Participants
              </label>
              <span className="text-xs text-white/25">
                {participants.length} entered
                {mode === 'single' && participants.length >= 2
                  ? ` → ${nextPow2(participants.length)}-team bracket${
                      byeCount > 0
                        ? ` (${byeCount} bye${byeCount > 1 ? 's' : ''})`
                        : ''
                    }`
                  : ''}
              </span>
            </div>
            <textarea
              value={namesText}
              onChange={(e) => setNamesText(e.target.value)}
              placeholder={'Team Alpha\nTeam Beta\nTeam Gamma\nTeam Delta\n...'}
              rows={10}
              className="input-style resize-none font-mono text-sm"
            />
            <p className="text-[11px] text-white/20 mt-1.5">
              One participant per line
              {mode === 'robin' ? ' (max 16)' : ' (max 64)'}
            </p>
          </div>

          {mode === 'single' && (
            <label className="flex items-center gap-3 cursor-pointer select-none group" onClick={() => setDoShuffle(!doShuffle)}>
              <div
                className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                  doShuffle
                    ? 'bg-tavern-accent border-tavern-accent'
                    : 'border-white/20 group-hover:border-white/40'
                }`}
              >
                {doShuffle && (
                  <svg
                    className="w-3 h-3 text-white"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
              <span className="text-sm text-white/60 group-hover:text-white/80 transition-colors">
                Randomize seed order
              </span>
            </label>
          )}

          {error && (
            <p className="text-sm text-red-400 font-medium">{error}</p>
          )}

          <button
            onClick={handleGenerate}
            className="w-full py-3.5 bg-tavern-accent text-white font-bold rounded-xl hover:bg-tavern-accent/80 transition-colors text-sm"
          >
            Generate Bracket
          </button>
        </div>
      </div>
    );
  }

  // ================================================================
  // BRACKET PHASE — SINGLE ELIMINATION
  // ================================================================
  if (bracket) {
    const { mw, mh, cw, mg } = dims;
    const bW = bracket.length * mw + (bracket.length - 1) * cw;
    const bH = bracket[0].matches.length * (mh + mg) - mg;
    const pad = 40;

    return (
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={handleBack}
              className="shrink-0 p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors"
            >
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white truncate">
              {name || 'Tournament'}
            </h1>
            {byeCount > 0 && (
              <span className="text-[10px] font-bold text-white/25 shrink-0">
                {byeCount} bye{byeCount > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-tavern-accent text-white text-sm font-bold rounded-lg hover:bg-tavern-accent/80 transition-colors disabled:opacity-40 shrink-0"
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            {downloading ? '...' : 'PNG'}
          </button>
        </div>

        <div className="overflow-x-auto -mx-4 sm:-mx-8 px-4 sm:px-8 pb-4">
          <div
            ref={imgRef}
            className="inline-block bg-[#0a0a0a] rounded-xl"
            style={{ padding: pad }}
          >
            <h2
              className="text-lg font-extrabold text-white text-center mb-10"
              style={{ width: bW }}
            >
              {name || 'Tournament'}
            </h2>

            {champ && (
              <div className="flex justify-center mb-15">
                <div className="text-center py-4 px-8 bg-tavern-accent/10 border border-tavern-accent/20 rounded-xl">
                  <svg className="w-10 h-10 text-amber-400 mx-auto mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                    <path d="M4 22h16" />
                    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
                    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
                    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
                  </svg>
                  <p className="text-[8px] text-tavern-accent font-bold uppercase tracking-[0.3em] mb-1">
                    Champion
                  </p>
                  <p className="text-xl font-black text-white">{champ}</p>
                </div>
              </div>
            )}

            <div
              className="relative"
              style={{ width: bW, height: bH + 24, marginTop: 20 }}
            >
              <Connectors bracket={bracket} dims={dims} />
              {bracket.map((round, ri) => (
                <p
                  key={`l${ri}`}
                  className="absolute text-[8px] font-bold text-white/20 uppercase tracking-[0.1em] whitespace-nowrap"
                  style={{ left: ri * (mw + cw), top: -18 }}
                >
                  {round.name}
                </p>
              ))}
              {bracket.map((round, ri) =>
                round.matches.map((match, mi) => (
                  <BrackMatch
                    key={`${ri}-${mi}`}
                    match={match}
                    ri={ri}
                    mi={mi}
                    dims={dims}
                    onWin={handleBrackWin}
                    onScore={handleBrackScore}
                    top={matchTop(ri, mi, mh, mg)}
                    left={ri * (mw + cw)}
                  />
                ))
              )}
            </div>
            
            <h1 className='text-center font-bold'>Make your own bracket!</h1>
            <p
              className="text-center text-[9px] text-white/30 tracking-wider"
              style={{ width: bW }}
            >
              mlbb-tavern.site
            </p>
          </div>
        </div>

        <div className="mt-5 p-4 bg-white/[0.02] border border-white/5 rounded-xl">
          <h3 className="text-xs font-bold text-white/40 mb-2">How to use</h3>
          <ul className="text-[11px] text-white/25 space-y-1 list-disc list-inside">
            <li>
              Click the arrow icon to advance a team to the next round
            </li>
            <li>Click again to deselect</li>
            <li>Enter scores in the small input boxes</li>
            <li>BYE matches are resolved automatically</li>
          </ul>
        </div>
      </div>
    );
  }

  // ================================================================
  // BRACKET PHASE — ROUND ROBIN
  // ================================================================
  if (robin) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={handleBack}
              className="shrink-0 p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors"
            >
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white truncate">
              {name || 'Tournament'}
            </h1>
            <span className="text-[10px] font-bold text-white/25 shrink-0">
              Round Robin
            </span>
          </div>
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-tavern-accent text-white text-sm font-bold rounded-lg hover:bg-tavern-accent/80 transition-colors disabled:opacity-40 shrink-0"
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            {downloading ? '...' : 'PNG'}
          </button>
        </div>

        <div
          ref={imgRef}
          className="bg-[#0a0a0a] rounded-xl p-4 sm:p-6"
        >
          <h2 className="text-lg font-extrabold text-white text-center mb-6">
            {name || 'Tournament'}
          </h2>

          <div className="space-y-6">
            {robin.rounds.map((round, ri) => (
              <div key={ri}>
                <p className="text-[10px] font-bold text-white/25 uppercase tracking-[0.15em] mb-3">
                  {round.name}
                </p>
                <div className="space-y-2">
                  {round.matches.map((match, mi) => (
                    <RobinMatch
                      key={mi}
                      match={match}
                      ri={ri}
                      mi={mi}
                      onWin={handleRobinWin}
                      onScore={handleRobinScore}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {standings.length > 0 && (
            <div className="mt-8">
              <p className="text-[10px] font-bold text-white/25 uppercase tracking-[0.15em] mb-3">
                Standings
              </p>
              <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="py-2.5 pr-4 text-white/30 font-bold text-xs uppercase tracking-wider">
                        #
                      </th>
                      <th className="py-2.5 pr-4 text-white/30 font-bold text-xs uppercase tracking-wider">
                        Team
                      </th>
                      <th className="py-2.5 px-3 text-center text-white/30 font-bold text-xs uppercase tracking-wider">
                        W
                      </th>
                      <th className="py-2.5 px-3 text-center text-white/30 font-bold text-xs uppercase tracking-wider">
                        L
                      </th>
                      <th className="py-2.5 pl-3 text-center text-white/30 font-bold text-xs uppercase tracking-wider">
                        Played
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {standings.map((s, i) => (
                      <tr
                        key={s.team}
                        className="border-b border-white/5"
                      >
                        <td className="py-2.5 pr-4 text-white/30 font-bold tabular-nums">
                          {i + 1}
                        </td>
                        <td className="py-2.5 pr-4 text-white font-medium truncate max-w-[200px]">
                          {s.team}
                        </td>
                        <td className="py-2.5 px-3 text-center text-tavern-accent font-bold tabular-nums">
                          {s.w}
                        </td>
                        <td className="py-2.5 px-3 text-center text-white/40 tabular-nums">
                          {s.l}
                        </td>
                        <td className="py-2.5 pl-3 text-center text-white/40 tabular-nums">
                          {s.played}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <p className="text-center text-[9px] text-white/10 mt-6 tracking-wider">
            mlbb-tavern.site
          </p>
        </div>
      </div>
    );
  }

  return null;
}