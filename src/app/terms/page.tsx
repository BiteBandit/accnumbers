export const metadata = {
  title: "Terms of Service - Accnumbers",
  description: "Read the terms and conditions for using Accnumbers virtual SMS verification and temporary phone number rental services.",
  robots: {
    index: false, // Keeps search engines focused on your service pages
    follow: true,
  },
};

'use client';

import Link from 'next/link';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#fdfdfc] text-[#0b1e5b] flex flex-col justify-between">
      <main className="flex-1 relative bg-[#fdfdfc] bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] bg-[size:2.25rem_2.25rem]">
        
        {/* HEADER */}
        <section className="pt-16 pb-10 px-4 border-b border-[#e5e7eb]/80 bg-[#fdfdfc]/90 backdrop-blur-xs">
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
              <span className="text-xs font-black uppercase tracking-widest text-[#0b1e5b]">
                Legal
              </span>
            </div>
            <h1 className="text-4xl sm:text-6xl font-black text-[#0b1e5b] tracking-tight leading-none">
              Terms of Service
            </h1>
            <p className="text-xs sm:text-sm text-[#6b7280] font-medium">
              Last updated: May 26, 2026
            </p>
          </div>
        </section>

        {/* CONTENT CONTAINER */}
        <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
          
          <div className="bg-white border border-[#e5e7eb] rounded-2xl p-6 sm:p-8 shadow-xs space-y-6 text-xs sm:text-sm font-medium text-[#6b7280] leading-relaxed">
            <p>
              These Terms govern your access to and use of AccNumbers (&quot;the Service&quot;). By creating an account, funding a wallet, or calling our API you agree to be bound by them.
            </p>

            {/* SECTION 1 */}
            <div className="space-y-2 pt-4 border-t border-[#e5e7eb]">
              <h2 className="text-base sm:text-lg font-black text-[#0b1e5b]">1. Account</h2>
              <p>
                You must be at least 18 years old and legally capable of forming a binding contract. You are responsible for keeping your password and API keys confidential and for all activity that occurs under your account. Notify us immediately if you suspect any unauthorised use.
              </p>
            </div>

            {/* SECTION 2 */}
            <div className="space-y-2 pt-4 border-t border-[#e5e7eb]">
              <h2 className="text-base sm:text-lg font-black text-[#0b1e5b]">2. Acceptable use</h2>
              <p>You agree NOT to use the Service to:</p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>commit fraud, identity theft, or any criminal activity;</li>
                <li>violate the terms of service of any third-party platform you verify against;</li>
                <li>send spam, harassment, or unsolicited messages from numbers you rent;</li>
                <li>resell raw numbers (you may build a product on top of our API; you may not redistribute single-use SMS codes);</li>
                <li>scrape, reverse-engineer, or otherwise disrupt the Service.</li>
              </ul>
              <p className="pt-2 text-xs font-bold text-red-600">
                Violations result in immediate suspension and forfeiture of any remaining balance.
              </p>
            </div>

            {/* SECTION 3 */}
            <div className="space-y-2 pt-4 border-t border-[#e5e7eb]">
              <h2 className="text-base sm:text-lg font-black text-[#0b1e5b]">3. Pricing and payment</h2>
              <p>
                Pricing is shown in NGN and USD, depending on your preference, and includes our markup. Prices are live and can change at any time without notice; the price quoted at the moment you confirm a rental is the price you pay. We accept payment via Korapay (card, bank transfer) and Cryptomus (cryptocurrency). All payments are non-refundable except as specified in section 4.
              </p>
            </div>

            {/* SECTION 4 */}
            <div className="space-y-2 pt-4 border-t border-[#e5e7eb]">
              <h2 className="text-base sm:text-lg font-black text-[#0b1e5b]">4. Refunds</h2>
              <p>A rental is automatically refunded to your wallet when:</p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>you cancel within the cancellation window (subject to upstream provider rules — some providers lock cancellation for the first 2 minutes);</li>
                <li>the rental expires without an SMS being received;</li>
                <li>the upstream provider returns the number to inventory.</li>
              </ul>
              <p className="pt-2">
                Refunds land in your wallet, not back to the original payment method. Wallet-to-bank withdrawals are at our discretion and subject to KYC.
              </p>
            </div>

            {/* SECTION 5 */}
            <div className="space-y-2 pt-4 border-t border-[#e5e7eb]">
              <h2 className="text-base sm:text-lg font-black text-[#0b1e5b]">5. Service availability</h2>
              <p>
                We aim for high availability but make no guarantees. Upstream providers can run out of inventory, change pricing, or temporarily refuse rentals at any time. We are not liable for losses arising from such outages, including missed verifications or expired tokens on third-party platforms.
              </p>
            </div>

            {/* SECTION 6 */}
            <div className="space-y-2 pt-4 border-t border-[#e5e7eb]">
              <h2 className="text-base sm:text-lg font-black text-[#0b1e5b]">6. API rate limits</h2>
              <p>
                API keys are subject to a default rate limit of 60 requests per minute. Sustained abuse beyond your tier triggers automatic throttling and may result in key revocation. Per-account limits also apply to active concurrent rentals.
              </p>
            </div>

            {/* SECTION 7 */}
            <div className="space-y-2 pt-4 border-t border-[#e5e7eb]">
              <h2 className="text-base sm:text-lg font-black text-[#0b1e5b]">7. Termination</h2>
              <p>
                You may close your account at any time by emailing <a href="mailto:support@accnumbers.com" className="text-[#0b1e5b] font-bold underline">support@accnumbers.com</a>. We may suspend or terminate accounts that breach these Terms or that pose a fraud risk. On termination, any remaining wallet balance is forfeited if it was obtained through prohibited activity; otherwise it can be withdrawn at our discretion subject to KYC.
              </p>
            </div>

            {/* SECTION 8 */}
            <div className="space-y-2 pt-4 border-t border-[#e5e7eb]">
              <h2 className="text-base sm:text-lg font-black text-[#0b1e5b]">8. Limitation of liability</h2>
              <p>
                To the maximum extent permitted by law, AccNumbers&apos;s total aggregate liability arising out of or relating to these terms shall not exceed the total fees paid by you to us in the preceding 30 days.
              </p>
            </div>

            {/* SECTION 9 */}
            <div className="space-y-2 pt-4 border-t border-[#e5e7eb]">
              <h2 className="text-base sm:text-lg font-black text-[#0b1e5b]">9. Changes to terms</h2>
              <p>
                We may modify these terms by posting a revised version on our site and notifying users via email or dashboard notice at least 14 days before they take effect. Continued use after the effective date constitutes acceptance.
              </p>
            </div>

            {/* SECTION 10 */}
            <div className="space-y-2 pt-4 border-t border-[#e5e7eb]">
              <h2 className="text-base sm:text-lg font-black text-[#0b1e5b]">10. Contact</h2>
              <p>
                Questions about these Terms: <a href="mailto:support@accnumbers.com" className="text-[#0b1e5b] font-bold underline">support@accnumbers.com</a>
              </p>
            </div>

          </div>

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
