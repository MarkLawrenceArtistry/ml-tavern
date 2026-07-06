import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function OnlinePill() {
  const [count, setCount] = useState('???');

  useEffect(() => {
    console.error('⚡ OnlinePill MOUNTED'); // console.error is NEVER suppressed, even in prod

    supabase.rpc('get_online_count').then(({ data, error }) => {
      console.error('⚡ RPC result:', data, error);
      setCount(error ? 'ERR' : data);
    }).catch(e => {
      console.error('⚡ RPC catch:', e);
      setCount('ERR');
    });
  }, []);

  return (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border-2 border-emerald-400 rounded-full text-sm font-black text-emerald-400"
      style={{ minWidth: 100, textAlign: 'center' }}
    >
      <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
      {count} online
    </span>
  );
}