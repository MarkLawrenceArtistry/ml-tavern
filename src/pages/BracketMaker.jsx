import { useState, useEffect } from 'react';

const STORAGE_KEY = 'ml-tavern-brackets';

const generateRounds = (size) => {
  let rounds = [];
  let matchesInRound = size / 2;
  let matchId = 1;

  let currentRound = [];
  for (let i = 0; i < matchesInRound; i++) {
    currentRound.push({ id: matchId++, team1: '', team2: '', winner: null });
  }
  rounds.push(currentRound);

  while (matchesInRound > 1) {
    matchesInRound = matchesInRound / 2;
    currentRound = [];
    for (let i = 0; i < matchesInRound; i++) {
      currentRound.push({ id: matchId++, team1: null, team2: null, winner: null });
    }
    rounds.push(currentRound);
  }
  return rounds;
};

export default function BracketMaker() {
  const [brackets, setBrackets] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newSize, setNewSize] = useState(8);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      setBrackets(parsed);
      if (parsed.length > 0) setActiveId(parsed[0].id);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(brackets));
  }, [brackets]);

  const activeBracket = brackets.find(b => b.id === activeId);

  const handleCreate = (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    const newBracket = {
      id: crypto.randomUUID(),
      name: newName,
      size: newSize,
      rounds: generateRounds(newSize),
    };
    setBrackets([...brackets, newBracket]);
    setActiveId(newBracket.id);
    setNewName('');
    setShowCreate(false);
  };

  const handleDelete = () => {
    if (!window.confirm('Delete this bracket permanently?')) return;
    const updated = brackets.filter(b => b.id !== activeId);
    setBrackets(updated);
    setActiveId(updated.length > 0 ? updated[0].id : null);
  };

  const setTeamName = (matchIdx, slot, value) => {
    setBrackets(brackets.map(b => {
      if (b.id !== activeId) return b;
      const newRounds = JSON.parse(JSON.stringify(b.rounds));
      const currentMatch = newRounds[0][matchIdx];
      const oldWinner = currentMatch.winner;
      
      currentMatch[slot] = value;
      
      // If they change the name of a team that already won, clear the winner and downstream rounds
      if (oldWinner && (oldWinner === currentMatch[slot])) {
        currentMatch.winner = null;
        let rIdx = 0;
        let mIdx = matchIdx;
        while (rIdx < newRounds.length - 1) {
          const nextMatchIdx = Math.floor(mIdx / 2);
          const nextSlot = mIdx % 2 === 0 ? 'team1' : 'team2';
          const nextMatch = newRounds[rIdx + 1][nextMatchIdx];
          
          if (nextMatch[nextSlot] === oldWinner) {
            nextMatch[nextSlot] = null;
            if (nextMatch.winner === oldWinner) nextMatch.winner = null;
          }
          rIdx++;
          mIdx = nextMatchIdx;
        }
      }
      
      return { ...b, rounds: newRounds };
    }));
  };

  const setWinner = (roundIdx, matchIdx, winningTeam) => {
    setBrackets(brackets.map(b => {
      if (b.id !== activeId) return b;
      const newRounds = JSON.parse(JSON.stringify(b.rounds));
      const currentMatch = newRounds[roundIdx][matchIdx];
      
      // Toggle winner if clicking the same team
      currentMatch.winner = currentMatch.winner === winningTeam ? null : winningTeam;

      // Propagate to next round
      if (roundIdx < newRounds.length - 1) {
        const nextMatchIdx = Math.floor(matchIdx / 2);
        const nextSlot = matchIdx % 2 === 0 ? 'team1' : 'team2';
        const nextMatch = newRounds[roundIdx + 1][nextMatchIdx];
        
        if (nextMatch.winner === nextMatch[nextSlot]) nextMatch.winner = null;
        nextMatch[nextSlot] = currentMatch.winner;
      }
      
      return { ...b, rounds: newRounds };
    }));
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full">
      {/* Sidebar: Bracket List */}
      <div className="lg:w-72 shrink-0 bg-white/5 border border-white/10 rounded-xl p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold text-white">My Brackets</h2>
          <button onClick={() => setShowCreate(!showCreate)} className="text-tavern-accent hover:underline text-sm font-bold">
            {showCreate ? 'Cancel' : '+ New'}
          </button>
        </div>

        {showCreate && (
          <form onSubmit={handleCreate} className="mb-4 p-3 bg-black/30 rounded-lg space-y-2">
            <input type="text" required value={newName} onChange={e => setNewName(e.target.value)} className="input-style text-sm" placeholder="Tournament Name" />
            <select value={newSize} onChange={e => setNewSize(Number(e.target.value))} className="input-style text-sm">
              <option value={4}>4 Teams</option>
              <option value={8}>8 Teams</option>
              <option value={16}>16 Teams</option>
            </select>
            <button type="submit" className="w-full py-2 bg-tavern-accent rounded-lg text-sm font-bold hover:bg-red-700">Create</button>
          </form>
        )}

        <div className="space-y-2">
          {brackets.length === 0 ? (
            <p className="text-white/30 text-sm text-center py-4">No brackets yet.</p>
          ) : (
            brackets.map(b => (
              <div 
                key={b.id} 
                onClick={() => setActiveId(b.id)}
                className={`p-3 rounded-lg cursor-pointer transition-colors text-sm ${activeId === b.id ? 'bg-tavern-accent/20 text-white border border-tavern-accent/50' : 'hover:bg-white/5 text-white/70'}`}
              >
                {b.name} <span className="text-white/30">({b.size})</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Area: The Bracket */}
      <div className="flex-1 bg-white/5 border border-white/10 rounded-xl p-6 overflow-x-auto">
        {!activeBracket ? (
          <div className="flex items-center justify-center h-full min-h-[400px] text-white/30">
            Select or create a bracket to begin
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-2xl font-extrabold text-white">{activeBracket.name}</h1>
              <button onClick={handleDelete} className="text-sm text-red-400/50 hover:text-red-400 transition-colors">Delete Bracket</button>
            </div>

            <div className="flex gap-8 min-w-max pb-4">
              {activeBracket.rounds.map((round, rIdx) => (
                <div key={rIdx} className="flex flex-col justify-around min-w-[220px]">
                  <h3 className="text-center text-xs font-bold text-white/40 uppercase tracking-widest mb-4">
                    {rIdx === activeBracket.rounds.length - 1 ? 'Finals' : `Round ${rIdx + 1}`}
                  </h3>
                  
                  <div className="flex flex-col justify-around gap-4 flex-1">
                    {round.map((match, mIdx) => {
                      const isChamp = rIdx === activeBracket.rounds.length - 1 && match.winner;
                      
                      return (
                        <div key={match.id} className="flex flex-col">
                          {isChamp && (
                            <div className="text-center mb-2 px-3 py-1 bg-tavern-accent rounded-full text-white text-xs font-bold animate-pulse">
                              CHAMPION
                            </div>
                          )}

                          <div className={`border border-white/10 rounded-lg overflow-hidden ${isChamp ? 'ring-2 ring-tavern-accent' : ''}`}>
                            <TeamSlot 
                              team={match.team1} 
                              isWinner={match.winner === match.team1}
                              isEditable={rIdx === 0}
                              onChange={(val) => setTeamName(mIdx, 'team1', val)}
                              onClick={() => match.team1 && setWinner(rIdx, mIdx, match.team1)}
                            />
                            <div className="border-t border-white/10" />
                            <TeamSlot 
                              team={match.team2} 
                              isWinner={match.winner === match.team2}
                              isEditable={rIdx === 0}
                              onChange={(val) => setTeamName(mIdx, 'team2', val)}
                              onClick={() => match.team2 && setWinner(rIdx, mIdx, match.team2)}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Updated Team Slot Component
function TeamSlot({ team, isWinner, isEditable, onChange, onClick }) {
  if (isEditable) {
    return (
      <div className="flex items-center">
        <input
          type="text"
          value={team || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Team name..."
          className="flex-1 bg-transparent px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:bg-white/5"
        />
        {/* THE FIX: An explicit button to advance the team */}
        {team && (
          <button 
            type="button"
            onClick={onClick}
            className={`px-2 py-2 transition-colors ${
              isWinner ? 'text-tavern-accent' : 'text-white/20 hover:text-tavern-accent'
            }`}
            title="Advance Team"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={`px-3 py-2 text-sm cursor-pointer transition-colors flex justify-between items-center ${
        !team ? 'text-white/10 cursor-default' : 
        isWinner ? 'bg-tavern-accent/30 text-tavern-accent font-bold' : 'text-white/70 hover:bg-white/5'
      }`}
    >
      <span>{team || 'TBD'}</span>
      {team && (
         <svg className="w-4 h-4 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 18l6-6-6-6" />
         </svg>
      )}
    </div>
  );
}