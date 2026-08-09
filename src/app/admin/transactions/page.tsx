'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { 
  ArrowLeftIcon, 
  MagnifyingGlassIcon, 
  ArrowPathIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  GiftIcon,
  ArrowUturnLeftIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  BanknotesIcon
} from '@heroicons/react/24/solid';

export default function AdminTransactionsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'credit' | 'debit' | 'reward' | 'refund'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'pending' | 'failed'>('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Selected Transaction Modal State
  const [selectedTx, setSelectedTx] = useState<any | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Custom Alert & Confirm States
  const [alertState, setAlertState] = useState<{ show: boolean; title: string; message: string; type: 'success' | 'error' }>({
    show: false,
    title: '',
    message: '',
    type: 'success'
  });

  async function loadTransactions(isRefresh = false) {
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

      // 2. Fetch all transactions ordered by creation date
      const { data: txData, error: txError } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false });

      if (txError) throw txError;

      setTransactions(txData || []);
    } catch (err) {
      console.error('Error loading transactions:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadTransactions();
  }, [router]);

  // Manual Force-Success / Credit Recovery action for stuck/pending credits/deposits
  const handleForceCompleteTransaction = async () => {
    if (!selectedTx) return;

    if (selectedTx.status === 'success') {
      setAlertState({
        show: true,
        title: 'Already Successful',
        message: 'This transaction has already been marked as successful.',
        type: 'error'
      });
      return;
    }

    setActionLoading(true);

    try {
      const userId = selectedTx.user_id;
      const txAmount = parseFloat(selectedTx.amount) || 0;
      const isPositive = selectedTx.type === 'credit' || selectedTx.type === 'reward' || selectedTx.type === 'refund';

      // 1. Fetch user wallet
      let { data: walletData, error: walletFetchError } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', userId)
        .maybeSingle();

      if (walletFetchError) throw new Error(`Wallet fetch error: ${walletFetchError.message}`);

      let currentBalance = 0;
      if (!walletData) {
        const initialBalance = isPositive ? txAmount : 0;
        const { error: walletInsertError } = await supabase
          .from('wallets')
          .insert({ user_id: userId, balance: initialBalance });
        if (walletInsertError) throw new Error(`Wallet insert error: ${walletInsertError.message}`);
      } else {
        currentBalance = parseFloat(walletData?.balance || 0);
        const newBalance = isPositive ? currentBalance + txAmount : currentBalance - txAmount;
        
        const { error: walletUpdateError } = await supabase
          .from('wallets')
          .update({ balance: newBalance })
          .eq('user_id', userId);
        if (walletUpdateError) throw new Error(`Wallet update error: ${walletUpdateError.message}`);
      }

      // 2. Update transaction status to success
      const { error: txUpdateError } = await supabase
        .from('transactions')
        .update({ status: 'success' })
        .eq('id', selectedTx.id);

      if (txUpdateError) throw new Error(`Transaction update error: ${txUpdateError.message}`);

      // 3. Send notification
      await supabase.from('notifications').insert({
        user_id: userId,
        title: 'Transaction Approved 🟢',
        message: `Your ${selectedTx.type} transaction of ₦${txAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} has been manually approved.`,
        read: false
      });

      await loadTransactions();
      setSelectedTx({ ...selectedTx, status: 'success' });

      setAlertState({
        show: true,
        title: 'Transaction Processed',
        message: 'Successfully updated transaction status and updated user wallet!',
        type: 'success'
      });
    } catch (err: any) {
      console.error('Force complete error:', err);
      setAlertState({
        show: true,
        title: 'Action Failed',
        message: err.message || 'Failed to process manual transaction.',
        type: 'error'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const filteredTransactions = transactions.filter((tx) => {
    const userId = tx.user_id || '';
    const reference = tx.reference || '';
    const description = tx.description || '';
    const id = tx.id || '';

    const matchesSearch = 
      userId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = typeFilter === 'all' || tx.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || tx.status === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
  });

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage) || 1;
  const paginatedTransactions = filteredTransactions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Quick stats calculation
  const totalVolume = transactions.filter(t => t.status === 'success').reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
  const successCount = transactions.filter(t => t.status === 'success').length;
  const pendingCount = transactions.filter(t => t.status === 'pending').length;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fdfdfc] flex flex-col items-center justify-center gap-4 text-[#6b7280]">
        <div className="w-10 h-10 rounded-full border-2 border-[#0b1e5b]/20 border-t-[#0b1e5b] animate-spin"></div>
        <span className="font-mono text-[11px] uppercase tracking-widest text-[#0b1e5b] font-bold">Loading Transactions...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fdfdfc] bg-grid-pattern text-[#111111] space-y-4 max-w-7xl mx-auto pb-16 px-3 sm:px-6 lg:px-8 w-full max-w-[100vw] overflow-x-hidden box-border">
      
      {/* Top Header */}
      <div className="bg-gradient-to-br from-white via-white to-[#f8fafc] border border-[#e5e7eb] rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 w-full box-border">
        <div className="space-y-1.5 w-full min-w-0">
          <button 
            onClick={() => router.push('/admin')} 
            className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#0b1e5b]/5 text-[#0b1e5b] text-[10px] font-mono font-bold uppercase tracking-wider border border-[#0b1e5b]/10 hover:bg-[#0b1e5b]/10 transition cursor-pointer"
          >
            <ArrowLeftIcon className="w-3 h-3" /> Overview
          </button>
          <h1 className="text-xl sm:text-3xl font-black text-[#0b1e5b] tracking-tight truncate">
            Transactions Log
          </h1>
          <p className="text-xs sm:text-sm text-[#6b7280]">
            Monitor platform credits, debits, rewards, refunds, and gateway statuses.
          </p>
        </div>

        <button 
          onClick={() => loadTransactions(true)}
          disabled={refreshing}
          className="p-2.5 sm:p-3 rounded-2xl bg-white border border-[#e5e7eb] text-[#6b7280] hover:text-[#0b1e5b] transition shadow-xs flex items-center justify-center cursor-pointer shrink-0 self-end sm:self-auto"
          title="Refresh"
        >
          <ArrowPathIcon className={`w-4 h-4 sm:w-5 sm:h-5 ${refreshing ? 'animate-spin text-[#0b1e5b]' : ''}`} />
        </button>
      </div>

      {/* Analytics Summary Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white border border-[#e5e7eb] p-4 rounded-2xl shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shrink-0">
            <BanknotesIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-mono uppercase text-[#6b7280] font-bold">Total Volume (Success)</div>
            <div className="text-base sm:text-lg font-black text-[#111111]">₦{totalVolume.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
          </div>
        </div>

        <div className="bg-white border border-[#e5e7eb] p-4 rounded-2xl shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center shrink-0">
            <CheckCircleIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-mono uppercase text-[#6b7280] font-bold">Successful Logs</div>
            <div className="text-base sm:text-lg font-black text-[#111111]">{successCount}</div>
          </div>
        </div>

        <div className="bg-white border border-[#e5e7eb] p-4 rounded-2xl shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center shrink-0">
            <ClockIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-mono uppercase text-[#6b7280] font-bold">Pending Actions</div>
            <div className="text-base sm:text-lg font-black text-[#111111]">{pendingCount}</div>
          </div>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white/95 backdrop-blur-md border border-[#e5e7eb] p-3 sm:p-4 rounded-2xl shadow-xs space-y-3 w-full box-border">
        <div className="relative w-full">
          <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6b7280]" />
          <input 
            type="text"
            placeholder="Search reference, description, user ID..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="w-full pl-10 pr-4 py-2.5 bg-[#f8fafc] border border-[#e5e7eb] rounded-xl text-xs sm:text-sm font-medium text-[#111111] focus:outline-none focus:border-[#0b1e5b] box-border"
          />
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
          {/* Type Filters */}
          <div className="flex items-center gap-1.5 bg-[#f8fafc] p-1.5 rounded-xl border border-[#e5e7eb] overflow-x-auto w-full scrollbar-none">
            {(['all', 'credit', 'debit', 'reward', 'refund'] as const).map((t) => (
              <button
                key={t}
                onClick={() => { setTypeFilter(t); setCurrentPage(1); }}
                className={`px-3 py-1.5 rounded-lg transition font-mono uppercase text-[10px] sm:text-xs cursor-pointer whitespace-nowrap shrink-0 ${
                  typeFilter === t 
                    ? 'bg-white text-[#0b1e5b] font-bold shadow-xs border border-[#e5e7eb]' 
                    : 'text-[#6b7280] hover:text-[#111111]'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Status Filters */}
          <div className="flex items-center gap-1.5 bg-[#f8fafc] p-1.5 rounded-xl border border-[#e5e7eb] overflow-x-auto shrink-0">
            {(['all', 'success', 'pending', 'failed'] as const).map((st) => (
              <button
                key={st}
                onClick={() => { setStatusFilter(st); setCurrentPage(1); }}
                className={`px-2.5 py-1.5 rounded-lg transition font-mono uppercase text-[10px] sm:text-xs cursor-pointer whitespace-nowrap ${
                  statusFilter === st 
                    ? 'bg-white text-[#0b1e5b] font-bold shadow-xs border border-[#e5e7eb]' 
                    : 'text-[#6b7280] hover:text-[#111111]'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Transactions Container */}
      <div className="bg-white border border-[#e5e7eb] rounded-2xl sm:rounded-3xl shadow-xs overflow-hidden w-full box-border">
        
        {paginatedTransactions.length === 0 ? (
          <div className="py-20 text-center space-y-2">
            <BanknotesIcon className="w-10 h-10 text-slate-300 mx-auto" />
            <div className="text-sm font-bold text-[#6b7280]">No transaction records found.</div>
          </div>
        ) : (
          <>
            {/* MOBILE STREAM CARDS (< md) */}
            <div className="block md:hidden divide-y divide-[#e5e7eb] w-full max-w-full overflow-hidden">
              {paginatedTransactions.map((tx) => {
                const isPositive = tx.type === 'credit' || tx.type === 'reward' || tx.type === 'refund';
                return (
                  <div key={tx.id} className="p-3.5 space-y-2.5 bg-white w-full max-w-full box-border">
                    <div className="flex items-center justify-between gap-2 w-full">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
                          tx.type === 'credit' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                          tx.type === 'reward' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                          tx.type === 'refund' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                          'bg-purple-50 text-purple-600 border-purple-200'
                        }`}>
                          {tx.type === 'credit' ? <ArrowTrendingUpIcon className="w-4 h-4" /> :
                           tx.type === 'reward' ? <GiftIcon className="w-4 h-4" /> :
                           tx.type === 'refund' ? <ArrowUturnLeftIcon className="w-4 h-4" /> :
                           <ArrowTrendingDownIcon className="w-4 h-4" />}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-xs text-[#111111] uppercase tracking-wide truncate">{tx.type}</div>
                          <div className="text-[10px] text-[#6b7280] font-mono truncate">{tx.reference || 'No ref'}</div>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded font-mono font-bold text-[9px] uppercase border shrink-0 ${
                        tx.status === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        tx.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        'bg-red-50 text-red-700 border-red-200'
                      }`}>
                        {tx.status}
                      </span>
                    </div>

                    <div className="bg-[#f8fafc] p-3 rounded-xl border border-[#e5e7eb] space-y-2 text-xs font-mono w-full max-w-full box-border overflow-hidden">
                      <div className="flex items-center justify-between gap-1 w-full">
                        <span className="text-[#6b7280] text-[10px] shrink-0">Amount:</span>
                        <span className={`font-bold text-xs truncate ${isPositive ? 'text-emerald-600' : 'text-[#111111]'}`}>
                          {isPositive ? '+' : '-'}₦{Number(tx.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-1 w-full pt-1 border-t border-[#e5e7eb]/60">
                        <span className="text-[#6b7280] text-[10px] shrink-0">Balance After:</span>
                        <span className="font-bold text-[#111111] text-xs truncate">₦{Number(tx.balance_after || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex items-center justify-between gap-1 w-full pt-1 border-t border-[#e5e7eb]/60">
                        <span className="text-[#6b7280] text-[10px] shrink-0">Description:</span>
                        <span className="text-[#111111] text-[11px] truncate max-w-[200px]" title={tx.description}>{tx.description || 'N/A'}</span>
                      </div>
                      <div className="flex items-center justify-between gap-1 w-full pt-1 border-t border-[#e5e7eb]/60 min-w-0">
                        <span className="text-[#6b7280] text-[9px] shrink-0">User ID:</span>
                        <span className="text-[#111111] text-[10px] font-mono truncate max-w-[180px]" title={tx.user_id}>
                          {tx.user_id}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedTx(tx)}
                      className="w-full py-3 min-h-[42px] rounded-xl bg-[#0b1e5b]/5 border border-[#0b1e5b]/20 text-[#0b1e5b] font-bold text-xs transition active:scale-98 cursor-pointer flex items-center justify-center shadow-xs"
                    >
                      View Details
                    </button>
                  </div>
                );
              })}
            </div>

              {/* DESKTOP TABLE VIEW (>= md) */}
            <div className="hidden md:block overflow-x-auto w-full">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#f8fafc] border-b border-[#e5e7eb] text-[11px] font-mono font-bold text-[#6b7280] uppercase tracking-wider">
                    <th className="py-4 px-6">Type / Ref</th>
                    <th className="py-4 px-6">User ID</th>
                    <th className="py-4 px-6">Description</th>
                    <th className="py-4 px-6">Amount</th>
                    <th className="py-4 px-6">Balance After</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e5e7eb] text-sm">
                  {paginatedTransactions.map((tx) => {
                    const isPositive = tx.type === 'credit' || tx.type === 'reward' || tx.type === 'refund';
                    return (
                      <tr key={tx.id} className="hover:bg-[#f8fafc]/60 transition">
                        <td className="py-4 px-6 flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                            tx.type === 'credit' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                            tx.type === 'reward' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                            tx.type === 'refund' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                            'bg-purple-50 text-purple-600 border-purple-200'
                          }`}>
                            {tx.type === 'credit' ? <ArrowTrendingUpIcon className="w-4 h-4" /> :
                             tx.type === 'reward' ? <GiftIcon className="w-4 h-4" /> :
                             tx.type === 'refund' ? <ArrowUturnLeftIcon className="w-4 h-4" /> :
                             <ArrowTrendingDownIcon className="w-4 h-4" />}
                          </div>
                          <div>
                            <div className="font-bold text-[#111111] uppercase tracking-wide text-xs">{tx.type}</div>
                            <div className="text-xs text-[#6b7280] font-mono">{tx.reference || 'No ref'}</div>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-[#6b7280] font-mono text-xs max-w-[150px] truncate" title={tx.user_id}>
                          {tx.user_id}
                        </td>
                        <td className="py-4 px-6 text-xs text-[#111111] max-w-[220px] truncate" title={tx.description}>
                          {tx.description || 'N/A'}
                        </td>
                        <td className={`py-4 px-6 font-mono font-bold ${isPositive ? 'text-emerald-600' : 'text-[#111111]'}`}>
                          {isPositive ? '+' : '-'}₦{Number(tx.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-4 px-6 font-mono text-xs text-[#6b7280]">
                          ₦{Number(tx.balance_after || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-4 px-6">
                          <span className={`px-2.5 py-1 rounded-lg font-mono font-bold text-[10px] uppercase border ${
                            tx.status === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            tx.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                            'bg-red-50 text-red-700 border-red-200'
                          }`}>
                            {tx.status}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <button
                            onClick={() => setSelectedTx(tx)}
                            className="px-3.5 py-2 rounded-xl bg-white border border-[#e5e7eb] hover:border-[#0b1e5b] text-[#0b1e5b] font-bold text-xs transition shadow-2xs cursor-pointer"
                          >
                            View
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
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 sm:px-6 py-4 bg-[#f8fafc] border-t border-[#e5e7eb] w-full box-border">
          <div className="text-xs text-[#6b7280]">
            Showing <span className="font-bold text-[#111111]">{filteredTransactions.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</span> to <span className="font-bold text-[#111111]">{Math.min(currentPage * itemsPerPage, filteredTransactions.length)}</span> of <span className="font-bold text-[#111111]">{filteredTransactions.length}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-2.5 rounded-xl bg-white border border-[#e5e7eb] text-[#6b7280] hover:text-[#0b1e5b] disabled:opacity-40 transition cursor-pointer shadow-2xs"
            >
              <ChevronLeftIcon className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono font-bold px-3 py-1.5 bg-white border border-[#e5e7eb] rounded-xl text-[#0b1e5b]">
              {currentPage} / {totalPages || 1}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="p-2.5 rounded-xl bg-white border border-[#e5e7eb] text-[#6b7280] hover:text-[#0b1e5b] disabled:opacity-40 transition cursor-pointer shadow-2xs"
            >
              <ChevronRightIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

      {/* Transaction Details Modal */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 box-border">
          <div className="fixed inset-0 bg-[#111111]/50 backdrop-blur-xs" onClick={() => setSelectedTx(null)}></div>
          
          <div className="relative w-full max-w-md bg-white border border-[#e5e7eb] rounded-3xl p-4 sm:p-6 shadow-2xl z-10 space-y-4 max-h-[85dvh] overflow-y-auto box-border">
            
            <div className="flex items-center justify-between border-b border-[#e5e7eb] pb-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-[#0b1e5b]/10 flex items-center justify-center shrink-0 text-[#0b1e5b]">
                  <BanknotesIcon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs sm:text-sm font-black text-[#0b1e5b] uppercase tracking-wide truncate">{selectedTx.type} Transaction</h3>
                  <span className="text-[10px] font-mono text-[#6b7280] block truncate">ID: {selectedTx.id}</span>
                </div>
              </div>
              <button 
                onClick={() => setSelectedTx(null)}
                className="w-8 h-8 rounded-xl bg-[#f8fafc] flex items-center justify-center text-[#6b7280] hover:text-[#0b1e5b] border border-[#e5e7eb] cursor-pointer shrink-0"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 bg-[#f8fafc] p-3.5 rounded-2xl border border-[#e5e7eb] text-xs font-mono w-full box-border">
              <div className="flex flex-col gap-1 border-b border-[#e5e7eb]/60 pb-2 w-full">
                <span className="text-[#6b7280] text-[10px]">User ID:</span>
                <span className="font-bold text-[#111111] break-all select-all text-xs">{selectedTx.user_id}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-[#e5e7eb]/60">
                <span className="text-[#6b7280]">Reference:</span>
                <span className="font-bold text-[#111111] truncate max-w-[200px]" title={selectedTx.reference}>{selectedTx.reference || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-[#e5e7eb]/60">
                <span className="text-[#6b7280]">Amount:</span>
                <span className="font-bold text-emerald-600">₦{Number(selectedTx.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-[#e5e7eb]/60">
                <span className="text-[#6b7280]">Balance After:</span>
                <span className="font-bold text-[#111111]">₦{Number(selectedTx.balance_after || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-[#e5e7eb]/60">
                <span className="text-[#6b7280]">Status:</span>
                <span className="uppercase font-bold text-[#0b1e5b]">{selectedTx.status}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-[#e5e7eb]/60">
                <span className="text-[#6b7280]">Timestamp:</span>
                <span className="font-bold text-[#111111]">
                  {selectedTx.created_at ? new Date(selectedTx.created_at).toLocaleString() : 'N/A'}
                </span>
              </div>
              <div className="flex flex-col gap-1 pt-1">
                <span className="text-[#6b7280] text-[10px]">Description:</span>
                <span className="text-[#111111] font-sans">{selectedTx.description || 'N/A'}</span>
              </div>
            </div>

            {/* Manual Action Card for Pending/Stuck Transactions */}
            {selectedTx.status !== 'success' && (
              <div className="space-y-2.5 bg-emerald-50/60 p-4 rounded-2xl border border-emerald-200 w-full box-border">
                <h4 className="text-xs font-bold text-emerald-900">Manual Transaction Approval</h4>
                <p className="text-[11px] text-emerald-700">Force approves this transaction and safely reconciles the user's wallet balance.</p>
                <button
                  onClick={handleForceCompleteTransaction}
                  disabled={actionLoading}
                  className="w-full py-3 min-h-[42px] rounded-xl font-bold text-xs transition cursor-pointer shadow-xs flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-40"
                >
                  <CheckCircleIcon className="w-4 h-4" />
                  <span>Approve & Update Wallet</span>
                </button>
              </div>
            )}

            <button
              onClick={() => setSelectedTx(null)}
              className="w-full py-3 min-h-[42px] rounded-xl bg-white border border-[#e5e7eb] text-[#111111] font-bold text-xs hover:bg-[#f8fafc] transition cursor-pointer"
            >
              Close
            </button>

          </div>
        </div>
      )}

      {/* CUSTOM ALERT MODAL */}
      {alertState.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-[#111111]/50 backdrop-blur-xs" onClick={() => setAlertState(prev => ({ ...prev, show: false }))}></div>
          <div className="relative w-full max-w-sm bg-white border border-[#e5e7eb] rounded-3xl p-6 shadow-2xl z-10 space-y-4 text-center">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto border ${
              alertState.type === 'success' 
                ? 'bg-emerald-50 text-emerald-600 border-emerald-200' 
                : 'bg-red-50 text-red-600 border-red-200'
            }`}>
              {alertState.type === 'success' ? <CheckCircleIcon className="w-6 h-6" /> : <ExclamationTriangleIcon className="w-6 h-6" />}
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-black text-[#0b1e5b]">{alertState.title}</h3>
              <p className="text-xs text-[#6b7280] leading-relaxed">{alertState.message}</p>
            </div>
            <button
              onClick={() => setAlertState(prev => ({ ...prev, show: false }))}
              className="w-full py-2.5 rounded-xl bg-[#0b1e5b] text-white font-bold text-xs hover:bg-[#0b1e5b]/90 transition cursor-pointer shadow-xs"
            >
              OK
            </button>
          </div>
        </div>
      )}

    </div>
  );
}