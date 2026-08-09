'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
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
  CheckCircleIcon,
  ChevronRightIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/solid';

// --- NORMALIZATION FUNCTIONS ---

const getCountryCode = (countryName: string): string => {
  if (!countryName) return 'russia';
  const clean = countryName.toLowerCase().trim();

  const map: Record<string, string> = {
    russia: 'russia',
    ru: 'russia',
    ukraine: 'ukraine',
    ua: 'ukraine',
    kazakhstan: 'kazakhstan',
    kz: 'kazakhstan',
    usa: 'usa',
    us: 'usa',
    'united states': 'usa',
    england: 'england',
    gb: 'england',
    'united kingdom': 'england',
    china: 'china',
    cn: 'china',
    philippines: 'philippines',
    ph: 'philippines',
    indonesia: 'indonesia',
    id: 'indonesia',
    malaysia: 'malaysia',
    my: 'malaysia',
    kenya: 'kenya',
    ke: 'kenya',
    tanzania: 'tanzania',
    tz: 'tanzania',
    vietnam: 'vietnam',
    vn: 'vietnam',
    india: 'india',
    in: 'india',
    nigeria: 'nigeria',
    ng: 'nigeria',
    brazil: 'brazil',
    br: 'brazil',
    colombia: 'colombia',
    co: 'colombia',
    pakistan: 'pakistan',
    pk: 'pakistan',
    egypt: 'egypt',
    eg: 'egypt',
    canada: 'canada',
    ca: 'canada',
    germany: 'germany',
    de: 'germany',
    france: 'france',
    fr: 'france',
    italy: 'italy',
    it: 'italy',
    spain: 'spain',
    es: 'spain',
    bangladesh: 'bangladesh',
    bd: 'bangladesh',
    ethiopia: 'ethiopia',
    et: 'ethiopia',
    mexico: 'mexico',
    mx: 'mexico',
    japan: 'japan',
    jp: 'japan',
  };

  return map[clean] || clean;
};

const getServiceCode = (serviceName: string): string => {
  if (!serviceName) return 'telegram';
  const clean = serviceName.toLowerCase().trim();

  const map: Record<string, string> = {
    telegram: 'telegram',
    'telegram app': 'telegram',
    whatsapp: 'whatsapp',
    'whatsapp messenger': 'whatsapp',
    facebook: 'facebook',
    instagram: 'instagram',
    google: 'google',
    gmail: 'google',
    twitter: 'twitter',
    x: 'twitter',
    tiktok: 'tiktok',
    discord: 'discord',
    microsoft: 'microsoft',
    outlook: 'microsoft',
    apple: 'apple',
    uber: 'uber',
    amazon: 'amazon',
    snapchat: 'snapchat',
  };

  return map[clean] || clean;
};

const getServiceLogoUrl = (serviceName: string) => {
  if (!serviceName) return '';
  const serviceSlug = getServiceCode(serviceName);
  const logos: Record<string, string> = {
    whatsapp: 'https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg',
    telegram: 'https://upload.wikimedia.org/wikipedia/commons/8/82/Telegram_logo.svg',
    facebook: 'https://upload.wikimedia.org/wikipedia/commons/b/b8/2021_Facebook_icon.svg',
    instagram: 'https://upload.wikimedia.org/wikipedia/commons/e/e7/Instagram_logo_2016.svg',
    twitter: 'https://upload.wikimedia.org/wikipedia/commons/6/6f/Logo_of_Twitter.svg',
    google: 'https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg',
    microsoft: 'https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo_%282012%29.svg',
  };
  return logos[serviceSlug] || `https://www.google.com/s2/favicons?domain=${serviceSlug}.com&sz=128`;
};

