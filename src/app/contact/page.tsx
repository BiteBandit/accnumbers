import Link from 'next/link';

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[#fdfdfc] text-[#0b1e5b] flex flex-col justify-between">
      
      <main className="flex-1 relative bg-[#fdfdfc] bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] bg-[size:2.25rem_2.25rem]">
        
        {/* HEADER */}
        <section className="pt-16 pb-12 px-4 border-b border-[#e5e7eb]/80 bg-[#fdfdfc]/90 backdrop-blur-xs">
          <div className="max-w-3xl mx-auto space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-widest text-[#0b1e5b]">
                Support & Assistance
              </span>
              <span className="text-[10px] font-bold bg-[#e5e7eb] text-[#0b1e5b] px-3 py-1 rounded-full flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Support Active
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-black text-[#0b1e5b] tracking-tight leading-none">
              Get in Touch.
            </h1>
            <p className="text-sm sm:text-base text-[#6b7280] font-medium max-w-xl leading-relaxed">
              General support, billing, and integration help. We're here to make sure your SMS activations run smoothly.
            </p>
          </div>
        </section>

        {/* CONTENT SECTION */}
        <section className="py-12 px-4">
          <div className="max-w-3xl mx-auto space-y-6">

            {/* EMAIL CARD */}
            <div className="bg-[#fdfdfc] border border-[#e5e7eb] rounded-2xl p-6 sm:p-8 shadow-xs space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#0b1e5b]/5 flex items-center justify-center text-[#0b1e5b] text-xl font-black">
                  <i className="fa-solid fa-envelope"></i>
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#6b7280]">Email Us At</span>
                  <h2 className="text-lg sm:text-xl font-black text-[#0b1e5b]">support@accnumbers.com</h2>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-[#6b7280] font-medium leading-relaxed">
                Send us a direct message for any billing queries, technical issues, or platform assistance.
              </p>
            </div>

            {/* RESPONSE TIMES GRID */}
            <div className="bg-[#fdfdfc] border border-[#e5e7eb] rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
              <h3 className="text-xs font-black uppercase tracking-widest text-[#0b1e5b]">Response Times</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="space-y-1 bg-[#e5e7eb]/20 p-4 rounded-xl border border-[#e5e7eb]/60">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#6b7280]">Standard support</span>
                  <div className="text-lg font-black text-[#0b1e5b]">&lt; 4 hours</div>
                  <p className="text-[11px] text-[#6b7280] font-medium">Business days, 09:00-18:00 WAT</p>
                </div>

                <div className="space-y-1 bg-[#e5e7eb]/20 p-4 rounded-xl border border-[#e5e7eb]/60">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#6b7280]">Payment / refund</span>
                  <div className="text-lg font-black text-[#0b1e5b]">&lt; 24 hours</div>
                  <p className="text-[11px] text-[#6b7280] font-medium">Incl. weekends</p>
                </div>

                <div className="space-y-1 bg-[#e5e7eb]/20 p-4 rounded-xl border border-[#e5e7eb]/60">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#6b7280]">Outage / incident</span>
                  <div className="text-lg font-black text-[#0b1e5b]">&lt; 30 min</div>
                  <p className="text-[11px] text-[#6b7280] font-medium">On-call rotation, 24/7</p>
                </div>
              </div>
            </div>

            {/* RENTAL ID NOTICE */}
            <div className="bg-[#0b1e5b] text-white rounded-2xl p-6 sm:p-8 shadow-sm space-y-3">
              <div className="flex items-center gap-3">
                <i className="fa-solid fa-circle-exclamation text-emerald-400"></i>
                <h4 className="text-xs font-black uppercase tracking-wider text-emerald-400">When emailing about a rental</h4>
              </div>
              <p className="text-xs sm:text-sm font-medium text-slate-200 leading-relaxed">
                Please include your <strong className="text-white">rental ID</strong> (visible in the URL of any rental detail page, e.g., <code className="bg-white/10 px-1.5 py-0.5 rounded text-emerald-300">/account/rentals/12345</code>) and a short description of what went wrong. We can resolve almost anything from the audit ledger, so the more detail, the faster.
              </p>
            </div>

          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="bg-[#fdfdfc] border-t border-[#e5e7eb] py-12 px-4 relative z-10">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="space-y-2">
            <span className="text-xl font-black text-[#0b1e5b] tracking-tight">AccNumbers</span>
            <p className="text-xs text-[#6b7280] font-medium max-w-sm">
              Programmable SMS verification numbers for builders, agencies, and operators.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 text-xs font-bold">
            <div className="space-y-3">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#6b7280]">Product</span>
              <ul className="space-y-2">
                <li><Link href="/pricing" className="text-[#0b1e5b] hover:underline">Pricing</Link></li>
                <li><Link href="/api" className="text-[#0b1e5b] hover:underline">API</Link></li>
                <li><Link href="/about" className="text-[#0b1e5b] hover:underline">About</Link></li>
                <li><Link href="/contact" className="text-[#0b1e5b] hover:underline">Contact</Link></li>
              </ul>
            </div>

            <div className="space-y-3">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#6b7280]">Legal</span>
              <ul className="space-y-2">
                <li><Link href="/terms" className="text-[#0b1e5b] hover:underline">Terms of service</Link></li>
                <li><Link href="/privacy" className="text-[#0b1e5b] hover:underline">Privacy policy</Link></li>
                <li><Link href="/refund" className="text-[#0b1e5b] hover:underline">Refund policy</Link></li>
                <li><Link href="/faq" className="text-[#0b1e5b] hover:underline">FAQ</Link></li>
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

