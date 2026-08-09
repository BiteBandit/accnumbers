'use client';

import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      setSuccessMessage('Password reset instructions have been sent to your email address.');
      setEmail('');

    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fdfdfc] text-[#0b1e5b] flex flex-col justify-between">
      <main className="flex-1 relative bg-[#fdfdfc] bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] bg-[size:2.25rem_2.25rem] flex items-center justify-center py-12 px-4">
        
        <div className="w-full max-w-md bg-white border border-[#e5e7eb] rounded-3xl p-8 shadow-xl space-y-6 my-auto">
          
          {/* Header */} 
          <div className="space-y-3 text-center">
            <div className="inline-flex items-center justify-center h-32 mb-1">
              <img 
                src="/logo.png" 
                alt="AccNumbers Logo" 
                className="h-full w-auto object-contain"
              />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#0b1e5b] tracking-tight">
              Reset password
            </h1>
            <p className="text-xs sm:text-sm font-medium text-[#6b7280]">
              Enter your email and we'll send you a link to reset your password.
            </p>
          </div>

          {/* Error Message Alert */}
          {errorMessage && (
            <div className="p-4 rounded-2xl bg-red-50/80 border border-red-200/65 backdrop-blur-xs flex items-start gap-3 shadow-xs">
              <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center shrink-0 text-red-600 font-bold text-xs mt-0.5">!</div>
              <p className="text-xs font-semibold text-red-700 leading-relaxed">{errorMessage}</p>
            </div>
          )}

          {/* Professional Success Banner Alert */}
          {successMessage && (
            <div className="p-4 rounded-2xl bg-[#0b1e5b]/5 border border-[#0b1e5b]/15 backdrop-blur-xs flex items-start gap-3 shadow-xs">
              <div className="w-5 h-5 rounded-full bg-[#0b1e5b] flex items-center justify-center shrink-0 text-white font-bold text-[10px] mt-0.5">✓</div>
              <p className="text-xs font-semibold text-[#0b1e5b] leading-relaxed">{successMessage}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#0b1e5b] uppercase tracking-wider">
                Email
              </label>
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-[#e5e7eb] bg-[#fdfdfc] text-xs sm:text-sm font-medium text-[#0b1e5b] focus:outline-none focus:ring-2 focus:ring-[#0b1e5b]/20 focus:border-[#0b1e5b] transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-xl bg-[#0b1e5b] text-[#fdfdfc] font-bold text-xs sm:text-sm hover:bg-[#0b1e5b]/90 transition shadow-md hover:shadow-lg disabled:opacity-50 cursor-pointer mt-2"
            >
              {loading ? 'Sending link...' : 'Send Reset Link'}
            </button>

          </form>

          {/* Footer Link */}
          <div className="text-center pt-2 border-t border-[#e5e7eb]">
            <p className="text-xs font-medium text-[#6b7280]">
              Remembered your password?{' '}
              <Link href="/signin" className="text-[#0b1e5b] font-bold hover:underline">
                Sign in
              </Link>
            </p>
          </div>

        </div>

      </main>

      {/* Footer */}
      <footer className="bg-[#fdfdfc] border-t border-[#e5e7eb] py-6 px-4 text-center text-xs text-[#6b7280] font-medium">
        © 2026 Accnumbers. All rights reserved. Powered by Accmarket Network.
      </footer>
    </div>
  );
}
