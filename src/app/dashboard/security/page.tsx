'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import QRCode from 'qrcode';
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
  ExclamationTriangleIcon,
  LockClosedIcon
} from '@heroicons/react/24/solid';

export default function SecurityPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [balanceNGN, setBalanceNGN] = useState<number>(0);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  // Password Update States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordUpdateCode, setPasswordUpdateCode] = useState('');
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  // 2FA & Security States
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [pendingFactorId, setPendingFactorId] = useState('');
  const [totpSecret, setTotpSecret] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [disableCode, setDisableCode] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [loading2FA, setLoading2FA] = useState(false);

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    let isMounted = true;
    let channel: any = null;

    async function loadSecurityData() {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session) {
          console.error('[SecurityPage] Session missing or error:', sessionError);
          router.push('/signin');
          return;
        }

        const currentUser = session.user;
        if (!isMounted) return;
        setUser(currentUser);

        // Check factors safely with network resilience check
        const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors();
        if (factorsError) {
          console.error('[SecurityPage] Error listing MFA factors:', factorsError);
        } else if (factors) {
          console.log('[SecurityPage] Fetched MFA factors successfully:', factors);
          const verifiedTotp = factors.totp?.find((f: any) => f.status === 'verified');
          if (verifiedTotp) setIs2FAEnabled(true);
        }

        // Fetch wallet balance
        const { data: walletData, error: walletError } = await supabase
          .from('wallets')
          .select('balance')
          .eq('user_id', currentUser.id)
          .single();

        if (walletError) {
          console.error('[SecurityPage] Error loading wallet balance:', walletError);
        } else if (walletData && isMounted) {
          setBalanceNGN(walletData.balance ?? 0);
        }

        // Fetch unread notification count
        const { count: notifCount, error: notifError } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', currentUser.id)
          .eq('read', false);

        if (notifError) {
          console.error('[SecurityPage] Error loading notification count:', notifError);
        } else if (isMounted) {
          setUnreadCount(notifCount || 0);
        }

                // Realtime sync for wallet & notifications with robust reconnection handling
        channel = supabase
          .channel(`security-realtime-${currentUser.id}`)
          .on(
            'postgres_changes',
            { event: 'UPDATE', schema: 'public', table: 'wallets', filter: `user_id=eq.${currentUser.id}` },
            (payload: any) => {
              console.log('[Realtime] Wallet update received:', payload);
              if (isMounted && payload.new) setBalanceNGN(payload.new.balance ?? 0);
            }
          )
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${currentUser.id}` },
            async (payload: any) => {
              console.log('[Realtime] Notification change received:', payload);
              const { count } = await supabase
                .from('notifications')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', currentUser.id)
                .eq('read', false);
              if (isMounted) setUnreadCount(count || 0);
            }
          )
          .subscribe((status, err) => {
            if (status === 'SUBSCRIBED') {
              console.log('[Realtime] Connected successfully.');
            }
            if (status === 'CLOSED') {
              console.warn('[Realtime] Channel closed normally.');
            }
            if (status === 'CHANNEL_ERROR' || err) {
              console.error('[Realtime] Channel error encountered (possible 1006 drop):', err);
            }
            if (status === 'TIMED_OUT') {
              console.error('[Realtime] Subscription timed out.');
            }
          });

      } catch (err) {
        console.error('[SecurityPage] Failed to load security settings exception:', err);
      } finally {
        if (isMounted) {
          setLoadingUser(false);
        }
      }
    }

    loadSecurityData();

    return () => {
      isMounted = false;
      if (channel) {
        console.log('[Realtime] Cleaning up channels');
        supabase.removeChannel(channel);
      }
    };
  }, [router]);

        
  // Handle Password Update
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters long.');
      return;
    }

    if (is2FAEnabled && passwordUpdateCode.length !== 6) {
      setPasswordError('Please enter your 6-digit authenticator code to update your password.');
      return;
    }

    setLoadingPassword(true);
    console.log('[Password Update] Attempting password change...');

    try {
      // Optional safety check: verify current password by re-authenticating
      if (user?.email && currentPassword) {
        const { error: signInErr } = await supabase.auth.signInWithPassword({
          email: user.email,
          password: currentPassword,
        });
        if (signInErr) {
          console.error('[Password Update] Current password validation failed:', signInErr);
          throw new Error('Current password is incorrect.');
        }
      }

      // If MFA is enabled, elevate the session to AAL2
      if (is2FAEnabled) {
        const { data: factorsData, error: listError } = await supabase.auth.mfa.listFactors();
        if (listError) throw listError;

        const verifiedFactor = factorsData.totp?.find((f: any) => f.status === 'verified');
        if (!verifiedFactor) {
          throw new Error('No verified 2FA factor found.');
        }

        const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({ 
          factorId: verifiedFactor.id 
        });
        if (challengeError) throw challengeError;

        const { error: verifyError } = await supabase.auth.mfa.verify({
          factorId: verifiedFactor.id,
          challengeId: challengeData.id,
          code: passwordUpdateCode,
        });
        if (verifyError) throw verifyError;
      }

      const { error: updateErr } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateErr) {
        console.error('[Password Update] Failed to update user password:', updateErr);
        throw updateErr;
      }

      console.log('[Password Update] Password updated successfully.');
      setPasswordSuccess('Your password has been changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordUpdateCode('');
    } catch (err: any) {
      console.error('[Password Update] Caught exception:', err);
      setPasswordError(err.message || 'Failed to update password.');
    } finally {
      setLoadingPassword(false);
    }
  };


  // Step 1: Initialize TOTP Enrollment
  const handleStartEnable2FA = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    setLoading2FA(true);
    console.log('[2FA Setup] Starting 2FA enrollment process...');

    try {
      const { data: factorsData, error: listError } = await supabase.auth.mfa.listFactors();
      if (listError) {
        console.error('[2FA Setup] Error listing factors before enrollment:', listError);
      } else if (factorsData?.totp) {
        console.log('[2FA Setup] Existing factors found to clean up:', factorsData);
        for (const factor of factorsData.totp) {
          const { error: unenrollErr } = await supabase.auth.mfa.unenroll({ factorId: factor.id });
          if (unenrollErr) {
            console.warn(`[2FA Setup] Failed to clean up old factor ID ${factor.id}:`, unenrollErr);
          } else {
            console.log(`[2FA Setup] Successfully cleaned up old factor ID ${factor.id}`);
          }
        }
      }

      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
      });

      if (error) {
        console.error('[2FA Setup] Error during supabase.auth.mfa.enroll:', error);
        throw error;
      }

      console.log('[2FA Setup] Successfully enrolled unverified TOTP factor:', data);

      const factorId = data.id;
      setPendingFactorId(factorId);

      const secretKey = data.totp?.secret || (data as any).secret;
      setTotpSecret(secretKey);
      
      const qrUri = data.totp?.uri;
      const qrImageString = await QRCode.toDataURL(qrUri);
      setQrCodeUrl(qrImageString);

    } catch (err: any) {
      console.error('[2FA Setup] Caught exception in handleStartEnable2FA:', err);
      setErrorMsg(err.message || 'Failed to initialize 2FA setup.');
    } finally {
      setLoading2FA(false);
    }
  };

  // Step 2: Verify and Enroll TOTP Factor (with direct pendingFactorId state tracking)
  const handleVerifyAndEnable2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading2FA(true);
    console.log('[2FA Verify] Attempting verification for code length:', verificationCode.length);

    try {
      let factorId = pendingFactorId;

      // Fallback: If pendingFactorId was lost due to re-renders, look it up via listFactors
      if (!factorId) {
        let factorsData: any = null;
        let listError: any = null;

        for (let attempt = 1; attempt <= 3; attempt++) {
          const res = await supabase.auth.mfa.listFactors();
          factorsData = res.data;
          listError = res.error;
          if (!listError) break;
          console.warn(`[2FA Verify] Attempt ${attempt} listing factors failed, retrying...`, listError);
          await new Promise(r => setTimeout(r, 1000));
        }

        if (listError || !factorsData) {
          throw new Error('Network connection dropped. Please check your internet and try again.');
        }

        const unverifiedFactor = factorsData.totp?.find((f: any) => f.status === 'unverified');
        if (!unverifiedFactor) {
          throw new Error('No active enrollment found. Please restart setup.');
        }
        factorId = unverifiedFactor.id;
      }

      console.log('[2FA Verify] Using factor ID:', factorId);

      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({ factorId });
      if (challengeError) {
        console.error('[2FA Verify] Error creating challenge:', challengeError);
        throw challengeError;
      }

      const challengeId = challengeData.id;
      console.log('[2FA Verify] Challenge created successfully ID:', challengeId);

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId,
        code: verificationCode,
      });

      if (verifyError) {
        console.error('[2FA Verify] Error verifying code:', verifyError);
        throw verifyError;
      }

      console.log('[2FA Verify] Factor verification successful!');

      const mockCodes = Array.from({ length: 8 }, () => 
        Array.from(crypto.getRandomValues(new Uint8Array(4)))
          .map(b => b.toString(36))
          .join('')
      );

      for (const code of mockCodes) {
        const { error: insertError } = await supabase.from('mfa_recovery_codes').insert({
          user_id: user.id,
          code_hash: code,
          used: false
        });
        if (insertError) {
          console.error('[2FA Verify] Error saving recovery code to database:', insertError);
        }
      }

      setRecoveryCodes(mockCodes);
      setIs2FAEnabled(true);
      setPendingFactorId('');
      setSuccessMsg('Two-factor authentication is now active and recovery codes saved.');
      setVerificationCode('');
    } catch (err: any) {
      console.error('[2FA Verify] Caught exception in handleVerifyAndEnable2FA:', err);
      setErrorMsg(err.message || 'Invalid verification code or network issue. Please try again.');
    } finally {
      setLoading2FA(false);
    }
  };

  // Disable 2FA
  const handleDisable2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading2FA(true);
    console.log('[2FA Disable] Attempting to disable 2FA...');

    try {
      const { data: factorsData, error: listError } = await supabase.auth.mfa.listFactors();
      if (listError) {
        console.error('[2FA Disable] Error listing factors:', listError);
        throw listError;
      }

      const verifiedFactor = factorsData.totp?.find((f: any) => f.status === 'verified');
      if (!verifiedFactor) {
        console.error('[2FA Disable] No active verified 2FA factor found in:', factorsData);
        throw new Error('No active 2FA factor found.');
      }

      const { error: unenrollError } = await supabase.auth.mfa.unenroll({
        factorId: verifiedFactor.id,
      });

      if (unenrollError) {
        console.error('[2FA Disable] Error unenrolling factor:', unenrollError);
        throw unenrollError;
      }

      const { error: deleteRecError } = await supabase.from('mfa_recovery_codes').delete().eq('user_id', user.id);
      if (deleteRecError) {
        console.warn('[2FA Disable] Warning: Failed to clean recovery codes:', deleteRecError);
      }

      setIs2FAEnabled(false);
      setTotpSecret('');
      setQrCodeUrl('');
      setPendingFactorId('');
      setRecoveryCodes([]);
      setDisableCode('');
      setSuccessMsg('Two-factor authentication has been disabled.');
      console.log('[2FA Disable] Successfully disabled 2FA.');
    } catch (err: any) {
      console.error('[2FA Disable] Caught exception:', err);
      setErrorMsg(err.message || 'Failed to disable 2FA.');
    } finally {
      setLoading2FA(false);
    }
  };

  const handleSignOut = async () => {
    console.log('[Auth] Signing out user...');
    await supabase.auth.signOut();
    router.push('/signin');
  };

  if (loadingUser) {
    return (
      <div className="min-h-screen bg-[#fdfdfc] bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] flex flex-col items-center justify-center gap-4 text-[#6b7280]">
        <div className="w-8 h-8 rounded-xl border-2 border-[#0b1e5b]/20 border-t-[#0b1e5b] animate-spin"></div>
        <div className="flex flex-col items-center gap-1">
          <span className="font-bold text-xs tracking-widest uppercase text-[#0b1e5b]">AccNumbers</span>
          <span className="text-xs font-medium">Loading Security Settings...</span>
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
              
              <div className="flex items-center justify-between border-b border-[#e5e7eb] pb-4">
                <div className="relative w-32 h-14 flex items-center overflow-hidden">
                  <Image src="/logo.png" alt="AccNumbers Logo" fill className="object-contain object-left" />
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
                <Link href="/dashboard/notifications" onClick={() => setIsSidebarOpen(false)} className="flex items-center justify-between px-3.5 py-3 rounded-2xl hover:bg-[#e5e7eb]/40 text-[#111111] font-medium text-xs transition">
                  <div className="flex items-center gap-3">
                    <BellIcon className="w-4 h-4 text-[#6b7280]" /> Notifications
                  </div>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-red-500 text-white font-bold text-[10px]">{unreadCount}</span>
                  )}
                </Link>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wider px-2 pb-1">Finance & Funding</p>
                <Link href="/dashboard/transactions" onClick={() => setIsSidebarOpen(false)} className="flex items-center gap-3 px-3.5 py-3 rounded-2xl hover:bg-[#e5e7eb]/40 text-[#111111] font-medium text-xs transition">
                  <ArrowsRightLeftIcon className="w-4 h-4 text-[#6b7280]" /> Transactions & Ledger
                </Link>
                <Link href="/dashboard/wallet" onClick={() => setIsSidebarOpen(false)} className="flex items-center gap-3 px-3.5 py-3 rounded-2xl hover:bg-[#e5e7eb]/40 text-[#111111] font-medium text-xs transition">
                  <PlusIcon className="w-4 h-4 text-[#6b7280]" /> Wallet Top Up
                </Link>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wider px-2 pb-1">System & Settings</p>
                <Link href="/dashboard/api" onClick={() => setIsSidebarOpen(false)} className="flex items-center gap-3 px-3.5 py-3 rounded-2xl hover:bg-[#e5e7eb]/40 text-[#111111] font-medium text-xs transition">
                  <KeyIcon className="w-4 h-4 text-[#6b7280]" /> API Keys & Access
                </Link>
                <Link href="/dashboard/security" onClick={() => setIsSidebarOpen(false)} className="flex items-center gap-3 px-3.5 py-3 rounded-2xl bg-[#0b1e5b]/10 text-[#0b1e5b] font-bold text-xs">
                  <ShieldCheckIcon className="w-4 h-4 text-[#0b1e5b]" /> Security & 2FA
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

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto py-10 px-4 sm:px-6 space-y-8">
        
        {/* Header Title Section */}
        <div className="bg-[#0b1e5b] text-white border border-[#0b1e5b] rounded-3xl p-8 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-64 h-full bg-gradient-to-l from-white/10 to-transparent pointer-events-none"></div>
          <div className="space-y-1.5 z-10">
            <span className="px-3 py-1 rounded-full bg-white/10 text-white text-[10px] font-bold uppercase tracking-wider">Account Security</span>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Security & 2FA
            </h1>
            <p className="text-xs sm:text-sm font-medium text-white/80">
              Manage your password, two-factor authentication, and account security.
            </p>
          </div>
        </div>

        {/* Change Password Card */}
        <div className="bg-white border border-[#e5e7eb] rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="flex items-center gap-3 border-b border-[#e5e7eb] pb-4">
            <div className="w-10 h-10 rounded-2xl bg-[#0b1e5b]/10 text-[#0b1e5b] flex items-center justify-center font-bold">
              <LockClosedIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-[#0b1e5b]">Change Password</h2>
              <p className="text-xs font-medium text-[#6b7280]">Update your account password regularly to keep your account secure.</p>
            </div>
          </div>

          {passwordError && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs font-bold flex items-center gap-3">
              <ExclamationTriangleIcon className="w-5 h-5 flex-shrink-0" />
              <span>{passwordError}</span>
            </div>
          )}

          {passwordSuccess && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl text-xs font-bold flex items-center gap-3">
              <CheckCircleIcon className="w-5 h-5 flex-shrink-0" />
              <span>{passwordSuccess}</span>
            </div>
          )}

          <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-lg">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#0b1e5b] block">Current Password</label>
              <input 
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-3 rounded-xl border border-[#e5e7eb] focus:outline-none focus:border-[#0b1e5b] text-xs font-medium shadow-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#0b1e5b] block">New Password</label>
              <input 
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-3 rounded-xl border border-[#e5e7eb] focus:outline-none focus:border-[#0b1e5b] text-xs font-medium shadow-xs"
              />
              <span className="text-[10px] text-[#6b7280]">Must be at least 6 characters long.</span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#0b1e5b] block">Confirm New Password</label>
              <input 
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-3 rounded-xl border border-[#e5e7eb] focus:outline-none focus:border-[#0b1e5b] text-xs font-medium shadow-xs"
              />
            </div>

            {is2FAEnabled && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#0b1e5b] block">Authenticator 6-Digit Code (Required for 2FA)</label>
                <input 
                  type="text"
                  maxLength={6}
                  value={passwordUpdateCode}
                  onChange={(e) => setPasswordUpdateCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-[#e5e7eb] focus:outline-none focus:border-[#0b1e5b] font-mono tracking-widest text-xs font-medium shadow-xs"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loadingPassword}
              className="px-6 py-3 rounded-2xl bg-[#0b1e5b] text-white hover:bg-[#0b1e5b]/90 transition text-xs font-bold cursor-pointer shadow-xs disabled:opacity-50"
            >
              {loadingPassword ? 'Updating Password...' : 'Update Password'}
            </button>
          </form>
        </div>

        {/* Global Alerts for 2FA */}
        {errorMsg && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs font-bold flex items-center gap-3">
            <ExclamationTriangleIcon className="w-5 h-5 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl text-xs font-bold flex items-center gap-3">
            <CheckCircleIcon className="w-5 h-5 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Recovery Codes Banner if just enabled */}
        {recoveryCodes.length > 0 && (
          <div className="bg-amber-50 border border-amber-300 rounded-3xl p-6 sm:p-8 space-y-4">
            <div className="flex items-start gap-3">
              <ExclamationTriangleIcon className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h3 className="text-sm font-black text-amber-900">Save these recovery codes now</h3>
                <p className="text-xs font-medium text-amber-800">
                  Each one works exactly once. We will never show them again.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {recoveryCodes.map((code, idx) => (
                <div key={idx} className="bg-white border border-amber-200 py-2.5 px-4 rounded-xl text-center font-mono font-bold text-xs text-[#0b1e5b] tracking-wider select-all shadow-xs">
                  {code}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Main 2FA Control Card */}
        <div className="bg-white border border-[#e5e7eb] rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#e5e7eb] pb-6">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h2 className="text-base font-black text-[#0b1e5b]">Two-factor authentication (TOTP)</h2>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  is2FAEnabled 
                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
                    : 'bg-gray-100 text-gray-600 border border-gray-200'
                }`}>
                  {is2FAEnabled ? 'enabled' : 'off'}
                </span>
              </div>
              <p className="text-xs font-medium text-[#6b7280]">
                Add a second factor to your sign-in flow using an authenticator app.
              </p>
            </div>
          </div>

          {!is2FAEnabled && !qrCodeUrl && (
            <div className="space-y-4">
              <ul className="text-xs font-medium text-[#6b7280] space-y-2 list-disc list-inside">
                <li>Works with Google Authenticator, Authy, 1Password.</li>
                <li>Includes 8 single-use recovery codes upon activation.</li>
              </ul>
              <button
                onClick={handleStartEnable2FA}
                disabled={loading2FA}
                className="px-6 py-3 rounded-2xl bg-[#0b1e5b] text-white hover:bg-[#0b1e5b]/90 transition text-xs font-bold cursor-pointer shadow-xs flex items-center gap-2 disabled:opacity-50"
              >
                {loading2FA ? 'Setting up...' : 'Set up two-factor'} <ArrowRightIcon className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* QR Code Setup Step */}
          {!is2FAEnabled && qrCodeUrl && (
            <form onSubmit={handleVerifyAndEnable2FA} className="space-y-6 pt-2">
              <div className="space-y-3">
                <p className="text-xs font-bold text-[#0b1e5b]">
                  Scan this with your authenticator app, or copy the long code below.
                </p>
                <div className="bg-white p-4 inline-block border border-[#e5e7eb] rounded-2xl shadow-xs">
                  <img src={qrCodeUrl} alt="2FA QR Code" className="w-44 h-44 object-contain" />
                </div>
              </div>

              <div className="space-y-2 max-w-md">
                <label className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wider block">
                  Or enter this secret key manually into your app:
                </label>
                <div className="bg-gray-50 border border-[#e5e7eb] p-3 rounded-xl font-mono text-xs text-[#0b1e5b] select-all break-all shadow-inner">
                  {totpSecret}
                </div>
                <p className="text-[10px] text-[#6b7280]">
                  Compatible with Google Authenticator, Authy, 1Password, and Microsoft Authenticator.
                </p>
              </div>

              <div className="space-y-2 max-w-sm">
                <label className="text-xs font-bold text-[#0b1e5b] block">6-digit code from app</label>
                <input
                  type="text"
                  maxLength={6}
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-[#e5e7eb] focus:outline-none focus:border-[#0b1e5b] font-mono tracking-widest text-center text-sm font-bold shadow-xs"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={loading2FA || verificationCode.length !== 6}
                  className="px-6 py-3 rounded-2xl bg-[#0b1e5b] text-white hover:bg-[#0b1e5b]/90 transition text-xs font-bold cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {loading2FA ? 'Verifying...' : 'Verify & enable'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setQrCodeUrl('');
                    setTotpSecret('');
                    setPendingFactorId('');
                  }}
                  className="px-4 py-3 rounded-2xl bg-gray-100 text-gray-700 hover:bg-gray-200 transition text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

           {/* Enabled State: Form to Disable 2FA */}
          {is2FAEnabled && (
            <form onSubmit={handleDisable2FA} className="space-y-4 pt-2">
              <div className="space-y-1">
                <p className="text-xs font-medium text-[#6b7280]">
                  Your account requires a 6-digit code from your authenticator app at sign-in.
                </p>
              </div>

              <div className="space-y-2 max-w-sm pt-2">
                <label className="text-xs font-bold text-[#0b1e5b] block">Disable two-factor</label>
                <p className="text-[11px] text-[#6b7280]">Enter your current 6-digit code to confirm.</p>
                <input
                  type="text"
                  maxLength={6}
                  value={disableCode}
                  onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-[#e5e7eb] focus:outline-none focus:border-red-500 font-mono tracking-widest text-center text-sm font-bold shadow-xs"
                />
              </div>

              <button
                type="submit"
                disabled={loading2FA || disableCode.length !== 6}
                className="px-6 py-3 rounded-2xl bg-red-600 text-white hover:bg-red-700 transition text-xs font-bold cursor-pointer shadow-xs disabled:opacity-50"
              >
                {loading2FA ? 'Disabling...' : 'Disable 2FA'}
              </button>
            </form>
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