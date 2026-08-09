'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { 
  UsersIcon, 
  ChartBarIcon,
  ServerStackIcon,
  ArrowUpRightIcon,
  SparklesIcon,
  ArrowRightIcon,
  WalletIcon,
  CheckIcon,
  DocumentDuplicateIcon,
  ArrowTrendingUpIcon,
  ShieldCheckIcon,
  ArrowPathIcon,
  BellAlertIcon,
  UserPlusIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/solid';

export default function AdminOverviewPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [totalRentalsCount, setTotalRentalsCount] = useState<number>(0);
  const [totalPlatformAsset, setTotalPlatformAsset] = useState<number>(0);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [timeFilter, setTimeFilter] = useState<'24h' | '7d' | '30d' | 'all'>('30d');

  async function loadAdminOverview(isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        router.push('/signin');
        return;
      }

      const currentUser = session.user;

      // 1. Verify Admin Privileges
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .maybeSingle();

      if (profileError || !profile || !profile.is_admin) {
        router.push('/dashboard');
        return;
      }

      // Calculate date threshold based on timeFilter
      let dateThreshold: string | null = null;
      const now = new Date();
      
      if (timeFilter === '24h') {
        now.setHours(now.getHours() - 24);
        dateThreshold = now.toISOString();
      } else if (timeFilter === '7d') {
        now.setDate(now.getDate() - 7);
        dateThreshold = now.toISOString();
      } else if (timeFilter === '30d') {
        now.setDate(now.getDate() - 30);
        dateThreshold = now.toISOString();
      }

      let usersQuery = supabase.from('profiles').select('*', { count: 'exact', head: true });
      let rentalsQuery = supabase.from('rentals').select('*', { count: 'exact', head: true });

      if (dateThreshold) {
        usersQuery = usersQuery.gte('created_at', dateThreshold);
        rentalsQuery = rentalsQuery.gte('created_at', dateThreshold);
      }

      // 2. Fetch metrics and data concurrently using created_at and time filters
      const [
        usersRes,
        rentalsRes,
        walletsRes,
        profilesRes
      ] = await Promise.all([
        usersQuery,
        rentalsQuery,
        supabase.from('wallets').select('balance'),
        supabase.from('profiles').select('id, email, is_admin, created_at').order('created_at', { ascending: false }).limit(5)
      ]);

      setTotalUsers(usersRes.count || 0);
      setTotalRentalsCount(rentalsRes.count || 0);

      if (walletsRes.data && walletsRes.data.length > 0) {
        const totalAssets = walletsRes.data.reduce((acc, curr) => {
          const numericBalance = parseFloat(curr.balance) || 0;
          return acc + numericBalance;
        }, 0);
        setTotalPlatformAsset(totalAssets);
      } else {
        setTotalPlatformAsset(0);
      }

      if (profilesRes.data) {
        setRecentUsers(profilesRes.data);
      }

    } catch (err) {
      console.error('Unexpected error loading admin overview:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadAdminOverview();
  }, [router, timeFilter]);

  const handleCopyUid = (uid: string) => {
    navigator.clipboard.writeText(uid);
    setCopiedId(uid);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Loading Screen with Grid Background
  if (loading) {
    return (
      <div className="min-h-screen bg-[#fdfdfc] bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] flex flex-col items-center justify-center gap-4 text-[#6b7280]">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-2 border-[#0b1e5b]/20 border-t-[#0b1e5b] animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-4 h-4 bg-[#0b1e5b] rounded-full animate-ping opacity-20"></div>
          </div>
        </div>
        <span className="font-mono text-[11px] uppercase tracking-widest text-[#0b1e5b] font-bold">Loading Admin Panel...</span>
      </div>
    );
  }

  // Main View with Grid Background
  return (
    <div className="min-h-screen bg-[#fdfdfc] bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] text-[#111111] space-y-8 animate-in fade-in duration-300 max-w-7xl mx-auto pb-16 px-4 sm:px-6 lg:px-8">
      
      {/* Header */}
      <div className="bg-gradient-to-br from-white via-white to-[#f8fafc] border border-[#e5e7eb] rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-[#0b1e5b]/5 to-transparent rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="space-y-2 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0b1e5b]/5 text-[#0b1e5b] text-[10px] font-mono font-bold uppercase tracking-wider border border-[#0b1e5b]/10">
            <SparklesIcon className="w-3 h-3 text-[#0b1e5b]" /> Admin Overview
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-[#0b1e5b] tracking-tight">
            System Dashboard & Activity
          </h1>
          <p className="text-xs sm:text-sm text-[#6b7280] font-normal max-w-2xl">
            Monitor registered users, total platform wallet balances, and track your rentals easily.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto relative z-10">
          <button 
            onClick={() => loadAdminOverview(true)}
            disabled={refreshing}
            className="p-2.5 rounded-xl bg-white border border-[#e5e7eb] text-[#6b7280] hover:text-[#0b1e5b] hover:border-[#0b1e5b]/30 transition shadow-xs flex items-center justify-center cursor-pointer"
            title="Refresh Data"
          >
            <ArrowPathIcon className={`w-4 h-4 ${refreshing ? 'animate-spin text-[#0b1e5b]' : ''}`} />
          </button>
          
          <Link 
            href="/admin/settings"
            className="flex-1 md:flex-none py-2.5 px-5 rounded-xl bg-[#0b1e5b] hover:bg-[#0b1e5b]/90 text-white font-bold text-xs transition shadow-md hover:shadow-lg flex items-center justify-center gap-2"
          >
            <AdjustmentsHorizontalIcon className="w-4 h-4" />
            <span>Settings</span> 
          </Link>
        </div>
      </div>

      {/* Sub-toolbar: Time Filters & Live Status */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white/95 backdrop-blur-md border border-[#e5e7eb] px-5 py-3 rounded-2xl shadow-xs">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-mono font-semibold text-[#111111]">System Online</span>
          <span className="text-[#e5e7eb] mx-1">|</span>
          <span className="text-[11px] text-[#6b7280]">Last updated: Just now</span>
        </div>

        <div className="flex items-center gap-1.5 bg-[#f8fafc] p-1 rounded-xl border border-[#e5e7eb] text-xs font-medium">
          {(['24h', '7d', '30d', 'all'] as const).map((period) => (
            <button
              key={period}
              onClick={() => setTimeFilter(period)}
              className={`px-3 py-1.5 rounded-lg transition font-mono uppercase text-[10px] cursor-pointer ${
                timeFilter === period 
                  ? 'bg-white text-[#0b1e5b] font-bold shadow-xs border border-[#e5e7eb]/80' 
                  : 'text-[#6b7280] hover:text-[#111111]'
              }`}
            >
              {period}
            </button>
          ))}
        </div>
      </div>

      {/* 4 Core Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        
        {/* Total Users */}
        <div className="bg-white/90 backdrop-blur-md border border-[#e5e7eb] rounded-2xl p-5 shadow-xs space-y-4 hover:border-[#0b1e5b]/40 transition group">
          <div className="flex items-center justify-between text-[#6b7280]">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider">Total Users</span>
            <div className="w-8 h-8 rounded-xl bg-[#0b1e5b]/5 text-[#0b1e5b] flex items-center justify-center group-hover:scale-110 transition">
              <UsersIcon className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-[#111111] tracking-tight">{totalUsers.toLocaleString()}</div>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="inline-flex items-center gap-0.5 text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold">
                <ArrowTrendingUpIcon className="w-3 h-3" /> Active
              </span>
              <span className="text-[11px] text-[#6b7280]">Registered accounts ({timeFilter.toUpperCase()})</span>
            </div>
          </div>
          <div className="pt-3 border-t border-[#e5e7eb] flex items-center justify-between text-[11px]">
            <Link href="/admin/users" className="font-bold text-[#0b1e5b] hover:underline flex items-center gap-1">
              View All Users <ArrowUpRightIcon className="w-3 h-3" />
            </Link>
            <span className="font-mono text-[#6b7280] text-[10px]">Profiles</span>
          </div>
        </div>

        {/* Total Rentals Sold */}
        <div className="bg-white/90 backdrop-blur-md border border-[#e5e7eb] rounded-2xl p-5 shadow-xs space-y-4 hover:border-[#0b1e5b]/40 transition group">
          <div className="flex items-center justify-between text-[#6b7280]">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider">Rentals Sold (Count)</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition">
              <ChartBarIcon className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-emerald-600 tracking-tight">{totalRentalsCount.toLocaleString()}</div>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="inline-flex items-center gap-0.5 text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold">
                <ArrowTrendingUpIcon className="w-3 h-3" /> Total Count
              </span>
              <span className="text-[11px] text-[#6b7280]">Completed rentals ({timeFilter.toUpperCase()})</span>
            </div>
          </div>
          <div className="pt-3 border-t border-[#e5e7eb] flex items-center justify-between text-[11px]">
            <Link href="/admin/rentals" className="font-bold text-[#0b1e5b] hover:underline flex items-center gap-1">
              View Rentals <ArrowUpRightIcon className="w-3 h-3" />
            </Link>
            <span className="font-mono text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded text-[10px]">Tracked</span>
          </div>
        </div>

        {/* Total Platform Asset */}
        <div className="bg-white/90 backdrop-blur-md border border-[#e5e7eb] rounded-2xl p-5 shadow-xs space-y-4 hover:border-[#0b1e5b]/40 transition group">
          <div className="flex items-center justify-between text-[#6b7280]">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider">Total User Wallets Balance</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition">
              <WalletIcon className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-blue-600 tracking-tight">₦{totalPlatformAsset.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="inline-flex items-center gap-0.5 text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold">
                Combined Balances
              </span>
              <span className="text-[11px] text-[#6b7280]">All user wallets</span>
            </div>
          </div>
          <div className="pt-3 border-t border-[#e5e7eb] flex items-center justify-between text-[11px]">
            <span className="text-[#6b7280] font-medium">Platform Funds</span>
            <span className="font-mono text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded text-[10px]">Live Total</span>
          </div>
        </div>

        {/* System Health */}
        <div className="bg-white/90 backdrop-blur-md border border-[#e5e7eb] rounded-2xl p-5 shadow-xs space-y-4 hover:border-[#0b1e5b]/40 transition group sm:col-span-2 lg:col-span-3">
          <div className="flex items-center justify-between text-[#6b7280]">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider">System Status</span>
            <div className="w-8 h-8 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center group-hover:scale-110 transition">
              <ServerStackIcon className="w-4 h-4" />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-3xl font-black text-[#111111] tracking-tight">99.9%</div>
              <div className="text-[11px] text-[#6b7280] mt-1">Database connection uptime</div>
            </div>
            <div className="flex items-center gap-2 bg-[#f8fafc] px-3 py-2 rounded-xl border border-[#e5e7eb]">
              <ShieldCheckIcon className="w-5 h-5 text-emerald-600" />
              <div className="text-[11px]">
                <div className="font-bold text-[#111111]">Everything is Working</div>
                <div className="text-[#6b7280] text-[10px]">No issues detected</div>
              </div>
            </div>
          </div>
          <div className="pt-3 border-t border-[#e5e7eb] flex items-center justify-between text-[11px]">
            <Link href="/admin/settings" className="font-bold text-[#0b1e5b] hover:underline flex items-center gap-1">
              Configuration <ArrowUpRightIcon className="w-3 h-3" />
            </Link>
            <span className="font-mono text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded text-[10px]">Good</span>
          </div>
        </div>

      </div>

      {/* Quick Action Shortcuts Banner */}
      <div className="bg-[#0b1e5b] text-white rounded-2xl p-6 shadow-md flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center md:text-left">
          <span className="font-mono text-[10px] uppercase tracking-widest text-blue-300 font-bold">Quick Actions</span>
          <h3 className="text-lg font-bold">Manage Your Platform Easily</h3>
          <p className="text-xs text-slate-300">Quickly jump to user management or check rental orders.</p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link 
            href="/admin/users" 
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-xs font-bold transition flex items-center gap-2"
          >
            <UserPlusIcon className="w-4 h-4 text-blue-200" /> Manage Users
          </Link>
          <Link 
            href="/admin/rentals" 
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-xs font-bold transition flex items-center gap-2"
          >
            <BellAlertIcon className="w-4 h-4 text-blue-200" /> Review Rentals
          </Link>
        </div>
      </div>

       {/* Recent Users Directory (Last 5) */}
      <div className="bg-white/90 backdrop-blur-md border border-[#e5e7eb] rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-black text-[#0b1e5b] uppercase tracking-wider font-mono">Recent Users</h3>
            <p className="text-xs text-[#6b7280] mt-0.5">Last 5 users registered on the platform with quick copy user IDs</p>
          </div>
          <Link href="/admin/users" className="text-xs font-bold text-[#0b1e5b] hover:underline flex items-center gap-1">
            View All Users <ArrowRightIcon className="w-3 h-3" />
          </Link>
        </div>

        {recentUsers.length === 0 ? (
          <div className="py-12 text-center text-xs text-[#6b7280] border border-dashed border-[#e5e7eb] rounded-2xl bg-[#f8fafc]">
            No user profiles found.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentUsers.map((u) => {
              const userEmail = u.email || 'No email provided';
              const isCopied = copiedId === u.id;

              return (
                <div key={u.id} className="bg-[#f8fafc]/50 border border-[#e5e7eb] rounded-2xl p-4 flex items-center justify-between gap-3 transition hover:border-[#0b1e5b]/40 hover:bg-white shadow-2xs">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-[#0b1e5b]/10 text-[#0b1e5b] flex items-center justify-center font-bold text-sm uppercase shrink-0 font-mono border border-[#0b1e5b]/10">
                      {userEmail.charAt(0)}
                    </div>
                    <div className="min-w-0 space-y-1">
                      <div className="text-xs font-bold text-[#111111] truncate" title={userEmail}>{userEmail}</div>
                      <button 
                        onClick={() => handleCopyUid(u.id)}
                        className="text-[10px] font-mono text-[#6b7280] hover:text-[#0b1e5b] flex items-center gap-1 transition text-left cursor-pointer group"
                        title="Click to copy full ID"
                      >
                        <span className="group-hover:underline">ID: {u.id.slice(0, 6)}...{u.id.slice(-4)}</span>
                        {isCopied ? (
                          <span className="text-emerald-600 font-bold flex items-center gap-0.5"><CheckIcon className="w-3 h-3" /> Copied</span>
                        ) : (
                          <DocumentDuplicateIcon className="w-3 h-3 text-slate-400 group-hover:text-[#0b1e5b]" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="shrink-0">
                    {u.is_admin ? (
                      <span className="px-2.5 py-1 rounded-md bg-[#0b1e5b]/10 text-[#0b1e5b] font-mono font-bold text-[9px] uppercase border border-[#0b1e5b]/20">
                        Admin
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-md bg-gray-100 text-gray-600 font-mono font-bold text-[9px] uppercase border border-gray-200">
                        User
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}