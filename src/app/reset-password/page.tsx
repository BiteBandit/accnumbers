'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { KeyIcon, CheckCircleIcon, ExclamationCircleIcon, ArrowRightIcon, ShieldCheckIcon, ArrowPathIcon } from '@heroicons/react/24/solid';
import Link from 'next/link';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [requiresMfa, setRequiresMfa] = useState(false);
  const [linkExpired, setLinkExpired] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    // Check if URL contains token error hash parameters (e.g., otp_expired)
    const hash = window.location.hash;
    if (hash.includes('error_code=otp_expired') || hash.includes('error_description=Email+link+is+invalid')) {
      setLinkExpired(true);
      setErrorMessage('This password reset link has expired or is invalid. Please request a new one.');
    }
  }, []);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (linkExpired) return;

    setErrorMessage(null);
    setSuccessMessage(null);

    if (!password || !confirmPassword) {
      setErrorMessage('Please fill in both password fields.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      // If 2FA step is active, verify the TOTP code first
      if (requiresMfa) {
        if (!totpCode || totpCode.length !== 6) {
          setErrorMessage('Please enter your 6-digit authenticator code.');
          setLoading(false);
          return;
        }

        const { data: factorsData, error: factorsError } = await supabase.auth.mfa.listFactors();
        if (factorsError) throw factorsError;

        const verifiedTotpFactor = factorsData.totp.find(f => f.status === 'verified');
        if (!verifiedTotpFactor) {
          throw new Error('No active authenticator factor found.');
        }

        const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
          factorId: verifiedTotpFactor.id,
        });
        if (challengeError) throw challengeError;

        const { error: verifyError } = await supabase.auth.mfa.verify({
          factorId: verifiedTotpFactor.id,
          challengeId: challengeData.id,
          code: totpCode,
        });
        if (verifyError) throw new Error('Invalid authenticator code. Please try again.');
      }

      // Attempt to update password
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        if (error.message.toLowerCase().includes('aal2') || error.message.toLowerCase().includes('mfa')) {
          setRequiresMfa(true);
          setErrorMessage('Multi-factor authentication required. Please enter your authenticator app code below.');
          setLoading(false);
          return;
        }
        throw error;
      }

      setSuccessMessage('Password successfully updated! Redirecting to sign in...');
      setTimeout(() => {
        router.push('/signin');
      }, 3000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fdfdfc] bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] flex flex-col justify-between font-sans text-[#111111] selection:bg-[#0b1e5b]/15">
      
      {/* Header */}
      <header className="bg-[#fdfdfc]/95 backdrop-blur-md border-b border-[#e5e7eb] px-6 py-4 flex items-center justify-between sticky top-0 z-40 shadow-xs">
        <div className="flex flex-col">
          <span className="font-black text-lg tracking-tight text-[#0b1e5b] leading-tight">Acc<span className="text-[#6b7280]">Numbers</span></span>
          <span className="text-[9px] font-bold text-[#6b7280] tracking-widest uppercase">Virtual Hub</span>
        </div>
      </header>

      {/* Main Content Form */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="max-w-md w-full bg-white border border-[#e5e7eb] rounded-3xl p-8 shadow-sm space-y-6">
          
          <div className="space-y-2 text-center">
            <div className="w-12 h-12 rounded-2xl bg-[#0b1e5b]/5 border border-[#0b1e5b]/10 flex items-center justify-center mx-auto text-[#0b1e5b]">
              {linkExpired ? <ExclamationCircleIcon className="w-6 h-6 text-red-500" /> : requiresMfa ? <ShieldCheckIcon className="w-6 h-6" /> : <KeyIcon className="w-6 h-6" />}
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-[#0b1e5b] tracking-tight">
              {linkExpired ? 'Link Expired' : requiresMfa ? 'Two-Factor Verification' : 'Reset Password'}
            </h1>
            <p className="text-xs font-medium text-[#6b7280]">
              {linkExpired 
                ? 'Your password reset link is invalid or has expired.' 
                : requiresMfa 
                  ? 'Enter the 6-digit code from your authenticator app to authorize this change.' 
                  : 'Enter your new secure password below to complete recovery.'}
            </p>
          </div>

          {errorMessage && (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-600 text-xs font-medium flex items-center gap-2">
              <ExclamationCircleIcon className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium flex items-center gap-2">
              <CheckCircleIcon className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {linkExpired ? (
            <div className="space-y-4">
              <Link 
  href="/forgot-password" 
  className="w-full py-3.5 rounded-2xl bg-[#0b1e5b] hover:bg-[#0b1e5b]/90 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2"
>
  <ArrowPathIcon className="w-4 h-4" /> Request New Recovery Link
</Link>
            </div>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              {!requiresMfa ? (
                <>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wider block">
                      New Password
                    </label>
                    <input 
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full px-4 py-3 rounded-2xl border border-[#e5e7eb] bg-[#fdfdfc] text-xs font-medium text-[#111111] focus:outline-none focus:ring-2 focus:ring-[#0b1e5b]/20 focus:border-[#0b1e5b] transition"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wider block">
                      Confirm New Password
                    </label>
                    <input 
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full px-4 py-3 rounded-2xl border border-[#e5e7eb] bg-[#fdfdfc] text-xs font-medium text-[#111111] focus:outline-none focus:ring-2 focus:ring-[#0b1e5b]/20 focus:border-[#0b1e5b] transition"
                    />
                  </div>
                </>
              ) : (
                <div className="space-y-1.5 p-4 rounded-2xl bg-[#fdfdfc] border border-[#e5e7eb]">
                  <label className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wider block mb-1 text-center">
                    Authenticator App Code (2FA)
                  </label>
                  <input 
                    type="text"
                    maxLength={6}
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-[#e5e7eb] bg-white text-sm font-bold text-[#111111] tracking-[0.3em] text-center focus:outline-none focus:ring-2 focus:ring-[#0b1e5b]/20 focus:border-[#0b1e5b] transition"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-2xl bg-[#0b1e5b] hover:bg-[#0b1e5b]/90 text-white font-bold text-xs shadow-md transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin"></div>
                ) : (
                  <>
                    {requiresMfa ? 'Verify & Continue' : 'Update Password'} <ArrowRightIcon className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#fdfdfc] border-t border-[#e5e7eb] py-6 px-4 text-center text-xs text-[#6b7280] font-medium">
        © 2026 AccNumbers. All rights reserved.
      </footer>
    </div>
  );
}

