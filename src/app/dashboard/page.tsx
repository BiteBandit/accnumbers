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
  ChartBarIcon 
} from '@heroicons/react/24/solid';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [balanceNGN, setBalanceNGN] = useState<number>(0);
  const [activeRentals, setActiveRentals] = useState<number>(0);
  const [lifetimeSpend, setLifetimeSpend] = useState<number>(0);
  const [completedThisMonth, setCompletedThisMonth] = useState<number>(0);
  const [spendThisMonth, setSpendThisMonth] = useState<number>(0);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const [recentRentals, setRecentRentals] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  useEffect(() => {
    let channels: any[] = [];

    async function loadDashboardData() {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session) {
          router.push('/signin');
          return;
        }

        const currentUser = session.user;
        setUser(currentUser);

        // Helper to recalculate rental stats from raw rental items
        const processRentals = (rentalsData: any[]) => {
  const activeCount = rentalsData.filter((r: any) => r.status === 'active' || r.status === 'pending').length;
  setActiveRentals(activeCount);

  const completedCount = rentalsData.filter((r: any) => r.status === 'completed' || r.status === 'finished').length;
  setCompletedThisMonth(completedCount);
  
  const totalSpent = rentalsData.reduce((acc: number, curr: any) => {
    if (curr.status === 'completed' || curr.status === 'finished') {
      return acc + Number(curr.amount || 0);
    }
    return acc;
  }, 0);

  setLifetimeSpend(totalSpent);
  setSpendThisMonth(totalSpent);

  setRecentRentals(rentalsData.slice(0, 4).map((r: any) => {
    const statusLower = (r.status || '').toLowerCase();
    
    // Determine style theme based on status type
    let theme = {
      badgeClass: 'text-[#6b7280] bg-[#e5e7eb]/60 border-[#e5e7eb]',
      iconBg: 'bg-gray-50 text-gray-600 border-gray-100',
      isSuccess: false
    };

    if (statusLower === 'completed' || statusLower === 'finished') {
      theme = {
        badgeClass: 'text-emerald-700 bg-emerald-50 border-emerald-200',
        iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-100',
        isSuccess: true
      };
    } else if (statusLower === 'active' || statusLower === 'pending') {
      theme = {
        badgeClass: 'text-amber-700 bg-amber-50 border-amber-200',
        iconBg: 'bg-amber-50 text-amber-600 border-amber-100',
        isSuccess: false
      };
    } else if (['cancelled', 'expired', 'aspire', 'timeout', 'banned'].includes(statusLower)) {
      theme = {
        badgeClass: 'text-red-700 bg-red-50 border-red-200',
        iconBg: 'bg-red-50 text-red-600 border-red-100',
        isSuccess: false
      };
    }

    return {
      id: r.id,
      service: r.service,
      country: r.country,
      number: r.phone_number,
      code: r.sms_code,
      status: r.status,
      theme,
      amount: `₦${Number(r.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
      date: new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    };
  }));
};


        // 1. Fetch user wallet balance from the database 'wallets' table
        const { data: walletData, error: walletError } = await supabase
          .from('wallets')
          .select('balance')
          .eq('user_id', currentUser.id)
          .single();

        if (!walletError && walletData) {
          setBalanceNGN(walletData.balance ?? 0);
        }

        // Fetch unread notifications count
        const { count: unread, error: unreadError } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', currentUser.id)
          .eq('read', false);

        if (!unreadError) {
          setUnreadCount(unread || 0);
        }

        // 2. Fetch user rentals directly from the database 'rentals' table
        const { data: rentalsData, error: rentalsError } = await supabase
          .from('rentals')
          .select('*')
          .eq('user_id', currentUser.id)
          .order('created_at', { ascending: false });

        if (!rentalsError && rentalsData) {
          processRentals(rentalsData);
        }

        // 3. Fetch transactions ledger from the database and handle 'credit'/'refund' vs 'debit'
        const { data: txData, error: txError } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', currentUser.id)
          .order('created_at', { ascending: false })
          .limit(3);

        if (!txError && txData) {
          setRecentActivity(txData.map((tx: any) => {
            const txType = tx.type?.toLowerCase() || 'credit';
            const txStatus = tx.status?.toLowerCase() || (txType === 'pending' ? 'pending' : 'success');
            
            const isPending = txStatus === 'pending' || txType === 'pending';
            const isFailed = txStatus === 'failed';
            const isCredit = txType === 'credit';
            const isRefund = txType === 'refund';
            const isReward = txType === 'reward';

            // Correct sign determination: positive for credits, refunds, rewards; negative for debits
            const amountPrefix = isPending || isFailed ? '' : (isCredit || isRefund || isReward ? '+' : '-');

            return {
              id: tx.id,
              text: tx.description || `${tx.type} transaction`,
              sub: `ref:${tx.reference || tx.id.slice(0, 6)}`,
              amount: `${amountPrefix}₦${Number(tx.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
              balance: tx.balance_after ? `₦${Number(tx.balance_after).toLocaleString(undefined, { minimumFractionDigits: 2 })}` : null,
              status: txStatus,
              isSuccess: txStatus === 'success' && (isCredit || isRefund || isReward),
              isCredit: isCredit || isRefund || isReward,
              isPending,
              isFailed
            };
          }));
        }

        // --- REALTIME SUBSCRIPTIONS SETUP ---
        
        // Wallet Realtime Channel
        const walletChannel = supabase
          .channel(`wallets-channel-${currentUser.id}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'wallets',
              filter: `user_id=eq.${currentUser.id}`,
            },
            (payload: any) => {
              if (payload.new && typeof payload.new.balance === 'number') {
                setBalanceNGN(payload.new.balance);
              }
            }
          )
          .subscribe();

        // Rentals Realtime Channel
        const rentalsChannel = supabase
          .channel(`rentals-channel-${currentUser.id}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'rentals',
              filter: `user_id=eq.${currentUser.id}`,
            },
            async () => {
              const { data: updatedRentals } = await supabase
                .from('rentals')
                .select('*')
                .eq('user_id', currentUser.id)
                .order('created_at', { ascending: false });

              if (updatedRentals) {
                processRentals(updatedRentals);
              }
            }
          )
          .subscribe();

        // Notifications Realtime Channel
        const notifChannel = supabase
          .channel(`notifications-channel-${currentUser.id}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'notifications',
              filter: `user_id=eq.${currentUser.id}`,
            },
            async () => {
              const { count: updatedUnread } = await supabase
                .from('notifications')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', currentUser.id)
                .eq('read', false);

              setUnreadCount(updatedUnread || 0);
            }
          )
          .subscribe();

        // Transactions Realtime Channel
        const txChannel = supabase
          .channel(`transactions-channel-${currentUser.id}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'transactions',
              filter: `user_id=eq.${currentUser.id}`,
            },
            async () => {
              const { data: updatedTx } = await supabase
                .from('transactions')
                .select('*')
                .eq('user_id', currentUser.id)
                .order('created_at', { ascending: false })
                .limit(3);

              if (updatedTx) {
                setRecentActivity(updatedTx.map((tx: any) => {
                  const txType = tx.type?.toLowerCase() || 'credit';
                  const txStatus = tx.status?.toLowerCase() || (txType === 'pending' ? 'pending' : 'success');
                  
                  const isPending = txStatus === 'pending' || txType === 'pending';
                  const isFailed = txStatus === 'failed';
                  const isCredit = txType === 'credit';
                  const isRefund = txType === 'refund';
                  const isReward = txType === 'reward';

                  const amountPrefix = isPending || isFailed ? '' : (isCredit || isRefund || isReward ? '+' : '-');

                  return {
                    id: tx.id,
                    text: tx.description || `${tx.type} transaction`,
                    sub: `ref:${tx.reference || tx.id.slice(0, 6)}`,
                    amount: `${amountPrefix}₦${Number(tx.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
                    balance: tx.balance_after ? `₦${Number(tx.balance_after).toLocaleString(undefined, { minimumFractionDigits: 2 })}` : null,
                    status: txStatus,
                    isSuccess: txStatus === 'success' && (isCredit || isRefund || isReward),
                    isCredit: isCredit || isRefund || isReward,
                    isPending,
                    isFailed
                  };
                }));
              }
            }
          )
          .subscribe();

        channels = [walletChannel, rentalsChannel, notifChannel, txChannel];

      } catch (err) {
        console.error('Error loading dashboard data from database:', err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();

    return () => {
      channels.forEach((channel) => {
        supabase.removeChannel(channel);
      });
    };
  }, [router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/signin');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fdfdfc] bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] flex flex-col items-center justify-center gap-4 text-[#6b7280]">
        <div className="w-8 h-8 rounded-xl border-2 border-[#0b1e5b]/20 border-t-[#0b1e5b] animate-spin"></div>
        <div className="flex flex-col items-center gap-1">
          <span className="font-bold text-xs tracking-widest uppercase text-[#0b1e5b]">AccNumbers</span>
          <span className="text-xs font-medium">Loading Dashboard...</span>
        </div>
      </div>
    );
  }

  const displayName = user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'kelvin';

  const currentHour = new Date().getHours();
  let timeGreeting = 'Good evening';
  if (currentHour < 12) {
    timeGreeting = 'Good morning';
  } else if (currentHour < 18) {
    timeGreeting = 'Good afternoon';
  }

  return (
    <div className="min-h-screen bg-[#fdfdfc] bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] text-[#111111] flex flex-col justify-between selection:bg-[#0b1e5b]/15 font-sans">
      
      {/* Top Header with Full Logo */}
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
          {/* Notification Bell with Badge */}
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
              
              {/* Sidebar Header with Full Logo */}
              <div className="flex items-center justify-between border-b border-[#e5e7eb] pb-4">
                <div className="relative w-32 h-14 flex items-center overflow-hidden">
                  <Image 
                    src="/logo.png" 
                    alt="AccNumbers Logo" 
                    fill 
                    className="object-contain object-left"
                  />
                </div>
                <button onClick={() => setIsSidebarOpen(false)} className="w-8 h-8 rounded-xl bg-[#e5e7eb]/50 flex items-center justify-center text-[#6b7280] hover:text-[#0b1e5b] transition">
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              {/* Wallet Summary Widget inside Sidebar */}
              <div className="p-4 rounded-2xl bg-[#0b1e5b]/5 border border-[#0b1e5b]/10 space-y-2">
                <p className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wider">Active Wallet Balance</p>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-black text-[#0b1e5b]">₦{balanceNGN.toFixed(2)}</span>
                  <Link href="/dashboard/wallet" onClick={() => setIsSidebarOpen(false)} className="px-3 py-1.5 rounded-xl bg-[#0b1e5b] hover:bg-[#0b1e5b]/90 text-white font-bold text-xs transition shadow-xs flex items-center gap-1.5">
                    Top up <ArrowRightIcon className="w-3 h-3" />
                  </Link>
                </div>
              </div>

              {/* Account Links */}
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wider px-2 pb-1">Account & Shortcuts</p>
                <Link href="/dashboard" onClick={() => setIsSidebarOpen(false)} className="flex items-center gap-3 px-3.5 py-3 rounded-2xl bg-[#0b1e5b]/10 text-[#0b1e5b] font-bold text-xs">
                  <ClipboardDocumentListIcon className="w-4 h-4 text-[#0b1e5b]" /> Dashboard Overview
                </Link>
                <Link href="/dashboard/numbers" onClick={() => setIsSidebarOpen(false)} className="flex items-center gap-3 px-3.5 py-3 rounded-2xl hover:bg-[#e5e7eb]/40 text-[#111111] font-medium text-xs transition">
                  <MagnifyingGlassIcon className="w-4 h-4 text-[#6b7280]" /> Buy a number
                </Link>
                <Link href="/dashboard/rentals" onClick={() => setIsSidebarOpen(false)} className="flex items-center gap-3 px-3.5 py-3 rounded-2xl hover:bg-[#e5e7eb]/40 text-[#111111] font-medium text-xs transition">
                  <ClipboardDocumentListIcon className="w-4 h-4 text-[#6b7280]" /> My active rentals
                </Link>
                <Link href="/dashboard/referrals" onClick={() => setIsSidebarOpen(false)} className="flex items-center gap-3 px-3.5 py-3 rounded-2xl hover:bg-[#e5e7eb]/40 text-[#111111] font-medium text-xs transition">
                  <UsersIcon className="w-4 h-4 text-[#6b7280]" /> Referral rewards
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

              {/* Finance Section */}
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wider px-2 pb-1">Finance & Funding</p>
                <Link href="/dashboard/transactions" onClick={() => setIsSidebarOpen(false)} className="flex items-center gap-3 px-3.5 py-3 rounded-2xl hover:bg-[#e5e7eb]/40 text-[#111111] font-medium text-xs transition">
                  <ArrowsRightLeftIcon className="w-4 h-4 text-[#6b7280]" /> Transactions & Ledger
                </Link>
                <Link href="/dashboard/wallet" onClick={() => setIsSidebarOpen(false)} className="flex items-center gap-3 px-3.5 py-3 rounded-2xl hover:bg-[#e5e7eb]/40 text-[#111111] font-medium text-xs transition">
                  <PlusIcon className="w-4 h-4 text-[#6b7280]" /> Wallet Top Up
                </Link>
              </div>

              {/* Developer & Security */}
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

      {/* Main Clean Dashboard Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto py-10 px-4 sm:px-6 space-y-8">
        
        {/* Elite Greeting Banner */}
        <div className="bg-white border border-[#e5e7eb] rounded-3xl p-8 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-64 h-full bg-gradient-to-l from-[#0b1e5b]/5 to-transparent pointer-events-none"></div>
          <div className="space-y-1.5 z-10">
            <span className="px-3 py-1 rounded-full bg-[#0b1e5b]/5 text-[#0b1e5b] text-[10px] font-bold uppercase tracking-wider">Operator Portal</span>
            <h1 className="text-2xl sm:text-3xl font-black text-[#0b1e5b] tracking-tight capitalize">
              {timeGreeting}, {displayName}
            </h1>
            <p className="text-xs sm:text-sm font-medium text-[#6b7280]">
              Wrapping up the day? We've got you covered with live verification pipelines.
            </p>
          </div>
          <div className="flex items-center gap-3 z-10">
            <Link 
              href="/dashboard/numbers"
              className="py-3.5 px-6 rounded-2xl bg-[#0b1e5b] text-white font-bold text-xs sm:text-sm hover:bg-[#0b1e5b]/90 transition shadow-md hover:shadow-lg flex items-center gap-2"
            >
              <span>Get New Number</span> <ArrowRightIcon className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Financial Metrics Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Wallet Balance Card */}
          <div className="bg-white border border-[#e5e7eb] rounded-3xl p-6 shadow-sm space-y-4 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#6b7280] uppercase tracking-wider">Wallet Balance</span>
                <span className="w-8 h-8 rounded-xl bg-[#0b1e5b]/5 flex items-center justify-center text-[#0b1e5b]">
                  <WalletIcon className="w-4 h-4" />
                </span>
              </div>
              <h2 className="text-3xl font-black text-[#0b1e5b] tracking-tight">₦{balanceNGN.toFixed(2)}</h2>
              <p className="text-xs font-medium text-[#6b7280]">Available liquidity for instant routing.</p>
            </div>
            <div className="pt-4 border-t border-[#e5e7eb] flex items-center justify-between">
              <Link href="/dashboard/wallet" className="text-xs font-bold text-[#0b1e5b] hover:underline flex items-center gap-1">Top up funds <ArrowRightIcon className="w-3 h-3" /></Link>
              <Link href="/dashboard/transactions" className="text-xs font-medium text-[#6b7280] hover:text-[#0b1e5b]">Ledger</Link>
            </div>
          </div>

          {/* Active Rentals Card */}
          <div className="bg-white border border-[#e5e7eb] rounded-3xl p-6 shadow-sm space-y-4 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#6b7280] uppercase tracking-wider">Active Rentals</span>
                <span className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <ClipboardDocumentListIcon className="w-4 h-4" />
                </span>
              </div>
              <h2 className="text-3xl font-black text-[#0b1e5b] tracking-tight">{activeRentals}</h2>
              <p className="text-xs font-medium text-[#6b7280]">Active SMS lease connections.</p>
            </div>
            <div className="pt-4 border-t border-[#e5e7eb] flex items-center justify-between">
              <Link href="/dashboard/numbers" className="text-xs font-bold text-[#0b1e5b] hover:underline flex items-center gap-1">Rent a number <ArrowRightIcon className="w-3 h-3" /></Link>
              <Link href="/dashboard/rentals" className="text-xs font-medium text-[#6b7280] hover:text-[#0b1e5b]">View all</Link>
            </div>
          </div>

          {/* Lifetime Spend Card */}
          <div className="bg-white border border-[#e5e7eb] rounded-3xl p-6 shadow-sm space-y-4 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#6b7280] uppercase tracking-wider">Lifetime Spend</span>
                <span className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                  <ChartBarIcon className="w-4 h-4" />
                </span>
              </div>
              <h2 className="text-3xl font-black text-[#0b1e5b] tracking-tight">₦{lifetimeSpend.toLocaleString()}</h2>
              <p className="text-xs font-medium text-[#6b7280]">{completedThisMonth} completed • ₦{spendThisMonth.toLocaleString()} this month</p>
            </div>
            <div className="pt-4 border-t border-[#e5e7eb] flex items-center justify-between">
              <Link href="/dashboard/transactions" className="text-xs font-bold text-[#0b1e5b] hover:underline flex items-center gap-1">Audit history <ArrowRightIcon className="w-3 h-3" /></Link>
            </div>
          </div>

        </div>

        {/* Recent Rentals Section */}
        <div className="bg-white border border-[#e5e7eb] rounded-3xl p-7 shadow-sm space-y-4">
  <div className="flex items-center justify-between">
    <h3 className="text-sm font-black text-[#0b1e5b]">Recent rentals</h3>
    <Link href="/dashboard/rentals" className="text-xs font-bold text-[#6b7280] hover:text-[#0b1e5b]">See all →</Link>
  </div>

  {recentRentals.length === 0 ? (
    <div className="py-8 text-center text-xs text-[#6b7280] border border-dashed border-[#e5e7eb] rounded-2xl">
      No recent rentals found in database.
    </div>
  ) : (
    <div className="space-y-3">
      {recentRentals.map((item) => (
        <div key={item.id} className="bg-[#fdfdfc] border border-[#e5e7eb] rounded-2xl p-4 flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs border ${item.theme.iconBg}`}>
              {item.theme.isSuccess ? (
                <CheckCircleIcon className="w-5 h-5" />
              ) : (
                <XCircleIcon className="w-5 h-5" />
              )}
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#0b1e5b]">{item.service}</span>
                <span className="text-[10px] text-[#6b7280] font-medium">{item.country}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-[#111111]">
                <span>{item.number}</span>
                {item.code && <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200">{item.code}</span>}
              </div>
            </div>
          </div>

          <div className="text-right space-y-0.5">
            <div className="text-xs font-bold text-[#0b1e5b]">{item.amount}</div>
            <div className="flex items-center justify-end gap-1.5">
              <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full border capitalize ${item.theme.badgeClass}`}>
                {item.theme.isSuccess ? <CheckCircleIcon className="w-3 h-3" /> : <XCircleIcon className="w-3 h-3" />}
                {item.status}
              </span>
            </div>
            <div className="text-[10px] text-[#6b7280]">{item.date}</div>
          </div>
        </div>
      ))}
    </div>
  )}
</div>



        {/* Recent Activity Section with color-coded amount status */}
        <div className="bg-white border border-[#e5e7eb] rounded-3xl p-7 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-[#0b1e5b]">Recent activity ledger</h3>
            <Link href="/dashboard/transactions" className="text-xs font-bold text-[#6b7280] hover:text-[#0b1e5b]">See all →</Link>
          </div>

          {recentActivity.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#6b7280] border border-dashed border-[#e5e7eb] rounded-2xl">
              No recent transactions recorded.
            </div>
          ) : (
            <div className="border border-[#e5e7eb] rounded-2xl overflow-hidden shadow-xs">
              <div className="grid grid-cols-2 p-3.5 bg-[#fdfdfc] border-b border-[#e5e7eb] text-[10px] font-bold text-[#6b7280] uppercase tracking-wider">
                <span>DESCRIPTION</span>
                <span className="text-right">AMOUNT / BALANCE</span>
              </div>
              {recentActivity.map((act) => (
                <div key={act.id} className="grid grid-cols-2 p-4 border-b border-[#e5e7eb] last:border-0 items-center bg-white">
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-[#0b1e5b]">{act.text}</div>
                    <div className="text-[10px] text-[#6b7280]">{act.sub}</div>
                  </div>
                  <div className="text-right space-y-0.5">
                    <div className={`text-xs font-bold ${
                      act.isPending 
                        ? 'text-amber-500' 
                        : act.isFailed 
                        ? 'text-red-500' 
                        : act.isCredit 
                        ? 'text-emerald-600' 
                        : 'text-red-600'
                    }`}>
                      {act.amount}
                    </div>
                    {act.balance && <div className="text-[10px] text-[#6b7280] font-mono">{act.balance}</div>}
                  </div>
                </div>
              ))}
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