'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabaseClient';
import { ShieldCheckIcon, BoltIcon, GlobeAmericasIcon, CheckBadgeIcon } from '@heroicons/react/24/solid';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Refs for requestAnimationFrame elements (Grid, Big Orbs, Floating Orbs, Rings)
  const gridRef = useRef<HTMLDivElement>(null);
  const bigOrb1Ref = useRef<HTMLDivElement>(null);
  const bigOrb2Ref = useRef<HTMLDivElement>(null);
  const orbRefs = useRef<(HTMLDivElement | null)[]>([]);
  const ringRefs = useRef<(HTMLDivElement | null)[]>([]);

  // requestAnimationFrame Animation Loop for grid and background orbs
  useEffect(() => {
    let animationFrameId: number;
    let startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsedTime = (currentTime - startTime) / 1000;

      // 1. Move Grid background position
      if (gridRef.current) {
        const x = (elapsedTime * 15) % 90;
        const y = (elapsedTime * 15) % 90;
        gridRef.current.style.backgroundPosition = `${x}px ${y}px`;
      }

      // 2. Big glowing orbs
      if (bigOrb1Ref.current) {
        const scale = 1 + Math.sin(elapsedTime * 0.8) * 0.25;
        const tx = Math.cos(elapsedTime * 0.5) * 50;
        const ty = Math.sin(elapsedTime * 0.5) * 40;
        bigOrb1Ref.current.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
      }

      if (bigOrb2Ref.current) {
        const scale = 1 + Math.cos(elapsedTime * 0.6) * 0.2;
        const tx = Math.sin(elapsedTime * 0.4) * -50;
        const ty = Math.cos(elapsedTime * 0.4) * -40;
        bigOrb2Ref.current.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
      }

      // 3. Floating orbs movement
      orbRefs.current.forEach((el, index) => {
        if (!el) return;
        const speed = 0.4 + (index * 0.25);
        const tx = Math.sin(elapsedTime * speed) * (60 + index * 20);
        const ty = Math.cos(elapsedTime * speed) * (50 + index * 15);
        
        const baseX = el.dataset.baseX || '0';
        const baseY = el.dataset.baseY || '0';
        el.style.transform = `translate(calc(${baseX} + ${tx}px), calc(${baseY} + ${ty}px))`;
      });

      // 4. Rotating rings
      ringRefs.current.forEach((el, index) => {
        if (!el) return;
        const direction = index % 2 === 0 ? 1 : -1;
        const angle = (elapsedTime * 15 * direction) % 360;
        el.style.transform = `rotate(${angle}deg)`;
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // Crucial: prevents the default browser form reload
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
    <div className="min-h-screen bg-[#fdfdfc] text-[#0b1e5b] flex flex-col lg:flex-row overflow-x-hidden">
      
      {/* LEFT ANIMATED HERO PANEL */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#0b1e5b] text-white p-12 flex-col justify-between relative overflow-hidden">

        {/* Moving grid */}
        <div
          ref={gridRef}
          className="absolute inset-0 opacity-30 pointer-events-none will-change-[background-position]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)
            `,
            backgroundSize: '45px 45px',
          }}
        />

        {/* Big blue glowing orb */}
        <div
          ref={bigOrb1Ref}
          className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full pointer-events-none will-change-transform"
          style={{
            background: 'radial-gradient(circle, rgba(59,130,246,0.35) 0%, rgba(59,130,246,0.12) 35%, transparent 70%)',
            filter: 'blur(20px)',
          }}
        />

        {/* Big green glowing orb */}
        <div
          ref={bigOrb2Ref}
          className="absolute -bottom-40 -right-40 w-[550px] h-[550px] rounded-full pointer-events-none will-change-transform"
          style={{
            background: 'radial-gradient(circle, rgba(16,185,129,0.25) 0%, rgba(16,185,129,0.08) 35%, transparent 70%)',
            filter: 'blur(25px)',
          }}
        />

        {/* ================= GLOWING PARTICLES ================= */}

        {[
          { top: '20%', left: '18%', bg: 'bg-emerald-300', shadow: '0 0 8px #6ee7b7, 0 0 20px #34d399, 0 0 40px #10b981', size: 'w-2 h-2', delay: '0s', duration: '6s' },
          { top: '32%', left: '70%', bg: 'bg-blue-300', shadow: '0 0 8px #93c5fd, 0 0 20px #60a5fa, 0 0 35px #3b82f6', size: 'w-1.5 h-1.5', delay: '1s', duration: '7s' },
          { top: '65%', left: '82%', bg: 'bg-white', shadow: '0 0 8px white, 0 0 20px #93c5fd, 0 0 35px #60a5fa', size: 'w-2 h-2', delay: '2s', duration: '5s' },
          { top: '72%', left: '25%', bg: 'bg-emerald-200', shadow: '0 0 8px #a7f3d0, 0 0 22px #34d399', size: 'w-1.5 h-1.5', delay: '1.5s', duration: '8s' },
          { top: '45%', left: '45%', bg: 'bg-white', shadow: '0 0 8px white, 0 0 18px #60a5fa', size: 'w-1 h-1', delay: '0.5s', duration: '6s' },
          { top: '15%', left: '85%', bg: 'bg-blue-200', shadow: '0 0 8px #bfdbfe, 0 0 25px #3b82f6', size: 'w-2 h-2', delay: '2.5s', duration: '7s' },
        ].map((p, idx) => (
          <span
            key={idx}
            className={`absolute rounded-full pointer-events-none ${p.bg} ${p.size}`}
            style={{
              top: p.top,
              left: p.left,
              boxShadow: p.shadow,
              animation: `particleFloat ${p.duration} ease-in-out infinite ${p.delay}`,
            }}
          />
        ))}

        {/* ================= FLOATING ORBS ================= */}

        {[
          { top: '25%', right: '15%', left: 'auto', bottom: 'auto', bg: 'bg-emerald-400', shadow: '0 0 10px #34d399, 0 0 25px #34d399, 0 0 50px rgba(16,185,129,0.8)', size: 'w-6 h-6' },
          { top: '55%', left: '10%', right: 'auto', bottom: 'auto', bg: 'bg-blue-300', shadow: '0 0 10px #93c5fd, 0 0 25px #60a5fa, 0 0 45px rgba(59,130,246,0.8)', size: 'w-3 h-3' },
          { bottom: '22%', right: '28%', left: 'auto', top: 'auto', bg: 'bg-white', shadow: '0 0 10px white, 0 0 25px #93c5fd, 0 0 50px rgba(96,165,250,0.8)', size: 'w-4 h-4' },
        ].map((o, idx) => (
          <div
            key={idx}
            ref={(el) => { orbRefs.current[idx] = el; }}
            data-base-x={o.left !== 'auto' ? o.left : `calc(100% - ${o.right})`}
            data-base-y={o.top !== 'auto' ? o.top : `calc(100% - ${o.bottom})`}
            className={`absolute rounded-full pointer-events-none will-change-transform ${o.bg} ${o.size}`}
            style={{
              top: o.top,
              left: o.left,
              right: o.right,
              bottom: o.bottom,
              boxShadow: o.shadow,
            }}
          />
        ))}

        {/* ================= ROTATING RINGS ================= */}

        <div
          ref={(el) => { ringRefs.current[0] = el; }}
          className="absolute w-40 h-40 rounded-full border border-blue-300/20 pointer-events-none will-change-transform"
          style={{ top: '18%', right: '5%' }}
        />

        <div
          ref={(el) => { ringRefs.current[1] = el; }}
          className="absolute w-56 h-56 rounded-full border border-emerald-300/10 pointer-events-none will-change-transform"
          style={{ top: '14%', right: '1%' }}
        />

        {/* ================= LOGO ================= */}

        <div className="relative z-20 flex items-center">
          <div className="relative w-72 h-28" style={{ animation: 'logoFloat 4s ease-in-out infinite' }}>
            <Image
              src="/logo.png"
              alt="AccNumbers Logo"
              fill
              priority
              className="object-contain object-left brightness-0 invert"
              style={{ filter: 'brightness(0) invert(1) drop-shadow(0 0 15px rgba(255,255,255,0.15))' }}
            />
          </div>
        </div>

        {/* ================= HERO CONTENT ================= */}

        <div className="relative z-20 space-y-6 max-w-lg my-auto">
          <span
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 backdrop-blur-md text-emerald-400 font-bold text-[10px] uppercase tracking-widest border border-white/10"
            style={{ animation: 'fadeUp 0.8s ease-out both' }}
          >
            <BoltIcon className="w-4 h-4 animate-pulse" />
            Account Recovery Pipeline
          </span>

          <h2
            className="text-4xl xl:text-5xl font-black tracking-tight leading-tight"
            style={{ animation: 'fadeUp 1s ease-out 0.15s both' }}
          >
            Secure access recovery for <span className="text-emerald-400">your workspace.</span>
          </h2>

          <p
            className="text-slate-300 text-sm font-medium leading-relaxed"
            style={{ animation: 'fadeUp 1s ease-out 0.3s both' }}
          >
            Request a secure password reset link to safely regain access to your dashboard and active numbers.
          </p>

          <div
            className="grid grid-cols-2 gap-4 pt-5 border-t border-white/10"
            style={{ animation: 'fadeUp 1s ease-out 0.45s both' }}
          >
            <div className="group space-y-2 p-3 rounded-xl hover:bg-white/5 transition-all duration-300">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                <ShieldCheckIcon className="w-5 h-5 group-hover:scale-125 transition-transform duration-300" />
                Encrypted Tokens
              </div>
              <p className="text-[11px] text-slate-400">Time-limited recovery links.</p>
            </div>

            <div className="group space-y-2 p-3 rounded-xl hover:bg-white/5 transition-all duration-300">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                <GlobeAmericasIcon className="w-5 h-5 group-hover:scale-125 transition-transform duration-300" />
                Fast Support
              </div>
              <p className="text-[11px] text-slate-400">Automated dispatch via secure relay.</p>
            </div>
          </div>
        </div>

        {/* ================= FOOTER ================= */}

        <div className="relative z-20 text-xs text-slate-400 font-medium flex items-center justify-between">
          <span>© 2026 AccNumbers. All rights reserved.</span>
          <span className="flex items-center gap-1 text-emerald-400 font-bold">
            <CheckBadgeIcon className="w-4 h-4 animate-pulse" />
            Systems Operational
          </span>
        </div>

        <style jsx>{`
          @keyframes logoFloat {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-8px); }
          }
          @keyframes fadeUp {
            from { opacity: 0; transform: translateY(25px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes particleFloat {
            0%, 100% { transform: translate(0, 0); opacity: 0.3; }
            50% { transform: translate(35px, -40px); opacity: 1; }
          }
        `}</style>
      </div>

      {/* RIGHT FORM PANEL */}
      <div className="flex-1 flex flex-col justify-between bg-[#fdfdfc] bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] bg-[size:2.25rem_2.25rem]">
        
        <main className="flex-1 flex items-center justify-center p-4 sm:p-8 lg:px-20">
          <div className="w-full max-w-md bg-white border border-[#e5e7eb] rounded-3xl p-6 sm:p-8 shadow-xl lg:bg-transparent lg:border-none lg:rounded-none lg:p-0 lg:shadow-none space-y-6 my-auto">
            
            {/* Header */}
            <div className="space-y-3 text-center lg:text-left">
              <div className="inline-flex items-center justify-center h-16 mb-2 lg:hidden">
                <Image src="/logo.png" alt="AccNumbers Logo" width={120} height={50} className="object-contain" />
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
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 shadow-xs">
                <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center shrink-0 text-red-600 font-bold text-xs mt-0.5">!</div>
                <p className="text-xs font-semibold text-red-700 leading-relaxed">{errorMessage}</p>
              </div>
            )}

            {/* Professional Success Banner Alert */}
            {successMessage && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3 shadow-xs">
                <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 text-emerald-600 font-bold text-xs mt-0.5">✓</div>
                <p className="text-xs font-semibold text-emerald-800 leading-relaxed">{successMessage}</p>
              </div>
            )}

                        {/* Form */}
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmit(e);
              }} 
              className="space-y-4 text-left"
            >
              
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
                  className="w-full px-4 py-3.5 rounded-xl border border-[#cbd5e1] bg-white text-sm font-medium text-[#0b1e5b] focus:outline-none focus:ring-2 focus:ring-[#0b1e5b]/20 focus:border-[#0b1e5b] transition shadow-2xs"
                />
              </div>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-xl bg-[#0b1e5b] text-[#fdfdfc] font-bold text-sm hover:bg-[#0b1e5b]/90 transition shadow-md hover:shadow-lg disabled:opacity-50 cursor-pointer mt-2"
              >
                {loading ? 'Sending link...' : 'Send Reset Link'}
              </button>

            </form>



            {/* Footer Link */}
            <div className="text-center lg:text-left pt-2">
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
        <footer className="bg-transparent border-t border-[#e5e7eb] py-6 px-8 text-center sm:text-left text-xs text-[#6b7280] font-medium flex flex-col sm:flex-row items-center justify-between">
          <span>© 2026 Accnumbers. All rights reserved.</span>
          <span>Powered by Accmarket Network.</span>
        </footer>
      </div>

    </div>
  );
}

