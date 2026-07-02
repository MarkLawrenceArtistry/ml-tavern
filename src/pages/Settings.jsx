import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export default function Settings() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  
  const [newPassword, setNewPassword] = useState('');
  const [passMsg, setPassMsg] = useState('');
  const [passLoading, setPassLoading] = useState(false);

  const [deleteMsg, setDeleteMsg] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setPassLoading(true);
    setPassMsg('');

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    
    if (error) {
      setPassMsg(error.message);
    } else {
      setPassMsg('Password updated successfully!');
      setNewPassword('');
    }
    setPassLoading(false);
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('WARNING: This will permanently delete your account, all your posts, comments, and data. This cannot be undone. Continue?')) {
      return;
    }

    setDeleteLoading(true);
    setDeleteMsg('');

    try {
      // Call our Edge Function to delete the user from Auth
      const { error } = await supabase.functions.invoke('delete-user');
      
      if (error) throw error;
      
      // If successful, log them out and send them home
      await signOut();
      navigate('/login');
    } catch (err) {
      setDeleteMsg(err.message || 'Failed to delete account.');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-10">
      <h1 className="text-3xl font-extrabold text-white">Settings</h1>

      {/* Password Update Section */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-4">Update Password</h2>
        <form onSubmit={handlePasswordUpdate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1">New Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="input-style"
              placeholder="Min. 6 characters"
            />
          </div>
          
          {passMsg && (
            <p className={`text-sm font-semibold ${passMsg.includes('successfully') ? 'text-green-400' : 'text-red-400'}`}>
              {passMsg}
            </p>
          )}

          <button
            type="submit"
            disabled={passLoading}
            className="px-6 py-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold transition-colors disabled:opacity-50"
          >
            {passLoading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>

      {/* Danger Zone */}
      <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-6">
        <h2 className="text-xl font-bold text-red-400 mb-2">Danger Zone</h2>
        <p className="text-sm text-white/50 mb-4">
          Per the Data Privacy Act, you have the right to be forgotten. Deleting your account will permanently erase all your data, posts, and comments from ML Tavern.
        </p>
        
        {deleteMsg && (
          <p className="text-sm font-semibold text-red-400 mb-4">{deleteMsg}</p>
        )}

        <button
          onClick={handleDeleteAccount}
          disabled={deleteLoading}
          className="px-6 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold transition-colors disabled:opacity-50"
        >
          {deleteLoading ? 'Deleting...' : 'Delete My Account'}
        </button>
      </div>
    </div>
  );
}