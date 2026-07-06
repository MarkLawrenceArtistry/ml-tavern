// ============================================================
// FILE: src/components/Layout.jsx
// ============================================================
import { useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';

function RulesModal({ open, onClose }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#141414] border border-white/10 rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto z-10">
        {/* Header */}
        <div className="sticky top-0 bg-[#141414] border-b border-white/10 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-lg font-extrabold text-white">Community Guidelines</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-5 text-sm text-white/60 leading-relaxed">
          <section>
            <h3 className="text-white font-bold text-base mb-2">Be Respectful</h3>
            <p>Treat everyone with respect. No harassment, hate speech, slurs, or personal attacks. Keep discussions constructive and on-topic.</p>
          </section>

          <section>
            <h3 className="text-white font-bold text-base mb-2">Posting Rules</h3>
            <ul className="list-disc list-inside space-y-1 text-white/50">
              <li>Posts must match their chosen category</li>
              <li>No spam, self-promotion, or repetitive content</li>
              <li>No sharing personal info of others</li>
              <li>Markdown formatting is supported for long posts</li>
            </ul>
          </section>

          <section>
            <h3 className="text-white font-bold text-base mb-2">Buy & Sell</h3>
            <ul className="list-disc list-inside space-y-1 text-white/50">
              <li>All transactions are at your own risk</li>
              <li>Clearly state prices and payment methods</li>
              <li>No scamming — reported scammers will be banned</li>
            </ul>
          </section>

          <section>
            <h3 className="text-white font-bold text-base mb-2">Moderation</h3>
            <ul className="list-disc list-inside space-y-1 text-white/50">
              <li>Admins can <span className="text-tavern-accent font-semibold">pin, unpin, or delete</span> any post at their discretion</li>
              <li>Use the flag button to report rule violations</li>
              <li>False or spam reports may result in action against your account</li>
              <li>Admin decisions are final</li>
            </ul>
          </section>

          <section>
            <h3 className="text-white font-bold text-base mb-2">Bracket Maker</h3>
            <ul className="list-disc list-inside space-y-1 text-white/50">
              <li><strong className="text-white/70">Single Elimination:</strong> Bracket size auto-adjusts to the next power of 2. Higher seeds receive byes when needed.</li>
              <li><strong className="text-white/70">Round Robin:</strong> Every team plays every other team once. Standings update automatically.</li>
              <li>Enable &quot;Randomize seeds&quot; to shuffle starting positions</li>
            </ul>
          </section>

          <div className="pt-3 border-t border-white/5 text-center">
            <p className="text-xs text-white/25">Violations may result in warnings, post deletion, or account bans.</p>
            <p className="text-xs text-white/20 mt-1">Have fun and game on! 🎮</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Layout({ isAdmin = false }) {
  const { showInactivityWarning, extendSession } = useAuth();
  const [showRules, setShowRules] = useState(false);

  return (
    <div className="min-h-screen bg-tavern-dark">
      <Sidebar isAdmin={isAdmin} />
      <main className="md:ml-56 pt-20 md:pt-8 px-4 md:px-8 pb-8 min-h-screen">
        <Outlet />
      </main>

       

      <RulesModal open={showRules} onClose={() => setShowRules(false)} />

      {/* Rules button — fixed bottom-right */}
      <button
        onClick={() => setShowRules(true)}
        className="fixed bottom-5 right-5 z-40 w-10 h-10 rounded-full bg-white/[0.06] border border-white/10 flex items-center justify-center text-white/30 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all shadow-lg"
        title="Community Guidelines"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      </button>

      {/* Inactivity warning modal */}
      {showInactivityWarning && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" />
          <div className="relative bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl p-6 max-w-sm w-full text-center z-10">
            <div className="text-4xl mb-4">⏰</div>
            <h2 className="text-lg font-extrabold text-white mb-2">Session Expiring</h2>
            <p className="text-sm text-white/50 mb-6 leading-relaxed">
              You&apos;ve been inactive for a while. You&apos;ll be logged out in 1 minute.
            </p>
            <button
              onClick={extendSession}
              className="w-full py-3 bg-tavern-accent text-white font-bold rounded-lg hover:bg-tavern-accent/80 transition-colors"
            >
              Stay Logged In
            </button>
          </div>
        </div>
      )}

     {/* Footer links */}
      <div className="md:ml-56 border-t border-white/5 px-4 md:px-8 py-4 flex items-center justify-between text-[10px] text-white/15">
        <div className="flex items-center gap-4">
          <Link to="/terms" className="hover:text-white/40 transition-colors">Terms of Service</Link>
          <Link to="/donate" className="hover:text-white/40 transition-colors">Support the Developer</Link>
        </div>
        <span>Not affiliated with Moonton</span>
      </div>
      <RulesModal open={showRules} onClose={() => setShowRules(false)} />
        
    </div>
  );
}