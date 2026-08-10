'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';

interface ApiServiceItem {
  id: string;
  country: string;
  service: string;   // e.g. "whatsapp"
  operator: string;  // e.g. "virtual28"
  priceNgn: number;  // pre-calculated Naira price from backend
  priceUsd: number;  // pre-calculated Dollar price from backend
  totalStock: number;
}

const FEATURED_TABS = [
  { id: 'whatsapp', label: 'Whatsapp', keys: ['whatsapp', 'wa'] },
  { id: 'telegram', label: 'Telegram', keys: ['telegram', 'tg'] },
  { id: 'google', label: 'Google', keys: ['google', 'go', 'gmail', 'youtube'] },
  { id: 'facebook', label: 'Facebook', keys: ['facebook', 'fb'] },
];

export default function PricingPage() {
  const [services, setServices] = useState<ApiServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('whatsapp');

  useEffect(() => {
    async function fetchPrices() {
      try {
        const res = await fetch('/api/prices');
        const json = await res.json();

        if (json.success && Array.isArray(json.services)) {
          setServices(json.services);
        }
      } catch (err) {
        console.error('Failed to load pricing:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchPrices();
  }, []);

  // Filter countries for active tab (e.g., WhatsApp)
  const featuredCountries = useMemo(() => {
    const currentTabObj = FEATURED_TABS.find((t) => t.id === activeTab);
    const validKeys = currentTabObj ? currentTabObj.keys : [activeTab];

    return services
      .filter((item) => validKeys.includes(item.service.toLowerCase()))
      .sort((a, b) => b.totalStock - a.totalStock);
  }, [services, activeTab]);

  // Group top services across ALL countries
  const topServices = useMemo(() => {
    const grouped: Record<
      string,
      { displayService: string; totalStock: number; minCostNgn: number; minCostUsd: number; providers: number }
    > = {};

    services.forEach((item) => {
      const sName = item.service.toLowerCase();

      if (!grouped[sName]) {
        grouped[sName] = {
          displayService: item.service.toUpperCase(),
          totalStock: 0,
          minCostNgn: Infinity,
          minCostUsd: Infinity,
          providers: 0,
        };
      }

      grouped[sName].totalStock += item.totalStock;
      grouped[sName].providers += 1;

      if (item.priceNgn && item.priceNgn < grouped[sName].minCostNgn) {
        grouped[sName].minCostNgn = item.priceNgn;
      }
      if (item.priceUsd && item.priceUsd < grouped[sName].minCostUsd) {
        grouped[sName].minCostUsd = item.priceUsd;
      }
    });

    return Object.values(grouped)
      .sort((a, b) => b.totalStock - a.totalStock)
      .slice(0, 30);
  }, [services]);

  return (
    <div className="min-h-screen bg-[#fdfdfc] text-[#0b1e5b] flex flex-col justify-between">
      <main className="flex-1 relative bg-[#fdfdfc] bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] bg-[size:2.25rem_2.25rem]">
        
        {/* HEADER */}
        <section className="pt-16 pb-10 px-4 border-b border-[#e5e7eb]/80 bg-[#fdfdfc]/90 backdrop-blur-xs">
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-widest text-[#0b1e5b]">
                Live Pricing & Availability
              </span>
              <span className="text-[10px] font-bold bg-[#e5e7eb] text-[#0b1e5b] px-3 py-1 rounded-full flex items-center gap-2">
                <span
                  className={`h-2 w-2 rounded-full ${
                    !loading ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                  }`}
                ></span>
                {!loading ? 'Stock Synced' : 'Syncing Catalog...'}
              </span>
            </div>
            <h1 className="text-4xl sm:text-6xl font-black text-[#0b1e5b] tracking-tight leading-none">
              Pay only when you verify.
            </h1>
            <p className="text-sm sm:text-base text-[#6b7280] font-medium max-w-xl leading-relaxed">
              No subscriptions. Prices are live and include instant verification routes.
            </p>
          </div>
        </section>

        <div className="max-w-4xl mx-auto px-4 py-10 space-y-12">
          
          {/* BROWSE BY COUNTRY */}
          <section className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#e5e7eb] pb-4">
              <h2 className="text-xs font-black uppercase tracking-widest text-[#6b7280]">
                Browse by Country —{' '}
                <span className="text-[#0b1e5b] font-black">
                  {activeTab.toUpperCase()} FROM
                </span>
              </h2>

              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                {FEATURED_TABS.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-black transition shrink-0 ${
                      activeTab === tab.id
                        ? 'bg-[#0b1e5b] text-white shadow-xs'
                        : 'bg-[#e5e7eb]/60 text-[#6b7280] hover:text-[#0b1e5b]'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* COUNTRY BADGE GRID - SINGLE LINE & BOLD FIX */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {featuredCountries.length > 0 ? (
                featuredCountries.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 bg-white border border-[#e5e7eb] rounded-xl flex items-center justify-between gap-3 shadow-xs hover:border-[#0b1e5b]/40 transition"
                  >
                    {/* Country Name */}
                    <span className="text-xs font-black text-[#0b1e5b] whitespace-nowrap truncate min-w-0">
                      {item.country}
                    </span>

                    {/* Prices in Naira & USD */}
                    <div className="text-right whitespace-nowrap shrink-0">
                      <span className="text-[11px] font-extrabold text-[#0b1e5b] block">
                        ₦{item.priceNgn ? item.priceNgn.toLocaleString() : '0'}
                      </span>
                      <span className="text-[10px] font-bold text-[#6b7280] block">
                        ${item.priceUsd ? item.priceUsd.toFixed(2) : '0.00'}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full p-8 text-center text-xs font-bold text-[#6b7280] bg-white rounded-xl border border-[#e5e7eb]">
                  {loading
                    ? 'Syncing live routes...'
                    : `No active stock found for ${activeTab.toUpperCase()} right now.`}
                </div>
              )}
            </div>
          </section>

          {/* TOP SERVICES TABLE */}
          <section className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#e5e7eb] pb-4">
              <div className="space-y-0.5">
                <h2 className="text-lg font-black text-[#0b1e5b] tracking-tight">
                  Top Services
                </h2>
                <p className="text-xs text-[#6b7280] font-medium">
                  {topServices.length} services shown · sorted by availability
                </p>
              </div>
            </div>

            <div className="bg-white border border-[#e5e7eb] rounded-2xl overflow-hidden shadow-xs">
              <div className="px-5 py-3.5 bg-[#e5e7eb]/30 border-b border-[#e5e7eb] grid grid-cols-12 text-[10px] font-black uppercase tracking-wider text-[#6b7280]">
                <span className="col-span-5 sm:col-span-4">Service</span>
                <span className="col-span-2 text-center hidden sm:block">Providers</span>
                <span className="col-span-4 sm:col-span-3 text-right">Stock</span>
                <span className="col-span-3 sm:col-span-3 text-right">From</span>
              </div>

              <div className="divide-y divide-[#e5e7eb]/60">
                {topServices.length > 0 ? (
                  topServices.map((item) => (
                    <div
                      key={item.displayService}
                      className="px-5 py-4 grid grid-cols-12 items-center hover:bg-[#e5e7eb]/10 transition"
                    >
                      <span className="col-span-5 sm:col-span-4 font-black text-sm text-[#0b1e5b] truncate">
                        {item.displayService}
                      </span>
                      <span className="col-span-2 text-center text-xs font-bold text-[#6b7280] hidden sm:block">
                        {Math.min(item.providers, 8)}
                      </span>
                      <span className="col-span-4 sm:col-span-3 text-right text-xs font-extrabold text-[#6b7280]">
                        {item.totalStock.toLocaleString()}
                      </span>
                      <div className="col-span-3 sm:col-span-3 text-right flex items-center justify-end gap-3">
                        <div className="text-right">
                          <span className="text-xs sm:text-sm font-black text-[#0b1e5b] block">
                            ₦{item.minCostNgn !== Infinity ? item.minCostNgn.toLocaleString() : '0'}
                          </span>
                          <span className="text-[10px] font-bold text-[#6b7280] block">
                            ${item.minCostUsd !== Infinity ? item.minCostUsd.toFixed(2) : '0.00'}
                          </span>
                        </div>
                        <Link
                          href={`/buy?service=${item.displayService.toLowerCase()}`}
                          className="hidden sm:inline-flex text-[11px] font-extrabold text-[#0b1e5b] hover:underline"
                        >
                          Rent →
                        </Link>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-xs text-[#6b7280] font-medium">
                    {loading ? 'Fetching catalog inventory...' : 'No services currently available.'}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* INFO & CTA SECTION */}
          <section className="space-y-8 pt-4 pb-2">
            <div className="space-y-3 text-xs sm:text-sm font-medium text-[#6b7280] leading-relaxed max-w-3xl">
              <p>
                Listed prices are final — they include everything. The catalog also surfaces real-time stock, so each rental is fulfilled by the cheapest number with live inventory.
              </p>
              <p>
                Got a service or country we don't list?{' '}
                <Link 
                  href="/contact" 
                  className="text-[#0b1e5b] font-bold underline decoration-[#0b1e5b]/40 underline-offset-4 hover:decoration-[#0b1e5b] transition-colors"
                >
                  Tell us
                </Link>
                {' '}— we can usually add it within a day.
              </p>
            </div>

            {/* Compact Brand Blue CTA Card */}
            <div className="relative overflow-hidden bg-[#0b1e5b] rounded-2xl p-6 sm:p-8 shadow-sm border border-[#0b1e5b]/20">
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:1.5rem_1.5rem]"></div>
              
              <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="space-y-2">
                  <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                    Ready to start verifying?
                  </h2>
                  <p className="text-slate-300 text-xs sm:text-sm font-medium max-w-md leading-relaxed">
                    Top up via Korapay or crypto and rent your first number in under a minute.
                  </p>
                </div>
                
                <Link 
                  href="/signup" 
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-[#0b1e5b] font-black text-xs sm:text-sm rounded-xl shadow-xs hover:bg-slate-100 transition-all shrink-0 hover:-translate-y-0.5"
                >
                  Create account
                  <svg className="w-4 h-4 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Link>
              </div>
            </div>
          </section>

          {/* OUR NETWORK / ACCMARKET */}
          <section className="space-y-6 pt-6 pb-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#6b7280]">
                  Our Network
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-[#0b1e5b] tracking-tight">
                Part of the ecosystem
              </h2>
              <p className="text-xs sm:text-sm font-medium text-[#6b7280]">
                One team, specialized services — tap through to our sister site. Opens in a new tab.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {/* Accmarket Card */}
              <a
                href="https://accmarket.name.ng"
                target="_blank"
                rel="noopener noreferrer"
                className="p-4 sm:p-5 bg-white border border-[#e5e7eb] rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs hover:border-[#0b1e5b]/40 transition group"
              >
                <div className="flex items-center sm:items-start gap-3.5 w-full">
                  <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-white border border-[#e5e7eb] flex items-center justify-center shrink-0 overflow-hidden shadow-2xs p-1.5">
                    <img 
                      src="/accmarket.png" 
                      alt="Accmarket Logo" 
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="space-y-0.5 sm:space-y-1 min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                      <h3 className="text-sm font-black text-[#0b1e5b]">Accmarket</h3>
                      <span className="text-[11px] font-medium text-[#6b7280] truncate">accmarket.name.ng</span>
                    </div>
                    <p className="text-xs font-medium text-[#6b7280] leading-relaxed">
                      Verified digital accounts, social media assets, and marketing tools priced in naira.
                    </p>
                  </div>
                </div>
                
                <div className="self-end sm:self-center text-[#6b7280] group-hover:text-[#0b1e5b] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition shrink-0">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 17L17 7M17 7H7M17 7v10" />
                  </svg>
                </div>
              </a>
            </div>
          </section>

        </div>
      </main>

      {/* FOOTER */}
      <footer className="bg-[#fdfdfc] border-t border-[#e5e7eb] py-12 px-4 relative z-10">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="space-y-2">
            <span className="text-xl font-black text-[#0b1e5b] tracking-tight">AccNumbers</span>
            <p className="text-xs text-[#6b7280] font-medium max-w-sm">
              Programmable SMS verification numbers for builders, agencies, and operators.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 text-xs font-bold">
            <div className="space-y-3">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#6b7280]">
                Product
              </span>
              <ul className="space-y-2">
                <li><Link href="/pricing" className="text-[#0b1e5b] hover:underline">Pricing</Link></li>
                <li><Link href="/api" className="text-[#0b1e5b] hover:underline">API</Link></li>
                <li><Link href="/about" className="text-[#0b1e5b] hover:underline">About</Link></li>
              </ul>
            </div>

            <div className="space-y-3">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#6b7280]">
                Legal
              </span>
              <ul className="space-y-2">
                <li><Link href="/terms" className="text-[#0b1e5b] hover:underline">Terms of service</Link></li>
                <li><Link href="/privacy" className="text-[#0b1e5b] hover:underline">Privacy policy</Link></li>
              </ul>
            </div>
          </div>

          <div className="pt-6 border-t border-[#e5e7eb]/60 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs font-medium text-[#6b7280]">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[#0b1e5b] font-bold">All systems normal</span>
            </div>
            <div>© 2026 AccNumbers. All rights reserved.</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
