// ============================================================
// FILE: src/context/AuthContext.jsx
// ============================================================
import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

// 15 minutes inactivity, 1 minute warning before logout
const INACTIVITY_TIMEOUT = 15 * 60 * 1000;
const WARNING_BEFORE_LOGOUT = 60 * 1000;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showInactivityWarning, setShowInactivityWarning] = useState(false);

  // Refs for timers so we can clear them from anywhere
  const logoutTimerRef = useRef(null);
  const warningTimerRef = useRef(null);
  const signOutFnRef = useRef(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        handleUserSetup(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        handleUserSetup(session.user.id);
      } else {
        setIsAdmin(false);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleUserSetup = async (userId) => {
    try {
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('user_id', userId)
        .maybeSingle();

      if (!roleData) {
        await supabase.from('user_roles').insert({ user_id: userId, role: 'user' });
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .maybeSingle();

      if (!profileData) {
        await supabase.from('profiles').insert({ id: userId });
      }

      const { data: role } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      setIsAdmin(role?.role === 'admin');
    } catch (error) {
      console.error('Error setting up user:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    // Clear all inactivity timers
    if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    logoutTimerRef.current = null;
    warningTimerRef.current = null;
    setShowInactivityWarning(false);
    await supabase.auth.signOut();
  };

  // Store signOut in a ref so the timer callback always calls the latest version
  signOutFnRef.current = signOut;

  // ---- INACTIVITY TIMER ----
  const resetInactivityTimer = useCallback(() => {
    if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    setShowInactivityWarning(false);

    // Show warning 1 minute before logout
    warningTimerRef.current = setTimeout(() => {
      setShowInactivityWarning(true);
    }, INACTIVITY_TIMEOUT - WARNING_BEFORE_LOGOUT);

    // Log out after full timeout
    logoutTimerRef.current = setTimeout(() => {
      signOutFnRef.current?.();
    }, INACTIVITY_TIMEOUT);
  }, []);

  // Start/reset inactivity timer when user logs in, clean up on logout
  useEffect(() => {
    if (!user || loading) return;

    const activityEvents = ['mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    const handleActivity = () => resetInactivityTimer();

    activityEvents.forEach((evt) => {
      window.addEventListener(evt, handleActivity, { passive: true });
    });

    // Start the timer
    resetInactivityTimer();

    return () => {
      activityEvents.forEach((evt) => {
        window.removeEventListener(evt, handleActivity);
      });
      if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    };
  }, [user, loading, resetInactivityTimer]);

  // Called when user clicks "Stay Logged In" in the warning modal
  const extendSession = useCallback(() => {
    resetInactivityTimer();
  }, [resetInactivityTimer]);

  const value = {
    user,
    isAdmin,
    loading,
    signOut,
    showInactivityWarning,
    extendSession,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}