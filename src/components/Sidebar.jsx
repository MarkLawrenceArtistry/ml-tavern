// ============================================================
// FILE: src/components/Sidebar.jsx
// ============================================================
import { useState, useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';
import { supabase } from '../lib/supabase';

const Icons = {
  Home: () => (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  Shield: () => (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  Tag: () => (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <line x1="7" y1="7" x2="7.01" y2="7" />
    </svg>
  ),
  Users: () => (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  Trophy: () => (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  ),
  Card: () => (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <line x1="2" y1="10" x2="22" y2="10" />
    </svg>
  ),
  Settings: () => (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
  Chart: () => (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  ),
  Logout: () => (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
  Brain: () => (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a4 4 0 0 0-4 4c0 2 1 3 2 4l-2 2h4l-1 5 5-6h-3l1-3c1-1 2-3 2-5a4 4 0 0 0-4-4z" />
      <path d="M9.5 22h.5" />
      <path d="M14 22h.5" />
    </svg>
  ),
  Bookmark: () => (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  ),
  Map: () => (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
      <line x1="8" y1="2" x2="8" y2="18" />
      <line x1="16" y1="6" x2="16" y2="22" />
    </svg>
  ),
  Layers: () => (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5" />
      <path d="M2 12l10 5 10-5" />
    </svg>
  ),
};

const SECTIONS = [
  {
    label: 'HOME',
    links: [
      { to: '/feed', label: 'Feed', Icon: Icons.Home },
      { to: '/pilots', label: 'Pilot Service', Icon: Icons.Shield },
      { to: '/teams', label: 'LF Team', Icon: Icons.Users },
      { to: '/market', label: 'Buy & Sell', Icon: Icons.Tag },
    ],
  },
  {
    label: 'UTILITIES',
    links: [
      { to: '/bracket', label: 'Bracket Maker', Icon: Icons.Trophy, hot: true },
      { to: '/predict', label: 'Game Predict', Icon: Icons.Brain, hot: true },
      { to: '/draft', label: 'Practice Draft', Icon: Icons.Layers, hot: true },
      { to: '/jungle', label: 'Jungle Path', Icon: Icons.Map, hot: true },
    ],
  },
  {
    label: 'USER',
    links: [
      { to: '/bookmarks', label: 'Bookmarks', Icon: Icons.Bookmark },
      { to: '/profile', label: 'Esports Card', Icon: Icons.Card, hot: true },
      { to: '/settings', label: 'Settings', Icon: Icons.Settings },
    ],
  },
];

export default function Sidebar({ isAdmin }) {
  const [isOpen, setIsOpen] = useState(false);
  const { user, signOut } = useAuth();
  const [myIgn, setMyIgn] = useState('');

  useEffect(() => {
    if (user) {
      supabase
        .from('profiles')
        .select('ign')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          if (data) setMyIgn(data.ign);
        });
    }
  }, [user]);

  const linkClasses = ({ isActive }) =>
    `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 ${
      isActive
        ? 'bg-tavern-accent text-white'
        : 'text-white/50 hover:bg-white/5 hover:text-white'
    }`;

  const allSections = [...SECTIONS];
  if (isAdmin) {
    allSections.push({
      label: 'ADMIN',
      links: [{ to: '/admin', label: 'Admin Panel', Icon: Icons.Chart }],
    });
  }

  return (
    <>
      {/* ===== MOBILE TOP BAR ===== */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-tavern-dark/95 backdrop-blur-sm border-b border-white/10 flex items-center justify-between px-4 h-14">
        <div className="py-5 flex items-center gap-3 border-b border-white/5">
          <img src="/logo.png" alt="ML Tavern" className="w-9 h-9 shrink-0" />
          <span className="text-lg font-extrabold text-white tracking-tight">
            ML<span className="text-tavern-accent">Tavern</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell />
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="text-white p-1"
            aria-label="Toggle menu"
          >
            {isOpen ? (
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* ===== MOBILE OVERLAY ===== */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* ===== SIDEBAR ===== */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-56 bg-tavern-dark border-r border-white/10 flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0`}
      >
        {/* Logo + desktop notification bell */}
        <div className="pt-5 md:pt-5 pb-2 md:mb-2 flex items-center justify-between">
          <div className="pl-4 pr-0 py-5 flex items-center gap-3">
            <img src="/logo.png" alt="ML Tavern" className="w-9 h-9 shrink-0" />
            <span className="text-lg font-extrabold text-white tracking-tight">
              ML<span className="text-tavern-accent">Tavern</span>
            </span>
          </div>
          <div className="pr-3 hidden md:block">
            <NotificationBell />
          </div>
        </div>

        {/* Navigation sections */}
        <nav className="flex flex-col gap-4 flex-1 px-4 py-4 overflow-y-auto border-t border-white/5">
          {allSections.map((section) => (
            <div key={section.label}>
              <p className="text-[9px] font-bold text-white/20 uppercase tracking-[0.2em] mb-1.5 pl-3">
                {section.label}
              </p>
              <div className="flex flex-col gap-0.5">
                {section.links.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    onClick={() => setIsOpen(false)}
                    className={linkClasses}
                  >
                    <link.Icon />
                    <span className="flex-1 text-left truncate">{link.label}</span>
                    {link.hot && (
                      <span className="bg-tavern-accent text-white text-[8px] font-bold px-1.5 py-0.5 rounded-sm leading-none shrink-0">
                        HOT
                      </span>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="px-4 mt-auto mb-5 pt-4 border-t border-white/10 space-y-0.5">
          <Link
            to="/donate"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-pink-400/60 hover:bg-pink-500/10 hover:text-pink-400 transition-colors w-full"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            <span>Support</span>
          </Link>

          {user && myIgn && (
            <div className="mx-3 my-2 px-3 py-1.5 rounded-md bg-white/5 text-xs text-white/50 truncate">
              <span className="text-white/30">Logged in as </span>
              <span className="text-white font-semibold">{myIgn}</span>
            </div>
          )}

          {user ? (
            <button
              onClick={signOut}
              className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-white/50 hover:bg-white/5 hover:text-white transition-colors w-full"
            >
              <Icons.Logout />
              <span>Logout</span>
            </button>
          ) : (
            <NavLink to="/login" onClick={() => setIsOpen(false)} className={linkClasses}>
              <Icons.Logout />
              <span>Login</span>
            </NavLink>
          )}
        </div>
      </aside>
    </>
  );
}