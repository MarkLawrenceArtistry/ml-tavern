// ============================================================
// FILE: src/pages/Donate.jsx
// ============================================================
import { Link } from 'react-router-dom';

const COSTS = [
  {
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    ),
    label: 'AI Prediction API',
    desc: 'Every matchup analysis costs real money via Google Gemini. More predictions = higher bill.',
  },
  {
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" /><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
      </svg>
    ),
    label: 'Database & Hosting',
    desc: 'Supabase database, Vercel hosting, CDN for images — all scale with usage.',
  },
  {
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
      </svg>
    ),
    label: 'Development Time',
    desc: 'Hundreds of hours building features, fixing bugs, and responding to feedback.',
  },
];

const TIERS = [
  { name: 'Coffee', amount: '₱50', emoji: '☕', desc: 'Covers a few hours of API costs' },
  { name: 'Meal', amount: '₱150', emoji: '🍜', desc: 'Powers predictions for a dozen players' },
  { name: 'Stack', amount: '₱500', emoji: '🔥', desc: 'Keeps the site running for a week' },
  { name: 'Whale', amount: '₱1000+', emoji: '🐋', desc: 'Serious impact — you\'re the MVP' },
];

export default function Donate() {
  return (
    <div className="min-h-screen bg-tavern-dark" style={{
      backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)',
      backgroundSize: '28px 28px',
    }}>
      <div className="max-w-2xl mx-auto px-4 py-16 sm:py-24">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-tavern-accent/10 border border-tavern-accent/20 text-tavern-accent text-xs font-bold uppercase tracking-wider mb-6">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            Support MLBB Tavern
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white mb-4">Keep the Tavern Open</h1>
          <p className="text-white/40 text-base leading-relaxed max-w-lg mx-auto">
            MLBB Tavern is built and maintained by one developer. If you find this site useful, consider chipping in to cover costs and keep features free for everyone.
          </p>
        </div>

        {/* Where your money goes */}
        <div className="mb-12">
          <h2 className="text-sm font-bold text-white/30 uppercase tracking-wider mb-5 text-center">Where your donation goes</h2>
          <div className="space-y-3">
            {COSTS.map((c, i) => (
              <div key={i} className="flex items-start gap-4 p-4 bg-white/[0.03] border border-white/[0.06] rounded-xl">
                <div className="w-10 h-10 rounded-lg bg-tavern-accent/10 border border-tavern-accent/20 flex items-center justify-center text-tavern-accent shrink-0">
                  {c.icon}
                </div>
                <div>
                  <p className="text-sm font-bold text-white mb-0.5">{c.label}</p>
                  <p className="text-xs text-white/40 leading-relaxed">{c.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* QR Code */}
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-8 text-center mb-12">
          <h2 className="text-sm font-bold text-white/30 uppercase tracking-wider mb-6">Scan to Donate</h2>
          <div className="inline-block bg-white p-3 rounded-xl shadow-2xl shadow-black/50 mb-4">
            <img src="/donate-qr.png" alt="Donation QR Code" className="w-56 h-56 sm:w-64 sm:h-64 object-contain" />
          </div>
          <p className="text-white/30 text-xs">GCash / Maya / Any QR PH wallet</p>
          <p className="text-white/15 text-[10px] mt-2">Every peso helps. No amount is too small.</p>
        </div>

        {/* Suggested tiers */}
        <div className="mb-12">
          <h2 className="text-sm font-bold text-white/30 uppercase tracking-wider mb-5 text-center">Suggested amounts</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {TIERS.map((t, i) => (
              <div key={i} className="p-4 bg-white/[0.03] border border-white/[0.06] rounded-xl text-center hover:bg-white/[0.05] hover:border-white/10 transition-colors">
                <span className="text-2xl mb-2 block">{t.emoji}</span>
                <p className="text-lg font-black text-white">{t.amount}</p>
                <p className="text-[10px] text-white/20 font-bold uppercase tracking-wider mt-1">{t.name}</p>
                <p className="text-[10px] text-white/30 mt-2 leading-relaxed">{t.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* What you get */}
        <div className="bg-tavern-accent/5 border border-tavern-accent/15 rounded-2xl p-6 sm:p-8 text-center mb-12">
          <h2 className="text-lg font-extrabold text-white mb-3">Donators get recognized</h2>
          <div className="space-y-2 text-sm text-white/50">
            <p>✦ Your name on the <span className="text-tavern-accent font-semibold">Supporters</span> page (coming soon)</p>
            <p>✦ Priority feature requests</p>
            <p>✦ The warm feeling of helping the MLBB community</p>
          </div>
        </div>

        {/* Back link */}
        <div className="text-center">
          <Link to="/feed" className="text-white/20 hover:text-white/50 text-sm transition-colors">
            ← Back to Feed
          </Link>
        </div>
      </div>
    </div>
  );
}