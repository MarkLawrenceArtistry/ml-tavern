import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function Home() {
  const [showPrivacy, setShowPrivacy] = useState(false);

  const features = [
    { 
      to: '/pilots', 
      title: 'Pilot Services', 
      desc: 'Find trusted account pilots or advertise your services.',
      icon: (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
        </svg>
      )
    },
    { 
      to: '/market', 
      title: 'Buy & Sell', 
      desc: 'Trade accounts, skins, and merchandise safely.',
      icon: (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="1" x2="12" y2="23"></line>
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
        </svg>
      )
    },
    { 
      to: '/teams', 
      title: 'Team Finder', 
      desc: 'Join or form esports teams for ranked or tournaments.',
      icon: (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
        </svg>
      )
    }
  ];

  return (
    <div className="max-w-4xl mx-auto text-center py-16">
      {/* Hero Section */}
      <h1 className="text-6xl md:text-8xl font-extrabold text-tavern-accent mb-6 tracking-tighter">
        ML TAVERN
      </h1>
      <p className="text-xl md:text-2xl text-white/60 mb-12 max-w-2xl mx-auto">
        The unofficial community hub and utility suite for Mobile Legends: Bang Bang fans.
      </p>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        {features.map(f => (
          <Link
            key={f.to}
            to={f.to}
            className="group bg-white/5 border border-white/10 rounded-xl p-6 text-left hover:border-tavern-accent/50 transition-all duration-300 hover:-translate-y-1"
          >
            <div className="text-white/40 group-hover:text-tavern-accent transition-colors mb-4">
              {f.icon}
            </div>
            <h3 className="text-lg font-bold text-white mb-2">{f.title}</h3>
            <p className="text-sm text-white/40">{f.desc}</p>
          </Link>
        ))}
      </div>

      {/* Extra Tools */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center mb-24">
        <Link to="/bracket" className="px-8 py-3 rounded-lg border border-white/20 text-white font-bold hover:bg-white/5 transition-colors">
          Tournament Bracket Maker
        </Link>
        <Link to="/profile" className="px-8 py-3 rounded-lg bg-tavern-accent hover:bg-red-700 text-white font-bold transition-colors">
          Create Trainer Card
        </Link>
      </div>

      {/* Footer & Privacy Policy */}
      <div className="border-t border-white/10 pt-8">
        <button 
          onClick={() => setShowPrivacy(true)} 
          className="text-sm text-white/30 hover:text-white/60 transition-colors"
        >
          Data Privacy Policy
        </button>
      </div>

      {/* Privacy Policy Modal */}
      {showPrivacy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70" onClick={() => setShowPrivacy(false)}>
          <div className="bg-tavern-dark border border-white/10 rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-8" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Data Privacy Policy</h2>
              <button onClick={() => setShowPrivacy(false)} className="text-white/40 hover:text-white">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            
            <div className="space-y-4 text-white/70 text-sm leading-relaxed">
              <p><strong className="text-white">Effective Date:</strong> {new Date().toLocaleDateString()}</p>
              <p>ML Tavern ("we", "our", "us") is committed to protecting your privacy. This Policy explains how we collect, use, and safeguard your information in accordance with applicable data privacy laws.</p>
              
              <h3 className="text-white font-bold text-base pt-2">1. Information We Collect</h3>
              <p>We collect information you provide directly: your email address (for authentication), In-Game Name (IGN), and MLBB preferences (roles, heroes, teams) for your Trainer Card. We also collect IP addresses and device fingerprints strictly for security and rate-limiting purposes.</p>
              
              <h3 className="text-white font-bold text-base pt-2">2. How We Use Your Information</h3>
              <p>Your data is used solely to provide and secure the ML Tavern services (forums, profile generation, bracket making). We do not sell, rent, or share your personal data with third parties for marketing purposes.</p>
              
              <h3 className="text-white font-bold text-base pt-2">3. Data Retention & Your Rights</h3>
              <p>You have the right to access, correct, or delete your personal data at any time. By using the "Delete My Account" feature in Settings, you initiate the complete erasure of your account, associated posts, comments, and profile data from our active databases ("Right to be Forgotten").</p>
              
              <h3 className="text-white font-bold text-base pt-2">4. Security Measures</h3>
              <p>We implement strict security protocols, including Row Level Security (RLS), XSS sanitization, and strict rate-limiting to protect your data against unauthorized access, alteration, or disclosure.</p>
              
              <h3 className="text-white font-bold text-base pt-2">5. Consent</h3>
              <p>By creating an account, you explicitly consent to the collection and processing of your data as described in this Policy.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}