const getCountryFlagCode = (countryName: string): string => {
  if (!countryName) return 'un';
  const clean = countryName.toLowerCase().trim();
  const flagMap: Record<string, string> = {
    russia: 'ru',
    ukraine: 'ua',
    kazakhstan: 'kz',
    usa: 'us',
    'united states': 'us',
    england: 'gb',
    'united kingdom': 'gb',
    china: 'cn',
    philippines: 'ph',
    indonesia: 'id',
    malaysia: 'my',
    kenya: 'ke',
    tanzania: 'tz',
    vietnam: 'vn',
    india: 'in',
    nigeria: 'ng',
    brazil: 'br',
    colombia: 'co',
    pakistan: 'pk',
    egypt: 'eg',
    canada: 'ca',
    germany: 'de',
    france: 'fr',
    italy: 'it',
    spain: 'es',
    bangladesh: 'bd',
    ethiopia: 'et',
    mexico: 'mx',
    japan: 'jp',
  };
  const countrySlug = getCountryCode(clean);
  return flagMap[countrySlug] || (clean.length === 2 ? clean : 'un');
};

const getCountryFlagUrl = (countryName: string) => {
  const code = getCountryFlagCode(countryName);
  return `https://flagcdn.com/w40/${code}.png`;
};

export default function BuyNumbersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const queryService = searchParams.get('service');
  const queryCountry = searchParams.get('country');

  const [currentUserData, setCurrentUserData] = useState<any>(null);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState<number>(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  const [rawCatalog, setRawCatalog] = useState<any[]>([]);
  const [isFetchingCatalog, setIsFetchingCatalog] = useState(true);

  const [settings, setSettings] = useState({
    markup_multiplier: 1.15,
    usd_to_ngn: 1364.9076,
  });

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [selectedCountryName, setSelectedCountryName] = useState<string>('');
  
  const [availableOperators, setAvailableOperators] = useState<any[]>([]);
  const [isFetchingOperators, setIsFetchingOperators] = useState(false);
  const [selectedOperatorItem, setSelectedOperatorItem] = useState<any>(null);
  
  const [serviceSearchQuery, setServiceSearchQuery] = useState('');
  const [countrySearchQuery, setCountrySearchQuery] = useState('');
  const [operatorSearchQuery, setOperatorSearchQuery] = useState('');
  
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initial Auth & Data Fetching + Real-time subscriptions
  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/signin');
        return;
      }
      setCurrentUserData(session.user);
      setIsAuthChecking(false);

      const userId = session.user.id;

      // Fetch wallet, settings, catalog, and unread notifications count using 'read' column
      const walletPromise = supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', userId)
        .maybeSingle();

      const settingsPromise = supabase
        .from('settings')
        .select('key, value');

      const notifPromise = supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('read', false);

      const catalogPromise = fetch('/api/prices').then(res => res.json()).catch(() => null);

      const [walletRes, settingsRes, notifRes, catalogData] = await Promise.all([
        walletPromise, 
        settingsPromise, 
        notifPromise, 
        catalogPromise
      ]);

      if (walletRes.data) {
        setWalletBalance(Number(walletRes.data.balance ?? 0));
      }

      if (notifRes.count !== null) {
        setUnreadNotificationsCount(notifRes.count);
      }

      if (settingsRes.data && settingsRes.data.length > 0) {
        const newSettings: any = { ...settings };
        settingsRes.data.forEach((row: any) => {
          if (row.key === 'markup_multiplier') newSettings.markup_multiplier = Number(row.value);
          if (row.key === 'usd_to_ngn') newSettings.usd_to_ngn = Number(row.value);
        });
        setSettings(newSettings);
      }

      if (catalogData && catalogData.success && Array.isArray(catalogData.services)) {
        setRawCatalog(catalogData.services);
      }

      setIsFetchingCatalog(false);
    }
    init();
  }, [router]);

  // Real-time listener for Wallet updates & Notifications (handles inserts and updates)
  useEffect(() => {
    if (!currentUserData) return;

    const channel = supabase
      .channel('public-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'wallets',
          filter: `user_id=eq.${currentUserData.id}`,
        },
        (payload: any) => {
          if (payload.new && typeof payload.new.balance === 'number') {
            setWalletBalance(payload.new.balance);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${currentUserData.id}`,
        },
        async () => {
          const { count } = await supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', currentUserData.id)
            .eq('read', false);

          setUnreadNotificationsCount(count || 0);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserData]);

  const calculatePrices = (rubPrice: number) => {
    const baseRub = rubPrice || 0;
    const priceNgn = baseRub * settings.markup_multiplier;
    const priceUsd = settings.usd_to_ngn ? priceNgn / settings.usd_to_ngn : 0;

    return { 
      priceNgn: Number(priceNgn.toFixed(2)), 
      priceUsd: Number(priceUsd.toFixed(2)) 
    };
  };

  const uniqueServices = useMemo(() => {
    const map = new Map<string, { name: string; totalStock: number; minPriceNgn: number; minPriceUsd: number }>();
    
    for (const item of rawCatalog) {
      const name = item.service;
      const rubVal = item.priceRub || item.priceNgn || 0;
      const { priceNgn, priceUsd } = calculatePrices(rubVal);
      
      if (!map.has(name)) {
        map.set(name, { name, totalStock: item.totalStock || 0, minPriceNgn: priceNgn, minPriceUsd: priceUsd });
      } else {
        const current = map.get(name)!;
        current.totalStock += (item.totalStock || 0);
        if (priceNgn > 0 && priceNgn < current.minPriceNgn) {
          current.minPriceNgn = priceNgn;
          current.minPriceUsd = priceUsd;
        }
      }
    }

    return Array.from(map.values()).sort((a, b) => b.totalStock - a.totalStock);
  }, [rawCatalog, settings]);

  const handleCountrySelect = async (countryName: string, serviceObj?: any) => {
    const targetService = serviceObj || selectedService;
    if (!targetService) return;

    setSelectedCountryName(countryName);
    setSelectedOperatorItem(null);
    setStep(3);
    setIsFetchingOperators(true);
    setErrorMessage(null);

    const normalizedCountry = getCountryCode(countryName);
    const normalizedService = getServiceCode(targetService.name);

    try {
      const res = await fetch(`/api/5sim/products?country=${normalizedCountry}&service=${normalizedService}`);
      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to load operators.');
      }

      const formattedOperators = (data.operators || []).map((op: any) => {
        const rubVal = op.priceRub || op.price || 0;
        const calculated = calculatePrices(rubVal);
        return {
          ...op,
          priceNgn: op.priceNgn || calculated.priceNgn,
          priceUsd: op.priceUsd || calculated.priceUsd,
          priceRub: rubVal,
        };
      });

      setAvailableOperators(formattedOperators);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to fetch operators.');
      setAvailableOperators([]);
    } finally {
      setIsFetchingOperators(false);
    }
  };

  // Automatically handle URL Query parameters if present (e.g. ?service=tiktok&country=canada)
  useEffect(() => {
    if (isFetchingCatalog || uniqueServices.length === 0) return;

    if (queryService) {
      const matchedService = uniqueServices.find(
        (s) => s.name.toLowerCase() === queryService.toLowerCase() || getServiceCode(s.name) === getServiceCode(queryService)
      );

      if (matchedService) {
        setSelectedService(matchedService);
        setStep(2);

        if (queryCountry) {
          const matchedCountryItem = rawCatalog.find(
            (item) => 
              item.service.toLowerCase() === matchedService.name.toLowerCase() &&
              (item.country.toLowerCase() === queryCountry.toLowerCase() || getCountryCode(item.country) === getCountryCode(queryCountry))
          );

          if (matchedCountryItem) {
            handleCountrySelect(matchedCountryItem.country, matchedService);
          }
        }
      }
    }
  }, [isFetchingCatalog, uniqueServices, queryService, queryCountry, rawCatalog]);

  const filteredServices = useMemo(() => {
    if (!serviceSearchQuery.trim()) return uniqueServices;
    const query = serviceSearchQuery.toLowerCase();
    return uniqueServices.filter(s => s.name.toLowerCase().includes(query));
  }, [uniqueServices, serviceSearchQuery]);

  const availableCountriesForService = useMemo(() => {
    if (!selectedService) return [];
    const map = new Map<string, { country: string; totalStock: number }>();
    
    for (const item of rawCatalog) {
      if (item.service.toLowerCase().trim() === selectedService.name.toLowerCase().trim()) {
        const countryName = item.country;
        if (!map.has(countryName)) {
          map.set(countryName, { country: countryName, totalStock: item.totalStock || 0 });
        } else {
          map.get(countryName)!.totalStock += (item.totalStock || 0);
        }
      }
    }
    return Array.from(map.values()).sort((a, b) => b.totalStock - a.totalStock);
  }, [rawCatalog, selectedService]);

  const filteredCountries = useMemo(() => {
    if (!countrySearchQuery.trim()) return availableCountriesForService;
    const query = countrySearchQuery.toLowerCase();
    return availableCountriesForService.filter(c => c.country.toLowerCase().includes(query));
  }, [availableCountriesForService, countrySearchQuery]);

  const filteredOperators = useMemo(() => {
    if (!operatorSearchQuery.trim()) return availableOperators;
    const query = operatorSearchQuery.toLowerCase();
    return availableOperators.filter(o => o.operator.toLowerCase().includes(query));
  }, [availableOperators, operatorSearchQuery]);

  const handleServiceSelect = (service: any) => {
    setSelectedService(service);
    setSelectedCountryName('');
    setAvailableOperators([]);
    setSelectedOperatorItem(null);
    setStep(2);
  };

  const handleOperatorSelect = (operatorItem: any) => {
    const rubVal = operatorItem.priceRub || 0;
    const calculated = calculatePrices(rubVal);
    
    setSelectedOperatorItem({
      ...operatorItem,
      priceNgn: operatorItem.priceNgn || calculated.priceNgn,
      priceUsd: operatorItem.priceUsd || calculated.priceUsd
    });
    setStep(4);
  };

  const handleExecutePurchase = async () => {
    if (!selectedService || !selectedCountryName || !selectedOperatorItem || !currentUserData) return;
    const finalPrice = selectedOperatorItem.priceNgn;

    if (walletBalance < finalPrice) {
      setErrorMessage(`Insufficient wallet balance. You need ₦${(finalPrice - walletBalance).toLocaleString()} more.`);
      return;
    }

    setIsPurchasing(true);
    setErrorMessage(null);

    const requestPayload = {
      userId: currentUserData.id,
      country: getCountryCode(selectedCountryName),
      operator: selectedOperatorItem.operator,
      service: getServiceCode(selectedService.name),
    };

    try {
      const response = await fetch('/api/5sim/buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestPayload),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to purchase number.');
      }

      router.push(`/dashboard/rentals/${data.rentalId}`);

    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to complete purchase.');
      setIsPurchasing(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/signin');
  };

  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-[#fdfdfc] flex items-center justify-center">
        <div className="w-8 h-8 rounded-xl border-2 border-[#0b1e5b]/20 border-t-[#0b1e5b] animate-spin"></div>
      </div>
    );
  }

  const displayName = currentUserData?.user_metadata?.display_name || currentUserData?.email?.split('@')[0] || 'User';

  return (
    <div className="min-h-screen bg-[#fdfdfc] bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] text-[#111111] flex flex-col justify-between font-sans">
      
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
            className="relative p-2.5 rounded-2xl border border-[#e5e7eb] bg-white hover:bg-[#fdfdfc] transition text-[#0b1e5b] shadow-xs flex items-center justify-center"
            aria-label="Notifications"
          >
            <BellIcon className="w-5 h-5" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute top-2 right-2.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white"></span>
            )}
          </Link>

          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#0b1e5b] text-white font-bold text-xs shadow-md">
            <WalletIcon className="w-4 h-4 text-emerald-400" />
            <span>₦{walletBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
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
                <div className="flex flex-col">
                  <span className="font-black text-base tracking-tight text-[#0b1e5b]">AccNumbers</span>
                  <span className="text-[8px] font-bold text-[#6b7280] uppercase">Virtual Hub</span>
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
                <Link href="/dashboard/numbers" onClick={() => setIsSidebarOpen(false)} className="flex items-center gap-3 px-3.5 py-3 rounded-2xl bg-[#0b1e5b]/10 text-[#0b1e5b] font-bold text-xs">
                  <MagnifyingGlassIcon className="w-4 h-4 text-[#0b1e5b]" /> Buy a number
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
                  {unreadNotificationsCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-red-500 text-white font-black text-[10px]">
                      {unreadNotificationsCount}
                    </span>
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
      <main className="flex-1 max-w-7xl w-full mx-auto py-10 px-4 sm:px-6 lg:px-8 space-y-6">
        
        <div className="space-y-2">
          <h1 className="text-2xl font-black text-[#0b1e5b] tracking-tight">Buy virtual number</h1>
          <p className="text-xs text-[#6b7280] font-medium">
            {step === 1 && 'Choose your preferred application or service to get started.'}
            {step === 2 && 'Select the country for your virtual number.'}
            {step === 3 && 'Select the network operator and price configuration.'}
            {step === 4 && 'Review your order details and complete your instant activation.'}
          </p>
        </div>

        {errorMessage && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-600 text-xs font-bold flex items-center gap-2">
            <ExclamationTriangleIcon className="w-5 h-5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* STEP 1: SERVICE SELECTION */}
        <div className="bg-white border border-[#e5e7eb] rounded-3xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-xl bg-[#0b1e5b] text-white flex items-center justify-center font-black text-xs">1</div>
              <div>
                <span className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wider">Service</span>
                <p className="text-xs font-bold text-[#111111]">{selectedService ? selectedService.name : `${uniqueServices.length} services available`}</p>
              </div>
            </div>
            {step > 1 && (
              <button onClick={() => { setStep(1); setSelectedCountryName(''); setAvailableOperators([]); setSelectedOperatorItem(null); }} className="text-[11px] font-bold text-[#0b1e5b] hover:underline cursor-pointer">
                SELECTED - TAP TO CHANGE
              </button>
            )}
          </div>

          {step === 1 && (
            <div className="space-y-3 pt-2">
              <div className="relative">
                <MagnifyingGlassIcon className="w-4 h-4 text-[#6b7280] absolute left-3.5 top-3.5" />
                <input 
                  type="text"
                  placeholder="Search WhatsApp, Telegram, Google..."
                  value={serviceSearchQuery}
                  onChange={(e) => setServiceSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#fdfdfc] border border-[#e5e7eb] text-xs font-medium focus:outline-none focus:border-[#0b1e5b]"
                />
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {isFetchingCatalog ? (
                  <div className="py-12 flex flex-col items-center justify-center gap-3">
                    <div className="w-6 h-6 rounded-lg border-2 border-[#0b1e5b]/20 border-t-[#0b1e5b] animate-spin"></div>
                    <span className="text-xs text-[#6b7280] font-medium">Loading available services...</span>
                  </div>
                ) : filteredServices.length === 0 ? (
                  <div className="py-8 text-center text-xs text-[#6b7280]">No services found matching your search.</div>
                ) : (
                  filteredServices.map((service) => (
                    <div 
                      key={service.name}
                      onClick={() => handleServiceSelect(service)}
                      className="flex items-center justify-between p-3.5 rounded-2xl bg-[#fdfdfc] border border-[#e5e7eb]/80 hover:border-[#0b1e5b] hover:bg-white transition cursor-pointer shadow-xs"
                    >
                      <div className="flex items-center gap-3">
                        <img src={getServiceLogoUrl(service.name)} alt={service.name} className="w-7 h-7 object-contain" />
                        <div>
                          <span className="text-xs font-black text-[#111111] capitalize">{service.name}</span>
                          <p className="text-[10px] text-emerald-600 font-bold">{service.totalStock} available</p>
                        </div>
                      </div>
                      <div className="text-right flex items-center gap-3">
                        <div>
                          <span className="text-[9px] text-[#6b7280] block uppercase font-bold">From</span>
                          <span className="text-xs font-black text-[#0b1e5b]">₦{service.minPriceNgn.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                          <span className="text-[10px] font-bold text-emerald-600 block">${service.minPriceUsd.toFixed(2)}</span>
                        </div>
                        <ChevronRightIcon className="w-4 h-4 text-[#6b7280]" />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* STEP 2: COUNTRY SELECTION */}
        {step >= 2 && (
          <div className="bg-white border border-[#e5e7eb] rounded-3xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-xl bg-[#0b1e5b] text-white flex items-center justify-center font-black text-xs">2</div>
                <div>
                  <span className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wider">Country</span>
                  <p className="text-xs font-bold text-[#111111]">
                    {selectedCountryName ? selectedCountryName : `${availableCountriesForService.length} countries available`}
                  </p>
                </div>
              </div>
              {step > 2 && (
                <button onClick={() => { setStep(2); setSelectedOperatorItem(null); }} className="text-[11px] font-bold text-[#0b1e5b] hover:underline cursor-pointer">
                  SELECTED - TAP TO CHANGE
                </button>
              )}
            </div>

            {step === 2 && (
              <div className="space-y-3 pt-2">
                <div className="relative">
                  <MagnifyingGlassIcon className="w-4 h-4 text-[#6b7280] absolute left-3.5 top-3.5" />
                  <input 
                    type="text"
                    placeholder="Search countries..."
                    value={countrySearchQuery}
                    onChange={(e) => setCountrySearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#fdfdfc] border border-[#e5e7eb] text-xs font-medium focus:outline-none focus:border-[#0b1e5b]"
                  />
                </div>

                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {filteredCountries.map((item, idx) => (
                    <div 
                      key={item.country || idx}
                      onClick={() => handleCountrySelect(item.country)}
                      className="flex items-center justify-between p-3.5 rounded-2xl bg-[#fdfdfc] border border-[#e5e7eb]/80 hover:border-[#0b1e5b] hover:bg-white transition cursor-pointer shadow-xs"
                    >
                      <div className="flex items-center gap-3">
                        <img 
                          src={getCountryFlagUrl(item.country)} 
                          alt={item.country} 
                          className="w-6 h-4 object-cover rounded-xs shadow-xs border border-gray-200" 
                          onError={(e)=>{ (e.target as HTMLElement).style.display = 'none'; }}
                        />
                        <div>
                          <span className="text-xs font-black text-[#111111]">{item.country}</span>
                          <p className="text-[10px] text-emerald-600 font-bold">{item.totalStock} available</p>
                        </div>
                      </div>
                      <ChevronRightIcon className="w-4 h-4 text-[#6b7280]" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

                {/* STEP 3: OPERATOR SELECTION */}
        {step >= 3 && (
          <div className="bg-white border border-[#e5e7eb] rounded-3xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-xl bg-[#0b1e5b] text-white flex items-center justify-center font-black text-xs">3</div>
                <div>
                  <span className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wider">Network Operator & Rates</span>
                  <p className="text-xs font-bold text-[#111111]">
                    {selectedOperatorItem ? selectedOperatorItem.operator : `${availableOperators.length} operators available`}
                  </p>
                </div>
              </div>
              {step > 3 && (
                <button onClick={() => setStep(3)} className="text-[11px] font-bold text-[#0b1e5b] hover:underline cursor-pointer">
                  SELECTED - TAP TO CHANGE
                </button>
              )}
            </div>

            {step === 3 && (
              <div className="space-y-3 pt-2">
                <div className="relative">
                  <MagnifyingGlassIcon className="w-4 h-4 text-[#6b7280] absolute left-3.5 top-3.5" />
                  <input 
                    type="text"
                    placeholder="Search operators (e.g. verizon, t-mobile)..."
                    value={operatorSearchQuery}
                    onChange={(e) => setOperatorSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#fdfdfc] border border-[#e5e7eb] text-xs font-medium focus:outline-none focus:border-[#0b1e5b]"
                  />
                </div>

                <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                  {isFetchingOperators ? (
                    <div className="py-12 flex flex-col items-center justify-center gap-3">
                      <div className="w-6 h-6 rounded-lg border-2 border-[#0b1e5b]/20 border-t-[#0b1e5b] animate-spin"></div>
                      <span className="text-xs text-[#6b7280] font-medium">Fetching available operators & rates...</span>
                    </div>
                  ) : filteredOperators.length === 0 ? (
                    <div className="py-8 text-center text-xs text-[#6b7280]">No active operators found for this selection.</div>
                  ) : (
                    filteredOperators.map((item, idx) => {
                      const priceNgn = item.priceNgn || 0;
                      const priceUsd = item.priceUsd || 0;
                      const successRate = item.successRate ?? 0;

                      // Professional health color mapping
                      const isHigh = successRate >= 40;
                      const isMid = successRate >= 20 && successRate < 40;
                      
                      const barColor = isHigh ? 'bg-emerald-500' : isMid ? 'bg-blue-500' : 'bg-amber-500';
                      const textColor = isHigh ? 'text-emerald-700' : isMid ? 'text-blue-700' : 'text-amber-700';

                      return (
                        <div 
                          key={item.operator || idx}
                          onClick={() => handleOperatorSelect(item)}
                          className="p-3.5 rounded-2xl bg-[#fdfdfc] border border-[#e5e7eb]/80 hover:border-[#0b1e5b] hover:bg-white transition cursor-pointer shadow-xs space-y-2.5"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-xs font-black text-[#111111] uppercase tracking-wide">{item.operator}</span>
                              <span className="text-[10px] text-emerald-600 font-bold block mt-0.5">{item.totalStock.toLocaleString()} numbers in stock</span>
                            </div>
                            <div className="text-right">
                              <span className="text-[9px] text-[#6b7280] block uppercase font-bold">Operator Rate</span>
                              <span className="text-xs font-black text-[#0b1e5b]">₦{priceNgn.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                              <span className="text-[10px] font-bold text-emerald-600 block">${priceUsd.toFixed(2)}</span>
                            </div>
                          </div>

                          {/* Professional Delivery Rate Progress Bar Indicator */}
                          <div className="pt-1 border-t border-[#f3f4f6]">
                            <div className="flex items-center justify-between text-[10px] mb-1">
                              <span className="text-[#6b7280] font-semibold tracking-wide uppercase">Delivery Success Rate</span>
                              <span className={`font-black ${textColor}`}>{successRate}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-[#f3f4f6] rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all duration-500 ${barColor}`} 
                                style={{ width: `${Math.min(Math.max(successRate, 4), 100)}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        )}




          {/* STEP 4: QUOTE & CHECKOUT */}
        {step === 4 && selectedService && selectedCountryName && selectedOperatorItem && (
          <div className="bg-white border border-[#0b1e5b] rounded-3xl p-6 shadow-md space-y-6">
            <div className="space-y-1 border-b border-[#e5e7eb] pb-4">
              <span className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wider">Order Summary</span>
              <h2 className="text-sm font-black text-[#0b1e5b] capitalize flex items-center gap-2">
                <img src={getCountryFlagUrl(selectedCountryName)} alt="" className="w-5 h-3.5 object-cover rounded-xs border border-gray-200" />
                {selectedService.name} - {selectedCountryName} ({selectedOperatorItem.operator})
              </h2>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wider">Total Amount</span>
              <div className="flex items-baseline gap-3">
                <div className="text-3xl font-black text-emerald-600">
                  ₦{selectedOperatorItem.priceNgn.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
                <div className="text-lg font-bold text-[#6b7280]">
                  (${selectedOperatorItem.priceUsd.toFixed(2)})
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#0b1e5b]/5 border border-[#0b1e5b]/10 flex items-center gap-3">
              <CheckCircleIcon className="w-5 h-5 text-emerald-600 shrink-0" />
              <div className="text-xs text-[#6b7280] font-medium">
                <strong className="text-[#111111]">Instant Delivery.</strong> Your activation number will be generated immediately upon confirmation.
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input 
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-0.5 rounded border-[#0b1e5b]"
                />
                <span className="text-xs font-medium text-[#6b7280]">
                  I agree to the <a href="#" className="text-[#0b1e5b] font-bold underline">Terms of Service</a> and refund policies.
                </span>
              </label>

              <div className="flex items-center justify-between text-xs text-[#6b7280] font-semibold">
                <span>Wallet Balance: ₦{walletBalance.toLocaleString()}</span>
                {walletBalance < selectedOperatorItem.priceNgn ? (
                  <span className="text-red-600 font-bold">Insufficient funds</span>
                ) : (
                  <span className="text-emerald-600 font-bold">Sufficient funds</span>
                )}
              </div>

              <button
                onClick={handleExecutePurchase}
                disabled={!agreedToTerms || isPurchasing}
                className="w-full py-3.5 rounded-2xl bg-[#0b1e5b] hover:bg-[#0b1e5b]/90 text-white font-bold text-xs transition shadow-md cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isPurchasing ? (
                  <>Processing Activation...</>
                ) : (
                  <>Get Number Now <ArrowRightIcon className="w-4 h-4" /></>
                )}
              </button>
            </div>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="bg-[#fdfdfc] border-t border-[#e5e7eb] py-6 px-4 text-center text-xs text-[#6b7280] font-medium">
        © 2026 AccNumbers. All rights reserved.
      </footer>
    </div>
  );
}