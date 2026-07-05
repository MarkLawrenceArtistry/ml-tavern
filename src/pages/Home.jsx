// ============================================================
// FILE: src/pages/Home.jsx
// ============================================================
import { Link } from 'react-router-dom';

const FEATURES = [
  {
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    title: 'Pilot Services',
    desc: 'Find trusted pilots to boost your rank. Verified reviews, transparent pricing.',
  },
  {
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
      </svg>
    ),
    title: 'Buy & Sell Market',
    desc: 'Trade accounts, skins, and items safely. Community-rated sellers.',
  },
  {
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    title: 'Team Finder',
    desc: 'Looking for a squad? Post your rank, role, and playstyle. Get scouted.',
  },
  {
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    ),
    title: 'Game Predict',
    desc: 'AI-powered matchup analysis. Pick your 10 heroes, get a detailed Bo3 breakdown.',
  },
  {
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
    title: 'Featured Posts',
    desc: 'Curated top-quality posts pinned by admins. The best of the community.',
  },
  {
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" /><line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" /><line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" />
        <line x1="1" y1="14" x2="7" y2="14" /><line x1="9" y1="8" x2="15" y2="8" /><line x1="17" y1="16" x2="23" y2="16" />
      </svg>
    ),
    title: 'Bracket Maker',
    desc: 'Create and share tournament brackets. Single elimination or round robin.',
  },
];

const STEPS = [
  { num: '01', title: 'Create an Account', desc: 'Sign up with your Discord or email. Takes 10 seconds.' },
  { num: '02', title: 'Join the Boards', desc: 'Browse pilot services, market listings, or find a team.' },
  { num: '03', title: 'Post & Engage', desc: 'Share your services, upvote the best, build your reputation.' },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-tavern-dark">
      {/* ===== HERO ===== */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Splash art background */}
        <div className="absolute inset-0 z-0">
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: "url('/splash.jpg')" }}
          />
          {/* Dark overlays */}
          <div className="absolute inset-0 bg-black/60" />
          <div className="absolute inset-0 bg-gradient-to-t from-tavern-dark via-transparent to-black/40" />
          <div className="absolute inset-0 bg-gradient-to-r from-tavern-dark/80 via-transparent to-tavern-dark/80" />
        </div>

        <div className="relative z-10 text-center px-4 max-w-3xl mx-auto">
          {/* Logo */}
          <div className="mb-8">
            <img src="/logo.png" alt="ML Tavern" className="w-20 h-20 mx-auto drop-shadow-2xl" />
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-7xl font-black text-white leading-[0.95] mb-6 tracking-tight">
            MLBB<span className="text-tavern-accent"> Tavern</span>
          </h1>

          <p className="text-lg sm:text-xl text-white/60 max-w-xl mx-auto mb-10 leading-relaxed">
            The community hub for Mobile Legends players. Find pilots, trade accounts, build teams, and predict matchups.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-tavern-accent hover:bg-red-700 text-white font-bold rounded-xl transition-colors text-sm"
            >
              Get Started
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
            </Link>
            <a
              href="#features"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white/80 font-bold rounded-xl transition-all text-sm"
            >
              Learn More
            </a>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
            <svg className="w-5 h-5 text-white/20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="6 9 12 15 18 9" /></svg>
          </div>
        </div>
      </section>

      {/* ===== FEATURES — dots pattern bg ===== */}
      <section id="features" className="relative py-24 sm:py-32 px-4"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      >
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-tavern-accent text-xs font-bold uppercase tracking-[0.3em] mb-3">Features</p>
            <h2 className="text-3xl sm:text-4xl font-black text-white">Everything in one place</h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f, i) => (
              <div
                key={i}
                className="group p-6 bg-white/[0.03] border border-white/[0.06] rounded-2xl hover:bg-white/[0.06] hover:border-white/10 transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-tavern-accent/10 border border-tavern-accent/20 flex items-center justify-center text-tavern-accent mb-4 group-hover:scale-110 transition-transform">
                  {f.icon}
                </div>
                <h3 className="text-white font-bold text-base mb-2">{f.title}</h3>
                <p className="text-white/40 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS — dots pattern continues ===== */}
      <section className="relative py-24 sm:py-32 px-4 border-t border-white/5"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      >
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-tavern-accent text-xs font-bold uppercase tracking-[0.3em] mb-3">How it works</p>
            <h2 className="text-3xl sm:text-4xl font-black text-white">Three steps to get started</h2>
          </div>

          <div className="space-y-8">
            {STEPS.map((s, i) => (
              <div key={i} className="flex gap-6 items-start">
                <div className="shrink-0 w-14 h-14 rounded-2xl bg-tavern-accent/10 border border-tavern-accent/20 flex items-center justify-center">
                  <span className="text-tavern-accent font-black text-lg">{s.num}</span>
                </div>
                <div className="pt-1">
                  <h3 className="text-white font-bold text-lg mb-1">{s.title}</h3>
                  <p className="text-white/40 text-sm leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="relative py-24 sm:py-32 px-4 border-t border-white/5"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      >
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">Ready to join?</h2>
          <p className="text-white/40 text-lg mb-8 leading-relaxed">
            Jump into the community. Your next team, deal, or climb starts here.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center justify-center gap-2 px-10 py-4 bg-tavern-accent hover:bg-red-700 text-white font-bold rounded-xl transition-colors text-base"
          >
            Create Account
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
          </Link>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-white/5 py-8 px-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="" className="w-5 h-5 opacity-40" />
            <span className="text-white/20 text-xs font-medium">MLBB Tavern</span>
          </div>
          <p className="text-white/15 text-xs">
            Not affiliated with Moonton. This is a fan-made community tool.
          </p>
        </div>
      </footer>
    </div>
  );
}