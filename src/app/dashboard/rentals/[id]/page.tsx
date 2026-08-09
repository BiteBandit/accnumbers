'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { 
  Bars3Icon, 
  XMarkIcon, 
  WalletIcon, 
  ClipboardDocumentListIcon, 
  MagnifyingGlassIcon, 
  UsersIcon,
  BellIcon,
  ArrowsRightLeftIcon,
  KeyIcon,
  ShieldCheckIcon,
  ArrowRightOnRectangleIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  ClockIcon,
  ChatBubbleLeftRightIcon,
  DocumentDuplicateIcon,
  CheckIcon,
  ArrowLeftIcon,
  PhoneIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  ArrowRightIcon,
  ShieldExclamationIcon,
  CheckBadgeIcon,
  InformationCircleIcon,
  QuestionMarkCircleIcon 
} from '@heroicons/react/24/solid';

const getServiceLogoUrl = (serviceName: string) => {
  if (!serviceName) return '';
  const name = serviceName.toLowerCase().trim();
  
  const logos: Record<string, string> = {
    whatsapp: 'https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg',
    telegram: 'https://upload.wikimedia.org/wikipedia/commons/8/82/Telegram_logo.svg',
    facebook: 'https://upload.wikimedia.org/wikipedia/commons/b/b8/2021_Facebook_icon.svg',
    instagram: 'https://upload.wikimedia.org/wikipedia/commons/e/e7/Instagram_logo_2016.svg',
    twitter: 'https://upload.wikimedia.org/wikipedia/commons/6/6f/Logo_of_Twitter.svg',
    google: 'https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg',
    netflix: 'https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg',
    tinder: 'https://upload.wikimedia.org/wikipedia/commons/c/c5/Tinder_logo_2017.svg',
    apple: 'https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg',
    microsoft: 'https://upload.wikimedia.org/wikipedia/commons/9/96/Microsoft_logo_%282012%29.svg',
  };

  return logos[name] || `https://www.google.com/s2/favicons?domain=${name}.com&sz=128`;
};

