import { supabase } from './supabase';

export function initErrorLogger() {
  // Catch standard JS errors
  window.onerror = async (message, source, lineno, colno, error) => {
    await sendErrorToDb({
      error_message: message,
      error_stack: error?.stack || null,
      url: source,
      component_stack: `Line ${lineno}, Col ${colno}`,
      user_agent: navigator.userAgent
    });
    return false; // Prevent default browser error handling
  };

  // Catch unhandled Promise rejections (like API failures)
  window.addEventListener('unhandledrejection', async (event) => {
    await sendErrorToDb({
      error_message: event.reason?.message || 'Unhandled Promise Rejection',
      error_stack: event.reason?.stack || null,
      url: window.location.href,
      component_stack: null,
      user_agent: navigator.userAgent
    });
  });
}

async function sendErrorToDb(errorData) {
  try {
    // Get user ID if logged in (non-blocking, cached locally)
    const { data: { session } } = await supabase.auth.getSession();
    
    await supabase.from('error_logs').insert({
      user_id: session?.user?.id || null,
      ...errorData
    });
  } catch (err) {
    // Fail silently so we don't cause an infinite loop of errors
    console.error('Failed to log error to database:', err);
  }
}