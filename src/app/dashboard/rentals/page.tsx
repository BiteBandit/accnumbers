'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
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
  ClockIcon,
  DocumentDuplicateIcon,
  CheckIcon,
  EyeIcon
} from '@heroicons/react/24/solid';

export default function RentalsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [balanceNGN, setBalanceNGN] = useState<number>(0);
  const [rentals, setRentals] = useState<any[]>([]);
  const [filterTab, setFilterTab] = useState<'all' | 'pending' | 'received' | 'completed' | 'cancelled'>('all');
  
  // Track unread notifications count using `read` boolean column from your table
  const [unreadCount, setUnreadCount] = useState<number>(0);

  // Track copy feedback for specific text/codes
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

    useEffect(() => {
    let rentalsChannel: any = null;
    let walletChannel: any = null;
    let notificationsChannel: any = null;

    async function initializeDashboard() {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session) {
          router.push('/signin');
          return;
        }

        const currentUser = session.user;
        setUser(currentUser);

        // Fetch user wallet balance
        const { data: walletData } = await supabase
          .from('wallets')
          .select('balance')
          .eq('user_id', currentUser.id)
          .single();

        if (walletData) {
          setBalanceNGN(walletData.balance ?? 0);
        }

        // Fetch initial unread notifications count using `read: false`
        const { count: notifCount } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', currentUser.id)
          .eq('read', false);

        if (notifCount !== null) {
          setUnreadCount(notifCount);
        }

        // Fetch initial rentals data
        const { data: rentalsData, error: rentalsError } = await supabase
          .from('rentals')
          .select('*')
          .eq('user_id', currentUser.id)
          .order('created_at', { ascending: false });

        if (!rentalsError && rentalsData) {
          setRentals(rentalsData);
        }

        // Setup Supabase Realtime Subscription for rentals
        rentalsChannel = supabase
          .channel(`public:rentals:${currentUser.id}-${Date.now()}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'rentals',
              filter: `user_id=eq.${currentUser.id}`,
            },
            (payload) => {
              if (payload.eventType === 'INSERT') {
                setRentals((prev) => [payload.new, ...prev]);
              } else if (payload.eventType === 'UPDATE') {
                setRentals((prev) =>
                  prev.map((item) => (item.id === payload.new.id ? payload.new : item))
                );
              } else if (payload.eventType === 'DELETE') {
                setRentals((prev) => prev.filter((item) => item.id !== payload.old.id));
              }
            }
          )
          .subscribe();

        // Setup Wallet Realtime Subscription
        walletChannel = supabase
          .channel(`public:wallets:${currentUser.id}-${Date.now()}`)
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'wallets',
              filter: `user_id=eq.${currentUser.id}`,
            },
            (payload) => {
              if (payload.new && typeof payload.new.balance === 'number') {
                setBalanceNGN(payload.new.balance);
              }
            }
          )
          .subscribe();

        // Setup Notifications Realtime Subscription to update unread badge counts live
        notificationsChannel = supabase
          .channel(`public:notifications:${currentUser.id}-${Date.now()}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'notifications',
              filter: `user_id=eq.${currentUser.id}`,
            },
            async () => {
              const { count } = await supabase
                .from('notifications')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', currentUser.id)
                .eq('read', false);
              
              if (count !== null) {
                setUnreadCount(count);
              }
            }
          )
          .subscribe();

      } catch (err) {
        console.error('Error initializing dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }

    initializeDashboard();

    return () => {
      if (rentalsChannel) supabase.removeChannel(rentalsChannel);
      if (walletChannel) supabase.removeChannel(walletChannel);
      if (notificationsChannel) supabase.removeChannel(notificationsChannel);
    };
  }, [router]);



  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/signin');
  };

  const handleCopyCode = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    setTimeout(() => {
      setCopiedCode(null);
    }, 2000);
  };

  // Guaranteed direct Wikimedia / Brand CDN URLs for logos
  const getServiceLogoUrl = (serviceName: string) => {
    if (!serviceName) return '';
    const name = serviceName.toLowerCase().trim();
    
    const logos: Record<string, string> = {
      whatsapp: 'https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg',
      telegram: 'https://upload.wikimedia.org/wikipedia/commons/8/82/Telegram_logo.svg',
      facebook: 'https://upload.wikimedia.org/wikipedia/commons/b/b8/2021_Facebook_icon.svg',
      instagram: 'https://upload.wikimedia.org/wikipedia/commons/e/e7/Instagram_logo_2016.svg',
      twitter: 'https://upload.wikimedia.org/wikipedia/commons/6/6f/Logo_of_Twitter.svg',
      google: 'https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg',
      netflix: 'https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg',
      tinder: 'https://upload.wikimedia.org/wikipedia/commons/c/c5/Tinder_logo_2017.svg',
      apple: 'https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg',
      microsoft: 'https://upload.wikimedia.org/wikipedia/commons/9/96/Microsoft_logo_%282012%29.svg',
    };

    return logos[name] || `https://www.google.com/s2/favicons?domain=${name}.com&sz=128`;
  };

  // Helper function to extract codes or display SMS text cleanly across all 5sim statuses
  const extractDisplayCodeOrSms = (item: any) => {
    if (item.sms_code) return item.sms_code;
    if (Array.isArray(item.sms) && item.sms.length > 0) {
      const latest = item.sms[item.sms.length - 1];
      return latest?.code || latest?.text || JSON.stringify(latest);
    }
    return null;
  };

  // Normalize status checking for all possible uppercase/lowercase variants from 5sim/backend
  const isStatusPending = (status: string) => {
    const s = (status || '').toUpperCase();
    return s === 'PENDING' || s === 'CREATED';
  };

  const isStatusCompleted = (status: string) => {
    const s = (status || '').toUpperCase();
    return s === 'FINISHED' || s === 'COMPLETED';
  };

  const isStatusCancelledOrExpired = (status: string) => {
    const s = (status || '').toUpperCase();
    return ['CANCELED', 'CANCELLED', 'EXPIRED', 'BANNED', 'TIMEOUT'].includes(s);
  };

  // Filter computations incorporating full status support
  const counts = {
    all: rentals.length,
    pending: rentals.filter(r => isStatusPending(r.status) && !extractDisplayCodeOrSms(r)).length,
    received: rentals.filter(r => {
      const codeOrSms = extractDisplayCodeOrSms(r);
      return codeOrSms && !isStatusCancelledOrExpired(r.status);
    }).length,
    completed: rentals.filter(r => isStatusCompleted(r.status)).length,
    cancelled: rentals.filter(r => isStatusCancelledOrExpired(r.status)).length,
  };

  const filteredRentals = rentals.filter(r => {
    const codeOrSms = extractDisplayCodeOrSms(r);
    if (filterTab === 'all') return true;
    if (filterTab === 'pending') return isStatusPending(r.status) && !codeOrSms;
    if (filterTab === 'received') return codeOrSms && !isStatusCancelledOrExpired(r.status);
    if (filterTab === 'completed') return isStatusCompleted(r.status);
    if (filterTab === 'cancelled') return isStatusCancelledOrExpired(r.status);
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fdfdfc] bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] flex flex-col items-center justify-center gap-4 text-[#6b7280]">
        <div className="w-8 h-8 rounded-xl border-2 border-[#0b1e5b]/20 border-t-[#0b1e5b] animate-spin"></div>
        <div className="flex flex-col items-center gap-1">
          <span className="font-bold text-xs tracking-widest uppercase text-[#0b1e5b]">AccNumbers</span>
          <span className="text-xs font-medium">Loading live rentals...</span>
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
          {/* Header Notification Icon Button with Simple Red Indicator Dot */}
          <Link 
            href="/dashboard/notifications"
            className="relative p-2.5 rounded-2xl border border-[#e5e7eb] bg-white hover:bg-[#fdfdfc] transition text-[#0b1e5b] shadow-xs flex items-center justify-center"
            aria-label="Notifications"
          >
            <BellIcon className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white"></span>
            )}
          </Link>

          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#0b1e5b] text-white font-bold text-xs shadow-md">
            <WalletIcon className="w-4 h-4 text-emerald-400" />
            <span>₦{balanceNGN.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
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
                  <span className="text-lg font-black text-[#0b1e5b]">₦{balanceNGN.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
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
                <Link href="/dashboard/rentals" onClick={() => setIsSidebarOpen(false)} className="flex items-center gap-3 px-3.5 py-3 rounded-2xl bg-[#0b1e5b]/10 text-[#0b1e5b] font-bold text-xs">
                  <ClipboardDocumentListIcon className="w-4 h-4 text-[#0b1e5b]" /> My active rentals
                </Link>
                <Link href="/dashboard/referrals" onClick={() => setIsSidebarOpen(false)} className="flex items-center gap-3 px-3.5 py-3 rounded-2xl hover:bg-[#e5e7eb]/40 text-[#111111] font-medium text-xs transition">
                  <UsersIcon className="w-4 h-4 text-[#6b7280]" /> Referral rewards
                </Link>
                
                {/* Sidebar Notification Link with Number Badge */}
<Link href="/dashboard/notifications" onClick={() => setIsSidebarOpen(false)} className="flex items-center justify-between px-3.5 py-3 rounded-2xl hover:bg-[#e5e7eb]/40 text-[#111111] font-medium text-xs transition">
  <div className="flex items-center gap-3">
    <BellIcon className="w-4 h-4 text-[#6b7280]" /> Notifications
  </div>
  {unreadCount > 0 && (
    <span className="px-2 py-0.5 bg-red-500 text-white rounded-full font-bold text-[10px]">
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
      <main className="flex-1 max-w-5xl w-full mx-auto py-10 px-4 sm:px-6 space-y-8">
        
        {/* Header Title Section & Action Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-xs font-semibold text-[#6b7280]">Account / Rentals</div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#0b1e5b] tracking-tight">
              Rentals
            </h1>
            <p className="text-xs sm:text-sm font-medium text-[#6b7280]">
              Real-time SMS verification hub. Incoming codes appear instantly.
            </p>
          </div>

          <Link 
            href="/dashboard/numbers"
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-[#0b1e5b] hover:bg-[#0b1e5b]/90 text-white font-bold text-xs shadow-md transition cursor-pointer"
          >
            <PlusIcon className="w-4 h-4" /> Rent a number
          </Link>
        </div>

          {/* Filter Tabs Header */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-[#e5e7eb]">
          <button 
            onClick={() => setFilterTab('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${filterTab === 'all' ? 'bg-[#0b1e5b] text-white shadow-xs' : 'bg-white border border-[#e5e7eb] text-[#6b7280] hover:bg-[#e5e7eb]/40'}`}
          >
            All <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${filterTab === 'all' ? 'bg-white/20 text-white' : 'bg-[#e5e7eb]/60 text-[#111111]'}`}>{counts.all}</span>
          </button>
          
          <button 
            onClick={() => setFilterTab('pending')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${filterTab === 'pending' ? 'bg-[#0b1e5b] text-white shadow-xs' : 'bg-white border border-[#e5e7eb] text-[#6b7280] hover:bg-[#e5e7eb]/40'}`}
          >
            Pending <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${filterTab === 'pending' ? 'bg-white/20 text-white' : 'bg-[#e5e7eb]/60 text-[#111111]'}`}>{counts.pending}</span>
          </button>

          <button 
            onClick={() => setFilterTab('received')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${filterTab === 'received' ? 'bg-[#0b1e5b] text-white shadow-xs' : 'bg-white border border-[#e5e7eb] text-[#6b7280] hover:bg-[#e5e7eb]/40'}`}
          >
            Received <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${filterTab === 'received' ? 'bg-white/20 text-white' : 'bg-[#e5e7eb]/60 text-[#111111]'}`}>{counts.received}</span>
          </button>

          <button 
            onClick={() => setFilterTab('completed')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${filterTab === 'completed' ? 'bg-[#0b1e5b] text-white shadow-xs' : 'bg-white border border-[#e5e7eb] text-[#6b7280] hover:bg-[#e5e7eb]/40'}`}
          >
            Completed <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${filterTab === 'completed' ? 'bg-white/20 text-white' : 'bg-[#e5e7eb]/60 text-[#111111]'}`}>{counts.completed}</span>
          </button>

          <button 
            onClick={() => setFilterTab('cancelled')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${filterTab === 'cancelled' ? 'bg-[#0b1e5b] text-white shadow-xs' : 'bg-white border border-[#e5e7eb] text-[#6b7280] hover:bg-[#e5e7eb]/40'}`}
          >
            Cancelled/Expired <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${filterTab === 'cancelled' ? 'bg-white/20 text-white' : 'bg-[#e5e7eb]/60 text-[#111111]'}`}>{counts.cancelled}</span>
          </button>
        </div>

        {/* Rentals Table Container */}
        <div className="bg-white border border-[#e5e7eb] rounded-3xl shadow-sm overflow-hidden">
          
          {filteredRentals.length === 0 ? (
            <div className="py-16 text-center text-xs text-[#6b7280] space-y-3">
              <p>No rentals found under this category.</p>
              <Link href="/dashboard/numbers" className="inline-block text-[#0b1e5b] font-bold underline">
                Rent a virtual number now
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#fdfdfc] border-b border-[#e5e7eb] text-[10px] font-bold text-[#6b7280] uppercase tracking-wider">
                    <th className="py-4 px-6">When</th>
                    <th className="py-4 px-6">Service / Country</th>
                    <th className="py-4 px-6">Number</th>
                    <th className="py-4 px-6">Code</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6 text-right">Price</th>
                    <th className="py-4 px-6 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e5e7eb] text-xs">
                  {filteredRentals.map((item) => {
                    const dateFormatted = new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ', ' + new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    const displayCode = extractDisplayCodeOrSms(item);
                    const statusStr = (item.status || '').toUpperCase();

                    return (
                      <tr key={item.id} className="hover:bg-[#fdfdfc]/80 transition">
                        <td className="py-4 px-6 text-[#6b7280] whitespace-nowrap">{dateFormatted}</td>
                        <td className="py-4 px-6 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-2xl bg-slate-100 border border-[#e5e7eb] overflow-hidden flex items-center justify-center shrink-0 shadow-xs p-1.5">
                              <img 
                                src={getServiceLogoUrl(item.service)} 
                                alt={item.service} 
                                className="w-full h-full object-contain"
                                onError={(e) => {
                                  const parent = (e.target as HTMLElement).parentElement;
                                  if (parent) {
                                    parent.innerHTML = `<span class="font-black text-xs text-[#0b1e5b]">${item.service ? item.service.charAt(0).toUpperCase() : 'S'}</span>`;
                                  }
                                }}
                              />
                            </div>
                            <div className="flex flex-col">
                              <span className="font-bold text-[#0b1e5b] text-xs">{item.service}</span>
                              <span className="text-[10px] font-medium text-[#6b7280] uppercase tracking-wide">{item.country}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap">
                          <button
                            onClick={() => handleCopyCode(item.phone_number)}
                            className="group flex items-center gap-2 text-left cursor-pointer"
                            title="Click to copy phone number"
                          >
                            <span className="font-mono font-bold text-[#111111] group-hover:text-[#0b1e5b] transition">
                              {item.phone_number}
                            </span>
                            {copiedCode === item.phone_number ? (
                              <CheckIcon className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <DocumentDuplicateIcon className="w-3.5 h-3.5 text-gray-400 opacity-0 group-hover:opacity-100 transition" />
                            )}
                          </button>
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap">
                          {displayCode ? (
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                                {displayCode}
                              </span>
                              <button
                                onClick={() => handleCopyCode(displayCode)}
                                className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition cursor-pointer"
                                title="Copy code"
                              >
                                {copiedCode === displayCode ? <CheckIcon className="w-3.5 h-3.5 text-emerald-600" /> : <DocumentDuplicateIcon className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          ) : isStatusPending(item.status) ? (
                            <div className="flex items-center gap-1.5 text-[#6b7280] italic">
                              <span className="flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-400 italic">No code</span>
                          )}
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap">
                          {isStatusCompleted(item.status) ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px]">
                              <CheckCircleIcon className="w-3 h-3" /> Completed
                            </span>
                          ) : statusStr === 'CANCELED' || statusStr === 'CANCELLED' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 font-bold text-[10px]">
                              <XCircleIcon className="w-3 h-3" /> Cancelled
                            </span>
                          ) : statusStr === 'EXPIRED' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-50 text-red-600 font-bold text-[10px]">
                              <ClockIcon className="w-3 h-3" /> Expired
                            </span>
                          ) : statusStr === 'BANNED' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 text-rose-600 font-bold text-[10px]">
                              <XCircleIcon className="w-3 h-3" /> Banned
                            </span>
                          ) : statusStr === 'TIMEOUT' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 font-bold text-[10px]">
                              <ClockIcon className="w-3 h-3" /> Timeout
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 font-bold text-[10px]">
                              <ClockIcon className="w-3 h-3" /> Pending
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-right font-bold text-[#0b1e5b] whitespace-nowrap">
                          ₦{Number(item.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-4 px-6 text-center whitespace-nowrap">
                          <Link 
                            href={`/dashboard/rentals/${item.idx || item.id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white border border-[#e5e7eb] hover:bg-[#0b1e5b] hover:text-white text-[#0b1e5b] font-bold text-xs transition shadow-xs"
                          >
                            <EyeIcon className="w-3.5 h-3.5" /> View
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
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