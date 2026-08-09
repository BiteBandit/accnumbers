'use client';

import Link from 'next/link';

export default function RefundPolicyPage() {
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
              Refund Policy
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
              At AccNumbers, we aim to provide reliable, automated SMS verification services. Because our platform provisions numbers and digital tokens instantly via upstream providers, our refund policies are structured around automated system outcomes.
            </p>

            {/* SECTION 1 */}
            <div className="space-y-2 pt-4 border-t border-[#e5e7eb]">
              <h2 className="text-base sm:text-lg font-black text-[#0b1e5b]">1. General Payment Finality</h2>
              <p>
                All wallet funding transactions made via Korapay (card, bank transfer) or Cryptomus (cryptocurrency) are final and non-refundable, except as expressly provided under specific automated conditions outlined in this policy.
              </p>
            </div>

            {/* SECTION 2 */}
            <div className="space-y-2 pt-4 border-t border-[#e5e7eb]">
              <h2 className="text-base sm:text-lg font-black text-[#0b1e5b]">2. Automatic Rental Refunds</h2>
              <p>A rental is automatically refunded back to your platform wallet when:</p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>you cancel the order within the allowed cancellation window (subject to upstream rules; certain providers lock cancellation during the first 2 minutes);</li>
                <li>the rental period expires completely without a verification SMS being received;</li>
                <li>the upstream provider recalls or returns the number back to inventory due to unavailability.</li>
              </ul>
            </div>

            {/* SECTION 3 */}
            <div className="space-y-2 pt-4 border-t border-[#e5e7eb]">
              <h2 className="text-base sm:text-lg font-black text-[#0b1e5b]">3. Wallet Credit vs. Cash Payouts</h2>
              <p>
                All successful refunds are credited exclusively back to your AccNumbers account wallet balance. Refunds are never automatically routed back to your original payment card, bank account, or crypto wallet.
              </p>
            </div>

            {/* SECTION 4 */}
            <div className="space-y-2 pt-4 border-t border-[#e5e7eb]">
              <h2 className="text-base sm:text-lg font-black text-[#0b1e5b]">4. Wallet-to-Bank Withdrawals</h2>
              <p>
                Withdrawals of unused wallet balances back to a bank account are processed strictly at our discretion and are subject to mandatory Know Your Customer (KYC) verification checks, anti-fraud reviews, and applicable processing fees.
              </p>
            </div>

            {/* SECTION 5 */}
            <div className="space-y-2 pt-4 border-t border-[#e5e7eb]">
              <h2 className="text-base sm:text-lg font-black text-[#0b1e5b]">5. Failed or Incomplete Funding</h2>
              <p>
                If your wallet funding transaction fails due to network errors, gateway interruptions, or dropped bank transfers, funds typically revert automatically via your payment provider. If funds leave your account but do not reflect in your wallet after 24 hours, contact support with your transaction reference.
              </p>
            </div>

            {/* SECTION 6 */}
            <div className="space-y-2 pt-4 border-t border-[#e5e7eb]">
              <h2 className="text-base sm:text-lg font-black text-[#0b1e5b]">6. Platform Abuse and Forfeiture</h2>
              <p className="text-xs font-bold text-red-600">
                Accounts found violating our Terms of Service (such as engaging in fraud, spam, or reverse-engineering) will face immediate suspension, resulting in the permanent forfeiture of any remaining wallet balance. No refunds will be issued for forfeited balances.
              </p>
            </div>

            {/* SECTION 7 */}
            <div className="space-y-2 pt-4 border-t border-[#e5e7eb]">
              <h2 className="text-base sm:text-lg font-black text-[#0b1e5b]">7. Third-Party Platform Failures</h2>
              <p>
                We are not responsible if a third-party application or website (e.g., social media platforms, financial apps) blocks, bans, or flags a number or token provided by our service after a successful verification code has been delivered. Once an SMS code is delivered, the transaction is considered complete and non-refundable.
              </p>
            </div>

            {/* SECTION 8 */}
            <div className="space-y-2 pt-4 border-t border-[#e5e7eb]">
              <h2 className="text-base sm:text-lg font-black text-[#0b1e5b]">8. Chargebacks and Disputes</h2>
              <p>
                Initiating unauthorized chargebacks, payment disputes, or fraudulent payment reversals through your bank or payment gateway will result in the immediate blacklisting of your account, API key revocation, and permanent freezing of remaining balances.
              </p>
            </div>

            {/* SECTION 9 */}
            <div className="space-y-2 pt-4 border-t border-[#e5e7eb]">
              <h2 className="text-base sm:text-lg font-black text-[#0b1e5b]">9. Policy Modifications</h2>
              <p>
                We reserve the right to amend, update, or modify this Refund Policy at any time. Changes will take effect immediately upon posting to the website. Continued usage of our services constitutes your agreement to the updated terms.
              </p>
            </div>

            {/* SECTION 10 */}
            <div className="space-y-2 pt-4 border-t border-[#e5e7eb]">
              <h2 className="text-base sm:text-lg font-black text-[#0b1e5b]">10. Support and Inquiries</h2>
              <p>
                If you have questions regarding a specific transaction or refund status, please reach out to our team at: <a href="mailto:support@accnumbers.com" className="text-[#0b1e5b] font-bold underline">support@accnumbers.com</a>
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
                <li><Link href="/refund" className="text-[#0b1e5b] hover:underline">Refund policy</Link></li>
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
