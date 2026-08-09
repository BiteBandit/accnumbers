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
  ArrowDownLeftIcon,
  ArrowUpRightIcon,
  ArrowPathRoundedSquareIcon,
  GiftIcon,
  ClockIcon
} from '@heroicons/react/24/solid';

interface TransactionItem {
  idx: number;
  id: string;
  user_id: string;
  description: string;
  reference: string;
  type: string; // 'credit', 'debit', 'refund', 'reward', or 'pending'
  status?: string; // 'success', 'pending', or 'failed'
  amount: string; 
  balance_after: string;
  created_at: string;
}

export default function TransactionsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [balanceNGN, setBalanceNGN] = useState<number>(0);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    let isMounted = true;
    let channel: any = null;

    async function loadUserDataAndTransactions() {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session) {
          router.push('/signin');
          return;
        }

        const currentUser = session.user;
        if (!isMounted) return;
        setUser(currentUser);

        // 1. Fetch user wallet balance
        const { data: walletData, error: walletError } = await supabase
          .from('wallets')
          .select('balance')
          .eq('user_id', currentUser.id)
          .single();

        if (!walletError && walletData && isMounted) {
          setBalanceNGN(walletData.balance ?? 0);
        }

        // 2. Fetch unread notification count
        const { count: notifCount } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', currentUser.id)
          .eq('read', false);

        if (isMounted) {
          setUnreadCount(notifCount || 0);
        }

        // 3. Fetch initial transactions
        const { data: txData, error: txError } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', currentUser.id)
          .order('created_at', { ascending: false });

        if (!txError && txData && isMounted) {
          setTransactions(txData);
        } else if (isMounted) {
          setTransactions([]);
        }

        // 4. Setup Supabase Realtime Subscriptions
        channel = supabase
          .channel(`realtime-dashboard-${currentUser.id}`)
          
          // Listen to Wallet balance updates
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
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

          // Listen to new Transactions or status updates (INSERT or UPDATE)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'transactions',
              filter: `user_id=eq.${currentUser.id}`,
            },
            (payload: any) => {
              if (isMounted && payload.new) {
                if (payload.eventType === 'INSERT') {
                  setTransactions((prev) => [payload.new, ...prev]);
                } else if (payload.eventType === 'UPDATE') {
                  setTransactions((prev) =>
                    prev.map((tx) => (tx.id === payload.new.id ? payload.new : tx))
                  );
                }
              }
            }
          )

          // Listen to Notifications changes (INSERT or UPDATE)
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

              if (isMounted) {
                setUnreadCount(count || 0);
              }
            }
          )
          .subscribe();

      } catch (err) {
        console.error('Failed to load real-time page data:', err);
      } finally {
        if (isMounted) {
          setLoadingUser(false);
          setLoading(false);
        }
      }
    }

    loadUserDataAndTransactions();

    return () => {
      isMounted = false;
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/signin');
  };

  if (loadingUser) {
    return (
      <div className="min-h-screen bg-[#fdfdfc] bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] flex flex-col items-center justify-center gap-4 text-[#6b7280]">
        <div className="w-8 h-8 rounded-xl border-2 border-[#0b1e5b]/20 border-t-[#0b1e5b] animate-spin"></div>
        <div className="flex flex-col items-center gap-1">
          <span className="font-bold text-xs tracking-widest uppercase text-[#0b1e5b]">AccNumbers</span>
          <span className="text-xs font-medium">Loading Transactions...</span>
        </div>
      </div>
    );
  }

  const displayName = user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'kelvin';

  // Pagination calculations
  const totalPages = Math.ceil(transactions.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentTransactions = transactions.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="min-h-screen bg-[#fdfdfc] bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] text-[#111111] flex flex-col justify-between selection:bg-[#0b1e5b]/15 font-sans">
      
      {/* Top Header with Full Logo & Drawer Trigger */}
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
          {/* Notification Bell with Real-time Badge */}
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

          {/* Real-time Wallet Balance Widget */}
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
                <Link href="/dashboard" onClick={() => setIsSidebarOpen(false)} className="flex items-center gap-3 px-3.5 py-3 rounded-2xl hover:bg-[#e5e7eb]/40 text-[#111111] font-medium text-xs transition">
                  <ClipboardDocumentListIcon className="w-4 h-4 text-[#6b7280]" /> Dashboard Overview
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
                <Link href="/dashboard/notifications" onClick={() => setIsSidebarOpen(false)} className="flex items-center justify-between px-3.5 py-3 rounded-2xl hover:bg-[#e5e7eb]/40 text-[#111111] font-medium text-xs transition">
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
                <Link href="/dashboard/transactions" onClick={() => setIsSidebarOpen(false)} className="flex items-center gap-3 px-3.5 py-3 rounded-2xl bg-[#0b1e5b]/10 text-[#0b1e5b] font-bold text-xs">
                  <ArrowsRightLeftIcon className="w-4 h-4 text-[#0b1e5b]" /> Transactions & Ledger
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

      {/* Main Transactions Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto py-10 px-4 sm:px-6 space-y-8">
        
        {/* Header Title Section styled in Dark Blue */}
        <div className="bg-[#0b1e5b] text-white border border-[#0b1e5b] rounded-3xl p-8 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-64 h-full bg-gradient-to-l from-white/10 to-transparent pointer-events-none"></div>
          <div className="space-y-1.5 z-10">
            <span className="px-3 py-1 rounded-full bg-white/10 text-white text-[10px] font-bold uppercase tracking-wider">Ledger History</span>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Transactions & History
            </h1>
            <p className="text-xs sm:text-sm font-medium text-white/80">
              {loading ? 'Loading transactions...' : `${transactions.length} total entries recorded`}
            </p>
          </div>
        </div>

                {/* Transactions Card Feed */}
        <div className="space-y-4">
          {loading ? (
            <div className="p-12 text-center text-xs font-bold text-[#6b7280] bg-white rounded-3xl border border-[#e5e7eb] shadow-sm">
              Loading wallet ledger...
            </div>
          ) : currentTransactions.length > 0 ? (
            <div className="space-y-3">
              {currentTransactions.map((tx) => {
                const txType = tx.type?.toLowerCase() || 'credit';
                const txStatus = tx.status?.toLowerCase() || (txType === 'pending' ? 'pending' : 'success');
                const isPending = txStatus === 'pending' || txType === 'pending';
                const isCredit = txType === 'credit';
                const isRefund = txType === 'refund';
                const isReward = txType === 'reward';
                const formattedAmount = Number(tx.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 });
                const formattedBalanceAfter = Number(tx.balance_after || 0).toLocaleString('en-US', { minimumFractionDigits: 2 });

                return (
                  <div
                    key={tx.id}
                    className="p-6 bg-white border border-[#e5e7eb] rounded-3xl shadow-sm space-y-4 transition hover:border-[#0b1e5b]/40 animate-in fade-in duration-300"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold ${
                          isPending 
                            ? 'bg-amber-50 text-amber-600 border border-amber-200/50'
                            : isReward 
                            ? 'bg-amber-50 text-amber-600 border border-amber-200/50'
                            : isRefund 
                            ? 'bg-purple-50 text-purple-600 border border-purple-200/50'
                            : isCredit 
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/50' 
                            : 'bg-red-50 text-red-600 border border-red-200/50'
                        }`}>
                          {isPending ? (
                            <ClockIcon className="w-5 h-5 animate-pulse" />
                          ) : isReward ? (
                            <GiftIcon className="w-5 h-5" />
                          ) : isRefund ? (
                            <ArrowPathRoundedSquareIcon className="w-5 h-5" />
                          ) : isCredit ? (
                            <ArrowDownLeftIcon className="w-5 h-5" />
                          ) : (
                            <ArrowUpRightIcon className="w-5 h-5" />
                          )}
                        </div>
                        <div>
                          <h3 className="text-sm font-black text-[#0b1e5b]">{tx.description}</h3>
                          <p className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wider">Ref: {tx.reference}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`text-sm sm:text-base font-black ${
                          isPending ? 'text-amber-600' : isReward ? 'text-amber-600' : isRefund ? 'text-purple-600' : isCredit ? 'text-emerald-600' : 'text-red-600'
                        }`}>
                          {isPending ? '' : (isCredit || isRefund || isReward ? '+' : '-')}₦{formattedAmount}
                        </span>
                        <p className="text-[10px] font-bold text-[#6b7280]">
                          {isPending ? 'Pending Processing' : `Balance: ₦${formattedBalanceAfter}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-[#e5e7eb]/60 text-[11px] font-medium text-[#6b7280]">
                      <span className={`capitalize px-2.5 py-1 rounded-xl font-bold text-[10px] ${
                        isPending
                          ? 'bg-amber-50 text-amber-700 border border-amber-200/50'
                          : isReward
                          ? 'bg-amber-50 text-amber-700 border border-amber-200/50'
                          : isRefund 
                          ? 'bg-purple-50 text-purple-700 border border-purple-200/50' 
                          : isCredit
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/50'
                          : 'bg-red-50 text-red-700 border border-red-200/50'
                      }`}>
                        {isPending ? 'Pending' : tx.type}
                      </span>
                      <span>
                        {new Date(tx.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white border border-[#e5e7eb] rounded-3xl p-12 shadow-sm text-center space-y-4 max-w-md mx-auto">
              <div className="w-14 h-14 rounded-2xl bg-[#0b1e5b]/5 border border-[#0b1e5b]/10 flex items-center justify-center mx-auto text-[#0b1e5b]">
                <ArrowsRightLeftIcon className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-black text-[#0b1e5b]">No transactions yet</h3>
                <p className="text-xs font-medium text-[#6b7280] leading-relaxed">
                  Your wallet funding records, purchases, and rewards will appear here instantly.
                </p>
              </div>
              <div className="pt-2">
                <Link 
                  href="/dashboard/wallet"
                  className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-[#0b1e5b] text-white text-xs font-bold shadow-xs hover:bg-[#0b1e5b]/90 transition"
                >
                  Top Up Wallet
                </Link>
              </div>
            </div>
          )}

          {/* Pagination Footer */}
          {!loading && transactions.length > 0 && (
            <div className="bg-white border border-[#e5e7eb] rounded-3xl px-6 py-4 flex items-center justify-between shadow-sm">
              <span className="text-xs font-medium text-[#6b7280]">
                Page {currentPage} of {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 rounded-xl border border-[#e5e7eb] bg-white text-xs font-bold text-[#0b1e5b] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#fdfdfc] transition shadow-xs"
                >
                  Prev
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 rounded-xl border border-[#e5e7eb] bg-white text-xs font-bold text-[#0b1e5b] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#fdfdfc] transition shadow-xs"
                >
                  Next
                </button>
              </div>
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