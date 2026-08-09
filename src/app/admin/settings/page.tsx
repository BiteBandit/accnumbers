'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { 
  ArrowLeftIcon, 
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  ClockIcon,
  WalletIcon,
  MegaphoneIcon
} from '@heroicons/react/24/solid';

export default function AdminSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // API Balance State
  const [apiBalance, setApiBalance] = useState<string | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);

  // Settings State mapped strictly to database keys (including announcement and community modal settings)
  const [settings, setSettings] = useState({
    markup_multiplier: '1.00',
    referral_percentage: '3.00',
    usd_to_ngn: '1364.9076',
    auto_refund_minutes: '10',
    min_deposit_amount: '500.00',
    maintenance_mode: 'false',
    low_stock_threshold: '50',
    announcement_active: 'false',
    announcement_text: '',
    show_group_modal: 'false',
  });

  // Custom Alert Modal State
  const [alertState, setAlertState] = useState<{ show: boolean; title: string; message: string; type: 'success' | 'error' }>({
    show: false,
    title: '',
    message: '',
    type: 'success'
  });

  async function fetchApiBalance() {
    setBalanceLoading(true);
    try {
      const res = await fetch('/api/admin/provider-balance');
      const data = await res.json();
      
      if (data.success) {
        setApiBalance(data.balance);
      } else {
        setApiBalance('Failed to load');
      }
    } catch (err) {
      console.error('Failed to fetch provider balance:', err);
      setApiBalance('Error fetching');
    } finally {
      setBalanceLoading(false);
    }
  }

  async function loadSettings(isRefresh = false) {
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

      // 2. Fetch standard settings from database table
      const { data: settingsData, error: settingsError } = await supabase
        .from('settings')
        .select('key, value');

      if (settingsError) throw settingsError;

      if (settingsData) {
        const newSettings: any = { ...settings };
        settingsData.forEach((item: any) => {
          if (item.key in newSettings) {
            newSettings[item.key] = item.value;
          }
        });
        setSettings(newSettings);
      }

      // 3. Fetch 5sim balance from .env backend handler
      await fetchApiBalance();

    } catch (err) {
      console.error('Error loading settings:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadSettings();
  }, [router]);

  const handleChange = (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveAll = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      for (const [key, value] of Object.entries(settings)) {
        const { error } = await supabase
          .from('settings')
          .update({ value: String(value), updated_at: new Date().toISOString() })
          .eq('key', key);

        if (error) throw new Error(`Failed to update ${key}: ${error.message}`);
      }

      setAlertState({
        show: true,
        title: 'Settings Saved',
        message: 'All platform configuration values have been updated successfully!',
        type: 'success'
      });
      await loadSettings();
    } catch (err: any) {
      console.error('Save settings error:', err);
      setAlertState({
        show: true,
        title: 'Save Failed',
        message: err.message || 'Could not save configuration changes.',
        type: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fdfdfc] flex flex-col items-center justify-center gap-4 text-[#6b7280]">
        <div className="w-10 h-10 rounded-full border-2 border-[#0b1e5b]/20 border-t-[#0b1e5b] animate-spin"></div>
        <span className="font-mono text-[11px] uppercase tracking-widest text-[#0b1e5b] font-bold">Loading Settings...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fdfdfc] bg-grid-pattern text-[#111111] space-y-6 max-w-5xl mx-auto pb-20 px-3 sm:px-6 lg:px-8 w-full max-w-[100vw] overflow-x-hidden box-border">
      
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
            Platform Settings
          </h1>
          <p className="text-xs sm:text-sm text-[#6b7280]">
            Configure pricing multipliers, conversion rates, and automated operational limits.
          </p>
        </div>

        <button 
          onClick={() => loadSettings(true)}
          disabled={refreshing}
          className="p-2.5 sm:p-3 rounded-2xl bg-white border border-[#e5e7eb] text-[#6b7280] hover:text-[#0b1e5b] transition shadow-xs flex items-center justify-center cursor-pointer shrink-0 self-end sm:self-auto"
          title="Refresh"
        >
          <ArrowPathIcon className={`w-4 h-4 sm:w-5 sm:h-5 ${refreshing ? 'animate-spin text-[#0b1e5b]' : ''}`} />
        </button>
      </div>

      {/* Upstream 5sim Balance Widget */}
      <div className="bg-gradient-to-r from-[#0b1e5b] to-[#1e3a8a] text-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
            <WalletIcon className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <span className="text-[11px] font-mono uppercase tracking-widest text-white/70">Provider Balance</span>
            <div className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              {balanceLoading ? 'Checking...' : (apiBalance || 'Not Connected')}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={fetchApiBalance}
          disabled={balanceLoading}
          className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-mono font-bold uppercase transition text-white cursor-pointer shrink-0"
        >
          {balanceLoading ? 'Updating...' : 'Refresh Balance'}
        </button>
      </div>

      <form onSubmit={handleSaveAll} className="space-y-6">

        {/* Section 1: Pricing & Conversions */}
        <div className="bg-white border border-[#e5e7eb] rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-3 border-b border-[#e5e7eb] pb-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shrink-0">
              <CurrencyDollarIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-[#0b1e5b]">Pricing & Conversions</h2>
              <p className="text-xs text-[#6b7280]">Manage base exchange rates and global profit markups.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-mono font-bold uppercase text-[#6b7280]">USD to NGN Exchange Rate (`usd_to_ngn`)</label>
              <input 
                type="number" 
                step="0.0001"
                value={settings.usd_to_ngn}
                onChange={(e) => handleChange('usd_to_ngn', e.target.value)}
                className="w-full px-4 py-2.5 bg-[#f8fafc] border border-[#e5e7eb] rounded-xl text-sm font-mono font-bold text-[#111111] focus:outline-none focus:border-[#0b1e5b]"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-mono font-bold uppercase text-[#6b7280]">Markup Multiplier (`markup_multiplier`)</label>
              <input 
                type="number" 
                step="0.01"
                value={settings.markup_multiplier}
                onChange={(e) => handleChange('markup_multiplier', e.target.value)}
                className="w-full px-4 py-2.5 bg-[#f8fafc] border border-[#e5e7eb] rounded-xl text-sm font-mono font-bold text-[#111111] focus:outline-none focus:border-[#0b1e5b]"
                required
              />
            </div>
          </div>
        </div>

        {/* Section 2: Order & Transaction Rules */}
        <div className="bg-white border border-[#e5e7eb] rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-3 border-b border-[#e5e7eb] pb-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center shrink-0">
              <ClockIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-[#0b1e5b]">Order & Transaction Rules</h2>
              <p className="text-xs text-[#6b7280]">Configure refund windows and funding limits.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-mono font-bold uppercase text-[#6b7280]">Auto-Refund Window (Minutes) (`auto_refund_minutes`)</label>
              <input 
                type="number" 
                value={settings.auto_refund_minutes}
                onChange={(e) => handleChange('auto_refund_minutes', e.target.value)}
                className="w-full px-4 py-2.5 bg-[#f8fafc] border border-[#e5e7eb] rounded-xl text-sm font-mono font-bold text-[#111111] focus:outline-none focus:border-[#0b1e5b]"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-mono font-bold uppercase text-[#6b7280]">Minimum Deposit Amount (₦) (`min_deposit_amount`)</label>
              <input 
                type="number" 
                step="0.01"
                value={settings.min_deposit_amount}
                onChange={(e) => handleChange('min_deposit_amount', e.target.value)}
                className="w-full px-4 py-2.5 bg-[#f8fafc] border border-[#e5e7eb] rounded-xl text-sm font-mono font-bold text-[#111111] focus:outline-none focus:border-[#0b1e5b]"
                required
              />
            </div>
          </div>
        </div>

        {/* Section 3: Referral & System Controls */}
        <div className="bg-white border border-[#e5e7eb] rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-3 border-b border-[#e5e7eb] pb-3">
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 border border-purple-200 flex items-center justify-center shrink-0">
              <UserGroupIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-[#0b1e5b]">Referral & System Controls</h2>
              <p className="text-xs text-[#6b7280]">Manage acquisition rewards and system safety switches.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-mono font-bold uppercase text-[#6b7280]">Referral Percentage (%) (`referral_percentage`)</label>
              <input 
                type="number" 
                step="0.01"
                value={settings.referral_percentage}
                onChange={(e) => handleChange('referral_percentage', e.target.value)}
                className="w-full px-4 py-2.5 bg-[#f8fafc] border border-[#e5e7eb] rounded-xl text-sm font-mono font-bold text-[#111111] focus:outline-none focus:border-[#0b1e5b]"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-mono font-bold uppercase text-[#6b7280]">Low Stock Threshold (`low_stock_threshold`)</label>
              <input 
                type="number" 
                value={settings.low_stock_threshold}
                onChange={(e) => handleChange('low_stock_threshold', e.target.value)}
                className="w-full px-4 py-2.5 bg-[#f8fafc] border border-[#e5e7eb] rounded-xl text-sm font-mono font-bold text-[#111111] focus:outline-none focus:border-[#0b1e5b]"
                required
              />
            </div>
          </div>

          <div className="pt-3 border-t border-[#e5e7eb] flex items-center justify-between gap-4">
            <div>
              <div className="text-xs font-mono font-bold uppercase text-[#111111]">Maintenance Mode (`maintenance_mode`)</div>
              <p className="text-xs text-[#6b7280]">Temporarily pause ordering and wallet actions globally.</p>
            </div>
            <select
              value={settings.maintenance_mode}
              onChange={(e) => handleChange('maintenance_mode', e.target.value)}
              className="px-4 py-2 bg-[#f8fafc] border border-[#e5e7eb] rounded-xl text-xs font-mono font-bold text-[#111111] focus:outline-none focus:border-[#0b1e5b]"
            >
              <option value="false">False (Active)</option>
              <option value="true">True (Offline)</option>
            </select>
          </div>
        </div>

        {/* Section 4: Platform Announcements & Modals */}
        <div className="bg-white border border-[#e5e7eb] rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-3 border-b border-[#e5e7eb] pb-3">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center shrink-0">
              <MegaphoneIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-[#0b1e5b]">Platform Announcements & Modals</h2>
              <p className="text-xs text-[#6b7280]">Control top notification banner text/visibility and community link popups.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            <div className="space-y-1.5">
              <label className="block text-xs font-mono font-bold uppercase text-[#6b7280]">Announcement Status (`announcement_active`)</label>
              <select
                value={settings.announcement_active}
                onChange={(e) => handleChange('announcement_active', e.target.value)}
                className="w-full px-4 py-2.5 bg-[#f8fafc] border border-[#e5e7eb] rounded-xl text-xs font-mono font-bold text-[#111111] focus:outline-none focus:border-[#0b1e5b]"
              >
                <option value="false">False (Hidden)</option>
                <option value="true">True (Visible)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-mono font-bold uppercase text-[#6b7280]">Community Modal (`show_group_modal`)</label>
              <select
                value={settings.show_group_modal}
                onChange={(e) => handleChange('show_group_modal', e.target.value)}
                className="w-full px-4 py-2.5 bg-[#f8fafc] border border-[#e5e7eb] rounded-xl text-xs font-mono font-bold text-[#111111] focus:outline-none focus:border-[#0b1e5b]"
              >
                <option value="false">False (Disabled)</option>
                <option value="true">True (Enabled on Entry)</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5 pt-2">
            <label className="block text-xs font-mono font-bold uppercase text-[#6b7280]">Announcement Message (`announcement_text`)</label>
            <input 
              type="text" 
              value={settings.announcement_text}
              onChange={(e) => handleChange('announcement_text', e.target.value)}
              placeholder="e.g. 🚀 Welcome! Enjoy instant non-VoIP numbers..."
              className="w-full px-4 py-2.5 bg-[#f8fafc] border border-[#e5e7eb] rounded-xl text-sm font-mono text-[#111111] focus:outline-none focus:border-[#0b1e5b]"
            />
          </div>
        </div>

        {/* Save Changes Action Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-[#0b1e5b] hover:bg-[#0b1e5b]/90 text-white font-bold text-xs uppercase tracking-wider transition shadow-md active:scale-98 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin"></div>
                <span>Saving Changes...</span>
              </>
            ) : (
              <span>Save All Configurations</span>
            )}
          </button>
        </div>

      </form>

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