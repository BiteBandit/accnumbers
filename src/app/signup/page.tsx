'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    referralCode: '',
    acceptTerms: false,
  });

  // Capture referral code from URL query parameters on load
  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) {
      setFormData((prev) => ({ ...prev, referralCode: ref }));
      sessionStorage.setItem('pending_referral_code', ref);
    } else {
      const storedRef = sessionStorage.getItem('pending_referral_code');
      if (storedRef) {
        setFormData((prev) => ({ ...prev, referralCode: storedRef }));
      }
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    if (!formData.acceptTerms) {
      setErrorMessage('You must accept the terms and privacy policy.');
      setLoading(false);
      return;
    }

    try {
      // Sign up user and pass referral code in options.data metadata
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            display_name: formData.username,
            username: formData.username,
            referral_code: formData.referralCode.trim(),
          },
        },
      });

      if (signUpError) throw signUpError;

      sessionStorage.removeItem('pending_referral_code');

      if (data.session) {
        router.push('/dashboard');
      } else {
        setSuccessMessage('Account created successfully! Please check your email inbox to verify your account before signing in.');
        setFormData({
          username: '',
          email: '',
          password: '',
          referralCode: '',
          acceptTerms: false,
        });
      }

    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred during signup.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fdfdfc] text-[#0b1e5b] flex flex-col justify-between">
      <main className="flex-1 relative bg-[#fdfdfc] bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] bg-[size:2.25rem_2.25rem] flex items-center justify-center py-12 px-4">
        
        <div className="w-full max-w-md bg-white border border-[#e5e7eb] rounded-3xl p-8 shadow-xl space-y-6 my-auto">
          
          <div className="space-y-3 text-center">
            <div className="inline-flex items-center justify-center h-32 mb-1">
              <img 
                src="/logo.png" 
                alt="AccNumbers Logo" 
                className="h-full w-auto object-contain"
              />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#0b1e5b] tracking-tight">
              Create an account
            </h1>
            <p className="text-xs sm:text-sm font-medium text-[#6b7280]">
              Get instant SMS verification numbers for builders and operators.
            </p>
          </div>

          {errorMessage && (
            <div className="p-4 rounded-2xl bg-red-50/80 border border-red-200/60 backdrop-blur-xs flex items-start gap-3 shadow-xs">
              <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center shrink-0 text-red-600 font-bold text-xs mt-0.5">!</div>
              <p className="text-xs font-semibold text-red-700 leading-relaxed">{errorMessage}</p>
            </div>
          )}

          {successMessage && (
            <div className="p-4 rounded-2xl bg-[#0b1e5b]/5 border border-[#0b1e5b]/15 backdrop-blur-xs flex items-start gap-3 shadow-xs">
              <div className="w-5 h-5 rounded-full bg-[#0b1e5b] flex items-center justify-center shrink-0 text-white font-bold text-[10px] mt-0.5">✓</div>
              <p className="text-xs font-semibold text-[#0b1e5b] leading-relaxed">{successMessage}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#0b1e5b] uppercase tracking-wider">
                Display name
              </label>
              <input
                type="text"
                required
                placeholder="johndoe"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-[#e5e7eb] bg-[#fdfdfc] text-xs sm:text-sm font-medium text-[#0b1e5b] focus:outline-none focus:ring-2 focus:ring-[#0b1e5b]/20 focus:border-[#0b1e5b] transition"
              />
            </div>

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
              <label className="text-xs font-bold text-[#0b1e5b] uppercase tracking-wider">
                Password
              </label>
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

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#0b1e5b] uppercase tracking-wider">
                Referral Code <span className="text-[#6b7280] font-normal lowercase">(optional)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. YPVPEBJ2322"
                value={formData.referralCode}
                onChange={(e) => setFormData({ ...formData, referralCode: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-[#e5e7eb] bg-[#fdfdfc] text-xs sm:text-sm font-medium text-[#0b1e5b] focus:outline-none focus:ring-2 focus:ring-[#0b1e5b]/20 focus:border-[#0b1e5b] transition uppercase"
              />
            </div>

            <div className="flex items-start gap-2 pt-1">
              <input
                type="checkbox"
                required
                id="terms"
                checked={formData.acceptTerms}
                onChange={(e) => setFormData({ ...formData, acceptTerms: e.target.checked })}
                className="mt-0.5 rounded border-[#e5e7eb] text-[#0b1e5b] focus:ring-[#0b1e5b]"
              />
              <label htmlFor="terms" className="text-xs font-medium text-[#6b7280] leading-relaxed">
                I agree to the <Link href="/terms" className="text-[#0b1e5b] font-bold underline">Terms of Service</Link> and <Link href="/privacy" className="text-[#0b1e5b] font-bold underline">Privacy Policy</Link>.
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-xl bg-[#0b1e5b] text-[#fdfdfc] font-bold text-xs sm:text-sm hover:bg-[#0b1e5b]/90 transition shadow-md hover:shadow-lg disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>

          </form>

          <div className="text-center pt-2 border-t border-[#e5e7eb]">
            <p className="text-xs font-medium text-[#6b7280]">
              Already have an account?{' '}
              <Link href="/signin" className="text-[#0b1e5b] font-bold hover:underline">
                Sign in
              </Link>
            </p>
          </div>

        </div>

      </main>

      <footer className="bg-[#fdfdfc] border-t border-[#e5e7eb] py-6 px-4 text-center text-xs text-[#6b7280] font-medium">
        © 2026 Accnumbers. All rights reserved. Powered by Accmarket Network.
      </footer>
    </div>
  );
}

