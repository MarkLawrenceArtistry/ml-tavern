// ============================================================
// FILE: src/pages/Auth.jsx
// ============================================================
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

/* ── Move OUTSIDE Auth so React keeps the same identity ── */
const Input = ({ label, ...props }) => (
  <div>
    <label className="block text-xs font-bold text-white/50 uppercase tracking-wider mb-1.5">{label}</label>
    <input {...props} className="input-style" />
  </div>
);

export default function Auth() {
  const navigate = useNavigate();
  const [mode, setMode] = useState(() => {
    // Check hash synchronously on first render — no effect needed
    if (typeof window !== 'undefined' && window.location.hash.includes('type=recovery')) {
      window.history.replaceState(null, '', window.location.pathname);
      return 'reset';
    }
    return 'login';
  });
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [ign, setIgn] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const clearMessages = () => { setError(''); setSuccess(''); };
  const switchMode = (m) => { setMode(m); clearMessages(); };

  const handleLogin = async (e) => {
    e.preventDefault();
    clearMessages();
    setLoading(true);
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) setError(err.message);
    else navigate('/feed', { replace: true });
    setLoading(false);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    clearMessages();
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (!ign.trim()) { setError('In-game name is required.'); return; }
    setLoading(true);
    const { error: err } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { ign: ign.trim() } },
    });
    if (err) setError(err.message);
    else setSuccess('Verification email sent! Check your inbox to activate your account.');
    setLoading(false);
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    clearMessages();
    if (!email.trim()) { setError('Enter your email address.'); return; }
    setLoading(true);
    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/login`,
    });
    if (err) setError(err.message);
    else setSuccess('Password reset link sent! Check your inbox.');
    setLoading(false);
  };

  const handleReset = async (e) => {
    e.preventDefault();
    clearMessages();
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
    setLoading(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    if (err) setError(err.message);
    else {
      setSuccess('Password updated successfully! Redirecting…');
      setTimeout(() => navigate('/feed', { replace: true }), 1500);
    }
    setLoading(false);
  };

  const splashBg = {
    backgroundImage: `url('/splash.jpg')`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel: splash art (hidden on mobile) */}
      <div
        className="hidden lg:flex lg:w-1/2 relative"
        style={splashBg}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-tavern-dark" />
        <div className="relative z-10 flex flex-col justify-end p-12">
          <h1 className="text-5xl font-black text-white leading-tight">
            ML<span className="text-tavern-accent"> Tavern</span>
          </h1>
          <p className="text-white/50 mt-3 text-lg max-w-md">
            Your hub for pilot services, buy &amp; sell, and esports team finding.
          </p>
        </div>
      </div>

      {/* Right panel: form */}
      <div className="flex-1 flex items-center justify-center p-6 relative">
        <div
          className="absolute inset-0 lg:hidden opacity-10"
          style={splashBg}
        />
        <div className="relative z-10 w-full max-w-sm">

          {/* Logo (mobile) */}
          <div className="lg:hidden text-center mb-8">
            <h1 className="text-3xl font-black text-white">
              ML<span className="text-tavern-accent"> Tavern</span>
            </h1>
          </div>

          {/* LOGIN */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <h2 className="text-2xl font-extrabold text-white mb-1">Welcome back</h2>
              <p className="text-sm text-white/40 mb-6">Sign in to your account</p>

              <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required autoComplete="email" />
              <Input label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required autoComplete="current-password" />

              <div className="text-right">
                <button type="button" onClick={() => switchMode('forgot')} className="text-xs text-tavern-accent hover:text-tavern-accent/80 font-semibold transition-colors">
                  Forgot password?
                </button>
              </div>

              {error && <p className="text-sm text-red-400 font-medium">{error}</p>}

              <button type="submit" disabled={loading} className="w-full py-3 bg-tavern-accent text-white font-bold rounded-lg hover:bg-tavern-accent/80 transition-colors disabled:opacity-50">
                {loading ? 'Signing in…' : 'Sign In'}
              </button>

              <p className="text-center text-sm text-white/40">
                Don&apos;t have an account?{' '}
                <button type="button" onClick={() => switchMode('register')} className="text-tavern-accent hover:text-tavern-accent/80 font-semibold transition-colors">
                  Sign up
                </button>
              </p>
            </form>
          )}

          {/* REGISTER */}
          {mode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <h2 className="text-2xl font-extrabold text-white mb-1">Create account</h2>
              <p className="text-sm text-white/40 mb-6">Join the Tavern</p>

              <Input label="In-Game Name" type="text" value={ign} onChange={e => setIgn(e.target.value)} placeholder="Your IGN" required maxLength={30} />
              <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required autoComplete="email" />
              <Input label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 6 characters" required autoComplete="new-password" />
              <Input label="Confirm Password" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Re-enter password" required autoComplete="new-password" />

              {error && <p className="text-sm text-red-400 font-medium">{error}</p>}
              {success && <p className="text-sm text-emerald-400 font-medium">{success}</p>}

              <button type="submit" disabled={loading || !!success} className="w-full py-3 bg-tavern-accent text-white font-bold rounded-lg hover:bg-tavern-accent/80 transition-colors disabled:opacity-50">
                {loading ? 'Creating account…' : 'Create Account'}
              </button>

              <p className="text-center text-sm text-white/40">
                Already have an account?{' '}
                <button type="button" onClick={() => switchMode('login')} className="text-tavern-accent hover:text-tavern-accent/80 font-semibold transition-colors">
                  Sign in
                </button>
              </p>
            </form>
          )}

          {/* FORGOT PASSWORD */}
          {mode === 'forgot' && (
            <form onSubmit={handleForgot} className="space-y-4">
              <h2 className="text-2xl font-extrabold text-white mb-1">Reset password</h2>
              <p className="text-sm text-white/40 mb-6">Enter your email and we&apos;ll send you a reset link</p>

              <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required autoComplete="email" />

              {error && <p className="text-sm text-red-400 font-medium">{error}</p>}
              {success && <p className="text-sm text-emerald-400 font-medium">{success}</p>}

              <button type="submit" disabled={loading || !!success} className="w-full py-3 bg-tavern-accent text-white font-bold rounded-lg hover:bg-tavern-accent/80 transition-colors disabled:opacity-50">
                {loading ? 'Sending…' : 'Send Reset Link'}
              </button>

              <p className="text-center text-sm text-white/40">
                Remember your password?{' '}
                <button type="button" onClick={() => switchMode('login')} className="text-tavern-accent hover:text-tavern-accent/80 font-semibold transition-colors">
                  Sign in
                </button>
              </p>
            </form>
          )}

          {/* RESET PASSWORD (from email link) */}
          {mode === 'reset' && (
            <form onSubmit={handleReset} className="space-y-4">
              <h2 className="text-2xl font-extrabold text-white mb-1">Set new password</h2>
              <p className="text-sm text-white/40 mb-6">Enter your new password below</p>

              <Input label="New Password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 6 characters" required autoComplete="new-password" />
              <Input label="Confirm New Password" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Re-enter password" required autoComplete="new-password" />

              {error && <p className="text-sm text-red-400 font-medium">{error}</p>}
              {success && <p className="text-sm text-emerald-400 font-medium">{success}</p>}

              <button type="submit" disabled={loading || !!success} className="w-full py-3 bg-tavern-accent text-white font-bold rounded-lg hover:bg-tavern-accent/80 transition-colors disabled:opacity-50">
                {loading ? 'Updating…' : 'Update Password'}
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}