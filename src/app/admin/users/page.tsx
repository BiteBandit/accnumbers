'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { 
  UsersIcon, 
  ArrowLeftIcon, 
  MagnifyingGlassIcon, 
  ShieldCheckIcon, 
  ShieldExclamationIcon, 
  DocumentDuplicateIcon, 
  CheckIcon, 
  ArrowPathIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusCircleIcon,
  MinusCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/solid';

export default function AdminUsersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'user'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 10;

  // Selected User Modal / Drawer State for actions
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [walletAdjustmentAmount, setWalletAdjustmentAmount] = useState('');
  const [adjustmentType, setAdjustmentType] = useState<'credit' | 'debit'>('credit');
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  async function loadUsers(isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        router.push('/signin');
        return;
      }

      // 1. Verify Admin Privileges
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();

      if (profileError || !profile || !profile.is_admin) {
        router.push('/dashboard');
        return;
      }

      // 2. Fetch all profiles and wallet balances
      const [profilesRes, walletsRes] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('wallets').select('user_id, balance')
      ]);

      if (profilesRes.error) throw profilesRes.error;

      const walletMap = new Map();
      if (walletsRes.data) {
        walletsRes.data.forEach((w: any) => {
          walletMap.set(w.user_id, w.balance || 0);
        });
      }

      const combinedUsers = (profilesRes.data || []).map((u: any) => ({
        ...u,
        balance: walletMap.get(u.id) || 0
      }));

      setUsers(combinedUsers);
    } catch (err) {
      console.error('Error loading users list:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, [router]);

  const handleCopyUid = (uid: string) => {
    navigator.clipboard.writeText(uid);
    setCopiedId(uid);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Toggle Admin Role
  const handleToggleAdmin = async (targetUserId: string, currentStatus: boolean) => {
    setActionLoading(true);
    setActionMessage(null);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_admin: !currentStatus })
        .eq('id', targetUserId);

      if (error) throw error;

      setUsers(users.map(u => u.id === targetUserId ? { ...u, is_admin: !currentStatus } : u));
      if (selectedUser && selectedUser.id === targetUserId) {
        setSelectedUser({ ...selectedUser, is_admin: !currentStatus });
      }

      setActionMessage({ type: 'success', text: `Successfully updated user role!` });
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Failed to update role' });
    } finally {
      setActionLoading(false);
    }
  };

  // Adjust Wallet Balance Manually (with Transactions & Notifications logging)
  const handleWalletAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !walletAdjustmentAmount) return;

    const amount = parseFloat(walletAdjustmentAmount);
    if (isNaN(amount) || amount <= 0) {
      setActionMessage({ type: 'error', text: 'Please enter a valid positive amount.' });
      return;
    }

    setActionLoading(true);
    setActionMessage(null);

    try {
      const currentBalance = parseFloat(selectedUser.balance) || 0;
      const newBalance = adjustmentType === 'credit' ? currentBalance + amount : currentBalance - amount;

      // 1. Update wallets table
      const { error: walletError } = await supabase
        .from('wallets')
        .update({ balance: newBalance })
        .eq('user_id', selectedUser.id);

      if (walletError) throw walletError;

      const referenceCode = `ADMIN-${Math.random().toString(36).substring(2, 9).toUpperCase()}-${Date.now().toString().slice(-5)}`;

      // 2. Insert record into transactions table
      const { error: txError } = await supabase.from('transactions').insert({
        user_id: selectedUser.id,
        type: adjustmentType, // 'credit' or 'debit'
        amount: amount.toFixed(2),
        balance_after: newBalance.toFixed(2),
        status: 'success',
        reference: referenceCode,
        description: `Admin manual wallet ${adjustmentType}`
      });

      if (txError) throw txError;

      // 3. Insert record into notifications table
      const notificationTitle = adjustmentType === 'credit' ? 'Wallet Credited 🚀' : 'Wallet Debited ⚠️';
      const notificationMessage = adjustmentType === 'credit'
        ? `Your wallet has been credited with ₦${amount.toLocaleString(undefined, { minimumFractionDigits: 2 }) } by administration.`
        : `Your wallet has been debited by ₦${amount.toLocaleString(undefined, { minimumFractionDigits: 2 }) } by administration.`;

      const { error: notifError } = await supabase.from('notifications').insert({
        user_id: selectedUser.id,
        title: notificationTitle,
        message: notificationMessage,
        read: false
      });

      if (notifError) throw notifError;

      // Update state
      setUsers(users.map(u => u.id === selectedUser.id ? { ...u, balance: newBalance } : u));
      setSelectedUser({ ...selectedUser, balance: newBalance });
      setWalletAdjustmentAmount('');
      setActionMessage({ type: 'success', text: `Successfully ${adjustmentType}ed ₦${amount.toLocaleString()} and notified user!` });
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Failed to adjust wallet balance' });
    } finally {
      setActionLoading(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch = 
      (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.id && u.id.toLowerCase().includes(searchQuery.toLowerCase()));

    if (roleFilter === 'admin') return matchesSearch && u.is_admin;
    if (roleFilter === 'user') return matchesSearch && !u.is_admin;
    return matchesSearch;
  });

  const totalPages = Math.ceil(filteredUsers.length / usersPerPage) || 1;
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * usersPerPage, currentPage * usersPerPage);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fdfdfc] bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] flex flex-col items-center justify-center gap-4 text-[#6b7280]">
        <div className="w-12 h-12 rounded-full border-2 border-[#0b1e5b]/20 border-t-[#0b1e5b] animate-spin"></div>
        <span className="font-mono text-[11px] uppercase tracking-widest text-[#0b1e5b] font-bold">Loading User Directory...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fdfdfc] bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] text-[#111111] space-y-6 animate-in fade-in duration-300 max-w-7xl mx-auto pb-16 px-4 sm:px-6 lg:px-8">
      
      {/* Top Header */}
      <div className="bg-gradient-to-br from-white via-white to-[#f8fafc] border border-[#e5e7eb] rounded-3xl p-5 sm:p-8 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-[#0b1e5b]/5 to-transparent rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="space-y-2 relative z-10 w-full">
          <Link href="/admin" className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0b1e5b]/5 text-[#0b1e5b] text-[10px] font-mono font-bold uppercase tracking-wider border border-[#0b1e5b]/10 hover:bg-[#0b1e5b]/10 transition">
            <ArrowLeftIcon className="w-3 h-3" /> Back to Overview
          </Link>
          <h1 className="text-xl sm:text-3xl font-black text-[#0b1e5b] tracking-tight">
            User Management Directory
          </h1>
          <p className="text-xs sm:text-sm text-[#6b7280] font-normal max-w-2xl">
            Inspect customer accounts, modify roles, monitor wallet liquidity, and execute administrative actions.
          </p>
        </div>

        <div className="flex items-center gap-3 relative z-10 self-end md:self-auto">
          <button 
            onClick={() => loadUsers(true)}
            disabled={refreshing}
            className="p-2.5 rounded-xl bg-white border border-[#e5e7eb] text-[#6b7280] hover:text-[#0b1e5b] hover:border-[#0b1e5b]/30 transition shadow-xs flex items-center justify-center cursor-pointer"
            title="Refresh Users"
          >
            <ArrowPathIcon className={`w-4 h-4 ${refreshing ? 'animate-spin text-[#0b1e5b]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white/95 backdrop-blur-md border border-[#e5e7eb] p-4 rounded-2xl shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        
        <div className="relative w-full md:w-80">
          <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6b7280]" />
          <input 
            type="text"
            placeholder="Search email or user ID..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="w-full pl-10 pr-4 py-2 bg-[#f8fafc] border border-[#e5e7eb] rounded-xl text-xs font-medium text-[#111111] focus:outline-none focus:border-[#0b1e5b] transition"
          />
        </div>

        <div className="flex items-center gap-1.5 bg-[#f8fafc] p-1 rounded-xl border border-[#e5e7eb] text-xs font-medium w-full md:w-auto justify-center overflow-x-auto">
          {(['all', 'admin', 'user'] as const).map((role) => (
            <button
              key={role}
              onClick={() => { setRoleFilter(role); setCurrentPage(1); }}
              className={`px-4 py-1.5 rounded-lg transition font-mono uppercase text-[10px] cursor-pointer whitespace-nowrap ${
                roleFilter === role 
                  ? 'bg-white text-[#0b1e5b] font-bold shadow-xs border border-[#e5e7eb]/80' 
                  : 'text-[#6b7280] hover:text-[#111111]'
              }`}
            >
              {role} ({role === 'all' ? users.length : users.filter(u => role === 'admin' ? u.is_admin : !u.is_admin).length})
            </button>
          ))}
        </div>

      </div>

      {/* Responsive Content Area: Mobile Cards & Desktop Table */}
      <div className="bg-white/90 backdrop-blur-md border border-[#e5e7eb] rounded-2xl shadow-xs overflow-hidden">
        
        {paginatedUsers.length === 0 ? (
          <div className="py-20 text-center space-y-2">
            <UsersIcon className="w-10 h-10 text-slate-300 mx-auto" />
            <div className="text-xs font-bold text-[#6b7280]">No users found matching your criteria.</div>
          </div>
        ) : (
          <>
            {/* MOBILE VIEW: Stacked Cards (< md screens) */}
            <div className="block md:hidden divide-y divide-[#e5e7eb]">
              {paginatedUsers.map((u) => {
                const userEmail = u.email || 'No email specified';
                const isCopied = copiedId === u.id;

                return (
                  <div key={u.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-[#0b1e5b]/10 text-[#0b1e5b] flex items-center justify-center font-bold text-xs uppercase font-mono border border-[#0b1e5b]/10 shrink-0">
                          {userEmail.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-xs text-[#111111] truncate">{userEmail}</div>
                          <div className="text-[10px] font-mono text-[#6b7280]">
                            Joined: {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'N/A'}
                          </div>
                        </div>
                      </div>
                      <div className="shrink-0">
                        {u.is_admin ? (
                          <span className="px-2 py-0.5 rounded-md bg-[#0b1e5b]/10 text-[#0b1e5b] font-mono font-bold text-[9px] uppercase border border-[#0b1e5b]/20">Admin</span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 font-mono font-bold text-[9px] uppercase border border-gray-200">User</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs bg-[#f8fafc] p-2.5 rounded-xl border border-[#e5e7eb]">
                      <div>
                        <div className="text-[10px] text-[#6b7280] uppercase font-mono font-bold">Wallet Balance</div>
                        <div className="font-mono font-bold text-blue-600">₦{Number(u.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                      </div>
                      <div className="text-right">
                        <button 
                          onClick={() => handleCopyUid(u.id)}
                          className="text-[10px] font-mono text-[#6b7280] hover:text-[#0b1e5b] flex items-center gap-1 justify-end"
                        >
                          <span>ID: {u.id.slice(0, 6)}...</span>
                          {isCopied ? <CheckIcon className="w-3 h-3 text-emerald-600" /> : <DocumentDuplicateIcon className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <button
                        onClick={() => { setSelectedUser(u); setActionMessage(null); }}
                        className="w-full py-2 rounded-xl bg-white border border-[#e5e7eb] text-[#0b1e5b] font-bold text-xs transition shadow-2xs"
                      >
                        Manage User
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

              {/* DESKTOP VIEW: Table Layout (>= md screens) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#f8fafc] border-b border-[#e5e7eb] text-[10px] font-mono font-bold text-[#6b7280] uppercase tracking-wider">
                    <th className="py-3.5 px-6">User Profile</th>
                    <th className="py-3.5 px-6">User ID</th>
                    <th className="py-3.5 px-6">Wallet Balance</th>
                    <th className="py-3.5 px-6">Role</th>
                    <th className="py-3.5 px-6">Joined Date</th>
                    <th className="py-3.5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e5e7eb] text-xs">
                  {paginatedUsers.map((u) => {
                    const userEmail = u.email || 'No email specified';
                    const isCopied = copiedId === u.id;

                    return (
                      <tr key={u.id} className="hover:bg-[#f8fafc]/60 transition group">
                        
                        <td className="py-4 px-6 flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-[#0b1e5b]/10 text-[#0b1e5b] flex items-center justify-center font-bold text-xs uppercase font-mono border border-[#0b1e5b]/10 shrink-0">
                            {userEmail.charAt(0)}
                          </div>
                          <div className="font-bold text-[#111111] truncate max-w-xs" title={userEmail}>
                            {userEmail}
                          </div>
                        </td>

                        <td className="py-4 px-6 font-mono text-[#6b7280]">
                          <button 
                            onClick={() => handleCopyUid(u.id)}
                            className="hover:text-[#0b1e5b] flex items-center gap-1.5 transition cursor-pointer"
                            title="Click to copy full ID"
                          >
                            <span>{u.id.slice(0, 8)}...</span>
                            {isCopied ? (
                              <span className="text-emerald-600 font-bold flex items-center gap-0.5"><CheckIcon className="w-3 h-3" /> Copied</span>
                            ) : (
                              <DocumentDuplicateIcon className="w-3 h-3 text-slate-400 group-hover:text-[#0b1e5b]" />
                            )}
                          </button>
                        </td>

                        <td className="py-4 px-6 font-mono font-bold text-blue-600">
                          ₦{Number(u.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>

                        <td className="py-4 px-6">
                          {u.is_admin ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#0b1e5b]/10 text-[#0b1e5b] font-mono font-bold text-[9px] uppercase border border-[#0b1e5b]/20">
                              <ShieldCheckIcon className="w-3 h-3" /> Admin
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-gray-100 text-gray-600 font-mono font-bold text-[9px] uppercase border border-gray-200">
                              User
                            </span>
                          )}
                        </td>

                        <td className="py-4 px-6 text-[#6b7280] font-mono text-[11px]">
                          {u.created_at ? new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                        </td>

                        <td className="py-4 px-6 text-right">
                          <button
                            onClick={() => { setSelectedUser(u); setActionMessage(null); }}
                            className="px-3 py-1.5 rounded-xl bg-white border border-[#e5e7eb] hover:border-[#0b1e5b] text-[#0b1e5b] font-bold text-xs transition shadow-2xs cursor-pointer"
                          >
                            Manage
                          </button>
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Pagination Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 bg-[#f8fafc] border-t border-[#e5e7eb]">
          <div className="text-xs text-[#6b7280] text-center sm:text-left">
            Showing <span className="font-bold text-[#111111]">{filteredUsers.length > 0 ? (currentPage - 1) * usersPerPage + 1 : 0}</span> to <span className="font-bold text-[#111111]">{Math.min(currentPage * usersPerPage, filteredUsers.length)}</span> of <span className="font-bold text-[#111111]">{filteredUsers.length}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-xl bg-white border border-[#e5e7eb] text-[#6b7280] hover:text-[#0b1e5b] disabled:opacity-40 transition cursor-pointer shadow-2xs"
            >
              <ChevronLeftIcon className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono font-bold px-3 py-1 bg-white border border-[#e5e7eb] rounded-xl text-[#0b1e5b]">
              {currentPage} / {totalPages || 1}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="p-2 rounded-xl bg-white border border-[#e5e7eb] text-[#6b7280] hover:text-[#0b1e5b] disabled:opacity-40 transition cursor-pointer shadow-2xs"
            >
              <ChevronRightIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

      {/* User Management Modal / Drawer */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-[#111111]/50 backdrop-blur-xs transition-opacity" onClick={() => setSelectedUser(null)}></div>
          
          <div className="relative w-full max-w-lg bg-white border border-[#e5e7eb] rounded-3xl p-6 sm:p-8 shadow-2xl z-10 space-y-6 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-[#e5e7eb] pb-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-[#0b1e5b]/10 text-[#0b1e5b] flex items-center justify-center font-bold font-mono uppercase shrink-0">
                  {selectedUser.email?.charAt(0)}
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs sm:text-sm font-black text-[#0b1e5b] truncate">{selectedUser.email}</h3>
                  <span className="text-[10px] font-mono text-[#6b7280] block truncate">ID: {selectedUser.id}</span>
                </div>
              </div>
              <button 
                onClick={() => setSelectedUser(null)}
                className="w-8 h-8 rounded-xl bg-[#f8fafc] flex items-center justify-center text-[#6b7280] hover:text-[#0b1e5b] transition cursor-pointer border border-[#e5e7eb] shrink-0"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {actionMessage && (
              <div className={`p-3 rounded-xl text-xs font-medium border ${
                actionMessage.type === 'success' 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                  : 'bg-red-50 text-red-700 border-red-200'
              }`}>
                {actionMessage.text}
              </div>
            )}

            <div className="space-y-3 bg-[#f8fafc] p-4 rounded-2xl border border-[#e5e7eb]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-[#111111]">Administrator Privilege</h4>
                  <p className="text-[11px] text-[#6b7280]">Grant or revoke admin access rights.</p>
                </div>
                <button
                  onClick={() => handleToggleAdmin(selectedUser.id, selectedUser.is_admin)}
                  disabled={actionLoading}
                  className={`px-4 py-2 rounded-xl font-bold text-xs transition cursor-pointer shadow-xs flex items-center justify-center gap-1.5 ${
                    selectedUser.is_admin 
                      ? 'bg-amber-100 hover:bg-amber-200 text-amber-800 border border-amber-300' 
                      : 'bg-[#0b1e5b] hover:bg-[#0b1e5b]/90 text-white'
                  }`}
                >
                  {selectedUser.is_admin ? <ShieldExclamationIcon className="w-4 h-4" /> : <ShieldCheckIcon className="w-4 h-4" />}
                  <span>{selectedUser.is_admin ? 'Revoke Admin' : 'Make Admin'}</span>
                </button>
              </div>
            </div>

            <form onSubmit={handleWalletAdjustment} className="space-y-4 bg-[#f8fafc] p-4 rounded-2xl border border-[#e5e7eb]">
              <div>
                <h4 className="text-xs font-bold text-[#111111]">Wallet Balance Adjustment</h4>
                <p className="text-[11px] text-[#6b7280]">Current Balance: <span className="font-mono font-bold text-blue-600">₦{Number(selectedUser.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustmentType('credit')}
                  className={`py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer border ${
                    adjustmentType === 'credit'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-white text-[#6b7280] border-[#e5e7eb]'
                  }`}
                >
                  <PlusCircleIcon className="w-4 h-4" /> Credit
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustmentType('debit')}
                  className={`py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer border ${
                    adjustmentType === 'debit'
                      ? 'bg-red-600 text-white border-red-600 shadow-xs'
                      : 'bg-white text-[#6b7280] border-[#e5e7eb]'
                  }`}
                >
                  <MinusCircleIcon className="w-4 h-4" /> Debit
                </button>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#6b7280]">₦</span>
                  <input 
                    type="number"
                    step="any"
                    placeholder="Enter amount..."
                    value={walletAdjustmentAmount}
                    onChange={(e) => setWalletAdjustmentAmount(e.target.value)}
                    className="w-full pl-8 pr-4 py-2 bg-white border border-[#e5e7eb] rounded-xl text-xs font-mono font-bold text-[#111111] focus:outline-none focus:border-[#0b1e5b]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={actionLoading || !walletAdjustmentAmount}
                  className="px-5 py-2 rounded-xl bg-[#0b1e5b] hover:bg-[#0b1e5b]/90 text-white text-xs font-bold transition disabled:opacity-40 cursor-pointer shadow-md"
                >
                  {actionLoading ? 'Processing...' : 'Apply'}
                </button>
              </div>
            </form>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedUser(null)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white border border-[#e5e7eb] text-[#111111] font-bold text-xs hover:bg-[#f8fafc] transition cursor-pointer"
              >
                Close Drawer
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}