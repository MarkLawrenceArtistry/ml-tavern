import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="relative min-h-screen bg-tavern-dark overflow-hidden flex flex-col">
      
      {/* Subtle grid background effect */}
      <div className="absolute inset-0 opacity-[0.03]" style={{backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '40px 40px'}}></div>

      {/* Main Content Container */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6">
        
        {/* Small Top Text */}
        <p className="text-xs md:text-sm font-bold tracking-[0.3em] text-tavern-accent uppercase mb-6">
          Unofficial Community Hub
        </p>

        {/* Massive Main Headline */}
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold text-white leading-[0.9] tracking-tighter max-w-5xl">
          THE MLBB<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-tavern-accent to-red-500">EXPERIENCE</span>
        </h1>

        {/* Subheadline */}
        <p className="mt-8 text-lg md:text-xl text-white/40 max-w-2xl leading-relaxed">
          Connect with players. Build team comps. Track tournaments. Your ultimate desktop companion for Mobile Legends: Bang Bang.
        </p>

        {/* CTA Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row gap-4">
          <Link 
            to="/login" 
            className="px-10 py-4 bg-tavern-accent hover:bg-red-700 text-white font-bold rounded-sm transition-colors text-lg tracking-wide"
          >
            GET STARTED
          </Link>
          <Link 
            to="/login" 
            className="px-10 py-4 border border-white/20 hover:border-white/40 text-white font-bold rounded-sm transition-colors text-lg tracking-wide"
          >
            LOGIN
          </Link>
        </div>
      </div>

      {/* Bottom Stats Bar (Like the agency reference) */}
      <div className="relative z-10 w-full border-t border-white/10 bg-black/30 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto grid grid-cols-3 divide-x divide-white/10">
          <StatBlock value="COMMUNITY" label="Forums & Pilots" />
          <StatBlock value="LOCAL" label="Bracket Maker" />
          <StatBlock value="FREE" label="Esports ID Cards" />
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 w-full border-t border-white/5 py-4 text-center">
        <p className="text-xs text-white/20">
          Data Privacy Policy • Not affiliated with Moonton
        </p>
      </div>
    </div>
  );
}

function StatBlock({ value, label }) {
  return (
    <div className="py-6 px-4 text-center">
      <p className="text-sm md:text-base font-extrabold text-white tracking-wider">{value}</p>
      <p className="text-xs text-white/30 mt-1">{label}</p>
    </div>
  );
}