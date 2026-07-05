// ============================================================
// FILE: src/pages/Auth.jsx
// ============================================================
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { validateEmail } from '../lib/emailValidator';

export default function Auth() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate email format
    const emailCheck = validateEmail(email);
    if (!emailCheck.valid) {
      setError(emailCheck.reason);
      return;
    }

    // Password minimum length
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);

    if (isLogin) {
      const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (err) {
        setError(err.message === 'Invalid login credentials'
          ? 'Invalid email or password.'
          : err.message);
      } else {
        navigate('/feed', { replace: true });
      }
    } else {
      const { error: err } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: {} },
      });
      if (err) {
        if (err.message.includes('already registered')) {
          setError('This email is already registered. Try logging in instead.');
        } else {
          setError(err.message);
        }
      } else {
        setError('');
        // Check if email confirmation is required
        navigate('/feed', { replace: true });
      }
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-tavern-dark flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-extrabold text-tavern-accent tracking-tight">
            ML TAVERN
          </h1>
          <p className="text-sm text-white/30 mt-1">Mobile Legends Community Hub</p>
        </div>

        {/* Card */}
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 sm:p-8">
          {/* Tab toggle */}
          <div className="flex bg-white/5 rounded-lg p-1 mb-6">
            <button
              onClick={() => { setIsLogin(true); setError(''); }}
              className={`flex-1 py-2.5 text-sm font-bold rounded-md transition-colors ${
                isLogin ? 'bg-tavern-accent text-white' : 'text-white/40 hover:text-white'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => { setIsLogin(false); setError(''); }}
              className={`flex-1 py-2.5 text-sm font-bold rounded-md transition-colors ${
                !isLogin ? 'bg-tavern-accent text-white' : 'text-white/40 hover:text-white'
              }`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-white/40 uppercase tracking-wider mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                placeholder="you@example.com"
                autoComplete={isLogin ? 'email' : 'email'}
                className="input-style"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-white/40 uppercase tracking-wider mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                placeholder="Min. 6 characters"
                autoComplete={isLogin ? 'current-password' : 'new-password'}
                minLength={6}
                className="input-style"
                required
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
                <p className="text-sm text-red-400 font-medium">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-tavern-accent text-white font-bold rounded-lg hover:bg-tavern-accent/80 transition-colors disabled:opacity-50 disabled:pointer-events-none"
            >
              {loading ? 'Please wait...' : isLogin ? 'Login' : 'Create Account'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-white/15 mt-6">
          mlbb-tavern.site
        </p>
      </div>
    </div>
  );
}