export default function RentalDetailPage() {
  const router = useRouter();
  const params = useParams();
  const rentalId = params?.id;

  const [currentUserData, setCurrentUserData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // State for the Slide-in FAQ Drawer
  const [isFaqOpen, setIsFaqOpen] = useState(false);

  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [rentalSession, setRentalSession] = useState<any>(null);
  const [logoHasError, setLogoHasError] = useState(false);
  
      const [copiedItemText, setCopiedItemText] = useState<string | null>(null);
  const [isUpdatingAction, setIsUpdatingAction] = useState(false);
  const [isCheckingCode, setIsCheckingCode] = useState(false);
  const [codeCooldown, setCodeCooldown] = useState(0);
  const isPollingActiveRef = useRef(true);
  const pollFunctionRef = useRef<(() => void) | null>(null);
  const pollTimeoutRef = useRef<NodeJS.Timeout | null>(null); // Add this here
    const isFetchingRef = useRef(false); // <-- Moved here safely


  const [activeBannerIndex, setActiveBannerIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number>(1200);
  const [cancelGraceTimeLeft, setCancelGraceTimeLeft] = useState<number>(60);

   // 🔔 ADD THIS AUDIO HELPER FUNCTION HERE:
  const playNotificationSound = () => {
    try {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      audio.volume = 0.6;
      audio.play().catch(() => {});
    } catch (err) {
      // Fallback silently if blocked by browser policies
    }
  };
  
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    actionType: 'cancel' | 'ban' | 'finish' | null;
  }>({
    isOpen: false,
    title: '',
    description: '',
    actionType: null,
  });

  const [alertDialog, setAlertDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
  }>({
    isOpen: false,
    title: '',
    description: '',
  });

  const bannerTips = [
    {
      title: "Can't receive SMS?",
      description: "Try requesting the SMS message for the service you need again.",
    },
    {
      title: "Your IP address' country",
      description: "Should be the same as the country of the phone number you bought. Be sure to use proxy or VPN.",
    },
    {
      title: "Can't receive SMS?",
      description: "Use a different browser or device for signing up.",
    },
    {
      title: "Can't receive SMS?",
      description: "Study the Statistics to make sure you are using the operator with the best delivery rate.",
    },
  ];

  useEffect(() => {
    const bannerInterval = setInterval(() => {
      setActiveBannerIndex((prev) => (prev + 1) % bannerTips.length);
    }, 4000);
    return () => clearInterval(bannerInterval);
  }, [bannerTips.length]);

    useEffect(() => {
  let rentalSubscription: any = null;
  let walletSubscription: any = null;
  let notifSubscription: any = null;
  let isCancelled = false;

  // Ensure polling is explicitly enabled fresh on every mount/effect run
  isPollingActiveRef.current = true;

  async function loadRentalDetails() {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        router.push('/signin');
        return;
      }

      if (isCancelled) return;

      const userAccount = session.user;
      setCurrentUserData(userAccount);

      const { data: walletData } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', userAccount.id)
        .maybeSingle();

      if (isCancelled) return;

      if (walletData) {
        setWalletBalance(Number(walletData.balance ?? 0));
      }

      const { count: unread, error: unreadError } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userAccount.id)
        .eq('read', false);

      if (!unreadError && !isCancelled) {
        setUnreadCount(unread || 0);
      }

      let query = supabase.from('rentals').select('*').eq('user_id', userAccount.id);
      
      if (rentalId) {
        if (!isNaN(Number(rentalId))) {
          query = query.eq('idx', Number(rentalId));
        } else {
          query = query.eq('id', rentalId);
        }
      }

      const { data: rentalData, error: rentalError } = await query.maybeSingle();

      if (isCancelled) return;

      if (rentalError || !rentalData) {
        router.push('/dashboard/rentals');
        return;
      }

      let initialData = rentalData;
      const orderId = rentalData.external_order_id || rentalData.id;

      try {
        const checkRes = await fetch(`/api/5sim/check?id=${orderId}`);
        const checkJson = await checkRes.json();

        if (checkJson.success && !isCancelled) {
          initialData = {
            ...rentalData,
            status: checkJson.status || checkJson.rawStatus,
            sms: checkJson.sms,
            expires: checkJson.expires || rentalData.expires,
          };
        }
      } catch (err) {
        console.error("[DEBUG_5SIM_CHECK_INITIAL] Initial sync failed:", err);
      }

      if (isCancelled) return;

      setRentalSession(initialData);

      if (!['FINISHED', 'COMPLETED', 'CANCELED', 'CANCELLED', 'EXPIRED', 'BANNED', 'TIMEOUT'].includes(initialData.status?.toUpperCase())) {
        playNotificationSound();
      }

      const createdTimestamp = new Date(initialData.created_at).getTime();
      const now = Date.now();
      const elapsedSeconds = Math.floor((now - createdTimestamp) / 1000);
      const remainingGraceTime = Math.max(0, 60 - elapsedSeconds);

      setCancelGraceTimeLeft(remainingGraceTime);

      const poll = async (isManual = false) => {
        if ((!isPollingActiveRef.current && !isManual) || isFetchingRef.current || isCancelled) return;

        isFetchingRef.current = true;

        try {
          const res = await fetch(`/api/5sim/check?id=${orderId}`);
          
          if (!res.ok) {
            throw new Error(`Network response failed with status ${res.status}`);
          }

          const json = await res.json();

          if ((!json.success && !isManual) || isCancelled) return;

          const status = (json.status || json.rawStatus)?.toUpperCase();

          setRentalSession(prev => {
            if (isCancelled) return prev;
            const prevSmsCount = Array.isArray(prev?.sms) ? prev.sms.length : 0;
            const newSms = json.sms || prev?.sms;
            const newSmsCount = Array.isArray(newSms) ? newSms.length : 0;
            
            if (newSmsCount > prevSmsCount) {
              isPollingActiveRef.current = false;
              if (pollTimeoutRef.current) {
                clearTimeout(pollTimeoutRef.current);
                pollTimeoutRef.current = null;
              }
              setCodeCooldown(0);
              playNotificationSound();
            }

            return {
              ...prev,
              status: status || prev?.status,
              sms: newSms,
              expires: json.expires || prev?.expires,
            };
          });

          if (
            [
              "EXPIRED",
              "CANCELED",
              "CANCELLED",
              "FINISHED",
              "BANNED",
              "TIMEOUT",
            ].includes(status)
          ) {
            isPollingActiveRef.current = false;

            if (pollTimeoutRef.current) {
              clearTimeout(pollTimeoutRef.current);
              pollTimeoutRef.current = null;
            }

            return;
          }
        } catch (e) {
          console.error("[DEBUG_POLL_CHECK] Fetch error encountered:", e);
        } finally {
          isFetchingRef.current = false;
        }

        if (isPollingActiveRef.current && !isCancelled) {
          pollTimeoutRef.current = setTimeout(() => poll(false), 5000);
        }
      };

      pollFunctionRef.current = () => poll(true);
      poll(false);

      if (isCancelled) return;

      rentalSubscription = supabase
        .channel(`rental-live-${rentalData.id}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'rentals',
            filter: `id=eq.${rentalData.id}`,
          },
          (payload) => {
            if (payload.new && !isCancelled) {
              setRentalSession((prev: any) => ({ ...prev, ...payload.new }));
            }
          }
        )
        .subscribe();

      walletSubscription = supabase
        .channel(`wallet-live-${userAccount.id}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'wallets',
            filter: `user_id=eq.${userAccount.id}`,
          },
          (payload) => {
            if (payload.new && payload.new.balance !== undefined && !isCancelled) {
              setWalletBalance(Number(payload.new.balance));
            }
          }
        )
        .subscribe();

      notifSubscription = supabase
        .channel(`notifications-channel-${userAccount.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${userAccount.id}`,
          },
          async () => {
            if (isCancelled) return;
            const { count: updatedUnread } = await supabase
              .from('notifications')
              .select('*', { count: 'exact', head: true })
              .eq('user_id', userAccount.id)
              .eq('read', false);

            if (!isCancelled) {
              setUnreadCount(updatedUnread || 0);
            }
          }
        )
        .subscribe();

    } catch (err) {
      console.error('[DEBUG_LOAD_RENTAL] Error fetching rental page data:', err);
    } finally {
      if (!isCancelled) {
        setIsLoading(false);
      }
    }
  }

  if (rentalId) {
    loadRentalDetails();
  }

  return () => {
    isCancelled = true;
    isPollingActiveRef.current = false; 

    if (rentalSubscription) {
      supabase.removeChannel(rentalSubscription);
      rentalSubscription = null;
    }
    if (walletSubscription) {
      supabase.removeChannel(walletSubscription);
      walletSubscription = null;
    }
    if (notifSubscription) {
      supabase.removeChannel(notifSubscription);
      notifSubscription = null;
    }
    if (pollTimeoutRef.current) {
      clearTimeout(pollTimeoutRef.current);
      pollTimeoutRef.current = null;
    }
  };

}, [rentalId, router]);



    // 1. Initialize timeLeft when the session first loads or expires changes
  useEffect(() => {
    if (!rentalSession) return;

    const calculateTimeLeft = () => {
      if (rentalSession.expires) {
        const expirationTime = new Date(rentalSession.expires).getTime();
        return Math.max(0, Math.floor((expirationTime - Date.now()) / 1000));
      } else {
        const createdTimestamp = new Date(rentalSession.created_at).getTime();
        const elapsedSeconds = Math.floor((Date.now() - createdTimestamp) / 1000);
        return Math.max(0, 1200 - elapsedSeconds);
      }
    };

    setTimeLeft(calculateTimeLeft());
  }, [rentalSession?.id, rentalSession?.expires]);

  // 2. Clean standalone tick interval that safely decrements every second
  useEffect(() => {
    const upperStatus = rentalSession?.status?.toUpperCase();
    if (['FINISHED', 'COMPLETED', 'CANCELED', 'CANCELLED', 'EXPIRED', 'BANNED', 'TIMEOUT', 'RECEIVED'].includes(upperStatus)) {
      return;
    }

    const timerInterval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerInterval);
          setRentalSession((current: any) => ({ ...current, status: 'EXPIRED' }));
          return 0;
        }
        return prev - 1;
      });

      setCancelGraceTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timerInterval);
  }, [rentalSession?.status]);



  const handleUserSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/signin');
  };

  const copyToClipboard = (textToCopy: string, fieldIdentifier: string) => {
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy);
    setCopiedItemText(fieldIdentifier);
    setTimeout(() => {
      setCopiedItemText(null);
    }, 2000);
  };

  const promptAction = (actionType: 'cancel' | 'ban' | 'finish') => {
    if (!rentalSession || isUpdatingAction) return;

    if (actionType === 'cancel' && cancelGraceTimeLeft > 0) {
      setAlertDialog({
        isOpen: true,
        title: 'Please wait a moment',
        description: `To prevent premature cancellations, a short verification window is enforced. Cancellation available in ${cancelGraceTimeLeft} seconds.`,
      });
      return;
    }

    const configs = {
      cancel: {
        title: 'Cancel & Refund Rental?',
        description: 'This will terminate your order, release the number, and instantly refund your money.',
      },
      ban: {
        title: 'Report Number as Banned?',
        description: 'Use this if the number is already blocked or flagged by the platform. This will close the order and refund your funds.',
      },
      finish: {
        title: 'Mark Order as Complete?',
        description: 'Confirm that you have successfully received your SMS code and completed registration. This finalizes the order.',
      },
    };

    setConfirmDialog({
      isOpen: true,
      title: configs[actionType].title,
      description: configs[actionType].description,
      actionType,
    });
  };

              const handleResendSms = async () => {
    if (isUpdatingAction || isCheckingCode || codeCooldown > 0) return;
    setIsCheckingCode(true);
    
    // Enable active polling via ref
    isPollingActiveRef.current = true;
    
    // Clear any existing timeout before triggering
    if (pollTimeoutRef.current) {
      clearTimeout(pollTimeoutRef.current);
      pollTimeoutRef.current = null;
    }

    // Trigger the first check immediately
    if (pollFunctionRef.current) {
      await pollFunctionRef.current();
    }
    
    setTimeout(() => {
      setIsCheckingCode(false);
    }, 600);

    // Start a 45-second cooldown/active checking window
    setCodeCooldown(45);
    const cooldownInterval = setInterval(() => {
      setCodeCooldown((prev) => {
        if (prev <= 1 || !isPollingActiveRef.current) {
          clearInterval(cooldownInterval);
          isPollingActiveRef.current = false;
          if (pollTimeoutRef.current) {
            clearTimeout(pollTimeoutRef.current);
            pollTimeoutRef.current = null;
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };




    const executeAction = async () => {
    const selectedAction = confirmDialog.actionType;
    setConfirmDialog({ isOpen: false, title: '', description: '', actionType: null });
    if (!selectedAction) return;

    setIsUpdatingAction(true);
    try {
      const endpointMap = {
        cancel: '/api/5sim/cancel',
        ban: '/api/5sim/ban',
        finish: '/api/5sim/finish',
      };

      const res = await fetch(endpointMap[selectedAction], {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          rentalId: rentalSession.id, 
          externalOrderId: rentalSession.external_order_id,
          userId: currentUserData.id,
          amount: rentalSession.amount 
        })
      });
      const json = await res.json();

      if (!json.success) {
        throw new Error(json.error || 'Failed to update order status.');
      }

      const newStatus = json.order?.status || (selectedAction === 'cancel' ? 'CANCELED' : selectedAction === 'ban' ? 'BANNED' : 'FINISHED');

      setRentalSession((prev: any) => ({ ...prev, status: newStatus }));
      
      const successMessages = {
        cancel: `Rental cancelled successfully. ₦${Number(rentalSession.amount).toLocaleString()} has been refunded to your wallet.`,
        ban: `Number marked as banned. ₦${Number(rentalSession.amount).toLocaleString()} has been refunded to your wallet.`,
        finish: 'Order successfully completed and finalized!',
      };

      setAlertDialog({
        isOpen: true,
        title: selectedAction === 'finish' ? 'Order Finished' : 'Action Successful',
        description: successMessages[selectedAction],
      });

    } catch (err: any) {
      console.error('Action execution failed:', err);
      
      // Handle orders already closed or processed externally
      const errorMessage = err?.message || 'Could not process request.';
      if (errorMessage.includes('already been processed') || errorMessage.includes('closed')) {
        setRentalSession((prev: any) => ({ ...prev, status: 'EXPIRED' }));
      }

      setAlertDialog({
        isOpen: true,
        title: 'Action Notice',
        description: errorMessage,
      });
    } finally {
      setIsUpdatingAction(false);
    }
  };


  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#fdfdfc] bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] flex flex-col items-center justify-center gap-4 text-[#6b7280]">
        <div className="w-8 h-8 rounded-xl border-2 border-[#0b1e5b]/20 border-t-[#0b1e5b] animate-spin"></div>
        <div className="flex flex-col items-center gap-1">
          <span className="font-bold text-xs tracking-widest uppercase text-[#0b1e5b]">AccNumbers</span>
          <span className="text-xs font-medium">Loading number details...</span>
        </div>
      </div>
    );
  }

  if (!rentalSession) {
    return (
      <div className="min-h-screen bg-[#fdfdfc] bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] flex flex-col items-center justify-center gap-4 p-6 text-center">
        <ExclamationTriangleIcon className="w-12 h-12 text-amber-500" />
        <h2 className="text-xl font-black text-[#0b1e5b]">Rental Not Found</h2>
        <p className="text-xs text-[#6b7280]">We could not find this rental session.</p>
        <Link href="/dashboard/rentals" className="px-5 py-2.5 rounded-xl bg-[#0b1e5b] text-white font-bold text-xs shadow-md">
          Back to My Rentals
        </Link>
      </div>
    );
  }

  const formattedDate = new Date(rentalSession.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' at ' + new Date(rentalSession.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const logoUrl = getServiceLogoUrl(rentalSession.service);

  const minutesRemaining = Math.floor(timeLeft / 60);
  const secondsRemaining = timeLeft % 60;
  const formattedCountdown = `${minutesRemaining}:${secondsRemaining < 10 ? '0' : ''}${secondsRemaining}`;

  const smsList = rentalSession.sms || [];
  const latestSms = Array.isArray(smsList) && smsList.length > 0 ? smsList[smsList.length - 1] : null;
  
  const extractCodeFromText = (text: string) => {
    if (!text) return null;
    const match = text.match(/\b\d{4,8}\b/);
    return match ? match[0] : null;
  };

  const rawSmsText = typeof latestSms === 'string' 
    ? latestSms 
    : (latestSms?.text || latestSms?.message || '');
  
  const verificationCode = latestSms?.code || rentalSession.sms_code || extractCodeFromText(rawSmsText);
  
  const currentStatus = rentalSession.status?.toUpperCase() || 'PENDING';
  const isFinished = ['FINISHED', 'COMPLETED'].includes(currentStatus);
  const isCancelled = ['CANCELED', 'CANCELLED'].includes(currentStatus);
  const isExpired = ['EXPIRED', 'TIMEOUT'].includes(currentStatus);
  const isBanned = ['BANNED'].includes(currentStatus);
  const isReceived = currentStatus === 'RECEIVED';
  const hasCodeReceived = Boolean(verificationCode) || isReceived;
  const isTerminal = isFinished || isCancelled || isExpired || isBanned;

  const displayName = currentUserData?.user_metadata?.display_name || currentUserData?.email?.split('@')[0] || 'kelvin';

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
            <span>₦{walletBalance.toFixed(2)}</span>
          </div>
        </div>
      </header>

      {/* Slide-in FAQ Drawer Component */}
      {isFaqOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div 
            onClick={() => setIsFaqOpen(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
          />
          <div className="relative w-full max-w-md bg-[#fdfdfc] border-l border-[#e5e7eb] h-full shadow-2xl z-10 flex flex-col animate-in slide-in-from-right duration-300">
            
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-6 border-b border-[#e5e7eb]">
              <div>
                <h2 className="text-base font-black text-[#0b1e5b]">Help & FAQ</h2>
                <p className="text-xs text-[#6b7280]">Common questions about sms verifications.</p>
              </div>
              <button 
                onClick={() => setIsFaqOpen(false)}
                className="w-8 h-8 rounded-xl bg-[#e5e7eb]/50 flex items-center justify-center text-[#6b7280] hover:text-[#0b1e5b] transition"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

                        {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <details className="group border border-[#e5e7eb] rounded-2xl p-4 bg-white shadow-xs">
                <summary className="flex justify-between items-center font-bold text-xs cursor-pointer list-none text-[#0b1e5b]">
                  <span>I didn't receive the SMS verification code</span>
                  <span className="transition group-open:rotate-180">▼</span>
                </summary>
                <p className="text-xs text-[#6b7280] mt-2 leading-relaxed">
                  First, check if your proxy or VPN country matches the phone number's country. If no code arrives within a few minutes, click Cancel to get an instant refund and try a different operator or country.
                </p>
              </details>

              <details className="group border border-[#e5e7eb] rounded-2xl p-4 bg-white shadow-xs">
                <summary className="flex justify-between items-center font-bold text-xs cursor-pointer list-none text-[#0b1e5b]">
                  <span>What does "Pending" status mean?</span>
                  <span className="transition group-open:rotate-180">▼</span>
                </summary>
                <p className="text-xs text-[#6b7280] mt-2 leading-relaxed">
                  The phone number is active and waiting for incoming SMS traffic. Switch back to your target app or website and trigger the verification code to be sent to this number.
                </p>
              </details>

              <details className="group border border-[#e5e7eb] rounded-2xl p-4 bg-white shadow-xs">
                <summary className="flex justify-between items-center font-bold text-xs cursor-pointer list-none text-[#0b1e5b]">
                  <span>Why does it say "Number already used" or "Blocked"?</span>
                  <span className="transition group-open:rotate-180">▼</span>
                </summary>
                <p className="text-xs text-[#6b7280] mt-2 leading-relaxed">
                  Occasionally, virtual numbers may be pre-flagged by certain platforms. If this happens, click the **Ban** button immediately to close the session and automatically refund your wallet balance.
                </p>
              </details>

              <details className="group border border-[#e5e7eb] rounded-2xl p-4 bg-white shadow-xs">
                <summary className="flex justify-between items-center font-bold text-xs cursor-pointer list-none text-[#0b1e5b]">
                  <span>Can I request a code more than once?</span>
                  <span className="transition group-open:rotate-180">▼</span>
                </summary>
                <p className="text-xs text-[#6b7280] mt-2 leading-relaxed">
                  Yes! If the app or service allows resending SMS messages, you can click resend on their platform. Additional messages will automatically show up in your live feed here.
                </p>
              </details>

              <details className="group border border-[#e5e7eb] rounded-2xl p-4 bg-white shadow-xs">
                <summary className="flex justify-between items-center font-bold text-xs cursor-pointer list-none text-[#0b1e5b]">
                  <span>How long are numbers active?</span>
                  <span className="transition group-open:rotate-180">▼</span>
                </summary>
                <p className="text-xs text-[#6b7280] mt-2 leading-relaxed">
                  Standard rental sessions last up to 20 minutes (or as shown by the active countdown timer). If the timer hits zero without a message, the session expires and funds are refunded.
                </p>
              </details>

                            <details className="group border border-[#e5e7eb] rounded-2xl p-4 bg-white shadow-xs">
                <summary className="flex justify-between items-center font-bold text-xs cursor-pointer list-none text-[#0b1e5b]">
                  <span>Can I use the same phone number for multiple apps?</span>
                  <span className="transition group-open:rotate-180">▼</span>
                </summary>
                <p className="text-xs text-[#6b7280] mt-2 leading-relaxed">
                  No. Each number you buy is meant for only one specific service (such as WhatsApp or Telegram). Trying to use the same number for multiple apps will usually fail or cause issues.
                </p>
              </details>

              <details className="group border border-[#e5e7eb] rounded-2xl p-4 bg-white shadow-xs">
                <summary className="flex justify-between items-center font-bold text-xs cursor-pointer list-none text-[#0b1e5b]">
                  <span>What if the app says the phone number is already registered?</span>
                  <span className="transition group-open:rotate-180">▼</span>
                </summary>
                <p className="text-xs text-[#6b7280] mt-2 leading-relaxed">
                  Occasionally, virtual numbers may have been used previously on certain platforms. If the app tells you the number is already taken or blocked, just click the **"Ban"** button on this page. Your order will cancel and your money will be refunded instantly so you can try a different number.
                </p>
              </details>

              <details className="group border border-[#e5e7eb] rounded-2xl p-4 bg-white shadow-xs">
                <summary className="flex justify-between items-center font-bold text-xs cursor-pointer list-none text-[#0b1e5b]">
                  <span>How long does it usually take for the SMS code to arrive?</span>
                  <span className="transition group-open:rotate-180">▼</span>
                </summary>
                <p className="text-xs text-[#6b7280] mt-2 leading-relaxed">
                  Most verification codes arrive within 1 to 2 minutes after you request them on the target app. If several minutes pass with no message, it is best to cancel the order for a full refund and try a different country or operator.
                </p>
              </details>



              <details className="group border border-[#e5e7eb] rounded-2xl p-4 bg-white shadow-xs">
                <summary className="flex justify-between items-center font-bold text-xs cursor-pointer list-none text-[#0b1e5b]">
                  <span>How do refunds work?</span>
                  <span className="transition group-open:rotate-180">▼</span>
                </summary>
                <p className="text-xs text-[#6b7280] mt-2 leading-relaxed">
                  Refunds for cancelled, banned, or timed-out orders are credited back to your AccNumbers wallet balance instantly and automatically.
                </p>
              </details>

              <details className="group border border-[#e5e7eb] rounded-2xl p-4 bg-white shadow-xs">
                <summary className="flex justify-between items-center font-bold text-xs cursor-pointer list-none text-[#0b1e5b]">
                  <span>What should I do if the SMS code is split or incomplete?</span>
                  <span className="transition group-open:rotate-180">▼</span>
                </summary>
                <p className="text-xs text-[#6b7280] mt-2 leading-relaxed">
                  Make sure to check the entire text string in your received messages log. Some services send alphanumeric text where the verification digits are embedded within a sentence.
                </p>
              </details>

                            <details className="group border border-[#e5e7eb] rounded-2xl p-4 bg-white shadow-xs">
                <summary className="flex justify-between items-center font-bold text-xs cursor-pointer list-none text-[#0b1e5b]">
                  <span>How do I get another SMS code if I requested a resend?</span>
                  <span className="transition group-open:rotate-180">▼</span>
                </summary>
                <p className="text-xs text-[#6b7280] mt-2 leading-relaxed">
                  If you asked the app (like WhatsApp or Telegram) to send another code, just click the **"Check for New Code"** button on this page. This will check for your new message right away.
                </p>
              </details>



              <details className="group border border-[#e5e7eb] rounded-2xl p-4 bg-white shadow-xs">
                <summary className="flex justify-between items-center font-bold text-xs cursor-pointer list-none text-[#0b1e5b]">
                  <span>Are all country operators supported for every app?</span>
                  <span className="transition group-open:rotate-180">▼</span>
                </summary>
                <p className="text-xs text-[#6b7280] mt-2 leading-relaxed">
                  Certain platforms block specific telecom operators or virtual prefixes. Always check the operator statistics and delivery rates before purchasing a number for strict platforms.
                </p>
              </details>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-[#e5e7eb] bg-white text-center">
              <button 
                onClick={() => setIsFaqOpen(false)}
                className="w-full py-2.5 rounded-xl bg-[#0b1e5b] text-white font-bold text-xs shadow-xs"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar Menu Drawer */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-[#111111]/40 backdrop-blur-xs transition-opacity" onClick={() => setIsSidebarOpen(false)}></div>
          <div className="relative w-80 bg-[#fdfdfc] border-r border-[#e5e7eb] p-6 flex flex-col justify-between shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-[#e5e7eb] pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#0b1e5b] flex items-center justify-center text-white font-black text-lg shadow-sm">
                    A
                  </div>
                  <div className="flex flex-col">
                    <span className="font-black text-base tracking-tight text-[#0b1e5b] leading-tight">AccNumbers</span>
                    <span className="text-[9px] font-bold text-[#6b7280] tracking-widest uppercase">Virtual Hub</span>
                  </div>
                </div>
                <button onClick={() => setIsSidebarOpen(false)} className="w-8 h-8 rounded-xl bg-[#e5e7eb]/50 flex items-center justify-center text-[#6b7280] hover:text-[#0b1e5b] transition">
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-[#0b1e5b]/5 border border-[#0b1e5b]/10 space-y-2">
                <p className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wider">Active Wallet Balance</p>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-black text-[#0b1e5b]">₦{walletBalance.toFixed(2)}</span>
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
                <Link href="/dashboard/rentals" onClick={() => setIsSidebarOpen(false)} className="flex items-center gap-3 px-3.5 py-3 rounded-2xl bg-[#0b1e5b]/10 text-[#0b1e5b] font-bold text-xs">
                  <ClipboardDocumentListIcon className="w-4 h-4 text-[#0b1e5b]" /> My active rentals
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
                  <span className="text-[10px] text-[#6b7280] truncate">{currentUserData?.email || 'user@accnumbers.com'}</span>
                </div>
              </div>
              <button 
                onClick={handleUserSignOut}
                className="w-full py-3 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition text-xs font-bold text-center cursor-pointer shadow-xs flex items-center justify-center gap-2"
              >
                <ArrowRightOnRectangleIcon className="w-4 h-4" /> Sign Out Securely
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content (Edge-to-Edge on large screens) */}
      <main className="flex-1 w-full max-w-full sm:max-w-5xl mx-auto py-10 px-3 sm:px-8 space-y-8">
        
        <div className="space-y-4">
          <Link href="/dashboard/rentals" className="inline-flex items-center gap-2 text-xs font-bold text-[#6b7280] hover:text-[#0b1e5b] transition">
            <ArrowLeftIcon className="w-4 h-4" /> Back to My Rentals
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0b1e5b] border border-[#0b1e5b] p-6 rounded-3xl shadow-md text-white">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-white border border-[#e5e7eb]/20 flex items-center justify-center shrink-0 overflow-hidden p-2 shadow-sm">
                {!logoHasError ? (
                  <img src={logoUrl} alt={rentalSession.service} className="w-full h-full object-contain" onError={() => setLogoHasError(true)} />
                ) : (
                  <span className="text-[#0b1e5b] font-black text-sm uppercase">{rentalSession.service?.[0] || 'S'}</span>
                )}
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-black text-white tracking-tight capitalize">{rentalSession.service}</h1>
                  <span className="px-2 py-0.5 rounded-md bg-white/10 text-white text-[10px] font-bold uppercase">{rentalSession.country}</span>
                </div>
                <p className="text-xs text-white/75 font-medium">Order ID: #{rentalSession.external_order_id || rentalSession.id.slice(0, 8)} • {formattedDate}</p>
              </div>
            </div>

            {/* Status & FAQ Question Mark Icon Button */}
            <div className="flex items-center gap-3">
              <div>
                {isFinished ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-xs border border-emerald-500/30"><CheckCircleIcon className="w-4 h-4" /> Completed</span>
                ) : isCancelled ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 text-white/80 font-bold text-xs"><XCircleIcon className="w-4 h-4" /> Cancelled & Refunded</span>
                ) : isBanned ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500/20 text-red-300 font-bold text-xs border border-red-500/30"><ShieldExclamationIcon className="w-4 h-4" /> Banned & Refunded</span>
                ) : isExpired ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500/20 text-red-300 font-bold text-xs border border-red-500/30"><ClockIcon className="w-4 h-4" /> Timed Out & Refunded</span>
                ) : isReceived ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-xs border border-emerald-500/30"><CheckCircleIcon className="w-4 h-4" /> SMS Received</span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/20 text-amber-300 font-bold text-xs border border-amber-500/30">
                    <ClockIcon className="w-4 h-4" /> {formattedCountdown}
                  </span>
                )}
              </div>

              {/* FAQ Question Mark Icon Button inside Card Header */}
              <button
                onClick={() => setIsFaqOpen(true)}
                className="w-9 h-9 rounded-2xl bg-white/10 hover:bg-white/25 text-white transition flex items-center justify-center cursor-pointer shadow-xs"
                title="Help & FAQ"
                aria-label="Help & FAQ"
              >
                <QuestionMarkCircleIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white border border-[#e5e7eb] rounded-3xl shadow-sm p-6 sm:p-8 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            
            <div className="p-5 rounded-2xl bg-[#fdfdfc] border border-[#e5e7eb] space-y-2">
              <span className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wider flex items-center gap-1.5">
                <PhoneIcon className="w-3.5 h-3.5 text-[#0b1e5b]" /> Phone Number
              </span>
              <div className="flex items-center justify-between">
                <span className="font-mono text-lg font-black text-[#111111]">{rentalSession.phone_number || rentalSession.phone}</span>
                <button
                  onClick={() => copyToClipboard(rentalSession.phone_number || rentalSession.phone, 'phone')}
                  className="px-3 py-1.5 rounded-xl bg-white border border-[#e5e7eb] hover:bg-[#0b1e5b] hover:text-white text-[#0b1e5b] font-bold text-xs transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedItemText === 'phone' ? <><CheckIcon className="w-3.5 h-3.5 text-emerald-500" /> Copied</> : <><DocumentDuplicateIcon className="w-3.5 h-3.5" /> Copy</>}
                </button>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-[#fdfdfc] border border-[#e5e7eb] space-y-2">
              <span className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wider flex items-center gap-1.5">
                <ChatBubbleLeftRightIcon className="w-3.5 h-3.5 text-emerald-600" /> Verification Code / SMS
              </span>
              <div className="flex items-center justify-between">
                {verificationCode ? (
                  <div 
                    onClick={() => copyToClipboard(verificationCode, 'sms')}
                    className="w-full flex items-center justify-between cursor-pointer group py-1"
                  >
                    <span className="font-mono text-xl font-black text-emerald-600 tracking-wider">
                      {verificationCode}
                    </span>
                    <span className="px-3 py-1.5 rounded-xl bg-white border border-[#e5e7eb] group-hover:bg-[#0b1e5b] group-hover:text-white text-[#0b1e5b] font-bold text-xs transition shadow-xs flex items-center gap-1.5">
                      {copiedItemText === 'sms' ? <><CheckIcon className="w-3.5 h-3.5 text-emerald-500" /> Copied</> : <><DocumentDuplicateIcon className="w-3.5 h-3.5" /> Copy Code</>}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 py-2">
                      {isTerminal ? (
                      <span className="text-xs font-semibold text-[#6b7280]">No SMS received</span>
                    ) : (
                      <>
                        <div className="relative flex items-center justify-center w-6 h-6">
                          <div className="absolute w-full h-full rounded-full bg-emerald-400/30 animate-ping"></div>
                          <div className="w-2.5 h-2.5 rounded-full bg-emerald-600"></div>
                        </div>
                        <span className="text-xs font-semibold text-[#6b7280] tracking-wide animate-pulse">
                          Waiting for SMS... ({formattedCountdown})
                        </span>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

          </div>

          {!isTerminal && (
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex flex-col items-center text-center space-y-2 relative overflow-hidden transition-all duration-300">
              <div className="flex items-center gap-2 text-amber-800 font-black text-xs">
                <InformationCircleIcon className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{bannerTips[activeBannerIndex].title}</span>
              </div>
              <p className="text-xs text-amber-900/80 font-medium max-w-md">
                {bannerTips[activeBannerIndex].description}
              </p>
              <div className="flex items-center gap-1.5 pt-1">
                {bannerTips.map((_, dotIdx) => (
                  <span 
                    key={dotIdx}
                    className={`h-1.5 rounded-full transition-all duration-300 ${dotIdx === activeBannerIndex ? 'w-4 bg-amber-600' : 'w-1.5 bg-amber-200'}`}
                  ></span>
                ))}
              </div>
            </div>
          )}

          {Array.isArray(smsList) && smsList.length > 0 && (
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-2">
              <span className="text-[10px] font-bold text-gray-500 uppercase">Received Messages Log</span>
              <div className="space-y-1 font-mono text-xs text-gray-800">
                {smsList.map((msg: any, idx: number) => (
                  <div key={idx} className="p-2 bg-white rounded border border-gray-100 flex justify-between">
                    <span>{msg.text || JSON.stringify(msg)}</span>
                    <span className="text-gray-400 text-[10px]">{msg.date}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

            {/* Action Area / Dynamic Quick Buy Card for Completed/Finished States */}
          {isTerminal ? (
            <div className="pt-4 border-t border-[#e5e7eb] space-y-3">
              <button
                onClick={() => router.push(`/dashboard/numbers?service=${encodeURIComponent(rentalSession.service)}&country=${encodeURIComponent(rentalSession.country)}`)}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-gradient-to-r from-emerald-400 to-green-500 text-black font-semibold rounded-2xl shadow-md hover:opacity-95 transition-all text-xs sm:text-sm cursor-pointer"
              >
                <PlusIcon className="w-5 h-5 stroke-[2.5]" />
                <span className="capitalize">Buy new {rentalSession.service} • {rentalSession.country}</span>
              </button>
              <div className="text-center">
                <Link 
                  href="/dashboard/numbers" 
                  className="text-xs text-[#6b7280] hover:text-[#0b1e5b] font-bold transition-colors"
                >
                  Pick something else
                </Link>
              </div>
            </div>
          ) : (
            <div className="pt-4 border-t border-[#e5e7eb] space-y-4">

              {/* RESEND / CHECK NEW CODE BUTTON (Shows only when status is RECEIVED) */}
{isReceived && (
  <div className="p-4 rounded-2xl bg-[#0b1e5b]/5 border border-[#0b1e5b]/10 flex flex-col items-center gap-3">
    <p className="text-xs text-[#6b7280] text-center">
      Requested another SMS code from the app (e.g., WhatsApp, TikTok)? Click below to check for the new code.
    </p>
    <button
      onClick={handleResendSms}
      disabled={isUpdatingAction || isCheckingCode || codeCooldown > 0}
      className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-[#0b1e5b] hover:bg-[#0b1e5b]/90 text-white transition font-bold text-xs sm:text-sm cursor-pointer shadow-sm flex items-center justify-center gap-2 disabled:opacity-75"
    >
      <ArrowsRightLeftIcon className={`w-5 h-5 ${isCheckingCode ? 'animate-spin' : ''}`} /> 
      {isCheckingCode 
        ? 'Checking for code...' 
        : codeCooldown > 0 
        ? `Wait ${codeCooldown}s to recheck` 
        : 'Check for New Code'}
    </button>
  </div>
)}





              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-[11px] text-[#6b7280] font-medium">
                  {cancelGraceTimeLeft > 0 ? (
                    <span>Cancel ready in <strong className="text-[#0b1e5b]">{cancelGraceTimeLeft}s</strong></span>
                  ) : hasCodeReceived ? (
                    <span>Code received! Please click <strong>Finish</strong> to complete the order.</span>
                  ) : (
                    <span>Waiting for code: <strong>Cancel</strong> or <strong>Ban</strong> available</span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                  {!hasCodeReceived ? (
                    <>
                      <button
                        onClick={() => promptAction('cancel')}
                        disabled={isUpdatingAction}
                        className="px-5 py-3 rounded-2xl border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition font-bold text-xs sm:text-sm cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm flex-1 sm:flex-none"
                      >
                        <XCircleIcon className="w-5 h-5" /> Cancel
                      </button>
                      <button
                        onClick={() => promptAction('ban')}
                        disabled={isUpdatingAction}
                        className="px-5 py-3 rounded-2xl border border-gray-200 bg-gray-100 text-gray-700 hover:bg-gray-200 transition font-bold text-xs sm:text-sm cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm flex-1 sm:flex-none"
                      >
                        <ShieldExclamationIcon className="w-5 h-5" /> Ban
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => promptAction('finish')}
                      disabled={isUpdatingAction}
                      className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white transition font-bold text-xs sm:text-sm cursor-pointer shadow-sm disabled:opacity-50 flex items-center justify-center gap-2 animate-in fade-in duration-200 w-full sm:w-auto"
                    >
                      <CheckBadgeIcon className="w-5 h-5" /> Finish
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>

      </main>

      <footer className="bg-[#fdfdfc] border-t border-[#e5e7eb] py-6 px-4 text-center text-xs text-[#6b7280] font-medium">
        © 2026 AccNumbers. All rights reserved.
      </footer>

      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-[#111111]/40 backdrop-blur-xs transition-opacity" onClick={() => setConfirmDialog({ isOpen: false, title: '', description: '', actionType: null })}></div>
          <div className="relative bg-[#fdfdfc] border border-[#e5e7eb] rounded-3xl max-w-sm w-full p-6 shadow-2xl z-10 space-y-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${confirmDialog.actionType === 'finish' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                {confirmDialog.actionType === 'finish' ? <CheckBadgeIcon className="w-5 h-5" /> : <ExclamationTriangleIcon className="w-5 h-5" />}
              </div>
              <h3 className="text-base font-black text-[#0b1e5b]">{confirmDialog.title}</h3>
            </div>
            <p className="text-xs text-[#6b7280] font-medium leading-relaxed">{confirmDialog.description}</p>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setConfirmDialog({ isOpen: false, title: '', description: '', actionType: null })}
                className="px-4 py-2 rounded-xl border border-[#e5e7eb] bg-white text-[#6b7280] font-bold text-xs"
              >
                No, Go Back
              </button>
              <button
                onClick={executeAction}
                disabled={isUpdatingAction}
                className={`px-4 py-2 rounded-xl text-white font-bold text-xs shadow-xs ${confirmDialog.actionType === 'finish' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}`}
              >
                {isUpdatingAction ? 'Please wait...' : 'Yes, Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {alertDialog.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-[#111111]/40 backdrop-blur-xs transition-opacity" onClick={() => setAlertDialog({ isOpen: false, title: '', description: '' })}></div>
          <div className="relative bg-[#fdfdfc] border border-[#e5e7eb] rounded-3xl max-w-sm w-full p-6 shadow-2xl z-10 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                <ExclamationTriangleIcon className="w-5 h-5" />
              </div>
              <h3 className="text-base font-black text-[#0b1e5b]">{alertDialog.title}</h3>
            </div>
            <p className="text-xs text-[#6b7280] font-medium leading-relaxed">{alertDialog.description}</p>
            <div className="flex items-center justify-end pt-2">
              <button
                onClick={() => setAlertDialog({ isOpen: false, title: '', description: '' })}
                className="px-5 py-2 rounded-xl bg-[#0b1e5b] text-white font-bold text-xs shadow-xs hover:bg-[#0b1e5b]/90"
              >
                Okay
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}