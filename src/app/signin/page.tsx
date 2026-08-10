'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function SigninPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  
  // View states: 'credentials' | 'mfa_otp' | 'recovery_code'
  const [authStep, setAuthStep] = useState<'credentials' | 'mfa_otp' | 'recovery_code'>('credentials');
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: true,
    otpCode: '',
    recoveryCode: '',
  });

  // 1. "Remember Me" / Auto-Session Check on Mount
  useEffect(() => {
    async function checkExistingSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          router.push('/dashboard');
          return;
        }

        const savedEmail = localStorage.getItem('accnumbers_remembered_email');
        if (savedEmail) {
          setFormData((prev) => ({ ...prev, email: savedEmail, rememberMe: true }));
        }
      } catch (err) {
        console.error('Session check error:', err);
      } finally {
        setLoading(false);
      }
    }

    checkExistingSession();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    try {
      if (authStep === 'credentials') {
        if (formData.rememberMe) {
          localStorage.setItem('accnumbers_remembered_email', formData.email);
        } else {
          localStorage.removeItem('accnumbers_remembered_email');
        }

        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (error) throw error;

        // Check if Multi-Factor Authentication (MFA) AAL2 level is required
        const { data: aalData, error: aalError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        
        if (!aalError && aalData && aalData.nextLevel === 'aal2' && aalData.nextLevel !== aalData.currentLevel) {
          // User requires 2FA -> Switch UI to standard 2FA OTP prompt first
          setAuthStep('mfa_otp');
          setLoading(false);
          return;
        }

        router.push('/dashboard');

      } else if (authStep === 'mfa_otp') {
        // Handle standard 2FA authenticator app verification
        const cleanOtp = formData.otpCode.trim();
        if (!cleanOtp) throw new Error('Please enter your 6-digit authenticator code.');

        const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors();
        if (factorsError) throw factorsError;

        const totpFactor = factors.totp.find((factor) => factor.status === 'verified');
        if (!totpFactor) throw new Error('No active authenticator app factor found.');

        const challengeData = await supabase.auth.mfa.challenge({ factorId: totpFactor.id });
        if (challengeData.error) throw challengeData.error;

        const verifyData = await supabase.auth.mfa.verify({
          factorId: totpFactor.id,
          challengeId: challengeData.data.id,
          code: cleanOtp,
        });

        if (verifyData.error) throw verifyData.error;

        router.push('/dashboard');

      } else if (authStep === 'recovery_code') {
        // Handle Recovery Code Verification against `public.mfa_recovery_codes` table
        const cleanCode = formData.recoveryCode.trim();
        if (!cleanCode) throw new Error('Please enter a valid recovery code.');

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Session expired. Please sign in with your password again.');

        const { data: codeRecord, error: codeQueryError } = await supabase
          .from('mfa_recovery_codes')
          .select('*')
          .eq('user_id', user.id)
          .eq('code_hash', cleanCode)
          .eq('used', false)
          .single();

        if (codeQueryError || !codeRecord) {
          throw new Error('Invalid or already used recovery code.');
        }

        const { error: updateError } = await supabase
          .from('mfa_recovery_codes')
          .update({ used: true })
          .eq('id', codeRecord.id);

        if (updateError) {
          throw new Error('Failed to process recovery code. Try again.');
        }

        router.push('/dashboard');
      }

    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed. Please try again.');
      setLoading(false);
    }
  };

  if (loading && authStep === 'credentials') {
    return (
      <div className="min-h-screen bg-[#fdfdfc] flex items-center justify-center text-[#6b7280] text-xs font-medium">
        Checking session status...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fdfdfc] text-[#0b1e5b] flex flex-col justify-between">
      <main className="flex-1 relative bg-[#fdfdfc] bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] bg-[size:2.25rem_2.25rem] flex items-center justify-center py-12 px-4">
        
        <div className="w-full max-w-md bg-white border border-[#e5e7eb] rounded-3xl p-8 shadow-xl space-y-6 my-auto">
          
          {/* Header */} 
          <div className="space-y-3 text-center">
            <div className="inline-flex items-center justify-center h-24 mb-1">
              <img 
                src="/logo.png" 
                alt="AccNumbers Logo" 
                className="h-full w-auto object-contain"
              />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#0b1e5b] tracking-tight">
              {authStep === 'mfa_otp' ? 'Two-Factor Authentication' : authStep === 'recovery_code' ? 'Enter Recovery Code' : 'Welcome back'}
            </h1>
            <p className="text-xs sm:text-sm font-medium text-[#6b7280]">
              {authStep === 'mfa_otp' 
                ? 'Open your authenticator app and enter the 6-digit code.' 
                : authStep === 'recovery_code' 
                ? 'Input one of your backup recovery codes from your secure storage.' 
                : 'Sign in to manage your SMS verification numbers.'}
            </p>
          </div>

          {/* Error Message Alert */}
          {errorMessage && (
            <div className="p-4 rounded-2xl bg-red-50/80 border border-red-200/65 backdrop-blur-xs flex items-start gap-3 shadow-xs">
              <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center shrink-0 text-red-600 font-bold text-xs mt-0.5">!</div>
              <p className="text-xs font-semibold text-red-700 leading-relaxed">{errorMessage}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {authStep === 'credentials' && (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#0b1e5b] uppercase tracking-wider">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-[#e5e7eb] bg-[#fdfdfc] text-xs sm:text-sm font-medium text-[#0b1e5b] focus:outline-none focus:ring-2 focus:ring-[#0b1e5b]/20 focus:border-[#0b1e5b] transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-[#0b1e5b] uppercase tracking-wider">
                      Password
                    </label>
                    <Link href="/forgot-password" className="text-xs font-bold text-[#0b1e5b] hover:underline">
                      Forgot?
                    </Link>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-[#e5e7eb] bg-[#fdfdfc] text-xs sm:text-sm font-medium text-[#0b1e5b] focus:outline-none focus:ring-2 focus:ring-[#0b1e5b]/20 focus:border-[#0b1e5b] transition pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b7280] hover:text-[#0b1e5b] text-xs font-bold"
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formData.rememberMe}
                      onChange={(e) => setFormData({ ...formData, rememberMe: e.target.checked })}
                      className="w-4 h-4 rounded border-[#e5e7eb] text-[#0b1e5b] focus:ring-[#0b1e5b]/20 accent-[#0b1e5b]"
                    />
                    <span className="text-xs font-medium text-[#6b7280]">Remember me</span>
                  </label>
                </div>
              </>
            )}

            {authStep === 'mfa_otp' && (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#0b1e5b] uppercase tracking-wider">
                    Authentication Code (OTP)
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="123456"
                    value={formData.otpCode}
                    onChange={(e) => setFormData({ ...formData, otpCode: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-[#e5e7eb] bg-[#fdfdfc] text-base font-mono font-bold tracking-widest text-center text-[#0b1e5b] focus:outline-none focus:ring-2 focus:ring-[#0b1e5b]/20 focus:border-[#0b1e5b] transition"
                  />
                </div>

                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => { setAuthStep('recovery_code'); setErrorMessage(''); }}
                    className="text-xs font-bold text-[#0b1e5b] hover:underline"
                  >
                    Don't have your authenticator device? Use recovery code
                  </button>
                </div>
              </div>
            )}

            {authStep === 'recovery_code' && (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#0b1e5b] uppercase tracking-wider">
                    Backup Recovery Code
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 5x67y4w"
                    value={formData.recoveryCode}
                    onChange={(e) => setFormData({ ...formData, recoveryCode: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-[#e5e7eb] bg-[#fdfdfc] text-xs sm:text-sm font-mono font-bold text-[#0b1e5b] focus:outline-none focus:ring-2 focus:ring-[#0b1e5b]/20 focus:border-[#0b1e5b] transition"
                  />
                  <p className="text-[11px] text-[#6b7280] pt-1">
                    Each recovery code can only be used once. Entering a valid code marks it as consumed and logs you in.
                  </p>
                </div>

                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => { setAuthStep('mfa_otp'); setErrorMessage(''); }}
                    className="text-xs font-bold text-[#0b1e5b] hover:underline"
                  >
                    ← Back to Authenticator app code
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-xl bg-[#0b1e5b] text-[#fdfdfc] font-bold text-xs sm:text-sm hover:bg-[#0b1e5b]/90 transition shadow-md hover:shadow-lg disabled:opacity-50 cursor-pointer mt-2"
            >
              {loading ? 'Verifying...' : authStep === 'mfa_otp' ? 'Verify Code' : authStep === 'recovery_code' ? 'Verify Recovery Code' : 'Sign In'}
            </button>

            {authStep !== 'credentials' && (
              <button
                type="button"
                onClick={() => { setAuthStep('credentials'); setErrorMessage(''); }}
                className="w-full py-2 text-xs font-bold text-[#6b7280] hover:text-[#0b1e5b] transition text-center"
              >
                ← Back to standard login
              </button>
            )}

          </form>

          {/* Footer Link */}
          {authStep === 'credentials' && (
            <div className="text-center pt-2 border-t border-[#e5e7eb]">
              <p className="text-xs font-medium text-[#6b7280]">
                Don't have an account?{' '}
                <Link href="/signup" className="text-[#0b1e5b] font-bold hover:underline">
                  Create account
                </Link>
              </p>
            </div>
          )}

        </div>

      </main>

      {/* Footer */}
      <footer className="bg-[#fdfdfc] border-t border-[#e5e7eb] py-6 px-4 text-center text-xs text-[#6b7280] font-medium">
        © 2026 Accnumbers. All rights reserved. Powered by Accmarket Network.
      </footer>
    </div>
  );
}
