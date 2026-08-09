'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { 
  PhoneIcon, 
  ArrowLeftIcon, 
  MagnifyingGlassIcon, 
  ArrowPathIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
  ArrowUturnLeftIcon,
  GlobeAltIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/solid';

// Helper function to resolve service logos dynamically using your preferred style
function getServiceLogo(serviceName: string) {
  const serviceSlug = (serviceName || '').toLowerCase().trim().replace(/\s+/g, '');
  
  const logos: Record<string, string> = {
    whatsapp: 'https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg',
    telegram: 'https://upload.wikimedia.org/wikipedia/commons/8/82/Telegram_logo.svg',
    facebook: 'https://upload.wikimedia.org/wikipedia/commons/b/b8/2021_Facebook_icon.svg',
    instagram: 'https://upload.wikimedia.org/wikipedia/commons/e/e7/Instagram_logo_2016.svg',
    twitter: 'https://upload.wikimedia.org/wikipedia/commons/c/ce/X_logo_2023_original.svg',
    google: 'https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg',
  };

  return logos[serviceSlug] || `https://www.google.com/s2/favicons?domain=${serviceSlug}.com&sz=128`;
}

export default function AdminRentalsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [rentals, setRentals] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed' | 'expired' | 'cancelled'>('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const rentalsPerPage = 5;

  // Selected Rental Modal State
  const [selectedRental, setSelectedRental] = useState<any | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Custom Alert & Confirm Modals State
  const [alertState, setAlertState] = useState<{ show: boolean; title: string; message: string; type: 'success' | 'error' }>({
    show: false,
    title: '',
    message: '',
    type: 'success'
  });
  
  const [confirmState, setConfirmState] = useState<{ show: boolean; title: string; message: string; onConfirm: (() => void) | null }>({
    show: false,
    title: '',
    message: '',
    onConfirm: null
  });

  async function loadRentals(isRefresh = false) {
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

      // 2. Fetch all rentals ordered by creation date
      const { data: rentalsData, error: rentalsError } = await supabase
        .from('rentals')
        .select('*')
        .order('created_at', { ascending: false });

      if (rentalsError) throw rentalsError;

      setRentals(rentalsData || []);
    } catch (err) {
      console.error('Error loading rentals:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadRentals();
  }, [router]);

  // Trigger Custom Confirmation Modal
  const promptRefundConfirmation = () => {
    if (!selectedRental) return;

    if (selectedRental.status === 'cancelled') {
      setAlertState({
        show: true,
        title: 'Already Cancelled',
        message: 'This rental has already been cancelled and refunded.',
        type: 'error'
      });
      return;
    }

    setConfirmState({
      show: true,
      title: 'Confirm Refund',
      message: `Are you sure you want to cancel this rental and refund ₦${Number(selectedRental.amount).toLocaleString()} to the user?`,
      onConfirm: executeRefundRental
    });
  };

  // Actual Refund Logic Execution with targeted error catching
  const executeRefundRental = async () => {
    setConfirmState({ show: false, title: '', message: '', onConfirm: null });
    if (!selectedRental) return;

    setActionLoading(true);

    try {
      const userId = selectedRental.user_id;
      const refundAmount = parseFloat(selectedRental.amount) || 0;

      // 1. Fetch current wallet balance safely using maybeSingle to prevent PGRST116 error if row doesn't exist
      let { data: walletData, error: walletFetchError } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', userId)
        .maybeSingle();

      if (walletFetchError) throw new Error(`Wallet fetch error: ${walletFetchError.message}`);

      let currentBalance = 0;

      if (!walletData) {
        // If user doesn't have a wallet row yet, create one
        const { error: walletInsertError } = await supabase
          .from('wallets')
          .insert({ user_id: userId, balance: refundAmount });

        if (walletInsertError) throw new Error(`Wallet insert error: ${walletInsertError.message}`);
        currentBalance = 0;
      } else {
        currentBalance = parseFloat(walletData?.balance || 0);
      }

      const newBalance = currentBalance + (walletData ? refundAmount : 0);

      if (walletData) {
        // 2. Update wallet balance if it already existed
        const { error: walletUpdateError } = await supabase
          .from('wallets')
          .update({ balance: newBalance })
          .eq('user_id', userId);

        if (walletUpdateError) throw new Error(`Wallet update error: ${walletUpdateError.message}`);
      }

      // 3. Update rental status to 'cancelled'
      const { error: rentalUpdateError } = await supabase
        .from('rentals')
        .update({ status: 'cancelled' })
        .eq('id', selectedRental.id);

      if (rentalUpdateError) throw new Error(`Rental update error: ${rentalUpdateError.message}`);

      // 4. Insert into transactions table
      const referenceCode = `REFUND-${Math.random().toString(36).substring(2, 9).toUpperCase()}-${Date.now().toString().slice(-5)}`;
      const { error: txError } = await supabase.from('transactions').insert({
        user_id: userId,
        type: 'refund',
        amount: refundAmount.toFixed(2),
        balance_after: newBalance.toFixed(2),
        status: 'success',
        reference: referenceCode,
        description: `Refund for rental #${selectedRental.id.slice(0, 8)} (${selectedRental.service})`
      });

      if (txError) throw new Error(`Transactions insert error: ${txError.message}`);

      // 5. Insert notification
      const { error: notifError } = await supabase.from('notifications').insert({
        user_id: userId,
        title: 'Rental Refunded 💸',
        message: `Your rental for ${selectedRental.service} (${selectedRental.country}) was cancelled and ₦${refundAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} has been refunded to your wallet.`,
        read: false
      });

      if (notifError) throw new Error(`Notifications insert error: ${notifError.message}`);

      // Reload fresh data from database so state and UI match securely
      await loadRentals();

      // Update selected modal state locally
      setSelectedRental({ ...selectedRental, status: 'cancelled' });
      
      setAlertState({
        show: true,
        title: 'Refund Successful',
        message: `Successfully refunded ₦${refundAmount.toLocaleString()} to user!`,
        type: 'success'
      });
    } catch (err: any) {
      console.error('Refund execution error:', err);
      setAlertState({
        show: true,
        title: 'Action Failed',
        message: err.message || 'Failed to process refund. Check console.',
        type: 'error'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const filteredRentals = rentals.filter((r) => {
    const userId = r.user_id || '';
    const phone = r.phone_number || '';
    const service = r.service || '';
    const country = r.country || '';
    const id = r.id || '';

    const matchesSearch = 
      userId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.toLowerCase().includes(searchQuery.toLowerCase()) ||
      country.toLowerCase().includes(searchQuery.toLowerCase()) ||
      id.toLowerCase().includes(searchQuery.toLowerCase());

    if (statusFilter === 'all') return matchesSearch;
    return matchesSearch && r.status === statusFilter;
  });

  const totalPages = Math.ceil(filteredRentals.length / rentalsPerPage) || 1;
  const paginatedRentals = filteredRentals.slice((currentPage - 1) * rentalsPerPage, currentPage * rentalsPerPage);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fdfdfc] flex flex-col items-center justify-center gap-4 text-[#6b7280]">
        <div className="w-10 h-10 rounded-full border-2 border-[#0b1e5b]/20 border-t-[#0b1e5b] animate-spin"></div>
        <span className="font-mono text-[11px] uppercase tracking-widest text-[#0b1e5b] font-bold">Loading Rentals...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fdfdfc] text-[#111111] space-y-4 max-w-7xl mx-auto pb-16 px-3 sm:px-6 lg:px-8 w-full max-w-[100vw] overflow-x-hidden box-border">
      
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
            Rentals Directory
          </h1>
          <p className="text-xs sm:text-sm text-[#6b7280]">
            Monitor verification logs and process refunds seamlessly across all devices.
          </p>
        </div>

        <button 
          onClick={() => loadRentals(true)}
          disabled={refreshing}
          className="p-2.5 sm:p-3 rounded-2xl bg-white border border-[#e5e7eb] text-[#6b7280] hover:text-[#0b1e5b] transition shadow-xs flex items-center justify-center cursor-pointer shrink-0 self-end sm:self-auto"
          title="Refresh"
        >
          <ArrowPathIcon className={`w-4 h-4 sm:w-5 sm:h-5 ${refreshing ? 'animate-spin text-[#0b1e5b]' : ''}`} />
        </button>
      </div>

      {/* Search & Status Filter Toolbar */}
      <div className="bg-white/95 backdrop-blur-md border border-[#e5e7eb] p-3 sm:p-4 rounded-2xl shadow-xs space-y-3 w-full box-border">
        <div className="relative w-full">
          <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6b7280]" />
          <input 
            type="text"
            placeholder="Search service, phone, user ID..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="w-full pl-10 pr-4 py-2.5 bg-[#f8fafc] border border-[#e5e7eb] rounded-xl text-xs sm:text-sm font-medium text-[#111111] focus:outline-none focus:border-[#0b1e5b] box-border"
          />
        </div>

        <div className="flex items-center gap-1.5 bg-[#f8fafc] p-1.5 rounded-xl border border-[#e5e7eb] overflow-x-auto w-full scrollbar-none [-webkit-overflow-scrolling:touch]">
          {(['all', 'pending', 'completed', 'expired', 'cancelled'] as const).map((st) => (
            <button
              key={st}
              onClick={() => { setStatusFilter(st); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-lg transition font-mono uppercase text-[10px] sm:text-xs cursor-pointer whitespace-nowrap shrink-0 ${
                statusFilter === st 
                  ? 'bg-white text-[#0b1e5b] font-bold shadow-xs border border-[#e5e7eb]' 
                  : 'text-[#6b7280] hover:text-[#111111]'
              }`}
            >
              {st} ({st === 'all' ? rentals.length : rentals.filter(r => r.status === st).length})
            </button>
          ))}
        </div>
      </div>

      {/* Rentals Content Container */}
      <div className="bg-white border border-[#e5e7eb] rounded-2xl sm:rounded-3xl shadow-xs overflow-hidden w-full box-border">
        
        {paginatedRentals.length === 0 ? (
          <div className="py-20 text-center space-y-2">
            <PhoneIcon className="w-10 h-10 text-slate-300 mx-auto" />
            <div className="text-sm font-bold text-[#6b7280]">No rental orders found.</div>
          </div>
        ) : (
          <>
            {/* MOBILE STREAM CARDS (< md) */}
            <div className="block md:hidden divide-y divide-[#e5e7eb] w-full max-w-full overflow-hidden">
              {paginatedRentals.map((r) => (
                <div key={r.id} className="p-3.5 space-y-2.5 bg-white w-full max-w-full box-border">
                  <div className="flex items-center justify-between gap-2 w-full">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-[#0b1e5b]/5 border border-[#e5e7eb] flex items-center justify-center p-1 shrink-0 overflow-hidden">
                        <img 
                          src={getServiceLogo(r.service)} 
                          alt={r.service} 
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-xs text-[#111111] truncate">{r.service}</div>
                        <div className="text-[10px] text-[#6b7280] flex items-center gap-1 font-mono truncate">
                          <GlobeAltIcon className="w-3 h-3 shrink-0" /> {r.country}
                        </div>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded font-mono font-bold text-[9px] uppercase border shrink-0 ${
                      r.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      r.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                      r.status === 'cancelled' ? 'bg-red-50 text-red-700 border-red-200' :
                      'bg-gray-100 text-gray-600 border-gray-200'
                    }`}>
                      {r.status}
                    </span>
                  </div>

                  <div className="bg-[#f8fafc] p-3 rounded-xl border border-[#e5e7eb] space-y-2 text-xs font-mono w-full max-w-full box-border overflow-hidden">
                    <div className="flex items-center justify-between gap-1 w-full">
                      <span className="text-[#6b7280] text-[10px] shrink-0">Phone:</span>
                      <span className="font-bold text-[#111111] text-xs truncate">{r.phone_number}</span>
                    </div>
                    <div className="flex items-center justify-between gap-1 w-full pt-1 border-t border-[#e5e7eb]/60">
                      <span className="text-[#6b7280] text-[10px] shrink-0">SMS Code:</span>
                      <span className="font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 text-xs truncate">{r.sms_code || 'Pending'}</span>
                    </div>
                    <div className="flex items-center justify-between gap-1 w-full pt-1 border-t border-[#e5e7eb]/60">
                      <span className="text-[#6b7280] text-[10px] shrink-0">Amount:</span>
                      <span className="font-bold text-emerald-600 text-xs truncate">₦{Number(r.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex items-center justify-between gap-1 w-full pt-1 border-t border-[#e5e7eb]/60 min-w-0">
                      <span className="text-[#6b7280] text-[9px] shrink-0">User ID:</span>
                      <span className="text-[#111111] text-[10px] font-mono truncate max-w-[180px]" title={r.user_id}>
                        {r.user_id}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedRental(r)}
                    className="w-full py-3 min-h-[42px] rounded-xl bg-[#0b1e5b]/5 border border-[#0b1e5b]/20 text-[#0b1e5b] font-bold text-xs transition active:scale-98 cursor-pointer flex items-center justify-center shadow-xs"
                  >
                    Manage Order
                  </button>
                </div>
              ))}
            </div>

             {/* DESKTOP TABLE VIEW (>= md) */}
            <div className="hidden md:block overflow-x-auto w-full">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#f8fafc] border-b border-[#e5e7eb] text-[11px] font-mono font-bold text-[#6b7280] uppercase tracking-wider">
                    <th className="py-4 px-6">Service / Country</th>
                    <th className="py-4 px-6">User ID</th>
                    <th className="py-4 px-6">Phone Number</th>
                    <th className="py-4 px-6">SMS Code</th>
                    <th className="py-4 px-6">Amount</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e5e7eb] text-sm">
                  {paginatedRentals.map((r) => (
                    <tr key={r.id} className="hover:bg-[#f8fafc]/60 transition">
                      <td className="py-4 px-6 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[#0b1e5b]/5 border border-[#e5e7eb] flex items-center justify-center p-1.5 shrink-0 overflow-hidden">
                          <img 
                            src={getServiceLogo(r.service)} 
                            alt={r.service} 
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        </div>
                        <div>
                          <div className="font-bold text-[#111111]">{r.service}</div>
                          <div className="text-xs text-[#6b7280] font-mono">{r.country}</div>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-[#6b7280] font-mono text-xs max-w-[150px] truncate" title={r.user_id}>
                        {r.user_id}
                      </td>
                      <td className="py-4 px-6 font-mono font-bold text-[#111111]">
                        {r.phone_number}
                      </td>
                      <td className="py-4 px-6 font-mono">
                        {r.sms_code ? (
                          <span className="px-2.5 py-1 bg-blue-50 text-blue-700 font-bold rounded-lg border border-blue-200">
                            {r.sms_code}
                          </span>
                        ) : (
                          <span className="text-[#6b7280] italic">Pending...</span>
                        )}
                      </td>
                      <td className="py-4 px-6 font-mono font-bold text-emerald-600">
                        ₦{Number(r.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-2.5 py-1 rounded-lg font-mono font-bold text-[10px] uppercase border ${
                          r.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          r.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          r.status === 'cancelled' ? 'bg-red-50 text-red-700 border-red-200' :
                          'bg-gray-100 text-gray-600 border-gray-200'
                        }`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => setSelectedRental(r)}
                          className="px-3.5 py-2 rounded-xl bg-white border border-[#e5e7eb] hover:border-[#0b1e5b] text-[#0b1e5b] font-bold text-xs transition shadow-2xs cursor-pointer"
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Pagination Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 sm:px-6 py-4 bg-[#f8fafc] border-t border-[#e5e7eb] w-full box-border">
          <div className="text-xs text-[#6b7280]">
            Showing <span className="font-bold text-[#111111]">{filteredRentals.length > 0 ? (currentPage - 1) * rentalsPerPage + 1 : 0}</span> to <span className="font-bold text-[#111111]">{Math.min(currentPage * rentalsPerPage, filteredRentals.length)}</span> of <span className="font-bold text-[#111111]">{filteredRentals.length}</span>
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

      {/* Management Modal */}
      {selectedRental && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 box-border">
          <div className="fixed inset-0 bg-[#111111]/50 backdrop-blur-xs" onClick={() => setSelectedRental(null)}></div>
          
          <div className="relative w-full max-w-md bg-white border border-[#e5e7eb] rounded-3xl p-4 sm:p-6 shadow-2xl z-10 space-y-4 max-h-[85dvh] overflow-y-auto box-border">
            
            <div className="flex items-center justify-between border-b border-[#e5e7eb] pb-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-[#0b1e5b]/5 border border-[#e5e7eb] flex items-center justify-center p-1.5 shrink-0 overflow-hidden">
                  <img 
                    src={getServiceLogo(selectedRental.service)} 
                    alt={selectedRental.service} 
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs sm:text-sm font-black text-[#0b1e5b] truncate">{selectedRental.service} ({selectedRental.country})</h3>
                  <span className="text-[10px] font-mono text-[#6b7280] block truncate">ID: {selectedRental.id}</span>
                </div>
              </div>
              <button 
                onClick={() => setSelectedRental(null)}
                className="w-8 h-8 rounded-xl bg-[#f8fafc] flex items-center justify-center text-[#6b7280] hover:text-[#0b1e5b] border border-[#e5e7eb] cursor-pointer shrink-0"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 bg-[#f8fafc] p-3.5 rounded-2xl border border-[#e5e7eb] text-xs font-mono w-full box-border">
              <div className="flex flex-col gap-1 border-b border-[#e5e7eb]/60 pb-2 w-full">
                <span className="text-[#6b7280] text-[10px]">User ID:</span>
                <span className="font-bold text-[#111111] break-all select-all text-xs">{selectedRental.user_id}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-[#e5e7eb]/60">
                <span className="text-[#6b7280]">Phone:</span>
                <span className="font-bold text-[#111111]">{selectedRental.phone_number}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-[#e5e7eb]/60">
                <span className="text-[#6b7280]">SMS Code:</span>
                <span className="font-bold text-blue-600">{selectedRental.sms_code || 'None'}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-[#e5e7eb]/60">
                <span className="text-[#6b7280]">Cost:</span>
                <span className="font-bold text-emerald-600">₦{Number(selectedRental.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-[#6b7280]">Status:</span>
                <span className="uppercase font-bold text-[#0b1e5b]">{selectedRental.status}</span>
              </div>
            </div>

            {/* Refund Action Card */}
            <div className="space-y-2.5 bg-amber-50/60 p-4 rounded-2xl border border-amber-200 w-full box-border">
              <h4 className="text-xs font-bold text-amber-900">Cancel & Refund User</h4>
              <p className="text-[11px] text-amber-700">Credits ₦{Number(selectedRental.amount || 0).toLocaleString()} back to their wallet.</p>
              <button
                onClick={promptRefundConfirmation}
                disabled={actionLoading || selectedRental.status === 'cancelled'}
                className="w-full py-3 min-h-[42px] rounded-xl font-bold text-xs transition cursor-pointer shadow-xs flex items-center justify-center gap-1.5 bg-red-600 hover:bg-red-700 text-white disabled:opacity-40"
              >
                <ArrowUturnLeftIcon className="w-4 h-4" />
                <span>{selectedRental.status === 'cancelled' ? 'Already Refunded' : 'Confirm Refund'}</span>
              </button>
            </div>

            <button
              onClick={() => setSelectedRental(null)}
              className="w-full py-3 min-h-[42px] rounded-xl bg-white border border-[#e5e7eb] text-[#111111] font-bold text-xs hover:bg-[#f8fafc] transition cursor-pointer"
            >
              Close
            </button>

          </div>
        </div>
      )}

      {/* CUSTOM CONFIRMATION MODAL */}
      {confirmState.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-[#111111]/50 backdrop-blur-xs" onClick={() => setConfirmState({ show: false, title: '', message: '', onConfirm: null })}></div>
          <div className="relative w-full max-w-sm bg-white border border-[#e5e7eb] rounded-3xl p-6 shadow-2xl z-10 space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto">
              <ExclamationTriangleIcon className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-black text-[#0b1e5b]">{confirmState.title}</h3>
              <p className="text-xs text-[#6b7280] leading-relaxed">{confirmState.message}</p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => setConfirmState({ show: false, title: '', message: '', onConfirm: null })}
                className="py-2.5 rounded-xl bg-[#f8fafc] border border-[#e5e7eb] text-[#6b7280] font-bold text-xs hover:bg-gray-100 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (confirmState.onConfirm) confirmState.onConfirm();
                }}
                className="py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition cursor-pointer shadow-xs"
              >
                Proceed
              </button>
            </div>
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