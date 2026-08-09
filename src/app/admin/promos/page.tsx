'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { 
  ArrowLeftIcon, 
  ArrowPathIcon,
  PlusIcon,
  TagIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  TrashIcon,
  XMarkIcon
} from '@heroicons/react/24/solid';

interface PromoCode {
  id: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_deposit: number;
  max_uses: number | null;
  uses_count: number;
  is_active: boolean;
  created_at: string;
}

export default function AdminPromosPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [promos, setPromos] = useState<PromoCode[]>([]);
  
  // Create Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCode, setNewCode] = useState({
    code: '',
    discount_type: 'percentage' as 'percentage' | 'fixed',
    discount_value: '',
    min_deposit: '0',
    max_uses: ''
  });
  const [creating, setCreating] = useState(false);

  // Custom Alert Modal State
  const [alertState, setAlertState] = useState<{ show: boolean; title: string; message: string; type: 'success' | 'error' }>({
    show: false,
    title: '',
    message: '',
    type: 'success'
  });

  // Custom Confirmation Modal State
  const [confirmState, setConfirmState] = useState<{ show: boolean; title: string; message: string; onConfirm: () => void }>({
    show: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  async function loadPromos(isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        router.push('/signin');
        return;
      }

      // Verify Admin Privileges
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', session.user.id)
        .maybeSingle();

      if (!profile?.is_admin) {
        router.push('/dashboard');
        return;
      }

      // Fetch Promo Codes from database
      const { data, error } = await supabase
        .from('promo_codes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPromos(data || []);

    } catch (err) {
      console.error('Error loading promos:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadPromos();
  }, [router]);

  const handleCreatePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      const formattedCode = newCode.code.trim().toUpperCase();
      if (!formattedCode) throw new Error('Promo code cannot be empty.');

      const { error } = await supabase
        .from('promo_codes')
        .insert([{
          code: formattedCode,
          discount_type: newCode.discount_type,
          discount_value: parseFloat(newCode.discount_value),
          min_deposit: parseFloat(newCode.min_deposit || '0'),
          max_uses: newCode.max_uses ? parseInt(newCode.max_uses) : null,
          is_active: true
        }]);

      if (error) throw error;

      setAlertState({
        show: true,
        title: 'Promo Created',
        message: `Successfully created promo code: ${formattedCode}`,
        type: 'success'
      });

      setShowCreateModal(false);
      setNewCode({ code: '', discount_type: 'percentage', discount_value: '', min_deposit: '0', max_uses: '' });
      loadPromos();
    } catch (err: any) {
      setAlertState({
        show: true,
        title: 'Creation Failed',
        message: err.message || 'Could not create promo code.',
        type: 'error'
      });
    } finally {
      setCreating(false);
    }
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('promo_codes')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      setPromos(promos.map(p => p.id === id ? { ...p, is_active: !currentStatus } : p));
    } catch (err: any) {
      setAlertState({
        show: true,
        title: 'Update Failed',
        message: 'Failed to update status: ' + err.message,
        type: 'error'
      });
    }
  };

  const handleDeletePrompt = (id: string, code: string) => {
    setConfirmState({
      show: true,
      title: 'Delete Promo Code',
      message: `Are you sure you want to delete promo code "${code}"? This action cannot be undone.`,
      onConfirm: () => executeDelete(id)
    });
  };

  const executeDelete = async (id: string) => {
    setConfirmState(prev => ({ ...prev, show: false }));
    try {
      const { error } = await supabase
        .from('promo_codes')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setPromos(promos.filter(p => p.id !== id));
      setAlertState({
        show: true,
        title: 'Deleted',
        message: 'Promo code successfully deleted.',
        type: 'success'
      });
    } catch (err: any) {
      setAlertState({
        show: true,
        title: 'Delete Failed',
        message: 'Failed to delete: ' + err.message,
        type: 'error'
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fdfdfc] flex flex-col items-center justify-center gap-4 text-[#6b7280]">
        <div className="w-10 h-10 rounded-full border-2 border-[#0b1e5b]/20 border-t-[#0b1e5b] animate-spin"></div>
        <span className="font-mono text-[11px] uppercase tracking-widest text-[#0b1e5b] font-bold">Loading Promo Codes...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fdfdfc] bg-grid-pattern text-[#111111] space-y-6 max-w-6xl mx-auto pb-20 px-3 sm:px-6 lg:px-8 w-full max-w-[100vw] overflow-x-hidden box-border">
      
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
            Promo Code Management
          </h1>
          <p className="text-xs sm:text-sm text-[#6b7280]">
            Create and track discount vouchers and wallet funding bonus codes.
          </p>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button 
            onClick={() => loadPromos(true)}
            disabled={refreshing}
            className="p-3 rounded-2xl bg-white border border-[#e5e7eb] text-[#6b7280] hover:text-[#0b1e5b] transition shadow-xs flex items-center justify-center cursor-pointer"
            title="Refresh"
          >
            <ArrowPathIcon className={`w-4 h-4 ${refreshing ? 'animate-spin text-[#0b1e5b]' : ''}`} />
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-3 rounded-2xl bg-[#0b1e5b] hover:bg-[#0b1e5b]/90 text-white font-bold text-xs uppercase tracking-wider transition shadow-md flex items-center gap-2 cursor-pointer"
          >
            <PlusIcon className="w-4 h-4" /> Create Promo
          </button>
        </div>
      </div>

      {/* Promos List: Responsive Card View for Mobile & Table for Desktop */}
      <div className="bg-white border border-[#e5e7eb] rounded-2xl sm:rounded-3xl shadow-xs overflow-hidden">
        <div className="p-5 border-b border-[#e5e7eb] flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center shrink-0">
            <TagIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-black text-[#0b1e5b]">Active & Existing Vouchers</h2>
            <p className="text-xs text-[#6b7280]">All generated promo codes and usage metrics.</p>
          </div>
        </div>

        {promos.length === 0 ? (
          <div className="p-12 text-center space-y-3 text-[#6b7280]">
            <TagIcon className="w-10 h-10 mx-auto opacity-30" />
            <p className="text-xs font-mono uppercase tracking-wider">No promo codes found. Create your first one!</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#f8fafc] text-[#6b7280] font-mono uppercase tracking-wider border-b border-[#e5e7eb]">
                    <th className="p-4">Code</th>
                    <th className="p-4">Discount Type</th>
                    <th className="p-4">Value</th>
                    <th className="p-4">Min Deposit</th>
                    <th className="p-4">Uses</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e5e7eb]">
                  {promos.map((promo) => (
                    <tr key={promo.id} className="hover:bg-[#fdfdfc] transition">
                      <td className="p-4 font-mono font-black text-[#0b1e5b] text-sm">{promo.code}</td>
                      <td className="p-4 uppercase font-bold text-[#6b7280]">{promo.discount_type}</td>
                      <td className="p-4 font-bold text-emerald-600">
                        {promo.discount_type === 'percentage' ? `${promo.discount_value}%` : `₦${promo.discount_value}`}
                      </td>
                      <td className="p-4 font-mono">₦{promo.min_deposit}</td>
                      <td className="p-4 font-mono">
                        {promo.uses_count} {promo.max_uses ? `/ ${promo.max_uses}` : '(Unlimited)'}
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ${
                          promo.is_active ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-red-50 text-red-600 border border-red-200'
                        }`}>
                          {promo.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => toggleStatus(promo.id, promo.is_active)}
                          className={`px-3 py-1.5 rounded-xl font-mono text-[10px] font-bold uppercase tracking-wider transition cursor-pointer border ${
                            promo.is_active 
                              ? 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100' 
                              : 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100'
                          }`}
                        >
                          {promo.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => handleDeletePrompt(promo.id, promo.code)}
                          className="p-1.5 rounded-xl bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition cursor-pointer"
                          title="Delete promo code"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Stacked Card View */}
            <div className="grid grid-cols-1 gap-3 p-4 md:hidden">
              {promos.map((promo) => (
                <div key={promo.id} className="bg-[#f8fafc] border border-[#e5e7eb] rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-black text-sm text-[#0b1e5b]">{promo.code}</span>
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider ${
                      promo.is_active ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-red-50 text-red-600 border border-red-200'
                    }`}>
                      {promo.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs border-y border-[#e5e7eb] py-2">
                    <div>
                      <span className="text-[10px] font-mono text-[#6b7280] uppercase block">Type / Value</span>
                      <span className="font-bold text-[#111111] uppercase">
                        {promo.discount_type}: <span className="text-emerald-600">{promo.discount_type === 'percentage' ? `${promo.discount_value}%` : `₦${promo.discount_value}`}</span>
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-mono text-[#6b7280] uppercase block">Min Deposit</span>
                      <span className="font-mono font-bold text-[#111111]">₦{promo.min_deposit}</span>
                    </div>
                    <div className="col-span-2 pt-1">
                      <span className="text-[10px] font-mono text-[#6b7280] uppercase block">Usage Status</span>
                      <span className="font-mono text-xs">{promo.uses_count} {promo.max_uses ? `/ ${promo.max_uses} uses` : '(Unlimited)'}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      onClick={() => toggleStatus(promo.id, promo.is_active)}
                      className={`px-3 py-1.5 rounded-xl font-mono text-[10px] font-bold uppercase tracking-wider transition cursor-pointer border ${
                        promo.is_active 
                          ? 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100' 
                          : 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100'
                      }`}
                    >
                      {promo.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => handleDeletePrompt(promo.id, promo.code)}
                      className="px-3 py-1.5 rounded-xl bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition cursor-pointer text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1"
                    >
                      <TrashIcon className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

          {/* CREATE PROMO MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-[#111111]/50 backdrop-blur-xs" onClick={() => setShowCreateModal(false)}></div>
          <div className="relative w-full max-w-md bg-white border border-[#e5e7eb] rounded-3xl p-6 sm:p-8 shadow-2xl z-10 space-y-6 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-[#e5e7eb] pb-4">
              <h3 className="text-base font-black text-[#0b1e5b]">Create Promo Code</h3>
              <button onClick={() => setShowCreateModal(false)} className="p-1.5 rounded-full hover:bg-[#f8fafc] text-[#6b7280] cursor-pointer">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePromo} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-mono font-bold uppercase text-[#6b7280]">Promo Code Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. WELCOME20"
                  value={newCode.code}
                  onChange={(e) => setNewCode({ ...newCode, code: e.target.value })}
                  className="w-full px-4 py-2.5 bg-[#f8fafc] border border-[#e5e7eb] rounded-xl text-sm font-mono font-bold uppercase text-[#111111] focus:outline-none focus:border-[#0b1e5b]"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-mono font-bold uppercase text-[#6b7280]">Discount Type</label>
                  <select 
                    value={newCode.discount_type}
                    onChange={(e) => setNewCode({ ...newCode, discount_type: e.target.value as any })}
                    className="w-full px-4 py-2.5 bg-[#f8fafc] border border-[#e5e7eb] rounded-xl text-xs font-mono font-bold text-[#111111] focus:outline-none focus:border-[#0b1e5b]"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (₦)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-mono font-bold uppercase text-[#6b7280]">Discount Value</label>
                  <input 
                    type="number" 
                    step="0.01"
                    placeholder={newCode.discount_type === 'percentage' ? 'e.g. 10' : 'e.g. 500'}
                    value={newCode.discount_value}
                    onChange={(e) => setNewCode({ ...newCode, discount_value: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#f8fafc] border border-[#e5e7eb] rounded-xl text-sm font-mono font-bold text-[#111111] focus:outline-none focus:border-[#0b1e5b]"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-mono font-bold uppercase text-[#6b7280]">Min Deposit (₦)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={newCode.min_deposit}
                    onChange={(e) => setNewCode({ ...newCode, min_deposit: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#f8fafc] border border-[#e5e7eb] rounded-xl text-sm font-mono font-bold text-[#111111] focus:outline-none focus:border-[#0b1e5b]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-mono font-bold uppercase text-[#6b7280]">Max Uses (Optional)</label>
                  <input 
                    type="number" 
                    placeholder="Leave blank = infinite"
                    value={newCode.max_uses}
                    onChange={(e) => setNewCode({ ...newCode, max_uses: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#f8fafc] border border-[#e5e7eb] rounded-xl text-sm font-mono font-bold text-[#111111] focus:outline-none focus:border-[#0b1e5b]"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={creating}
                  className="w-full py-3 rounded-2xl bg-[#0b1e5b] hover:bg-[#0b1e5b]/90 text-white font-bold text-xs uppercase tracking-wider transition shadow-md cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {creating ? 'Creating...' : 'Save Promo Code'}
                </button>
              </div>
            </form>
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

      {/* CUSTOM CONFIRMATION MODAL */}
      {confirmState.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-[#111111]/50 backdrop-blur-xs" onClick={() => setConfirmState(prev => ({ ...prev, show: false }))}></div>
          <div className="relative w-full max-w-sm bg-white border border-[#e5e7eb] rounded-3xl p-6 shadow-2xl z-10 space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto border bg-amber-50 text-amber-600 border-amber-200">
              <ExclamationTriangleIcon className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-black text-[#0b1e5b]">{confirmState.title}</h3>
              <p className="text-xs text-[#6b7280] leading-relaxed">{confirmState.message}</p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => setConfirmState(prev => ({ ...prev, show: false }))}
                className="py-2.5 rounded-xl bg-[#f8fafc] text-[#6b7280] hover:text-[#111111] font-bold text-xs transition border border-[#e5e7eb] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmState.onConfirm}
                className="py-2.5 rounded-xl bg-red-600 text-white font-bold text-xs hover:bg-red-700 transition cursor-pointer shadow-xs"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}