export const metadata = {
  title: "Privacy Policy - Accnumbers",
  description: "Read how Accnumbers protects your data, ensures user privacy, and handles security for virtual number rentals.",
  robots: {
    index: false,
    follow: true,
  },
};

'use client';

import Link from 'next/link';

export default function PrivacyPage() {
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
              Privacy Policy
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
              At AccNumbers (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;), we respect your privacy and are committed to protecting your personal information. This Privacy Policy explains how we collect, use, and safeguard your data when you use our SMS verification service and website.
            </p>

            {/* SECTION 1 */}
            <div className="space-y-2 pt-4 border-t border-[#e5e7eb]">
              <h2 className="text-base sm:text-lg font-black text-[#0b1e5b]">1. Information We Collect</h2>
              <p>
                When you register, fund your wallet, or use our services, we may collect information such as your email address, account credentials, transaction records, API keys, and basic usage logs (such as IP addresses and request timestamps) to maintain service security and functionality.
              </p>
            </div>

            {/* SECTION 2 */}
            <div className="space-y-2 pt-4 border-t border-[#e5e7eb]">
              <h2 className="text-base sm:text-lg font-black text-[#0b1e5b]">2. How We Use Your Information</h2>
              <p>We use the data we collect to:</p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>create and manage your user account and wallet balance;</li>
                <li>process payments and handle automated refunds or billing inquiries;</li>
                <li>deliver SMS verification numbers and route incoming messages correctly;</li>
                <li>monitor and prevent fraudulent activities, abuse, or security breaches;</li>
                <li>improve our platform performance and user experience.</li>
              </ul>
            </div>

            {/* SECTION 3 */}
            <div className="space-y-2 pt-4 border-t border-[#e5e7eb]">
              <h2 className="text-base sm:text-lg font-black text-[#0b1e5b]">3. Data Security Measures</h2>
              <p>
                We implement industry-standard security protocols, including encrypted data transmission (HTTPS/SSL), secure token hashing, and strict database access controls. While we strive to protect your data, no method of electronic transmission or storage is 100% secure.
              </p>
            </div>

            {/* SECTION 4 */}
            <div className="space-y-2 pt-4 border-t border-[#e5e7eb]">
              <h2 className="text-base sm:text-lg font-black text-[#0b1e5b]">4. Sharing and Disclosure of Data</h2>
              <p>
                We do not sell, trade, or rent your personal information to third parties. We may share data only with trusted payment processors (such as Korapay and Cryptomus) strictly for completing your wallet funding transactions, or when required by law enforcement or legal obligations.
              </p>
            </div>

            {/* SECTION 5 */}
            <div className="space-y-2 pt-4 border-t border-[#e5e7eb]">
              <h2 className="text-base sm:text-lg font-black text-[#0b1e5b]">5. Cookies and Tracking</h2>
              <p>
                Our website may use essential cookies and similar tracking technologies to maintain user session states, remember your currency preferences (NGN or USD), and analyze aggregate site traffic to ensure optimal performance.
              </p>
            </div>

            {/* SECTION 6 */}
            <div className="space-y-2 pt-4 border-t border-[#e5e7eb]">
              <h2 className="text-base sm:text-lg font-black text-[#0b1e5b]">6. Retention of Data</h2>
              <p>
                We retain your account information, ledger entries, and transaction histories for as long as your account remains active or as needed to provide you services, comply with legal obligations, resolve disputes, and enforce our agreements.
              </p>
            </div>

            {/* SECTION 7 */}
            <div className="space-y-2 pt-4 border-t border-[#e5e7eb]">
              <h2 className="text-base sm:text-lg font-black text-[#0b1e5b]">7. Third-Party Links</h2>
              <p>
                Our platform may contain links to external sites or sister networks (such as Accmarket). We are not responsible for the privacy practices, terms, or content of those external websites. We encourage you to review their respective privacy policies.
              </p>
            </div>

            {/* SECTION 8 */}
            <div className="space-y-2 pt-4 border-t border-[#e5e7eb]">
              <h2 className="text-base sm:text-lg font-black text-[#0b1e5b]">8. Children&apos;s Privacy</h2>
              <p>
                Our services are not directed to individuals under the age of 18. We do not knowingly collect personal information from minors. If we discover that a minor has provided us with personal data, we will take immediate steps to close the account and delete such information.
              </p>
            </div>

            {/* SECTION 9 */}
            <div className="space-y-2 pt-4 border-t border-[#e5e7eb]">
              <h2 className="text-base sm:text-lg font-black text-[#0b1e5b]">9. Changes to This Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. When we make significant changes, we will post the updated policy on this page and update the &quot;Last updated&quot; date. Continued use of the platform after changes constitutes your acknowledgement of the updated policy.
              </p>
            </div>

            {/* SECTION 10 */}
            <div className="space-y-2 pt-4 border-t border-[#e5e7eb]">
              <h2 className="text-base sm:text-lg font-black text-[#0b1e5b]">10. Contact Us</h2>
              <p>
                If you have any questions, concerns, or requests regarding this Privacy Policy or your personal data, please contact us at: <a href="mailto:support@accnumbers.com" className="text-[#0b1e5b] font-bold underline">support@accnumbers.com</a>
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
