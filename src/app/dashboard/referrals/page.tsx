'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { 
  Bars3Icon, 
  XMarkIcon, 
  WalletIcon, 
  ArrowRightIcon, 
  PlusIcon, 
  ClipboardDocumentListIcon, 
  MagnifyingGlassIcon, 
  UsersIcon, 
  BellIcon, 
  ArrowsRightLeftIcon, 
  KeyIcon, 
  ShieldCheckIcon, 
  ArrowRightOnRectangleIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  DocumentDuplicateIcon,
  SparklesIcon
} from '@heroicons/react/24/solid';

export default function ReferralsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [balanceNGN, setBalanceNGN] = useState<number>(0);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [referralCode, setReferralCode] = useState<string>('YPVPEBJRY');
  const [totalReferees, setTotalReferees] = useState<number>(0);
  const [payoutsReceived, setPayoutsReceived] = useState<number>(0);
  const [lifetimeEarned, setLifetimeEarned] = useState<number>(0);
  const [refereesList, setRefereesList] = useState<any[]>([]);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [shareableLink, setShareableLink] = useState<string>('https://accnumbers.com/signup');
  const [referralPercentage, setReferralPercentage] = useState<number>(5.00);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setShareableLink(`${window.location.origin}/signup?ref=${referralCode}`);
    }

    let channels: any[] = [];
    let isMounted = true;

    async function loadReferralData() {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session || !isMounted) {
          if (!session) router.push('/signin');
          return;
        }

        const currentUser = session.user;
        setUser(currentUser);

        const processReferrals = (refData: any[]) => {
          if (!isMounted) return;
          setTotalReferees(refData.length);
          const totalEarned = refData.reduce((acc: number, curr: any) => acc + (curr.earned_amount || 0), 0);
          setLifetimeEarned(totalEarned);
          setPayoutsReceived(refData.filter((r: any) => (r.earned_amount || 0) > 0).length);
          setRefereesList(refData.slice(0, 20));
        };

        // Fetch user wallet balance
        const { data: walletData } = await supabase
          .from('wallets')
          .select('balance')
          .eq('user_id', currentUser.id)
          .single();

        if (walletData && isMounted) {
          setBalanceNGN(walletData.balance ?? 0);
        }

        // Fetch unread notifications count
        const { count: unread } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', currentUser.id)
          .eq('read', false);

        if (isMounted) setUnreadCount(unread || 0);

        // Fetch user profile or referral code if stored
        const { data: profileData } = await supabase
          .from('profiles')
          .select('display_name, referral_code')
          .eq('id', currentUser.id)
          .single();

        if (profileData && profileData.referral_code && isMounted) {
          setReferralCode(profileData.referral_code);
          setShareableLink(`${window.location.origin}/signup?ref=${profileData.referral_code}`);
        }

        // Fetch referrals data from database
        const { data: refData } = await supabase
          .from('referrals')
          .select('*')
          .eq('referrer_id', currentUser.id)
          .order('created_at', { ascending: false });

        if (refData && isMounted) {
          processReferrals(refData);
        }

        // Fetch dynamic referral percentage from settings table
        const { data: settingData } = await supabase
          .from('settings')
          .select('value')
          .eq('key', 'referral_percentage')
          .single();

        if (settingData && settingData.value && isMounted) {
          setReferralPercentage(Number(settingData.value));
        }

        if (!isMounted) return;

        // --- UNIQUE REALTIME CHANNELS SETUP ---
        const uniqueInstanceId = Math.random().toString(36).substring(2, 9);

        // 1. Wallet Channel Setup
        const walletChannel = supabase
          .channel(`public:wallets:user_id=eq.${currentUser.id}-${uniqueInstanceId}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'wallets',
              filter: `user_id=eq.${currentUser.id}`,
            },
            (payload: any) => {
              if (isMounted && payload.new && typeof payload.new.balance === 'number') {
                setBalanceNGN(payload.new.balance);
              }
            }
          )
          .subscribe();

        // 2. Referrals Channel Setup
        const referralsChannel = supabase
          .channel(`public:referrals:referrer_id=eq.${currentUser.id}-${uniqueInstanceId}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'referrals',
              filter: `referrer_id=eq.${currentUser.id}`,
            },
            async () => {
              if (!isMounted) return;
              const { data: updatedRefs } = await supabase
                .from('referrals')
                .select('*')
                .eq('referrer_id', currentUser.id)
                .order('created_at', { ascending: false });

              if (updatedRefs && isMounted) {
                processReferrals(updatedRefs);
              }
            }
          )
          .subscribe();

        // 3. Settings Channel Setup for dynamic percentage updates
        const settingsChannel = supabase
          .channel(`public:settings:key=eq.referral_percentage-${uniqueInstanceId}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'settings',
              filter: `key=eq.referral_percentage`,
            },
            (payload: any) => {
              if (isMounted && payload.new && payload.new.value) {
                setReferralPercentage(Number(payload.new.value));
              }
            }
          )
          .subscribe();

        // 4. Notifications Channel Setup
        const notifChannel = supabase
          .channel(`public:notifications:user_id=eq.${currentUser.id}-${uniqueInstanceId}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'notifications',
              filter: `user_id=eq.${currentUser.id}`,
            },
            async () => {
              if (!isMounted) return;
              const { count: updatedUnread } = await supabase
                .from('notifications')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', currentUser.id)
                .eq('read', false);

              if (isMounted) setUnreadCount(updatedUnread || 0);
            }
          )
          .subscribe();

        channels = [walletChannel, referralsChannel, settingsChannel, notifChannel];

      } catch (err) {
        console.error('Error loading referral data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadReferralData();

    return () => {
      isMounted = false;
      channels.forEach((channel) => {
        supabase.removeChannel(channel);
      });
    };
  }, [router, referralCode]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/signin');
  };

  const copyToClipboard = (text: string, type: 'code' | 'link') => {
    navigator.clipboard.writeText(text);
    if (type === 'code') {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } else {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fdfdfc] bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] flex flex-col items-center justify-center gap-4 text-[#6b7280]">
        <div className="w-8 h-8 rounded-xl border-2 border-[#0b1e5b]/20 border-t-[#0b1e5b] animate-spin"></div>
        <div className="flex flex-col items-center gap-1">
          <span className="font-bold text-xs tracking-widest uppercase text-[#0b1e5b]">AccNumbers</span>
          <span className="text-xs font-medium">Authenticating secure session...</span>
        </div>
      </div>
    );
  }

  const displayName = user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'kelvin';

  return (
    <div className="min-h-screen bg-[#fdfdfc] bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] text-[#111111] flex flex-col justify-between selection:bg-[#0b1e5b]/15 font-sans">
      
      {/* Top Header */}
      <header className="bg-[#fdfdfc]/95 backdrop-blur-md border-b border-[#e5e7eb] px-6 py-4 flex items-center justify-between sticky top-0 z-40 shadow-xs">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2.5 rounded-2xl border border-[#e5e7eb] bg-white hover:bg-[#fdfdfc] transition text-[#0b1e5b] cursor-pointer shadow-xs flex items-center justify-center"
            aria-label="Open Menu"
          >
            <Bars3Icon className="w-5 h-5" />
          </button>
          
          <div className="flex flex-col">
            <span className="font-black text-lg tracking-tight text-[#0b1e5b] leading-tight">Acc<span className="text-[#6b7280]">Numbers</span></span>
            <span className="text-[9px] font-bold text-[#6b7280] tracking-widest uppercase">Virtual Hub</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link 
            href="/dashboard/notifications" 
            className="relative p-2.5 rounded-2xl bg-white border border-[#e5e7eb] text-[#6b7280] hover:text-[#0b1e5b] transition shadow-xs flex items-center justify-center"
            aria-label="Notifications"
          >
            <BellIcon className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
            )}
          </Link>

          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#0b1e5b] text-white font-bold text-xs shadow-md">
            <WalletIcon className="w-4 h-4 text-emerald-400" />
            <span>₦{balanceNGN.toFixed(2)}</span>
          </div>
        </div>
      </header>

      {/* Sidebar Drawer */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-[#111111]/40 backdrop-blur-xs transition-opacity" onClick={() => setIsSidebarOpen(false)}></div>
          <div className="relative w-80 bg-[#fdfdfc] border-r border-[#e5e7eb] p-6 flex flex-col justify-between shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            <div className="space-y-6">
              
              <div className="flex items-center justify-between border-b border-[#e5e7eb] pb-4">
                <div className="flex flex-col">
                  <span className="font-black text-lg tracking-tight text-[#0b1e5b] leading-tight">Acc<span className="text-[#6b7280]">Numbers</span></span>
                  <span className="text-[9px] font-bold text-[#6b7280] tracking-widest uppercase">Virtual Hub</span>
                </div>
                <button onClick={() => setIsSidebarOpen(false)} className="w-8 h-8 rounded-xl bg-[#e5e7eb]/50 flex items-center justify-center text-[#6b7280] hover:text-[#0b1e5b] transition">
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-[#0b1e5b]/5 border border-[#0b1e5b]/10 space-y-2">
                <p className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wider">Active Wallet Balance</p>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-black text-[#0b1e5b]">₦{balanceNGN.toFixed(2)}</span>
                  <Link href="/dashboard/wallet" onClick={() => setIsSidebarOpen(false)} className="px-3 py-1.5 rounded-xl bg-[#0b1e5b] hover:bg-[#0b1e5b]/90 text-white font-bold text-xs transition shadow-xs flex items-center gap-1.5">
                    Top up <ArrowRightIcon className="w-3 h-3" />
                  </Link>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wider px-2 pb-1">Account & Shortcuts</p>
                <Link href="/dashboard" onClick={() => setIsSidebarOpen(false)} className="flex items-center gap-3 px-3.5 py-3 rounded-2xl hover:bg-[#e5e7eb]/40 text-[#111111] font-medium text-xs transition">
                  <ClipboardDocumentListIcon className="w-4 h-4 text-[#6b7280]" /> Dashboard Overview
                </Link>
                <Link href="/dashboard/numbers" onClick={() => setIsSidebarOpen(false)} className="flex items-center gap-3 px-3.5 py-3 rounded-2xl hover:bg-[#e5e7eb]/40 text-[#111111] font-medium text-xs transition">
                  <MagnifyingGlassIcon className="w-4 h-4 text-[#6b7280]" /> Buy a number
                </Link>
                <Link href="/dashboard/rentals" onClick={() => setIsSidebarOpen(false)} className="flex items-center gap-3 px-3.5 py-3 rounded-2xl hover:bg-[#e5e7eb]/40 text-[#111111] font-medium text-xs transition">
                  <ClipboardDocumentListIcon className="w-4 h-4 text-[#6b7280]" /> My active rentals
                </Link>
                <Link href="/dashboard/referrals" onClick={() => setIsSidebarOpen(false)} className="flex items-center gap-3 px-3.5 py-3 rounded-2xl bg-[#0b1e5b]/10 text-[#0b1e5b] font-bold text-xs">
                  <UsersIcon className="w-4 h-4 text-[#0b1e5b]" /> Referral rewards
                </Link>
                <Link 
                  href="/dashboard/notifications" 
                  onClick={() => setIsSidebarOpen(false)} 
                  className="flex items-center justify-between px-3.5 py-3 rounded-2xl hover:bg-[#e5e7eb]/40 text-[#111111] font-medium text-xs transition"
                >
                  <div className="flex items-center gap-3">
                    <BellIcon className="w-4 h-4 text-[#6b7280]" /> Notifications
                  </div>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-red-500 text-white font-bold text-[10px]">
                      {unreadCount}
                    </span>
                  )}
                </Link>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wider px-2 pb-1">Finance & Funding</p>
                <Link href="/dashboard/transactions" onClick={() => setIsSidebarOpen(false)} className="flex items-center gap-3 px-3.5 py-3 rounded-2xl hover:bg-[#e5e7eb]/40 text-[#111111] font-medium text-xs transition">
                  <ArrowsRightLeftIcon className="w-4 h-4 text-[#6b7280]" /> Transactions & Ledger
                </Link>
                <Link href="/dashboard/wallet" onClick={() => setIsSidebarOpen(false)} className="flex items-center gap-3 px-3.5 py-3 rounded-2xl hover:bg-[#e5e7eb]/40 text-[#111111] font-medium text-xs transition">
                  <PlusIcon className="w-4 h-4 text-[#6b7280]" /> Wallet Top Up
                </Link>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wider px-2 pb-1">System & Settings</p>
                <Link href="/dashboard/api" onClick={() => setIsSidebarOpen(false)} className="flex items-center gap-3 px-3.5 py-3 rounded-2xl hover:bg-[#e5e7eb]/40 text-[#111111] font-medium text-xs transition">
                  <KeyIcon className="w-4 h-4 text-[#6b7280]" /> API Keys & Access
                </Link>
                <Link href="/dashboard/security" onClick={() => setIsSidebarOpen(false)} className="flex items-center gap-3 px-3.5 py-3 rounded-2xl hover:bg-[#e5e7eb]/40 text-[#111111] font-medium text-xs transition">
                  <ShieldCheckIcon className="w-4 h-4 text-[#6b7280]" /> Security & 2FA
                </Link>
              </div>

            </div>

            <div className="pt-4 border-t border-[#e5e7eb] space-y-3">
              <div className="flex items-center gap-3 px-2">
                <div className="w-8 h-8 rounded-xl bg-[#0b1e5b] text-white flex items-center justify-center font-bold text-xs uppercase shadow-xs">
                  {displayName.charAt(0)}
                </div>
                <div className="flex flex-col overflow-hidden">
                  <span className="text-xs font-bold text-[#0b1e5b] truncate">{displayName}</span>
                  <span className="text-[10px] text-[#6b7280] truncate">{user?.email || 'user@accnumbers.com'}</span>
                </div>
              </div>
              <button 
                onClick={handleSignOut}
                className="w-full py-3 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition text-xs font-bold text-center cursor-pointer shadow-xs flex items-center justify-center gap-2"
              >
                <ArrowRightOnRectangleIcon className="w-4 h-4" /> Sign Out Securely
              </button>
            </div>
          </div>
        </div>
      )}

              {/* Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto py-10 px-4 sm:px-6 space-y-8">
        
        <div className="space-y-1">
          <div className="text-xs font-semibold text-[#6b7280]">Account / Referrals</div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#0b1e5b] tracking-tight">
            Referral Rewards
          </h1>
        </div>

        <div className="bg-[#0b1e5b] text-white border border-[#0b1e5b] rounded-3xl p-7 sm:p-8 shadow-md space-y-4 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-64 h-full bg-gradient-to-l from-white/10 to-transparent pointer-events-none"></div>
          
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-400/20 text-emerald-300 text-xs font-bold border border-emerald-400/30">
            <SparklesIcon className="w-4 h-4" /> EARN FROM EVERY RENTAL
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Invite friends, earn {referralPercentage.toFixed(2)}%
            </h2>
            <p className="text-xs sm:text-sm font-medium text-slate-300">
              Every successful rental made by a friend you referred credits {referralPercentage.toFixed(2)}% of their spend straight to your wallet.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <div className="bg-white border border-[#e5e7eb] rounded-3xl p-6 shadow-sm space-y-3 flex flex-col justify-between">
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-[#6b7280] uppercase tracking-wider">Your Referral Code</span>
              <div className="flex items-center justify-between p-3.5 bg-[#fdfdfc] border border-[#e5e7eb] rounded-2xl">
                <span className="font-mono text-lg font-black text-[#0b1e5b] tracking-wider">{referralCode}</span>
                <button 
                  onClick={() => copyToClipboard(referralCode, 'code')}
                  className="p-2 rounded-xl bg-white border border-[#e5e7eb] hover:bg-[#e5e7eb]/40 text-[#0b1e5b] transition cursor-pointer shadow-xs flex items-center gap-1 text-xs font-bold"
                >
                  <DocumentDuplicateIcon className="w-4 h-4" />
                  {copiedCode ? 'Copied!' : ''}
                </button>
              </div>
            </div>
            <p className="text-[11px] text-[#6b7280]">Friends enter this on the signup page.</p>
          </div>

          <div className="bg-white border border-[#e5e7eb] rounded-3xl p-6 shadow-sm space-y-3 flex flex-col justify-between">
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-[#6b7280] uppercase tracking-wider">Shareable Link</span>
              <div className="flex items-center justify-between p-3.5 bg-[#fdfdfc] border border-[#e5e7eb] rounded-2xl gap-2">
                <span className="font-mono text-xs font-medium text-[#111111] truncate">{shareableLink}</span>
                <button 
                  onClick={() => copyToClipboard(shareableLink, 'link')}
                  className="p-2 rounded-xl bg-white border border-[#e5e7eb] hover:bg-[#e5e7eb]/40 text-[#0b1e5b] transition cursor-pointer shadow-xs flex items-center gap-1 text-xs font-bold shrink-0"
                >
                  <DocumentDuplicateIcon className="w-4 h-4" />
                  {copiedLink ? 'Copied!' : ''}
                </button>
              </div>
            </div>
            <p className="text-[11px] text-[#6b7280]">The code is auto-filled when they open this link.</p>
          </div>

        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="bg-white border border-[#e5e7eb] rounded-3xl p-6 shadow-sm space-y-2">
            <span className="text-[11px] font-bold text-[#6b7280] uppercase tracking-wider">Total Referees</span>
            <div className="text-3xl font-black text-[#0b1e5b] tracking-tight">{totalReferees}</div>
            <p className="text-xs font-medium text-[#6b7280]">signed up via your code</p>
          </div>

          <div className="bg-white border border-[#e5e7eb] rounded-3xl p-6 shadow-sm space-y-2">
            <span className="text-[11px] font-bold text-[#6b7280] uppercase tracking-wider">Payouts Received</span>
            <div className="text-3xl font-black text-[#0b1e5b] tracking-tight">{payoutsReceived}</div>
            <p className="text-xs font-medium text-[#6b7280]">one per referee rental</p>
          </div>

          <div className="bg-white border border-[#e5e7eb] rounded-3xl p-6 shadow-sm space-y-2">
            <span className="text-[11px] font-bold text-[#6b7280] uppercase tracking-wider">Lifetime Earned</span>
            <div className="text-3xl font-black text-[#0b1e5b] tracking-tight">₦{lifetimeEarned.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
            <p className="text-xs font-medium text-[#6b7280]">credited to your wallet</p>
          </div>

        </div>

        <div className="bg-white border border-[#e5e7eb] rounded-3xl p-7 shadow-sm space-y-4">
          <div className="space-y-1">
            <h3 className="text-base font-black text-[#0b1e5b]">Your referees</h3>
            <p className="text-xs text-[#6b7280]">Up to 20 most recent — anyone who signed up using your code.</p>
          </div>

          {refereesList.length === 0 ? (
            <div className="py-10 text-center text-xs text-[#6b7280] border border-dashed border-[#e5e7eb] rounded-2xl">
              Nobody has signed up with your code yet — share the link above to get started.
            </div>
          ) : (
            <div className="border border-[#e5e7eb] rounded-2xl overflow-hidden shadow-xs">
              <div className="grid grid-cols-3 p-3.5 bg-[#fdfdfc] border-b border-[#e5e7eb] text-[10px] font-bold text-[#6b7280] uppercase tracking-wider">
                <span>USER / EMAIL</span>
                <span>DATE JOINED</span>
                <span className="text-right">EARNED</span>
              </div>
              {refereesList.map((ref) => (
                <div key={ref.id} className="grid grid-cols-3 p-4 border-b border-[#e5e7eb] last:border-0 items-center bg-white text-xs">
                  <span className="font-bold text-[#0b1e5b] truncate">{ref.referee_email || 'Anonymous User'}</span>
                  <span className="text-[#6b7280]">{new Date(ref.created_at).toLocaleDateString()}</span>
                  <span className="text-right font-bold text-emerald-600">+₦{Number(ref.earned_amount || 0).toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

      </main>

      <footer className="bg-[#fdfdfc] border-t border-[#e5e7eb] py-6 px-4 text-center text-xs text-[#6b7280] font-medium">
        © 2026 AccNumbers. All rights reserved.
      </footer>
    </div>
  );
}