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
  BoltIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  TagIcon
} from '@heroicons/react/24/solid';

export default function WalletPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [balanceNGN, setBalanceNGN] = useState<number>(0);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [fundingAmount, setFundingAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Dynamic Minimum Deposit State (defaults to 500 as fallback)
  const [minDeposit, setMinDeposit] = useState<number>(500);

  // Promo Code States
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<any>(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [bonusAmount, setBonusAmount] = useState(0);

  const quickPicks = [1000, 2500, 5000, 10000, 25000, 50000];

  const fetchWalletData = async () => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        router.push('/signin');
        return;
      }

      const currentUser = session.user;
      setUser(currentUser);

      // Fetch dynamic settings for minimum deposit amount
      const { data: settingData, error: settingError } = await supabase
        .from('settings') // Adjust table name if your settings table is named differently
        .select('value')
        .eq('key', 'min_deposit_amount')
        .maybeSingle();

      if (!settingError && settingData && settingData.value) {
        setMinDeposit(Number(settingData.value));
      }

      const { data: walletData, error: walletError } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', currentUser.id)
        .single();

      if (!walletError && walletData) {
        setBalanceNGN(walletData.balance ?? 0);
      }

      const { count: unread } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', currentUser.id)
        .eq('read', false);

      setUnreadCount(unread || 0);

      const { data: txData, error: txError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', currentUser.id)
        .eq('type', 'credit') 
        .order('created_at', { ascending: false })
        .limit(5);

      if (!txError && txData) {
        setTransactions(txData);
      }
    } catch (err) {
      console.error('Error loading wallet data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWalletData();

    if (!user?.id) return;

    const walletChannel = supabase
      .channel(`realtime-wallets-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'wallets', filter: `user_id=eq.${user.id}` },
        (payload: any) => {
          if (payload.new && typeof payload.new.balance === 'number') {
            setBalanceNGN(payload.new.balance);
          }
        }
      )
      .subscribe();

    const notificationChannel = supabase
      .channel(`realtime-notifications-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        async () => {
          const { count: unread } = await supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('read', false);
          setUnreadCount(unread || 0);
        }
      )
      .subscribe();

    const txChannel = supabase
      .channel(`realtime-transactions-${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'transactions', filter: `user_id=eq.${user.id}` },
        (payload: any) => {
          if (payload.new) {
            setTransactions((prev) => [payload.new, ...prev.slice(0, 4)]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(walletChannel);
      supabase.removeChannel(notificationChannel);
      supabase.removeChannel(txChannel);
    };
  }, [user?.id]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/signin');
  };

  // Handle Promo Code Application and Verification
  const handleApplyPromo = async () => {
    if (!promoCodeInput.trim()) {
      setAlertMessage({ type: 'error', text: 'Please enter a promo code.' });
      return;
    }

    const amountNum = Number(fundingAmount);
    if (!fundingAmount || amountNum <= 0) {
      setAlertMessage({ type: 'error', text: 'Enter your deposit amount first to apply promo.' });
      return;
    }

    setPromoLoading(true);
    setAlertMessage(null);

    try {
      const { data, error } = await supabase
        .from('promo_codes')
        .select('*')
        .eq('code', promoCodeInput.trim().toUpperCase())
        .eq('is_active', true)
        .maybeSingle();

      if (error || !data) {
        throw new Error('Invalid or expired promo code.');
      }

      if (amountNum < data.min_deposit) {
        throw new Error(`Minimum deposit of ₦${data.min_deposit} required for this code.`);
      }

      if (data.max_uses !== null && data.uses_count >= data.max_uses) {
        throw new Error('This promo code has reached its maximum usage limit.');
      }

      // Calculate Bonus / Discount Amount
      let calculatedBonus = 0;
      if (data.discount_type === 'percentage') {
        calculatedBonus = (amountNum * data.discount_value) / 100;
      } else {
        calculatedBonus = data.discount_value;
      }

      setAppliedPromo(data);
      setBonusAmount(calculatedBonus);
      setAlertMessage({ type: 'success', text: `Promo code "${data.code}" applied successfully! You get +₦${calculatedBonus.toLocaleString()} extra bonus.` });
    } catch (err: any) {
      setAlertMessage({ type: 'error', text: err.message || 'Failed to apply promo code.' });
      setAppliedPromo(null);
      setBonusAmount(0);
    } finally {
      setPromoLoading(false);
    }
  };

  const handleFundWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlertMessage(null);

    const amountNum = Number(fundingAmount);
    if (!fundingAmount || amountNum < minDeposit) {
      setAlertMessage({ type: 'error', text: `Minimum top-up is ₦${minDeposit.toLocaleString()}.` });
      return;
    }

    setIsProcessing(true);

    try {
      const reference = `PAYSTACK-${Date.now()}-${user.id.slice(0, 5)}`;
      
      const response = await fetch('/api/initialize-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amountNum,
          email: user.email,
          reference: reference,
          user_id: user.id,
          promo_code_id: appliedPromo ? appliedPromo.id : null,
          bonus_amount: bonusAmount
        })
      });
      const data = await response.json();
      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      } else {
        setAlertMessage({ type: 'error', text: 'Failed to initialize Paystack payment gateway.' });
        setIsProcessing(false);
      }
    } catch (error) {
      console.error('Payment error:', error);
      setAlertMessage({ type: 'error', text: 'An error occurred while initializing payment.' });
      setIsProcessing(false);
    }
  };

  if (loading && !user) {
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

              <div className="space-y-1">
                <p className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wider px-2 pb-1">Finance & Funding</p>
                <Link href="/dashboard/transactions" onClick={() => setIsSidebarOpen(false)} className="flex items-center gap-3 px-3.5 py-3 rounded-2xl hover:bg-[#e5e7eb]/40 text-[#111111] font-medium text-xs transition">
                  <ArrowsRightLeftIcon className="w-4 h-4 text-[#6b7280]" /> Transactions & Ledger
                </Link>
                <Link href="/dashboard/wallet" onClick={() => setIsSidebarOpen(false)} className="flex items-center gap-3 px-3.5 py-3 rounded-2xl bg-[#0b1e5b]/10 text-[#0b1e5b] font-bold text-xs">
                  <PlusIcon className="w-4 h-4 text-[#0b1e5b]" /> Wallet Top Up
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

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto py-8 px-4 sm:px-8 lg:px-12 space-y-6">
        
        {/* Page Title */}
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl sm:text-3xl font-black text-[#0b1e5b] tracking-tight">
            Top up your wallet
          </h1>
          <p className="text-xs text-[#6b7280] font-medium">Fund your account instantly using Paystack gateway.</p>
        </div>

          {/* Alert Notification Display */}
        {alertMessage && (
          <div className={`p-4 rounded-2xl border flex items-center gap-3 shadow-xs animate-in fade-in duration-200 ${
            alertMessage.type === 'success' 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            {alertMessage.type === 'success' ? (
              <CheckCircleIcon className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <ExclamationCircleIcon className="w-5 h-5 text-red-600 shrink-0" />
            )}
            <span className="text-xs font-bold">{alertMessage.text}</span>
          </div>
        )}

        {/* Responsive Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          
          {/* Left Column Stack */}
          <div className="flex flex-col gap-6">
            
            {/* 1. Current Balance Card */}
            <div className="bg-[#0b1e5b] text-white rounded-3xl p-6 sm:p-8 shadow-xl space-y-4 relative overflow-hidden">
              <div className="absolute right-0 top-0 w-48 h-full bg-gradient-to-l from-white/10 to-transparent pointer-events-none"></div>
              
              <div className="space-y-1 relative z-10">
                <span className="text-[11px] font-bold text-blue-200 uppercase tracking-wider">CURRENT BALANCE</span>
                <div className="text-3xl sm:text-4xl font-black tracking-tight text-white">
                  ₦{balanceNGN.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-blue-200/80 font-medium pt-0.5">Minimum top-up ₦{minDeposit.toLocaleString()}</p>
              </div>

              <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white/10 border border-white/20 text-emerald-300 text-xs font-bold shadow-2xs relative z-10">
                <BoltIcon className="w-4 h-4 text-emerald-400 fill-emerald-400" />
                <span>Instant funding via Paystack</span>
              </div>
            </div>

            {/* 3. How It Works Section */}
            <div className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-7 shadow-sm space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-[#0b1e5b]">HOW IT WORKS</h3>
              
              <div className="space-y-3.5">
                <div className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-lg bg-[#0b1e5b] text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">1</span>
                  <p className="text-xs font-medium text-gray-700 leading-relaxed">Enter an amount in Naira (minimum ₦{minDeposit.toLocaleString()}).</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-lg bg-[#0b1e5b] text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">2</span>
                  <p className="text-xs font-medium text-gray-700 leading-relaxed">Apply an active promo code for bonus rewards (optional).</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-lg bg-[#0b1e5b] text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">3</span>
                  <p className="text-xs font-medium text-gray-700 leading-relaxed">Continue to Paystack and pay securely.</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-lg bg-[#0b1e5b] text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">4</span>
                  <p className="text-xs font-medium text-gray-700 leading-relaxed">Your balance updates automatically in real-time once confirmed.</p>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column Stack */}
          <div className="flex flex-col gap-6">
            
            {/* 2. Amount Form & Gateway Payment Card */}
            <div className="bg-white border border-[#e5e7eb] rounded-3xl p-6 sm:p-7 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-[#0b1e5b]">Amount & Vouchers</span>
                <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  via Paystack
                </span>
              </div>

              <form onSubmit={handleFundWallet} className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-[#6b7280] uppercase tracking-wider">Amount</label>
                  <div className="relative rounded-2xl shadow-2xs">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-xl font-black text-[#6b7280]">₦</div>
                    <input
                      type="number"
                      min={minDeposit}
                      step="any"
                      value={fundingAmount}
                      onChange={(e) => setFundingAmount(e.target.value)}
                      placeholder="0.00"
                      className="block w-full pl-10 pr-4 py-3.5 border border-[#e5e7eb] rounded-2xl focus:ring-[#0b1e5b] focus:border-[#0b1e5b] text-xl font-black text-[#111111] bg-[#fdfdfc]"
                      required
                    />
                  </div>
                  <p className="text-[11px] font-medium text-[#6b7280] leading-relaxed">
                    Between ₦{minDeposit.toLocaleString()} and ₦10,000,000. Funds settle automatically once Paystack confirms.
                  </p>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wider">QUICK PICKS</span>
                  <div className="grid grid-cols-3 gap-2.5">
                    {quickPicks.map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setFundingAmount(val.toString())}
                        className="py-3 px-2 rounded-2xl bg-white border border-[#e5e7eb] hover:border-[#0b1e5b] hover:bg-[#0b1e5b]/5 text-xs font-black text-[#0b1e5b] transition shadow-2xs cursor-pointer text-center"
                      >
                        ₦{val.toLocaleString()}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Promo Code Input Section */}
                <div className="space-y-2 bg-[#f8fafc] border border-[#e5e7eb] p-4 rounded-2xl">
                  <label className="block text-xs font-mono font-bold uppercase text-[#6b7280] flex items-center gap-1.5">
                    <TagIcon className="w-3.5 h-3.5 text-[#0b1e5b]" /> Have a Promo Code?
                  </label>
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      placeholder="ENTER PROMO CODE"
                      value={promoCodeInput}
                      onChange={(e) => setPromoCodeInput(e.target.value)}
                      disabled={appliedPromo !== null}
                      className="flex-1 px-4 py-2 bg-white border border-[#e5e7eb] rounded-xl text-xs font-mono font-bold uppercase text-[#111111] focus:outline-none focus:border-[#0b1e5b]"
                    />
                    {appliedPromo ? (
                      <button 
                        type="button"
                        onClick={() => { setAppliedPromo(null); setPromoCodeInput(''); setBonusAmount(0); }}
                        className="px-4 py-2 rounded-xl bg-red-50 text-red-600 border border-red-200 text-xs font-bold hover:bg-red-100 transition cursor-pointer"
                      >
                        Remove
                      </button>
                    ) : (
                      <button 
                        type="button"
                        onClick={handleApplyPromo}
                        disabled={promoLoading}
                        className="px-4 py-2 rounded-xl bg-[#0b1e5b] text-white text-xs font-bold hover:bg-[#0b1e5b]/90 transition cursor-pointer disabled:opacity-50"
                      >
                        {promoLoading ? 'Checking...' : 'Apply'}
                      </button>
                    )}
                  </div>

                  {appliedPromo && (
                    <div className="text-xs font-bold text-emerald-600 pt-1 space-y-0.5">
                      <p>✓ Code applied: {appliedPromo.discount_type === 'percentage' ? `${appliedPromo.discount_value}% bonus` : `₦${appliedPromo.discount_value} bonus`}</p>
                      <p className="text-[11px] font-medium text-emerald-700">Extra Bonus Reward: +₦{bonusAmount.toLocaleString()}</p>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full bg-[#0b1e5b] hover:bg-[#0b1e5b]/90 text-white font-bold py-4 px-6 rounded-2xl text-sm transition shadow-md disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>{isProcessing ? 'Processing payment...' : 'Continue to payment'}</span>
                  <ArrowRightIcon className="w-4 h-4" />
                </button>
              </form>

              <div className="pt-2 text-center">
                <p className="text-[11px] font-medium text-[#6b7280]">
                  Secure payment via Paystack — card, bank transfer, or USSD. Balance updates automatically.
                </p>
              </div>
            </div>

            {/* 4. Recent Deposits Section with Color-coded Amount Status */}
            <div className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-7 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-[#0b1e5b]">Recent deposits</h3>
                <span className="text-[11px] font-bold text-gray-400">{transactions.length} shown</span>
              </div>

              <div className="overflow-x-auto">
                {transactions.length === 0 ? (
                  <div className="py-8 px-4 text-center border border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400">
                      <ClipboardDocumentListIcon className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="text-xs font-bold text-[#111111]">No recent deposits</span>
                      <span className="text-[11px] text-gray-400 font-medium">Your funded transactions will appear here.</span>
                    </div>
                  </div>
                ) : (
                  <table className="min-w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        <th className="pb-3">WHEN</th>
                        <th className="pb-3">DETAILS / STATUS</th>
                        <th className="pb-3 text-right">AMOUNT</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {transactions.map((tx) => {
                        const isSuccess = tx.status === 'success';
                        const isPending = tx.status === 'pending';
                        
                        return (
                          <tr key={tx.id} className="hover:bg-gray-50/50 transition">
                            <td className="py-3.5 font-medium text-[#111111]">
                              {new Date(tx.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })},{' '}
                              {new Date(tx.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
                            </td>
                            <td className="py-3.5 space-y-1">
                              <div className="font-bold uppercase text-[#0b1e5b]">
                                {tx.type}
                              </div>
                              <div className="text-[11px] text-gray-400 font-normal">
                                {tx.description || 'N/A'} {tx.reference ? `• ${tx.reference.slice(0, 15)}...` : ''}
                              </div>
                            </td>
                            <td className={`py-3.5 text-right font-bold align-top ${
                              isSuccess 
                                ? 'text-emerald-600' 
                                : isPending 
                                ? 'text-amber-500' 
                                : 'text-red-500'
                            }`}>
                              {isSuccess ? '+' : ''}₦{Number(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

          </div>

        </div>

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-6 px-4 text-center text-xs text-gray-400 font-medium">
        © 2026 AccNumbers. All rights reserved.
      </footer>
    </div>
  );
}