'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Home() {
  const [activeFaq, setActiveFaq] = useState<number | null>(0);
  const [simulatedCode, setSimulatedCode] = useState('748 219');
  
  const [currentTime, setCurrentTime] = useState<string>('');
const [currentDate, setCurrentDate] = useState<string>('');

  useEffect(() => {
  const updateDateTime = () => {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    setCurrentTime(`${hours}:${minutes}`);

    setCurrentDate(
      now.toLocaleDateString('en-US', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      })
    );
  };

  updateDateTime();
  const timer = setInterval(updateDateTime, 1000);
  return () => clearInterval(timer);
}, []);


  // Periodically refresh simulated OTP code like YoungPG live demo
  useEffect(() => {
    const interval = setInterval(() => {
      const randomCode = Math.floor(100000 + Math.random() * 900000).toString();
      setSimulatedCode(`${randomCode.slice(0, 3)} ${randomCode.slice(3)}`);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const liveFeeds = [
    { service: 'X.com / Twitter', code: '89•••5', country: 'United States', flag: 'fa-solid fa-flag-usa', time: '2m ago' },
    { service: 'Google, Gmail', code: '79•••0', country: 'United States', flag: 'fa-solid fa-flag-usa', time: '3m ago' },
    { service: 'PayPal', code: '57•••2', country: 'United Kingdom', flag: 'fa-solid fa-[#0b1e5b]', time: '4m ago' },
    { service: 'TikTok', code: '82•••4', country: 'United States', flag: 'fa-solid fa-flag-usa', time: '29m ago' },
    { service: 'WhatsApp', code: '49•••4', country: 'Netherlands', flag: 'fa-solid fa-earth-europe', time: '36m ago' },
  ];

  const popularCountries = [
    { name: 'United States', code: '+1', price: '₦1,560', flag: 'fa-solid fa-globe-americas', status: 'High' },
    { name: 'United Kingdom', code: '+44', price: '₦1,120', flag: 'fa-solid fa-earth-europe', status: 'High' },
    { name: 'Austria', code: '+43', price: '₦960', flag: 'fa-solid fa-earth-europe', status: 'Medium' },
    { name: 'Germany', code: '+49', price: '₦720', flag: 'fa-solid fa-earth-europe', status: 'High' },
    { name: 'Canada', code: '+1', price: '₦1,280', flag: 'fa-solid fa-globe-americas', status: 'High' },
    { name: 'Singapore', code: '+65', price: '₦1,640', flag: 'fa-solid fa-globe-asia', status: 'Limited' },
  ];



  return (
    <div className="min-h-screen bg-[#fdfdfc] text-[#111111] selection:bg-[#0b1e5b] selection:text-[#fdfdfc]">
      
      {/* 1. TOP BRAND BANNER */}
      <div className="bg-[#0b1e5b] text-[#fdfdfc] text-xs py-2 px-4 border-b border-[#0b1e5b]/20">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="font-bold opacity-90">Part of Accmarket Network</span>
            <span className="opacity-40">•</span>
            <a href="https://accmarket.name.ng" target="_blank" rel="noreferrer" className="underline hover:text-[#e5e7eb] transition">
              Accmarket.name.ng
            </a>
          </div>
          <div className="flex items-center gap-2 text-[11px] font-semibold">
            <i className="fa-solid fa-shield-halved text-emerald-400"></i>
            <span>Automated Non-VoIP Gateway</span>
          </div>
        </div>
      </div>

            {/* 2. NAVIGATION BAR WITH CUSTOM LOGO */}
      <nav className="border-b border-[#e5e7eb] bg-[#fdfdfc]/90 sticky top-0 z-50 px-4 py-2.5 backdrop-blur-md">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          
          {/* Logo & Brand Image */}
          <a href="/" className="flex items-center gap-3 group">
  <img 
    src="/logo.png" 
    alt="AccNumbers Logo" 
    width="257"
    height="140"
    className="h-20 w-auto object-contain transition-transform group-hover:scale-105"
  />
</a>

          {/* Navigation Links */}
          <div className="hidden lg:flex items-center gap-7 text-xs font-bold text-[#6b7280]">
            <a href="#services" className="hover:text-[#0b1e5b] transition">Services</a>
            <a href="#how-it-works" className="hover:text-[#0b1e5b] transition">How It Works</a>
            <a href="#api" className="hover:text-[#0b1e5b] transition">API Docs</a>
            <a href="#faq" className="hover:text-[#0b1e5b] transition">FAQ</a>
          </div>


                      {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <Link 
              href="/signin" 
              className="text-xs font-bold text-[#0b1e5b] hover:bg-[#e5e7eb]/40 px-3.5 py-2 rounded-xl transition inline-flex items-center justify-center cursor-pointer"
            >
              Sign In
            </Link>

            <Link 
              href="/signup" 
              className="bg-[#0b1e5b] hover:bg-[#0b1e5b]/90 text-[#fdfdfc] font-black text-xs px-4 py-2.5 rounded-xl transition shadow-md active:scale-95 flex items-center gap-2 cursor-pointer inline-flex"
            >
              <span>Start Free</span>
              <i className="fa-solid fa-arrow-right text-[10px]"></i>
            </Link>
          </div>

          

        </div>
      </nav>


      {/* 3. HERO SECTION WITH SMARTPHONE MOCKUP */}
      <section className="grid-bg-light border-b border-[#e5e7eb] pt-12 pb-20 px-4">
        <div className="max-w-5xl mx-auto text-center space-y-8">
          
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#fdfdfc] border border-[#e5e7eb] shadow-xs text-[#0b1e5b] text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse-glow"></span>
            <span>Start free in 60 seconds</span>
            <i className="fa-solid fa-arrow-right text-[10px] ml-1"></i>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-[#0b1e5b] tracking-tight leading-tight">
            Virtual Numbers<br />
            <span className="text-[#0b1e5b]">Instant SMS Verification</span>
          </h1>

          <p className="text-[#6b7280] text-sm sm:text-lg max-w-2xl mx-auto font-medium leading-relaxed">
            Get reliable phone numbers for receiving SMS codes and verifying your accounts.
          </p>

          <div className="flex justify-center gap-3">
            <Link 
  href="/pricing"
  className="bg-[#0b1e5b] hover:bg-[#0b1e5b]/90 text-[#fdfdfc] font-extrabold text-sm px-8 py-3.5 rounded-xl shadow-lg transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer inline-flex"
>
  <span>See Prices & Stock</span>
  <i className="fa-solid fa-arrow-right text-xs"></i>
</Link>

          </div>

          {/* Interactive Smartphone Screen Mockup */}
          <div className="pt-8 max-w-sm mx-auto relative">
            <div className="bg-[#111111] border-4 border-[#0b1e5b] rounded-[40px] p-4 shadow-2xl space-y-3 text-left relative overflow-hidden">
              <div className="w-28 h-4 bg-[#0b1e5b] rounded-full mx-auto mb-4"></div>
              
              <div className="text-center text-[#fdfdfc] space-y-1 py-2">
  <p className="text-3xl font-mono font-bold tracking-tight">
    {currentTime || '00:00'}
  </p>
  <p className="text-[10px] text-[#6b7280] font-semibold">
    {currentDate || 'Loading date...'}
  </p>
</div>

              {/* Simulated Stack of Live Incoming Push Notifications */}
              <div className="space-y-2.5 pt-2">
                <div className="bg-[#fdfdfc]/10 border border-[#fdfdfc]/20 rounded-2xl p-3 backdrop-blur-md text-[#fdfdfc] space-y-1 animate-float">
                  <div className="flex justify-between items-center text-[10px] text-emerald-400 font-bold">
                    <span className="flex items-center gap-1.5"><i className="fa-brands fa-whatsapp text-emerald-400"></i> WhatsApp</span>
                    <span>now</span>
                  </div>
                  <p className="text-xs font-semibold">Your WhatsApp code is <span className="font-mono font-bold underline text-amber-300">577389</span>. Don't share it.</p>
                </div>

                <div className="bg-[#fdfdfc]/10 border border-[#fdfdfc]/20 rounded-2xl p-3 backdrop-blur-md text-[#fdfdfc] space-y-1">
                  <div className="flex justify-between items-center text-[10px] text-sky-400 font-bold">
                    <span className="flex items-center gap-1.5"><i className="fa-brands fa-telegram text-sky-400"></i> Telegram</span>
                    <span>14s ago</span>
                  </div>
                  <p className="text-xs font-semibold">Telegram code: <span className="font-mono font-bold text-amber-300">145099</span></p>
                </div>

                <div className="bg-[#fdfdfc]/10 border border-[#fdfdfc]/20 rounded-2xl p-3 backdrop-blur-md text-[#fdfdfc] space-y-1">
                  <div className="flex justify-between items-center text-[10px] text-red-400 font-bold">
                    <span className="flex items-center gap-1.5"><i className="fa-solid fa-film text-red-400"></i> Netflix</span>
                    <span>1m ago</span>
                  </div>
                  <p className="text-xs font-semibold">Your Netflix verification code is <span className="font-mono font-bold text-amber-300">0635</span></p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 4. LIVE METRICS COUNTER */}
      <section className="border-b border-[#e5e7eb] bg-[#fdfdfc] py-10 px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="border border-[#e5e7eb] rounded-2xl p-4 bg-[#fdfdfc] space-y-1 shadow-xs">
            <div className="text-xs font-bold text-[#6b7280] uppercase flex items-center justify-between">
              <span>Services</span>
              <i className="fa-solid fa-layer-group text-[#0b1e5b]"></i>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-[#0b1e5b]">1,670+</p>
            <p className="text-[11px] text-[#6b7280] font-medium">in catalog</p>
          </div>

          <div className="border border-[#e5e7eb] rounded-2xl p-4 bg-[#fdfdfc] space-y-1 shadow-xs">
            <div className="text-xs font-bold text-[#6b7280] uppercase flex items-center justify-between">
              <span>Countries</span>
              <i className="fa-solid fa-earth-africa text-[#0b1e5b]"></i>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-[#0b1e5b]">218</p>
            <p className="text-[11px] text-[#6b7280] font-medium">with live inventory</p>
          </div>

          <div className="border border-[#e5e7eb] rounded-2xl p-4 bg-[#fdfdfc] space-y-1 shadow-xs">
            <div className="text-xs font-bold text-[#6b7280] uppercase flex items-center justify-between">
              <span>Live Offers</span>
              <i className="fa-solid fa-chart-line text-[#0b1e5b]"></i>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-[#0b1e5b]">31,415</p>
            <p className="text-[11px] text-[#6b7280] font-medium">updated minutely</p>
          </div>

          <div className="border border-[#e5e7eb] rounded-2xl p-4 bg-[#fdfdfc] space-y-1 shadow-xs">
            <div className="text-xs font-bold text-[#6b7280] uppercase flex items-center justify-between">
              <span>From</span>
              <i className="fa-solid fa-[#0b1e5b] fa-tag text-[#0b1e5b]"></i>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-[#0b1e5b]">₦96.00</p>
            <p className="text-[11px] text-[#6b7280] font-medium">per number</p>
          </div>
        </div>
      </section>

      {/* 5. LIVE CODE STREAM */}
      <section className="py-16 px-4 max-w-5xl mx-auto space-y-8">
        <div className="space-y-2">
          <span className="text-xs font-black text-[#0b1e5b] uppercase tracking-wider">Realtime Stream</span>
          <h2 className="text-2xl sm:text-4xl font-black text-[#0b1e5b]">One number, every code.</h2>
          <p className="text-xs sm:text-sm text-[#6b7280] font-medium">From messaging apps to AI tools—here is what live verification looks like.</p>
        </div>

        <div className="space-y-3">
          {liveFeeds.map((feed, idx) => (
            <div key={idx} className="border border-[#e5e7eb] bg-[#fdfdfc] hover:border-[#0b1e5b] rounded-2xl p-4 flex justify-between items-center transition shadow-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-extrabold text-[#111111]">{feed.service}</h3>
                  <span className="text-[11px] font-mono font-bold text-[#0b1e5b]">Verification code <span className="bg-[#0b1e5b]/10 px-2 py-0.5 rounded">{feed.code}</span></span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-[#6b7280]">
                  <i className={feed.flag}></i>
                  <span>{feed.country}</span>
                </div>
              </div>

              <div className="text-right space-y-1">
                <span className="text-[11px] text-[#6b7280] font-medium block">{feed.time}</span>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  delivered
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. PLATFORM & SERVICE RATES GRID */}
      <section id="services" className="bg-[#e5e7eb]/20 border-y border-[#e5e7eb] py-16 px-4">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="space-y-2">
            <span className="text-xs font-black text-[#0b1e5b] uppercase tracking-wider">Instant Activations</span>
            <h2 className="text-2xl sm:text-4xl font-black text-[#0b1e5b]">Select your target platform.</h2>
            <p className="text-xs sm:text-sm text-[#6b7280] font-medium">Choose a service to view available country numbers, live stock, and starting rates.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { name: 'WhatsApp', icon: 'fa-brands fa-whatsapp text-emerald-500', price: '₦102.40', stock: '6,820,612', countries: '217 Countries' },
              { name: 'Telegram', icon: 'fa-brands fa-telegram text-sky-500', price: '₦96.00', stock: '12,043,656', countries: '217 Countries' },
              { name: 'Facebook', icon: 'fa-brands fa-facebook text-blue-600', price: '₦96.00', stock: '6,443,180', countries: '214 Countries' },
              { name: 'Viber', icon: 'fa-brands fa-viber text-purple-600', price: '₦96.00', stock: '7,986,568', countries: '213 Countries' },
              { name: 'WeChat', icon: 'fa-brands fa-weixin text-emerald-600', price: '₦96.00', stock: '8,238,231', countries: '212 Countries' },
              { name: 'eBay', icon: 'fa-brands fa-ebay text-blue-500', price: '₦96.00', stock: '5,120,400', countries: '210 Countries' },
              { name: 'Nike', icon: 'fa-brands fa-nike text-black', price: '₦96.00', stock: '7,718,276', countries: '215 Countries' },
              { name: 'Yahoo', icon: 'fa-brands fa-yahoo text-purple-700', price: '₦96.00', stock: '12,138,021', countries: '213 Countries' },
              { name: 'Naver', icon: 'fa-solid fa-square-letter-n text-emerald-500', price: '₦96.00', stock: '12,596,653', countries: '214 Countries' },
              { name: 'Tinder', icon: 'fa-solid fa-fire text-rose-500', price: '₦96.00', stock: '12,848,710', countries: '216 Countries' },
            ].map((service, i) => (
              <div key={i} className="bg-[#fdfdfc] border border-[#e5e7eb] rounded-2xl p-5 space-y-4 shadow-xs hover:border-[#0b1e5b] transition">
                
                {/* Platform Header */}
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#e5e7eb]/30 flex items-center justify-center text-xl">
                      <i className={service.icon}></i>
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-[#111111]">{service.name}</h3>
                      <span className="text-[11px] font-bold text-[#6b7280] flex items-center gap-1.5">
                        {/* Beaming Glowing Dot Effect */}
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        In Stock
                      </span>
                    </div>
                  </div>
                </div>

                {/* Live Stock Metrics */}
                <div className="bg-[#0b1e5b] text-[#fdfdfc] p-3 rounded-xl flex justify-between items-center font-mono text-xs">
                  <span className="opacity-75">{service.countries}</span>
                  <span className="font-bold text-emerald-400">{service.stock} available</span>
                </div>

                {/* Price & Action */}
                <div className="flex justify-between items-center pt-1">
                  <div>
                    <span className="text-[10px] font-bold text-[#6b7280] uppercase block">Starting From</span>
                    <span className="text-base font-black text-[#0b1e5b]">{service.price}</span>
                  </div>
                  <button className="bg-[#0b1e5b] hover:bg-[#0b1e5b]/90 text-[#fdfdfc] text-xs font-extrabold px-4 py-2 rounded-xl transition active:scale-95 flex items-center gap-1.5 cursor-pointer">
                    <span>Rent</span>
                    <i className="fa-solid fa-arrow-right text-[10px]"></i>
                  </button>
                </div>

              </div>
            ))}
          </div>
        </div>
      </section>



       {/* 7. STEP-BY-STEP WORKFLOW INTERFACE (YoungPG Style) */}
      <section id="how-it-works" className="grid-bg-dark text-[#fdfdfc] py-20 px-4">
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <span className="text-xs font-black uppercase tracking-wider text-emerald-400">How Rentals Work</span>
            <h2 className="text-3xl sm:text-5xl font-black">Four steps, about 30 seconds.</h2>
            <p className="text-xs sm:text-sm text-[#e5e7eb]/80 font-medium">No accounts to create with anyone else. No SIM cards to buy. Pick, rent, paste, receive.</p>
          </div>

          <div className="space-y-6">
            
            {/* Step 1 */}
            <div className="bg-[#fdfdfc]/10 border border-[#fdfdfc]/20 p-6 rounded-3xl space-y-4">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-emerald-400 text-[#0b1e5b] font-black flex items-center justify-center text-xs">1</span>
                <h3 className="text-base font-black uppercase">PICK SERVICE & COUNTRY</h3>
              </div>
              <div className="bg-[#fdfdfc] text-[#111111] p-4 rounded-2xl flex justify-between items-center font-bold text-xs">
                <span className="flex items-center gap-2"><i className="fa-brands fa-whatsapp text-emerald-600 text-base"></i> WhatsApp</span>
                <span className="text-[#0b1e5b] font-mono font-black">₦1,560</span>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-[#fdfdfc]/10 border border-[#fdfdfc]/20 p-6 rounded-3xl space-y-4">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-emerald-400 text-[#0b1e5b] font-black flex items-center justify-center text-xs">2</span>
                <h3 className="text-base font-black uppercase">PROVISION NUMBER</h3>
              </div>
              <div className="bg-[#111111] border border-[#fdfdfc]/20 p-4 rounded-2xl flex justify-between items-center font-mono text-xs">
                <div className="space-y-1">
                  <span className="text-amber-400 text-[10px] block font-sans font-bold">• pending allocation</span>
                  <span className="text-lg font-bold text-emerald-400">+1 415 555 0181</span>
                </div>
                <button className="bg-[#fdfdfc]/20 hover:bg-[#fdfdfc]/30 text-[#fdfdfc] px-3 py-1.5 rounded-lg text-xs font-sans font-bold">
                  <i className="fa-solid fa-copy mr-1"></i> Copy
                </button>
              </div>
            </div>

            {/* Step 3 & 4 */}
            <div className="bg-[#fdfdfc]/10 border border-[#fdfdfc]/20 p-6 rounded-3xl space-y-4">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-emerald-400 text-[#0b1e5b] font-black flex items-center justify-center text-xs">3 & 4</span>
                <h3 className="text-base font-black uppercase">PASTE & RECEIVE SMS</h3>
              </div>
              <div className="bg-[#111111] border border-emerald-500/50 p-6 rounded-2xl text-center space-y-3">
                <span className="text-emerald-400 text-xs font-bold font-mono">● received in 3.2s</span>
                <div className="text-3xl sm:text-4xl font-mono font-black text-emerald-400 tracking-widest">
                  {simulatedCode}
                </div>
                <p className="text-[11px] text-[#e5e7eb]/70 font-mono">"Your TargetApp code is {simulatedCode.replace(' ', '')}. Don't share it."</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 8. DEVELOPER API SECTION */}
      <section id="api" className="py-20 px-4 max-w-5xl mx-auto space-y-10">
        <div className="space-y-3">
          <span className="text-xs font-black text-[#0b1e5b] uppercase tracking-wider">DROP-IN COMPATIBLE</span>
          <h2 className="text-3xl sm:text-4xl font-black text-[#0b1e5b]">Integrated with SMS-Activate style software? You're done in five minutes.</h2>
          <p className="text-xs sm:text-sm text-[#6b7280] font-medium leading-relaxed max-w-2xl">
            Replace the host. Keep your client code. Get state-of-the-art provisioning, transparent pricing, and a real dashboard to back it up.
          </p>
        </div>

        {/* Code Snippet */}
        <div className="bg-[#111111] text-[#fdfdfc] rounded-3xl p-6 font-mono text-xs space-y-4 shadow-2xl border border-[#0b1e5b]">
          <div className="flex justify-between items-center border-b border-[#fdfdfc]/10 pb-3 text-[11px] text-[#6b7280]">
            <span className="text-emerald-400 font-bold"># Rent a US number for Telegram</span>
            <span>terminal</span>
          </div>
          <p className="text-sky-300">curl -X POST https://accnumbers.com/api/v1/rentals \</p>
          <p className="pl-4 text-[#e5e7eb]">-H "Authorization: Bearer ypv_e*#*" \</p>
          <p className="pl-4 text-[#e5e7eb]">-d '{`{"service": "tg", "country": "us"}`}'</p>
          
          <div className="pt-3 border-t border-[#fdfdfc]/10 text-amber-300 space-y-1">
            <p className="text-[10px] text-[#6b7280]"># Response</p>
            <p>{`{`}</p>
            <p className="pl-4">{`"ok": true,`}</p>
            <p className="pl-4">{`"data": { "id": 12345, "number": "+1415550181", "price": 1560.00 }`}</p>
            <p>{`}`}</p>
          </div>
        </div>
      </section>

            {/* 9. FAQ ACCORDION (Pure HTML - 100% Reliable on Mobile) */}
      <section id="faq" className="bg-[#e5e7eb]/20 border-y border-[#e5e7eb] py-20 px-4">
        <div className="max-w-4xl mx-auto space-y-10">
          <div className="space-y-2">
            <span className="text-xs font-black text-[#0b1e5b] uppercase tracking-wider">FAQ</span>
            <h2 className="text-3xl font-black text-[#0b1e5b]">Frequently asked questions</h2>
            <p className="text-xs text-[#6b7280] font-medium">What people ask before their first rental.</p>
          </div>

          <div className="space-y-3">
            <details className="group bg-[#fdfdfc] border border-[#e5e7eb] rounded-2xl overflow-hidden shadow-xs" open>
              <summary className="p-5 font-bold text-xs sm:text-sm text-[#0b1e5b] flex justify-between items-center cursor-pointer select-none list-none [&::-webkit-details-marker]:hidden">
                <span>Is this legal to use?</span>
                <i className="fa-solid fa-chevron-down text-xs transition-transform duration-200 group-open:rotate-180 group-open:text-emerald-600"></i>
              </summary>
              <div className="px-5 pb-5 text-xs text-[#6b7280] font-medium leading-relaxed border-t border-[#e5e7eb]/50 pt-3">
                Yes. At AccNumbers, your privacy comes first. Our virtual numbers let you sign up for apps and websites without exposing your real phone number, helping protect you from spam, scams, and data breaches. We enforce strict anti-abuse measures, and allocation logs are disclosed only when required by law.
              </div>
            </details>

            <details className="group bg-[#fdfdfc] border border-[#e5e7eb] rounded-2xl overflow-hidden shadow-xs">
              <summary className="p-5 font-bold text-xs sm:text-sm text-[#0b1e5b] flex justify-between items-center cursor-pointer select-none list-none [&::-webkit-details-marker]:hidden">
                <span>How long can I use one number?</span>
                <i className="fa-solid fa-chevron-down text-xs transition-transform duration-200 group-open:rotate-180 group-open:text-emerald-600"></i>
              </summary>
              <div className="px-5 pb-5 text-xs text-[#6b7280] font-medium leading-relaxed border-t border-[#e5e7eb]/50 pt-3">
                Standard rentals remain active for 20 minutes to receive your SMS code. If no SMS arrives, you are refunded 100% automatically.
              </div>
            </details>

            <details className="group bg-[#fdfdfc] border border-[#e5e7eb] rounded-2xl overflow-hidden shadow-xs">
              <summary className="p-5 font-bold text-xs sm:text-sm text-[#0b1e5b] flex justify-between items-center cursor-pointer select-none list-none [&::-webkit-details-marker]:hidden">
                <span>Will the same number work twice?</span>
                <i className="fa-solid fa-chevron-down text-xs transition-transform duration-200 group-open:rotate-180 group-open:text-emerald-600"></i>
              </summary>
              <div className="px-5 pb-5 text-xs text-[#6b7280] font-medium leading-relaxed border-t border-[#e5e7eb]/50 pt-3">
                No. Every AccNumbers virtual number is designed for one-time verification on a single service. This protects your account by ensuring verification codes are never received by another user after you've used the number.

If you need to verify the same service again, simply rent a new virtual number. AccNumbers continuously refreshes its inventory to provide secure, reliable numbers whenever they're available.
              </div>
            </details>

            <details className="group bg-[#fdfdfc] border border-[#e5e7eb] rounded-2xl overflow-hidden shadow-xs">
              <summary className="p-5 font-bold text-xs sm:text-sm text-[#0b1e5b] flex justify-between items-center cursor-pointer select-none list-none [&::-webkit-details-marker]:hidden">
                <span>Does it work for WhatsApp, Telegram, and Google?</span>
                <i className="fa-solid fa-chevron-down text-xs transition-transform duration-200 group-open:rotate-180 group-open:text-emerald-600"></i>
              </summary>
              <div className="px-5 pb-5 text-xs text-[#6b7280] font-medium leading-relaxed border-t border-[#e5e7eb]/50 pt-3">
                Yes. We provide 100% real SIM non-VoIP numbers from international carrier towers that work seamlessly with major messaging and social applications.
              </div>
            </details>

            <details className="group bg-[#fdfdfc] border border-[#e5e7eb] rounded-2xl overflow-hidden shadow-xs">
              <summary className="p-5 font-bold text-xs sm:text-sm text-[#0b1e5b] flex justify-between items-center cursor-pointer select-none list-none [&::-webkit-details-marker]:hidden">
                <span>What if no SMS arrives?</span>
                <i className="fa-solid fa-chevron-down text-xs transition-transform duration-200 group-open:rotate-180 group-open:text-emerald-600"></i>
              </summary>
              <div className="px-5 pb-5 text-xs text-[#6b7280] font-medium leading-relaxed border-t border-[#e5e7eb]/50 pt-3">
                Cancel the rental before the 20-minute timer ends, or let it expire. Your wallet balance is automatically credited back immediately.
              </div>
            </details>

            <details className="group bg-[#fdfdfc] border border-[#e5e7eb] rounded-2xl overflow-hidden shadow-xs">
              <summary className="p-5 font-bold text-xs sm:text-sm text-[#0b1e5b] flex justify-between items-center cursor-pointer select-none list-none [&::-webkit-details-marker]:hidden">
                <span>How do I pay? Is local Nigerian bank transfer supported?</span>
                <i className="fa-solid fa-chevron-down text-xs transition-transform duration-200 group-open:rotate-180 group-open:text-emerald-600"></i>
              </summary>
              <div className="px-5 pb-5 text-xs text-[#6b7280] font-medium leading-relaxed border-t border-[#e5e7eb]/50 pt-3">
                Yes! You can pay via local Bank Transfers, USSD, Monnify, Paystack, Visa, Mastercard, Verve, or crypto.
              </div>
            </details>
          </div>

                    {/* Still got questions? Support Card */}
          <div className="bg-[#fdfdfc] border border-[#e5e7eb] rounded-2xl p-6 sm:p-7 space-y-6 shadow-xs mt-6">
            <div className="flex items-start gap-4">
              {/* Light Green Icon Badge */}
              <div className="w-12 h-12 rounded-xl bg-[#ecfccb] flex items-center justify-center text-[#4d7c0f] shrink-0 text-xl">
                <i className="fa-regular fa-comment-dots"></i>
              </div>
              <div className="space-y-1">
                <h3 className="text-base sm:text-lg font-black text-[#0b1e5b]">Still got questions?</h3>
                <p className="text-xs text-[#6b7280] font-medium leading-relaxed">
                  Email us — most replies go out within a few hours during business days.
                </p>
              </div>
            </div>

            <a 
              href="/contact" 
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#fdfdfc] hover:bg-[#e5e7eb]/30 border border-[#e5e7eb] text-[#0b1e5b] text-xs font-extrabold px-6 py-3 rounded-xl transition active:scale-95 shadow-2xs"
            >
              <span>Contact support</span>
              <i className="fa-solid fa-arrow-right text-[10px]"></i>
            </a>
          </div>

        </div>
      </section>


      {/* 10. PAYMENT METHODS BADGES (Pay Your Way - Safely) */}
      <section className="py-16 px-4 text-center space-y-6 max-w-4xl mx-auto">
        <span className="text-xs font-black text-[#0b1e5b] uppercase tracking-wider">TRUSTED & SECURE</span>
        <h2 className="text-2xl font-black text-[#0b1e5b]">Pay your way — safely.</h2>
        <p className="text-xs text-[#6b7280] max-w-md mx-auto font-medium">
          Checkout is handled via encrypted PCI-DSS connection. Pay with your card, bank transfer, USSD, or crypto.
        </p>

        <div className="flex flex-wrap justify-center items-center gap-3 pt-2">
          <span className="bg-[#fdfdfc] border border-[#e5e7eb] px-4 py-2 rounded-xl text-xs font-bold text-[#0b1e5b] shadow-xs">
            <i className="fa-solid fa-[#0b1e5b] fa-building-columns mr-1.5 text-emerald-600"></i> Local Bank Transfer
          </span>
          <span className="bg-[#fdfdfc] border border-[#e5e7eb] px-4 py-2 rounded-xl text-xs font-bold text-[#0b1e5b] shadow-xs">
            <i className="fa-brands fa-cc-visa mr-1.5 text-blue-600"></i> Visa
          </span>
          <span className="bg-[#fdfdfc] border border-[#e5e7eb] px-4 py-2 rounded-xl text-xs font-bold text-[#0b1e5b] shadow-xs">
            <i className="fa-brands fa-cc-mastercard mr-1.5 text-orange-500"></i> Mastercard
          </span>
          <span className="bg-[#fdfdfc] border border-[#e5e7eb] px-4 py-2 rounded-xl text-xs font-bold text-[#0b1e5b] shadow-xs">
            <i className="fa-solid fa-shield-halved mr-1.5 text-emerald-500"></i> Verve
          </span>
        </div>
      </section>

      {/* 11. FOOTER */}
        <footer className="grid-bg-dark text-[#fdfdfc] border-t border-[#0b1e5b] px-4 py-16">
      <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-xs">
        <div className="space-y-3 col-span-2 md:col-span-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#fdfdfc] text-[#0b1e5b] flex items-center justify-center font-black">
              <i className="fa-solid fa-sim-card"></i>
            </div>
            <span className="text-base font-extrabold">Accnumbers</span>
          </div>
          <p className="text-[11px] text-[#e5e7eb]/70 leading-relaxed font-medium">
            Programmable SMS verification numbers for builders and operators. Powered by Accmarket Network.
          </p>
        </div>

        <div className="space-y-2">
          <h4 className="font-bold text-emerald-400 uppercase text-[10px] tracking-wider">Product</h4>
          <ul className="space-y-1 text-[#e5e7eb]/80 font-medium">
            <li><Link href="/pricing" className="hover:text-white">Pricing</Link></li>
            <li><Link href="/api" className="hover:text-white">API Docs</Link></li>
            <li><Link href="/about" className="hover:text-white">About</Link></li>
          </ul>
        </div>

        <div className="space-y-2">
          <h4 className="font-bold text-emerald-400 uppercase text-[10px] tracking-wider">Legal</h4>
          <ul className="space-y-1 text-[#e5e7eb]/80 font-medium">
            <li><Link href="/terms" className="hover:text-white">Terms of Service</Link></li>
            <li><Link href="/privacy" className="hover:text-white">Privacy Policy</Link></li>
            <li><Link href="/refunds" className="hover:text-white">Refund Policy</Link></li>
          </ul>
        </div>

        <div className="space-y-2">
          <h4 className="font-bold text-emerald-400 uppercase text-[10px] tracking-wider">Network</h4>
          <ul className="space-y-1 text-[#e5e7eb]/80 font-medium">
            <li><a href="https://accmarket.name.ng" target="_blank" rel="noreferrer" className="hover:text-white">Accmarket.name.ng</a></li>
            <li className="flex items-center gap-1.5 text-emerald-400 text-[11px] pt-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              All systems normal
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-6xl mx-auto border-t border-[#fdfdfc]/10 mt-12 pt-6 text-center text-[11px] text-[#e5e7eb]/60 font-medium">
        © 2026 Accnumbers. All rights reserved.
      </div>
    </footer>
    </div>
  );
}