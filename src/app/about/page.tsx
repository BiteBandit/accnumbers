import Link from 'next/link';

export const metadata = {
  title: 'About Us',
  description: 'Instant SMS verification numbers for personal accounts, social media signups, and online registrations. Fast, reliable, and funded easily in Naira or USD.',
  openGraph: {
    title: 'About Us — AccNumbers',
    description: 'Instant SMS verification numbers for personal accounts, social media signups, and online registrations.',
    url: 'https://accnumbers.com/about',
    siteName: 'AccNumbers',
  },
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#fdfdfc] text-[#0b1e5b] flex flex-col justify-between">
      <main className="flex-1 relative bg-[#fdfdfc] bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] bg-[size:2.25rem_2.25rem]">
        
        {/* HEADER */}
        <section className="pt-16 pb-10 px-4 border-b border-[#e5e7eb]/80 bg-[#fdfdfc]/90 backdrop-blur-xs">
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
              <span className="text-xs font-black uppercase tracking-widest text-[#0b1e5b]">
                About
              </span>
            </div>
            <h1 className="text-4xl sm:text-6xl font-black text-[#0b1e5b] tracking-tight leading-none">
              One wallet, instant numbers, effortless verification.
            </h1>
            <p className="text-sm sm:text-base text-[#6b7280] font-medium max-w-2xl leading-relaxed">
              AccNumbers is your go-to SMS verification platform designed for everyday users. We make getting online verification numbers simple, quick, and reliable, all from a single wallet funded in Naira or USD.
            </p>
          </div>
        </section>

        <div className="max-w-4xl mx-auto px-4 py-10 space-y-12">
          
          {/* WHAT WE DO */}
          <section className="space-y-4 bg-white border border-[#e5e7eb] rounded-2xl p-6 sm:p-8 shadow-xs">
            <h2 className="text-xl sm:text-2xl font-black text-[#0b1e5b] tracking-tight">
              What we do
            </h2>
            <div className="space-y-3 text-xs sm:text-sm font-medium text-[#6b7280] leading-relaxed">
              <p>
                Signing up for online services, social media apps, and digital platforms shouldn't be complicated by unavailable numbers or confusing payment methods. Stock fluctuates across services and countries, but you shouldn't have to worry about the backend hassle.
              </p>
              <p>
                AccNumbers handles the heavy lifting for you: a simple dashboard, transparent pricing, and instant access to working verification numbers whenever you need them.
              </p>
            </div>
          </section>

          {/* WHO WE SERVE */}
          <section className="space-y-6">
            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-black text-[#0b1e5b] tracking-tight">
                Who we serve
              </h2>
              <p className="text-xs sm:text-sm font-medium text-[#6b7280]">
                Built for individuals and users looking for fast account verification.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 bg-white border border-[#e5e7eb] rounded-2xl space-y-2 shadow-xs">
                <h3 className="text-sm font-black text-[#0b1e5b]">Everyday Users</h3>
                <p className="text-xs font-medium text-[#6b7280] leading-relaxed">
                  Looking to quickly verify personal accounts or sign up for platforms without using personal phone numbers.
                </p>
              </div>

              <div className="p-5 bg-white border border-[#e5e7eb] rounded-2xl space-y-2 shadow-xs">
                <h3 className="text-sm font-black text-[#0b1e5b]">Digital Creators</h3>
                <p className="text-xs font-medium text-[#6b7280] leading-relaxed">
                  Managing multiple social media or community profiles that require dependable SMS activation.
                </p>
              </div>

              <div className="p-5 bg-white border border-[#e5e7eb] rounded-2xl space-y-2 shadow-xs">
                <h3 className="text-sm font-black text-[#0b1e5b]">Online Shoppers</h3>
                <p className="text-xs font-medium text-[#6b7280] leading-relaxed">
                  Need smooth, instant code deliveries for global services, marketplaces, and apps.
                </p>
              </div>
            </div>
          </section>

          {/* HOW WE'RE DIFFERENT */}
          <section className="space-y-6">
            <h2 className="text-xl sm:text-2xl font-black text-[#0b1e5b] tracking-tight">
              How we're different
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-5 bg-white border border-[#e5e7eb] rounded-2xl space-y-1 shadow-xs">
                <h3 className="text-sm font-black text-[#0b1e5b]">Flexible Currencies</h3>
                <p className="text-xs font-medium text-[#6b7280] leading-relaxed">
                  Balance and pricing display in both NGN and USD end-to-end. Pay easily via Korapay (card or bank transfer) or crypto with no checkout surprises.
                </p>
              </div>

              <div className="p-5 bg-white border border-[#e5e7eb] rounded-2xl space-y-1 shadow-xs">
                <h3 className="text-sm font-black text-[#0b1e5b]">Instant Availability</h3>
                <p className="text-xs font-medium text-[#6b7280] leading-relaxed">
                  Get numbers that are ready to receive codes instantly. We source active inventory so you never get stuck waiting.
                </p>
              </div>

              <div className="p-5 bg-white border border-[#e5e7eb] rounded-2xl space-y-1 shadow-xs">
                <h3 className="text-sm font-black text-[#0b1e5b]">Simple User Experience</h3>
                <p className="text-xs font-medium text-[#6b7280] leading-relaxed">
                  Clean interface designed for anyone to use. Pick your country, select your service, and get your verification code within seconds.
                </p>
              </div>

              <div className="p-5 bg-white border border-[#e5e7eb] rounded-2xl space-y-1 shadow-xs">
                <h3 className="text-sm font-black text-[#0b1e5b]">Reliable Support</h3>
                <p className="text-xs font-medium text-[#6b7280] leading-relaxed">
                  Clear transaction logs and dedicated customer support to ensure a smooth experience every single time.
                </p>
              </div>
            </div>
          </section>

          {/* WHERE WE ARE */}
          <section className="space-y-3 bg-white border border-[#e5e7eb] rounded-2xl p-6 sm:p-8 shadow-xs">
            <h2 className="text-xl sm:text-2xl font-black text-[#0b1e5b] tracking-tight">
              Where we are
            </h2>
            <p className="text-xs sm:text-sm font-medium text-[#6b7280] leading-relaxed">
              Based in Nigeria, serving customers globally. Support is over email at <a href="mailto:support@accnumbers.com" className="text-[#0b1e5b] font-bold underline">support@accnumbers.com</a> — typically within a few hours during business days.
            </p>
          </section>

          {/* OUR NETWORK / ACCMARKET */}
          <section className="space-y-6 pt-4 pb-2">
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
              Instant SMS verification numbers for everyday users and online accounts.
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
