'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { 
  ChartBarIcon, 
  UsersIcon, 
  Cog6ToothIcon, 
  ArrowRightOnRectangleIcon,
  ClipboardDocumentListIcon,
  ArrowsRightLeftIcon,
  Bars3Icon,
  XMarkIcon,
  ShieldCheckIcon,
  ArrowTopRightOnSquareIcon,
  TagIcon
} from '@heroicons/react/24/solid';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [adminEmail, setAdminEmail] = useState<string>('operator@accnumbers.com');

  useEffect(() => {
    async function getAdminData() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.email) {
        setAdminEmail(session.user.email);
      }
    }
    getAdminData();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/signin');
  };

  const navItems = [
    { name: 'Overview & Stats', href: '/admin', icon: ChartBarIcon },
    { name: 'Manage Users', href: '/admin/users', icon: UsersIcon },
    { name: 'Active Rentals', href: '/admin/rentals', icon: ClipboardDocumentListIcon },
    { name: 'Transaction Ledger', href: '/admin/transactions', icon: ArrowsRightLeftIcon },
    { name: 'Promo Codes', href: '/admin/promos', icon: TagIcon },
    { name: 'System Settings', href: '/admin/settings', icon: Cog6ToothIcon },
  ];

  const maskedEmail = adminEmail.replace(/(.{2})(.*)(@.*)/, "$1***$3");

  return (
    <div className="min-h-screen bg-[#fdfdfc] bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] bg-[size:4rem_4rem] text-[#111111] flex font-sans selection:bg-[#0b1e5b]/10 selection:text-[#0b1e5b]">
      
      {/* Permanent Desktop Sidebar */}
      <aside className="w-72 bg-[#0b1e5b] text-[#fdfdfc] p-6 hidden md:flex flex-col justify-between sticky top-0 h-screen shadow-2xl border-r border-[#0b1e5b]/40 z-30">
        <div className="space-y-8">
          <div className="space-y-2 px-2">
            <div className="flex items-center gap-2">
              <span className="font-black text-xl tracking-tight text-white">
                Acc<span className="text-[#0b1e5b] bg-white px-1.5 py-0.5 rounded ml-0.5 text-base">Numbers</span>
              </span>
            </div>
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-slate-300">Command Core v3.0</span>
              </div>
              <span className="text-[9px] font-mono bg-white/10 px-1.5 py-0.5 rounded text-emerald-400 border border-emerald-500/20">SECURE</span>
            </div>
          </div>

          <nav className="space-y-1.5">
            <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest px-3 pb-2">Modules</p>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link 
                  key={item.href} 
                  href={item.href} 
                  className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl font-bold text-xs transition-all duration-200 group ${
                    isActive 
                      ? 'bg-white text-[#0b1e5b] shadow-lg scale-[1.02]' 
                      : 'text-slate-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${isActive ? 'text-[#0b1e5b]' : 'text-slate-400'}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="space-y-4 pt-6 border-t border-white/10">
          {/* Admin Identity Card */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0 font-mono border border-emerald-500/30">
              <ShieldCheckIcon className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Authorized Admin</div>
              <div className="text-xs font-bold text-white truncate" title={adminEmail}>{maskedEmail}</div>
            </div>
          </div>

          <div className="space-y-2">
            <Link 
              href="/dashboard"
              className="w-full py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-semibold flex items-center justify-between transition border border-white/5"
            >
              <span>Switch to User View</span>
              <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5 text-slate-400" />
            </Link>
            <button 
              onClick={handleSignOut}
              className="w-full py-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-300 hover:text-red-200 transition text-xs font-bold flex items-center justify-center gap-2 border border-red-500/20 cursor-pointer shadow-xs"
            >
              <ArrowRightOnRectangleIcon className="w-4 h-4" /> Exit Command Session
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Header & Drawer Overlay */}
      <div className="md:hidden flex flex-col flex-1 min-h-screen">
        <header className="bg-[#0b1e5b] text-white px-5 py-4 flex items-center justify-between sticky top-0 z-40 shadow-md border-b border-white/10">
          <div className="flex flex-col">
            <span className="font-black text-lg tracking-tight text-white">AccNumbers</span>
            <span className="text-[9px] font-mono text-emerald-400 tracking-widest uppercase flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Admin Command Core
            </span>
          </div>
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition cursor-pointer"
          >
            {mobileMenuOpen ? <XMarkIcon className="w-6 h-6" /> : <Bars3Icon className="w-6 h-6" />}
          </button>
        </header>

        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 flex bg-black/60 backdrop-blur-xs md:hidden">
            <div className="w-72 bg-[#0b1e5b] text-white p-6 flex flex-col justify-between shadow-2xl h-full animate-in slide-in-from-left duration-200">
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div>
                    <span className="font-black text-lg text-white">AccNumbers</span>
                    <p className="text-[10px] font-mono text-slate-300 uppercase">Command Hub v3.0</p>
                  </div>
                  <button onClick={() => setMobileMenuOpen(false)} className="p-2 rounded-lg bg-white/10 text-slate-300 hover:text-white">
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>

                <nav className="space-y-1.5">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                      <Link 
                        key={item.href} 
                        href={item.href} 
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl font-bold text-xs transition ${
                          isActive 
                            ? 'bg-white text-[#0b1e5b] shadow-md' 
                            : 'text-slate-300 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${isActive ? 'text-[#0b1e5b]' : 'text-slate-400'}`} />
                        <span>{item.name}</span>
                      </Link>
                    );
                  })}
                </nav>
              </div>

              <div className="space-y-3 pt-4 border-t border-white/10">
                <Link 
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-2.5 rounded-xl bg-white/10 text-center text-xs font-semibold block text-slate-200 border border-white/5"
                >
                  Switch to User App
                </Link>
                <button 
                  onClick={handleSignOut}
                  className="w-full py-3 rounded-xl bg-red-500/10 text-red-300 text-xs font-bold flex items-center justify-center gap-2 border border-red-500/20"
                >
                  <ArrowRightOnRectangleIcon className="w-4 h-4" /> Exit Command Session
                </button>
              </div>
            </div>
            <div className="flex-1" onClick={() => setMobileMenuOpen(false)}></div>
          </div>
        )}

        <main className="flex-1 min-h-screen p-4 sm:p-8 overflow-y-auto bg-[#fdfdfc]">
          {children}
        </main>
      </div>

      <main className="hidden md:flex flex-1 min-h-screen p-8 lg:p-12 overflow-y-auto bg-[#fdfdfc]/80 backdrop-blur-xs">
        <div className="max-w-7xl w-full mx-auto">
          {children}
        </div>
      </main>

    </div>
  );
}

