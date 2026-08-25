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
  KeyIcon, 
  ShieldCheckIcon, 
  ArrowRightOnRectangleIcon, 
  DocumentTextIcon,
  CheckCircleIcon,
  ClockIcon,
  TrashIcon,
  QuestionMarkCircleIcon,
  ExclamationTriangleIcon,
  ArrowsRightLeftIcon
} from '@heroicons/react/24/solid';

export default function ApiHubPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [balanceNGN, setBalanceNGN] = useState<number>(0);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  // API Key Request Form State
  const [keyName, setKeyName] = useState('');
  const [scopes, setScopes] = useState({
    balance: true,
    prices: true,
    purchase: true,
    cancel: true,
  });
  const [expires, setExpires] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Custom Modal States
  const [revokeModalOpen, setRevokeModalOpen] = useState(false);
  const [keyToRevoke, setKeyToRevoke] = useState<string | null>(null);
  const [faqModalOpen, setFaqModalOpen] = useState(false);

  // Real API Keys & Requests state from Supabase
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [apiRequests, setApiRequests] = useState<any[]>([]);

  useEffect(() => {
    let walletChannel: any;
    let notifChannel: any;

    async function loadData() {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session) {
          router.push('/signin');
          return;
        }

        const currentUser = session.user;
        setUser(currentUser);

        // Fetch wallet balance
        const { data: walletData } = await supabase
          .from('wallets')
          .select('balance')
          .eq('user_id', currentUser.id)
          .single();

        if (walletData) {
          setBalanceNGN(walletData.balance ?? 0);
        }

        // Fetch unread notifications count
        const { count: unread } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', currentUser.id)
          .eq('read', false);

        setUnreadCount(unread || 0);

        // Fetch real active API keys from your api_keys table (ignoring revoked ones)
        const { data: keysData } = await supabase
          .from('api_keys')
          .select('*')
          .eq('user_id', currentUser.id)
          .eq('status', 'active');

        if (keysData && keysData.length > 0) {
          const formattedKeys = keysData.map(k => {
            const rawKey = k.key || '';
            const masked = rawKey.length > 12 
              ? `${rawKey.substring(0, 12)}****************` 
              : 'acc_test_****************';
            
            const dateObj = new Date(k.created_at);
            const dateFormatted = !isNaN(dateObj.getTime()) 
              ? `Created ${dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
              : 'Created recently';

            return {
              id: k.id,
              name: k.name,
              key: masked,
              created: dateFormatted
            };
          });
          setApiKeys(formattedKeys);
        } else {
          setApiKeys([]);
        }

        // Fetch real API requests from Supabase
        const { data: reqData } = await supabase
          .from('api_key_requests')
          .select('*')
          .eq('user_id', currentUser.id)
          .order('created_at', { ascending: false });

        if (reqData && reqData.length > 0) {
          setApiRequests(reqData.map(r => ({
            id: r.id,
            name: r.name,
            date: new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            status: r.status || 'pending'
          })));
        } else {
          setApiRequests([]);
        }

        // --- Real-Time Subscriptions ---
        // 1. Listen for live wallet balance updates
        walletChannel = supabase
          .channel(`wallet-changes-${currentUser.id}`)
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

        // 2. Listen for live notification updates (unread counter)
        notifChannel = supabase
          .channel(`notifications-changes-${currentUser.id}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'notifications',
              filter: `user_id=eq.${currentUser.id}`,
            },
            async () => {
              // Re-fetch count accurately on change
              const { count: freshUnread } = await supabase
                .from('notifications')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', currentUser.id)
                .eq('read', false);

              setUnreadCount(freshUnread || 0);
            }
          )
          .subscribe();

      } catch (err) {
        console.error('Error loading API hub:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();

    return () => {
      if (walletChannel) supabase.removeChannel(walletChannel);
      if (notifChannel) supabase.removeChannel(notifChannel);
    };
  }, [router]);

  const handleScopeChange = (scopeKey: keyof typeof scopes) => {
    setScopes(prev => ({ ...prev, [scopeKey]: !prev[scopeKey] }));
  };

    const handleRequestKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyName.trim() || !user) return;

    // Prevent spam by capping active keys at 5
    if (apiKeys.length >= 5) {
      setSuccessMsg('Error: You have reached the maximum limit of 5 active API keys.');
      return;
    }

    setSubmitting(true);
    setSuccessMsg('');

    const { data: insertedReq, error } = await supabase
      .from('api_key_requests')
      .insert({
        user_id: user.id,
        name: keyName,
        scopes: scopes,
        expires_at: expires ? new Date(expires).toISOString() : null,
        status: 'pending'
      })
      .select()
      .single();

    setSubmitting(false);

    if (error) {
      setSuccessMsg('Error submitting request: ' + error.message);
    } else {
      setSuccessMsg('API key request submitted successfully! Pending admin approval.');
      setKeyName('');
      setExpires('');

      if (insertedReq) {
        setApiRequests(prev => [
          {
            id: insertedReq.id,
            name: insertedReq.name,
            date: new Date(insertedReq.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            status: insertedReq.status
          },
          ...prev
        ]);
      }
    }
  };


  const confirmRevokeModal = (keyId: string) => {
    setKeyToRevoke(keyId);
    setRevokeModalOpen(true);
  };

    const handleRevokeKey = async () => {
    if (!keyToRevoke || !user) return;

    const { error } = await supabase
      .from('api_keys')
      .update({ status: 'revoked' })
      .eq('id', keyToRevoke)
      .eq('user_id', user.id);

    if (error) {
      setSuccessMsg('Failed to revoke key: ' + error.message);
    } else {
      setApiKeys(prev => prev.filter(k => k.id !== keyToRevoke));
      setSuccessMsg('API key successfully revoked.');
    }

    setRevokeModalOpen(false);
    setKeyToRevoke(null);
  };



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
          <span className="text-xs font-medium">Loading API Hub...</span>
        </div>
      </div>
    );
  }

  const displayName = user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'kelvin';

  return (
    <div className="min-h-screen bg-[#fdfdfc] bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] text-[#111111] flex flex-col justify-between selection:bg-[#0b1e5b]/15 font-sans relative">
      
      {/* Top Header */}
      <header className="bg-[#fdfdfc]/95 backdrop-blur-md border-b border-[#e5e7eb] px-6 lg:px-12 py-4 flex items-center justify-between sticky top-0 z-40 shadow-xs">
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
              <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white animate-pulse"></span>
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
                <Link href="/dashboard/api" onClick={() => setIsSidebarOpen(false)} className="flex items-center gap-3 px-3.5 py-3 rounded-2xl bg-[#0b1e5b]/10 text-[#0b1e5b] font-bold text-xs">
                  <KeyIcon className="w-4 h-4 text-[#0b1e5b]" /> API Keys & Access
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
      
      {/* Main Reseller API Content Area - Expanded for Desktop */}
      <main className="flex-1 max-w-7xl w-full mx-auto py-10 px-4 sm:px-6 lg:px-8 space-y-8">


          {/* Breadcrumb & Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="text-xs text-[#6b7280] font-medium">Account <span className="px-1">/</span> API</div>
            <h1 className="text-2xl sm:text-4xl font-black text-[#0b1e5b] tracking-tight">Reseller API</h1>
            <p className="text-xs sm:text-sm text-[#6b7280] font-medium max-w-xl">
              Drop-in compatible with SMS-Activate-style tooling. Swap your host, keep your code.
            </p>
          </div>
          <button 
            onClick={() => setFaqModalOpen(true)}
            className="p-2.5 sm:px-4 sm:py-2.5 rounded-2xl bg-white border border-[#e5e7eb] text-[#0b1e5b] hover:bg-[#0b1e5b]/5 transition shadow-xs flex items-center gap-1.5 text-xs font-bold cursor-pointer"
            title="API Help & FAQ"
          >
            <QuestionMarkCircleIcon className="w-5 h-5 text-[#0b1e5b]" />
            <span className="hidden sm:inline">FAQ</span>
          </button>
        </div>

        <div className="pt-1">
          <Link 
            href="/docs" 
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border border-[#e5e7eb] text-[#0b1e5b] font-bold text-xs hover:bg-[#fdfdfc] transition shadow-xs"
          >
            <DocumentTextIcon className="w-4 h-4 text-[#6b7280]" /> Read the docs
          </Link>
        </div>

        {successMsg && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 shadow-xs">
            <CheckCircleIcon className="w-4 h-4 text-emerald-600 shrink-0" /> {successMsg}
          </div>
        )}

        {/* Two-column layout grid for desktop screens */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Keys & Requests */}
          <div className="lg:col-span-7 space-y-8">
            
            {/* Your Keys Section */}
            <div className="bg-white border border-[#e5e7eb] rounded-3xl shadow-sm overflow-hidden">
              <div className="p-5 border-b border-[#e5e7eb] flex items-center justify-between">
                <h2 className="text-xs font-black uppercase tracking-wider text-[#0b1e5b]">Your keys</h2>
                <span className="text-[11px] font-bold text-[#6b7280]">{apiKeys.length} total</span>
              </div>
              <div className="grid grid-cols-3 px-5 py-2.5 bg-[#fdfdfc] border-b border-[#e5e7eb] text-[10px] font-bold text-[#6b7280] uppercase tracking-wider">
                <span>Name</span>
                <span>Key</span>
                <span className="text-right">Action</span>
              </div>
              <div className="divide-y divide-[#e5e7eb]">
                {apiKeys.length === 0 ? (
                  <div className="p-6 text-center text-xs text-[#6b7280]">No active API keys found.</div>
                ) : (
                  apiKeys.map((k) => (
                    <div key={k.id} className="grid grid-cols-3 p-5 items-center">
                      <div className="space-y-0.5">
                        <div className="text-xs font-bold text-[#0b1e5b]">{k.name}</div>
                        <div className="text-[10px] text-[#6b7280]">{k.created}</div>
                      </div>
                      <div className="font-mono text-xs font-bold text-[#6b7280] truncate pr-2">
                        {k.key}
                      </div>
                      <div className="text-right">
                        <button 
                          onClick={() => confirmRevokeModal(k.id)}
                          className="px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 font-bold text-[10px] inline-flex items-center gap-1 transition cursor-pointer"
                        >
                          <TrashIcon className="w-3 h-3" /> Revoke
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Requests Section */}
            <div className="bg-white border border-[#e5e7eb] rounded-3xl shadow-sm overflow-hidden">
              <div className="p-5 border-b border-[#e5e7eb]">
                <h2 className="text-xs font-black uppercase tracking-wider text-[#0b1e5b]">Requests</h2>
              </div>
              <div className="divide-y divide-[#e5e7eb]">
                {apiRequests.length === 0 ? (
                  <div className="p-6 text-center text-xs text-[#6b7280]">No API key requests found.</div>
                ) : (
                  apiRequests.map((req) => (
                    <div key={req.id} className="p-5 flex items-center justify-between gap-4">
                      <div className="space-y-0.5">
                        <div className="text-xs font-bold text-[#0b1e5b]">{req.name}</div>
                        <div className="text-[10px] text-[#6b7280]">{req.date}</div>
                      </div>
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        req.status === 'approved' 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                          : req.status === 'rejected' 
                          ? 'bg-red-50 text-red-700 border border-red-200' 
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {req.status === 'approved' ? <CheckCircleIcon className="w-3 h-3" /> : <ClockIcon className="w-3 h-3" />}
                        {req.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

          {/* Right Column: Request Key Form & Documentation */}
          <div className="lg:col-span-5 space-y-8">
            
            {/* Request a Key Form */}
            <div className="bg-white border border-[#e5e7eb] rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
              <div className="space-y-1">
                <h2 className="text-sm font-black text-[#0b1e5b]">Request a key</h2>
                <p className="text-xs text-[#6b7280]">
                  An admin reviews every request. Your key is emailed once on approval and never shown again[span_0](start_span)[span_0](end_span).
                </p>
              </div>

              <form onSubmit={handleRequestKey} className="space-y-6">
                <div className="space-y-2">
                  <input 
                    type="text" 
                    value={keyName}
                    onChange={(e) => setKeyName(e.target.value)}
                    placeholder="e.g. main bot, staging, fallback"
                    required
                    className="w-full px-4 py-3.5 rounded-2xl border border-[#cbd5e1] bg-[#fdfdfc] text-xs font-medium text-[#111111] focus:outline-none focus:ring-2 focus:ring-[#0b1e5b]/20 focus:border-[#0b1e5b] transition"
                  />
                </div>

                <div className="space-y-3">
                  <label className="block text-[10px] font-bold text-[#6b7280] uppercase tracking-wider">
                    Scopes <span className="normal-case font-normal">(none = full access)</span>
                  </label>

                  <div className="grid grid-cols-2 gap-3">
                    <label className="flex items-center gap-3 p-3 rounded-2xl border border-[#e5e7eb] bg-[#fdfdfc] cursor-pointer hover:bg-slate-50 transition">
                      <input 
                        type="checkbox" 
                        checked={scopes.balance} 
                        onChange={() => handleScopeChange('balance')}
                        className="w-4 h-4 rounded text-[#0b1e5b] focus:ring-[#0b1e5b]"
                      />
                      <span className="text-xs font-bold text-[#0b1e5b]">Balance</span>
                    </label>

                    <label className="flex items-center gap-3 p-3 rounded-2xl border border-[#e5e7eb] bg-[#fdfdfc] cursor-pointer hover:bg-slate-50 transition">
                      <input 
                        type="checkbox" 
                        checked={scopes.prices} 
                        onChange={() => handleScopeChange('prices')}
                        className="w-4 h-4 rounded text-[#0b1e5b] focus:ring-[#0b1e5b]"
                      />
                      <span className="text-xs font-bold text-[#0b1e5b]">Prices</span>
                    </label>

                    <label className="flex items-center gap-3 p-3 rounded-2xl border border-[#e5e7eb] bg-[#fdfdfc] cursor-pointer hover:bg-slate-50 transition">
                      <input 
                        type="checkbox" 
                        checked={scopes.purchase} 
                        onChange={() => handleScopeChange('purchase')}
                        className="w-4 h-4 rounded text-[#0b1e5b] focus:ring-[#0b1e5b]"
                      />
                      <span className="text-xs font-bold text-[#0b1e5b]">Purchase</span>
                    </label>

                    <label className="flex items-center gap-3 p-3 rounded-2xl border border-[#e5e7eb] bg-[#fdfdfc] cursor-pointer hover:bg-slate-50 transition">
                      <input 
                        type="checkbox" 
                        checked={scopes.cancel} 
                        onChange={() => handleScopeChange('cancel')}
                        className="w-4 h-4 rounded text-[#0b1e5b] focus:ring-[#0b1e5b]"
                      />
                      <span className="text-xs font-bold text-[#0b1e5b]">Cancel</span>
                    </label>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-[#6b7280] uppercase tracking-wider">
                    Expires <span className="normal-case font-normal">(optional)</span>
                  </label>
                  <input 
                    type="date" 
                    value={expires}
                    onChange={(e) => setExpires(e.target.value)}
                    className="w-full px-4 py-3.5 rounded-2xl border border-[#cbd5e1] bg-[#fdfdfc] text-xs font-medium text-[#111111] focus:outline-none focus:ring-2 focus:ring-[#0b1e5b]/20 focus:border-[#0b1e5b] transition"
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={submitting}
                  className="w-full py-4 rounded-2xl bg-[#0b1e5b] text-white font-bold text-xs hover:bg-[#0b1e5b]/90 transition shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Submitting request...' : 'Submit request'}
                </button>
              </form>
            </div>

            {/* API Documentation Box */}
            <div className="bg-white border border-[#e5e7eb] rounded-3xl p-6 shadow-sm flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#0b1e5b]/5 flex items-center justify-center text-[#0b1e5b] shrink-0">
                  <DocumentTextIcon className="w-5 h-5" />
                </div>
                <div className="space-y-0.5">
                  <h3 className="text-xs font-black text-[#0b1e5b]">API documentation</h3>
                  <p className="text-[11px] text-[#6b7280]">Getting started, authentication, endpoints, and error reference.</p>
                </div>
              </div>
              <Link href="/docs" className="px-4 py-2.5 rounded-xl bg-[#0b1e5b]/5 hover:bg-[#0b1e5b]/10 text-[#0b1e5b] font-bold text-xs transition shrink-0">
                View
              </Link>
            </div>

          </div>

        </div>

      </main>

      {/* Custom Revoke Confirmation Modal */}
      {revokeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-[#111111]/40 backdrop-blur-xs transition-opacity" onClick={() => setRevokeModalOpen(false)}></div>
          <div className="relative w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-[#e5e7eb] z-10 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <ExclamationTriangleIcon className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-sm font-black text-[#0b1e5b]">Revoke API Key?</h3>
              <p className="text-xs text-[#6b7280]">
                Are you sure you want to revoke this API key? This action will immediately deactivate access for any script using it.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button 
                onClick={() => setRevokeModalOpen(false)}
                className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#0b1e5b] text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={handleRevokeKey}
                className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition cursor-pointer shadow-sm"
              >
                Yes, Revoke
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom FAQ / Help Modal */}
      {faqModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-[#111111]/40 backdrop-blur-xs transition-opacity" onClick={() => setFaqModalOpen(false)}></div>
          <div className="relative w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-[#e5e7eb] z-10 space-y-5 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#e5e7eb] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#0b1e5b]/10 text-[#0b1e5b] flex items-center justify-center">
                  <QuestionMarkCircleIcon className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-black text-[#0b1e5b]">API Hub FAQ & Help</h3>
              </div>
              <button 
                onClick={() => setFaqModalOpen(false)}
                className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-[#6b7280] hover:text-[#0b1e5b] transition cursor-pointer"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-[#6b7280]">
              <div className="space-y-1">
                <h4 className="font-bold text-[#0b1e5b]">How do I receive my API key when approved?</h4>
                <p>Once an administrator reviews and approves your API key request, your secure API token will be generated and sent directly to your account registered email address. For safety reasons, keys are never displayed more than once on the dashboard.</p>
              </div>

              <div className="space-y-1">
                <h4 className="font-bold text-[#0b1e5b]">How long does admin review take?</h4>
                <p>Requests are usually reviewed within a few business hours. You can check the live tracking status under the "Requests" section on this page.</p>
              </div>

              <div className="space-y-1">
                <h4 className="font-bold text-[#0b1e5b]">What happens when I revoke a key?</h4>
                <p>Revoking a key archives it and immediately terminates its permission to connect to your AccNumbers balance and ordering automation endpoints. It cannot be reactivated.</p>
              </div>

              <div className="space-y-1">
                <h4 className="font-bold text-[#0b1e5b]">What are scopes used for?</h4>
                <p>Scopes restrict your key's access level. If you only want your script to check your balance and purchase numbers without granting cancellation privileges, you can uncheck specific scopes during the request process.</p>
              </div>
            </div>

            <div className="pt-2">
              <button 
                onClick={() => setFaqModalOpen(false)}
                className="w-full py-3.5 rounded-2xl bg-[#0b1e5b] text-white text-xs font-bold hover:bg-[#0b1e5b]/90 transition cursor-pointer"
              >
                Got it, thanks
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="bg-[#fdfdfc] border-t border-[#e5e7eb] py-6 px-4 text-center text-xs text-[#6b7280] font-medium">
        © 2026 AccNumbers. All rights reserved.
      </footer>
    </div>
  );
}