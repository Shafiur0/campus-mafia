'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { motion } from 'framer-motion';
import { GraduationCap, Sparkles, User } from 'lucide-react';

export default function LoginPage() {
  const [guestName, setGuestName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGuestLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim()) {
      setError('Please enter a nickname');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const result = await signIn('credentials', {
        name: guestName,
        callbackUrl: '/',
        redirect: true,
      });
      if (result?.error) {
        setError('Login failed. Please try again.');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await signIn('google', { callbackUrl: '/' });
    } catch (err) {
      setError('Google login failed.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0B1E] flex flex-col justify-center items-center px-4 relative overflow-hidden">
      {/* Background neon blobs */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px].m-5 h-[500px] rounded-full bg-[#7C3AED]/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-[#22D3EE]/10 blur-[100px] pointer-events-none" />

      {/* Brand logo */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex items-center gap-3 mb-8"
      >
        <div className="w-12 h-12 bg-gradient-to-br from-[#7C3AED] to-[#22D3EE] rounded-2xl flex items-center justify-center shadow-neonPrimary">
          <GraduationCap className="w-7 h-7 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight text-white">
            CAMPUS <span className="text-[#22D3EE]">MAFIA</span>
          </h1>
          <p className="text-xs text-textMuted font-mono">UNIVERSITY EDITION</p>
        </div>
      </motion.div>

      {/* Main glass card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="w-full max-w-md glass-card rounded-3xl p-8 shadow-2xl relative z-10 border border-white/[0.08]"
      >
        <h2 className="text-xl font-display font-semibold text-white mb-2">
          Verify your credentials
        </h2>
        <p className="text-sm text-textMuted mb-6">
          Access the campus corridors. Watch your back.
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-danger/10 border border-danger/20 text-danger text-sm font-body">
            {error}
          </div>
        )}

        <div className="space-y-6">
          {/* Guest login form */}
          <form onSubmit={handleGuestLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-textMuted uppercase tracking-wider mb-2">
                Play as Guest
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-[#94A3B8]" />
                </span>
                <input
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="Enter nickname..."
                  disabled={loading}
                  maxLength={16}
                  className="w-full bg-[#12142B] border border-white/[0.08] focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] rounded-xl py-3 pl-10 pr-4 text-white text-sm placeholder-white/20 outline-none transition-all duration-300"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#7C3AED] to-[#7C3AED]/80 hover:from-[#7C3AED] hover:to-[#22D3EE] text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 shadow-neonPrimary hover:shadow-neonAccent hover:scale-[1.02] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Sparkles className="w-4 h-4" />
              {loading ? 'Entering...' : 'Enter as Guest'}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6 flex items-center">
            <div className="flex-grow border-t border-white/[0.05]"></div>
            <span className="flex-shrink mx-4 text-xs font-mono text-[#94A3B8] uppercase tracking-widest">
              or
            </span>
            <div className="flex-grow border-t border-white/[0.05]"></div>
          </div>

          {/* Google OAuth Login */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            type="button"
            className="w-full bg-[#12142B] hover:bg-white/[0.04] border border-white/[0.08] text-white font-medium py-3 px-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.137 4.114-3.41 0-6.19-2.78-6.19-6.19s2.78-6.19 6.19-6.19c1.55 0 2.96.57 4.05 1.51l3.1-3.1C19.1 1.95 15.91.95 12.24.95 6.04.95 1 5.99 1 12.19s5.04 11.24 11.24 11.24c6.26 0 11.13-4.4 11.13-11.24 0-.64-.06-1.28-.18-1.91H12.24z"
              />
            </svg>
            <span>Sign in with Google</span>
          </button>
        </div>
      </motion.div>

      {/* Decorative footer */}
      <p className="mt-8 text-xs font-mono text-textMuted tracking-wider z-10">
        Campus curfew is active. Keep your identity secret.
      </p>
    </div>
  );
}
