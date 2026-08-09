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
  CheckCircleIcon 
} from '@heroicons/react/24/solid';

interface NotificationItem {
  id: string;
  user_id: string;
  title: string;
  message: string;
  created_at: string;
  read: boolean;
}

export default function NotificationsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [balanceNGN, setBalanceNGN] = useState<number>(0);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let channel: any = null;
    let isMounted = true;

    async function loadUserDataAndNotifications() {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session || !isMounted) {
          if (!session) router.push('/signin');
          return;
        }

        const currentUser = session.user;
        setUser(currentUser);

        // Fetch user wallet balance
        const { data: walletData, error: walletError } = await supabase
          .from('wallets')
          .select('balance')
          .eq('user_id', currentUser.id)
          .single();

        if (!walletError && walletData && isMounted) {
          setBalanceNGN(walletData.balance ?? 0);
        }

        // Fetch notifications from database
        const { data: notifData, error: notifError } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', currentUser.id)
          .order('created_at', { ascending: false });

        if (!notifError && notifData && isMounted) {
          setNotifications(notifData);
          
          // Calculate initial unread count
          const unreadItems = notifData.filter((n: NotificationItem) => !n.read);
          setUnreadCount(unreadItems.length);

          // Automatically mark unread notifications as true in the database
          const unreadIds = unreadItems.map((n: NotificationItem) => n.id);
          if (unreadIds.length > 0) {
            const { error: updateError } = await supabase
              .from('notifications')
              .update({ read: true })
              .in('id', unreadIds);

            if (!updateError && isMounted) {
              setNotifications(prev => prev.map(n => ({ ...n, read: true })));
              setUnreadCount(0);
            }
          }
        } else if (isMounted) {
          setNotifications([]);
        }

        if (!isMounted) return;

        // Setup Realtime Subscription for notifications (Attach .on() BEFORE .subscribe())
        channel = supabase
          .channel(`public:notifications:user_id=eq.${currentUser.id}-${Math.random().toString(36).substring(2, 9)}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'notifications',
              filter: `user_id=eq.${currentUser.id}`,
            },
            async (payload) => {
              if (!isMounted) return;
              if (payload.eventType === 'INSERT') {
                const newNotif = payload.new as NotificationItem;
                
                // Instantly mark the incoming real-time notification as read since user is on the page
                await supabase
                  .from('notifications')
                  .update({ read: true })
                  .eq('id', newNotif.id);

                newNotif.read = true;

                if (isMounted) {
                  setNotifications((prev) => [newNotif, ...prev]);
                }
              } else if (payload.eventType === 'UPDATE') {
                const updatedNotif = payload.new as NotificationItem;
                if (isMounted) {
                  setNotifications((prev) =>
                    prev.map((n) => (n.id === updatedNotif.id ? updatedNotif : n))
                  );
                }
              } else if (payload.eventType === 'DELETE') {
                const deletedNotif = payload.old as NotificationItem;
                if (isMounted) {
                  setNotifications((prev) => prev.filter((n) => n.id !== deletedNotif.id));
                }
              }
            }
          )
          .subscribe();

      } catch (err) {
        console.error('Failed to load notifications page data:', err);
      } finally {
        if (isMounted) {
          setLoadingUser(false);
          setLoading(false);
        }
      }
    }

    loadUserDataAndNotifications();

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
          <span className="text-xs font-medium">Loading Notifications...</span>
        </div>
      </div>
    );
  }

  const displayName = user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'kelvin';

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
          {/* Notification Bell with Badge */}
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
                  className="flex items-center justify-between px-3.5 py-3 rounded-2xl bg-[#0b1e5b]/10 text-[#0b1e5b] font-bold text-xs"
                >
                  <div className="flex items-center gap-3">
                    <BellIcon className="w-4 h-4 text-[#0b1e5b]" /> Notifications
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

      {/* Main Notifications Content Area matching Dashboard Layout */}
      <main className="flex-1 max-w-4xl w-full mx-auto py-10 px-4 sm:px-6 space-y-8">
        
        {/* Header Title Section styled in Dark Blue */}
        <div className="bg-[#0b1e5b] text-white border border-[#0b1e5b] rounded-3xl p-8 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-64 h-full bg-gradient-to-l from-white/10 to-transparent pointer-events-none"></div>
          <div className="space-y-1.5 z-10">
            <span className="px-3 py-1 rounded-full bg-white/10 text-white text-[10px] font-bold uppercase tracking-wider">Notifications Hub</span>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              All notifications
            </h1>
            <p className="text-xs sm:text-sm font-medium text-white/80">
              {loading ? 'Loading notifications...' : `${notifications.length} total notifications`}
            </p>
          </div>
        </div>

        {/* Notifications Feed */}
        <div className="space-y-4">
          {loading ? (
            <div className="p-12 text-center text-xs font-bold text-[#6b7280] bg-white rounded-3xl border border-[#e5e7eb] shadow-sm">
              Checking for system updates...
            </div>
          ) : notifications.length > 0 ? (
            <div className="space-y-3">
              {notifications.map((item) => (
                <div
                  key={item.id}
                  className="p-6 bg-white border border-[#e5e7eb] rounded-3xl shadow-sm space-y-2 transition hover:border-[#0b1e5b]/40"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#0b1e5b] flex items-center justify-center">
                        <BellIcon className="w-4 h-4" />
                      </div>
                      <h3 className="text-sm font-black text-[#0b1e5b]">{item.title}</h3>
                    </div>
                    <span className="text-[10px] font-bold text-[#6b7280]">
                      {new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm font-medium text-[#6b7280] leading-relaxed pl-10">
                    {item.message}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white border border-[#e5e7eb] rounded-3xl p-12 shadow-sm text-center space-y-4 max-w-md mx-auto">
              <div className="w-14 h-14 rounded-2xl bg-[#0b1e5b]/5 border border-[#0b1e5b]/10 flex items-center justify-center mx-auto text-[#0b1e5b]">
                <BellIcon className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-black text-[#0b1e5b]">No notifications yet</h3>
                <p className="text-xs font-medium text-[#6b7280] leading-relaxed">
                  We'll notify you here when something important happens regarding your account, top-ups, or orders.
                </p>
              </div>
              <div className="pt-2">
                <Link 
                  href="/dashboard"
                  className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-[#0b1e5b] text-white text-xs font-bold shadow-xs hover:bg-[#0b1e5b]/90 transition"
                >
                  Back to Dashboard
                </Link>
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
