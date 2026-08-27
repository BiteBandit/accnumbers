'use client';

import React from 'react';
import Link from 'next/link';

export default function ApiDocsPage() {
  return (
    <div className="min-h-screen bg-[#fdfdfc] bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] flex flex-col">
      <main className="flex-1 w-full mx-auto py-10 px-4 sm:px-6 lg:px-12 space-y-8">

        {/* Breadcrumb & Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="text-xs text-[#6b7280] font-medium">
              Account <span className="px-1">/</span> API <span className="px-1">/</span> <span className="text-[#0b1e5b] font-bold">Documentation</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-[#0b1e5b] tracking-tight">API Documentation</h1>
            <p className="text-xs sm:text-sm text-[#6b7280] font-medium max-w-2xl">
              Complete reference and clear explanations for each endpoint, including request samples, exact response structures, error codes, and field descriptions.
            </p>
          </div>
          <Link 
            href="/account/api"
            className="p-2.5 sm:px-4 sm:py-2.5 rounded-2xl bg-white border border-[#e5e7eb] text-[#0b1e5b] hover:bg-[#0b1e5b]/5 transition shadow-xs flex items-center gap-1.5 text-xs font-bold shrink-0"
          >
            <span>Back to API Keys</span>
          </Link>
        </div>

        {/* Documentation Sections */}
        <div className="space-y-8">
          
          {/* Endpoint: User Profile & Balance */}
          <div className="bg-white border border-[#e5e7eb] rounded-3xl p-6 sm:p-8 shadow-sm space-y-8">
            
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider">GET</span>
                <span className="text-xs font-mono font-bold text-[#0b1e5b]">/api/v1/user/profile</span>
              </div>
              <h2 className="text-lg font-black text-[#0b1e5b]">User Profile &amp; Balance</h2>
              <p className="text-xs sm:text-sm text-[#6b7280] leading-relaxed">
                This endpoint allows authenticated users to fetch their account details, current vendor profile, and live wallet balances (including available balance and frozen funds) formatted identically to standard 5-SIM specifications.
              </p>
            </div>

            {/* Authentication requirements note */}
            <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-2xl p-4 text-xs text-[#475569] space-y-1">
              <span className="font-bold text-[#0b1e5b]">Authentication Requirement:</span> Requires a valid API key with an active status, a valid expiration date, and the <code className="bg-white px-1.5 py-0.5 rounded border border-gray-200 font-mono text-[11px]">balance</code> scope enabled. Pass your key via the <code className="font-mono">Authorization: Bearer &lt;YOUR_API_KEY&gt;</code> header or the <code className="font-mono">x-api-key</code> custom header
            </div>

            {/* Code Block Terminal */}
            <div className="bg-[#111111] border border-[#222222] rounded-2xl p-5 shadow-xl space-y-6 text-slate-200 font-mono">
              <div className="flex items-center justify-between border-b border-[#222222] pb-3 text-xs">
                <span className="text-emerald-400 font-bold"># Request Example (cURL)</span>
                <span className="text-slate-500 uppercase tracking-widest text-[10px]">terminal</span>
              </div>

              <div className="space-y-2 text-xs overflow-x-auto">
                <div className="text-cyan-400">curl &quot;https://www.accnumbers.com/api/v1/user/profile&quot; \</div>
                <div className="text-slate-300 pl-4">-H &quot;Authorization: Bearer acc_test_6ede12ca9a8ab629ab207f5346140cea&quot; \</div>
                <div className="text-slate-300 pl-4">-H &quot;Accept: application/json&quot;</div>
              </div>

              <div className="border-t border-[#222222] pt-3 space-y-2">
                <div className="text-slate-500 text-xs"># Success Response (200 OK)</div>
                <div className="text-amber-300 text-xs overflow-x-auto">
                  <pre>{`{
  "id": "69f6fef8-0246-447b-9da8-fe4300e2b61c",
  "email": "user@accnumbers.com",
  "vendor": "accnumbers",
  "default_forwarding_number": "",
  "balance": 15000,
  "rating": 100,
  "default_country": {
    "name": "nigeria",
    "iso": "ng",
    "prefix": "+234"
  },
  "default_operator": {
    "name": "any"
  },
  "frozen_balance": 0
}`}</pre>
                </div>
              </div>
            </div>

            {/* Detailed Error Messages Breakdown */}
            <div className="space-y-4">
              <h3 className="text-xs font-black text-[#0b1e5b] uppercase tracking-wider">Detailed Error Messages</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div className="border border-[#e5e7eb] rounded-2xl p-4 space-y-2 bg-[#fafafa]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-mono text-red-600 bg-red-50 px-2 py-0.5 rounded">401 Unauthorized</span>
                    <span className="text-[10px] text-gray-400 font-mono">Missing Token</span>
                  </div>
                  <p className="text-xs font-mono text-gray-800 bg-white p-2 rounded border border-gray-200">
                    &quot;Missing or invalid API token&quot;
                  </p>
                  <p className="text-xs text-[#6b7280]">
                    Triggered when neither the <code className="font-mono">Authorization</code> header nor the <code className="font-mono">x-api-key</code> header is provided or correctly formatted.
                  </p>
                </div>

                <div className="border border-[#e5e7eb] rounded-2xl p-4 space-y-2 bg-[#fafafa]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-mono text-red-600 bg-red-50 px-2 py-0.5 rounded">401 Unauthorized</span>
                    <span className="text-[10px] text-gray-400 font-mono">Invalid Key</span>
                  </div>
                  <p className="text-xs font-mono text-gray-800 bg-white p-2 rounded border border-gray-200">
                    &quot;Unauthorized: Invalid API key&quot;
                  </p>
                  <p className="text-xs text-[#6b7280]">
                    Triggered when the provided key token does not exist in the database records.
                  </p>
                </div>

                <div className="border border-[#e5e7eb] rounded-2xl p-4 space-y-2 bg-[#fafafa]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-mono text-amber-600 bg-amber-50 px-2 py-0.5 rounded">403 Forbidden</span>
                    <span className="text-[10px] text-gray-400 font-mono">Inactive Key</span>
                  </div>
                  <p className="text-xs font-mono text-gray-800 bg-white p-2 rounded border border-gray-200">
                    &quot;API key is inactive (Status: revoked)&quot;
                  </p>
                  <p className="text-xs text-[#6b7280]">
                    Triggered if the API key status has been deactivated or revoked by an administrator or user.
                  </p>
                </div>

                <div className="border border-[#e5e7eb] rounded-2xl p-4 space-y-2 bg-[#fafafa]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-mono text-amber-600 bg-amber-50 px-2 py-0.5 rounded">403 Forbidden</span>
                    <span className="text-[10px] text-gray-400 font-mono">Expired Key</span>
                  </div>
                  <p className="text-xs font-mono text-gray-800 bg-white p-2 rounded border border-gray-200">
                    &quot;API key has expired&quot;
                  </p>
                  <p className="text-xs text-[#6b7280]">
                    Triggered if the specified key lifetime (<code className="font-mono">expires_at</code> timestamp) has elapsed.
                  </p>
                </div>

                <div className="border border-[#e5e7eb] rounded-2xl p-4 space-y-2 bg-[#fafafa] md:col-span-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-mono text-amber-600 bg-amber-50 px-2 py-0.5 rounded">403 Forbidden</span>
                    <span className="text-[10px] text-gray-400 font-mono">Scope Mismatch</span>
                  </div>
                  <p className="text-xs font-mono text-gray-800 bg-white p-2 rounded border border-gray-200">
                    &quot;This API key lacks permission to access account details (balance scope is disabled).&quot;
                  </p>
                  <p className="text-xs text-[#6b7280]">
                    Triggered when the API key structure has the <code className="font-mono">balance</code> permission scope explicitly configured as false.
                  </p>
                </div>

              </div>
            </div>

            {/* Field Description Table */}
            <div className="space-y-4">
              <h3 className="text-xs font-black text-[#0b1e5b] uppercase tracking-wider">Response Field Descriptions</h3>
              <div className="overflow-x-auto border border-[#e5e7eb] rounded-2xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#f8fafc] text-[#0b1e5b] border-b border-[#e5e7eb]">
                    <tr>
                      <th className="p-3.5 font-bold">Field</th>
                      <th className="p-3.5 font-bold">Type</th>
                      <th className="p-3.5 font-bold">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e5e7eb] text-[#6b7280]">
                    <tr>
                      <td className="p-3.5 font-mono font-bold text-[#0b1e5b]">id</td>
                      <td className="p-3.5 font-mono">String (UUID)</td>
                      <td className="p-3.5">The unique system identifier tied to the user profile.</td>
                    </tr>
                    <tr>
                      <td className="p-3.5 font-mono font-bold text-[#0b1e5b]">email</td>
                      <td className="p-3.5 font-mono">String</td>
                      <td className="p-3.5">The registered email address associated with the user account.</td>
                    </tr>
                    <tr>
                      <td className="p-3.5 font-mono font-bold text-[#0b1e5b]">vendor</td>
                      <td className="p-3.5 font-mono">String</td>
                      <td className="p-3.5">The service provider platform identifier (<code className="font-mono">accnumbers</code>).</td>
                    </tr>
                    <tr>
                      <td className="p-3.5 font-mono font-bold text-[#0b1e5b]">balance</td>
                      <td className="p-3.5 font-mono">Number</td>
                      <td className="p-3.5">The current available cash balance in the user wallet.</td>
                    </tr>
                    <tr>
                      <td className="p-3.5 font-mono font-bold text-[#0b1e5b]">frozen_balance</td>
                      <td className="p-3.5 font-mono">Number</td>
                      <td className="p-3.5">Funds temporarily locked during live activations or pending actions.</td>
                    </tr>
                    <tr>
                      <td className="p-3.5 font-mono font-bold text-[#0b1e5b]">rating</td>
                      <td className="p-3.5 font-mono">Number</td>
                      <td className="p-3.5">The system rating score assigned to the user.</td>
                    </tr>
                    <tr>
                      <td className="p-3.5 font-mono font-bold text-[#0b1e5b]">default_country</td>
                      <td className="p-3.5 font-mono">Object</td>
                      <td className="p-3.5">Default regional configuration values containing name, iso code, and telephone prefix.</td>
                    </tr>
                    <tr>
                      <td className="p-3.5 font-mono font-bold text-[#0b1e5b]">default_operator</td>
                      <td className="p-3.5 font-mono">Object</td>
                      <td className="p-3.5">Default network operator preference setting.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

          </div>

        </div>

                  {/* Endpoint: User Payments & Transactions */}
          <div className="bg-white border border-[#e5e7eb] rounded-3xl p-6 sm:p-8 shadow-sm space-y-8">
            
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider">GET</span>
                <span className="text-xs font-mono font-bold text-[#0b1e5b]">/api/v1/user/payments</span>
              </div>
              <h2 className="text-lg font-black text-[#0b1e5b]">User Payments &amp; Transactions</h2>
              <p className="text-xs sm:text-sm text-[#6b7280] leading-relaxed">
                This endpoint allows authenticated users to fetch their transaction history (such as credits, debits, and refunds) with pagination support, formatted according to standard financial schemas.
              </p>
            </div>

            {/* Authentication requirements note */}
            <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-2xl p-4 text-xs text-[#475569] space-y-1">
              <span className="font-bold text-[#0b1e5b]">Authentication Requirement:</span> Requires a valid API key with an active status, a valid expiration date, and the <code className="bg-white px-1.5 py-0.5 rounded border border-gray-200 font-mono text-[11px]">balance</code> scope enabled. Pass your key via the <code className="font-mono">Authorization: Bearer &lt;YOUR_API_KEY&gt;</code> header or the <code className="font-mono">x-api-key</code> custom header.
            </div>

            {/* Query Parameters note */}
            <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-2xl p-4 text-xs text-[#475569] space-y-1">
              <span className="font-bold text-[#0b1e5b]">Query Parameters (Optional):</span>
              <ul className="list-disc pl-5 pt-1 space-y-1 text-gray-600">
                <li><code className="font-mono">limit</code>: Number of records to return per page (default is <code className="font-mono">15</code>).</li>
                <li><code className="font-mono">offset</code>: Number of records to skip for pagination (default is <code className="font-mono">0</code>).</li>
              </ul>
            </div>

            {/* Code Block Terminal */}
            <div className="bg-[#111111] border border-[#222222] rounded-2xl p-5 shadow-xl space-y-6 text-slate-200 font-mono">
              <div className="flex items-center justify-between border-b border-[#222222] pb-3 text-xs">
                <span className="text-emerald-400 font-bold"># Request Example (cURL)</span>
                <span className="text-slate-500 uppercase tracking-widest text-[10px]">terminal</span>
              </div>

              <div className="space-y-2 text-xs overflow-x-auto">
                <div className="text-cyan-400">curl &quot;https://www.accnumbers.com/api/v1/user/payments?limit=5&amp;offset=0&quot; \</div>
                <div className="text-slate-300 pl-4">-H &quot;Authorization: Bearer acc_test_6ede12ca9a8ab629ab207f5346140cea&quot; \</div>
                <div className="text-slate-300 pl-4">-H &quot;Accept: application/json&quot;</div>
              </div>

              <div className="border-t border-[#222222] pt-3 space-y-2">
                <div className="text-slate-500 text-xs"># Success Response (200 OK)</div>
                <div className="text-amber-300 text-xs overflow-x-auto">
                  <pre>{`{
  "Data": [
    {
      "ID": 42,
      "TypeName": "credit",
      "ProviderName": "paystack",
      "Amount": 5000,
      "Balance": 15000,
      "CreatedAt": "2026-08-23T07:40:34.510606+00:00"
    }
  ],
  "PaymentTypes": [
    { "Name": "credit" },
    { "Name": "debit" },
    { "Name": "refund" }
  ],
  "PaymentProviders": [
    { "Name": "paystack" },
    { "Name": "system" }
  ],
  "Total": 1
}`}</pre>
                </div>
              </div>
            </div>

            {/* Detailed Error Messages Breakdown */}
            <div className="space-y-4">
              <h3 className="text-xs font-black text-[#0b1e5b] uppercase tracking-wider">Detailed Error Messages</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div className="border border-[#e5e7eb] rounded-2xl p-4 space-y-2 bg-[#fafafa]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-mono text-red-600 bg-red-50 px-2 py-0.5 rounded">401 Unauthorized</span>
                    <span className="text-[10px] text-gray-400 font-mono">Missing Token</span>
                  </div>
                  <p className="text-xs font-mono text-gray-800 bg-white p-2 rounded border border-gray-200">
                    &quot;Missing or invalid API token&quot;
                  </p>
                  <p className="text-xs text-[#6b7280]">
                    Triggered when neither the <code className="font-mono">Authorization</code> header nor the <code className="font-mono">x-api-key</code> header is provided.
                  </p>
                </div>

                <div className="border border-[#e5e7eb] rounded-2xl p-4 space-y-2 bg-[#fafafa]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-mono text-red-600 bg-red-50 px-2 py-0.5 rounded">401 Unauthorized</span>
                    <span className="text-[10px] text-gray-400 font-mono">Invalid Key</span>
                  </div>
                  <p className="text-xs font-mono text-gray-800 bg-white p-2 rounded border border-gray-200">
                    &quot;Unauthorized: Invalid API key&quot;
                  </p>
                  <p className="text-xs text-[#6b7280]">
                    Triggered when the provided API key does not match any entry in the database records.
                  </p>
                </div>

                <div className="border border-[#e5e7eb] rounded-2xl p-4 space-y-2 bg-[#fafafa]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-mono text-amber-600 bg-amber-50 px-2 py-0.5 rounded">403 Forbidden</span>
                    <span className="text-[10px] text-gray-400 font-mono">Inactive Key</span>
                  </div>
                  <p className="text-xs font-mono text-gray-800 bg-white p-2 rounded border border-gray-200">
                    &quot;API key is inactive (Status: revoked)&quot;
                  </p>
                  <p className="text-xs text-[#6b7280]">
                    Triggered if the API key status is marked as inactive or revoked.
                  </p>
                </div>

                <div className="border border-[#e5e7eb] rounded-2xl p-4 space-y-2 bg-[#fafafa]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-mono text-amber-600 bg-amber-50 px-2 py-0.5 rounded">403 Forbidden</span>
                    <span className="text-[10px] text-gray-400 font-mono">Expired Key</span>
                  </div>
                  <p className="text-xs font-mono text-gray-800 bg-white p-2 rounded border border-gray-200">
                    &quot;API key has expired&quot;
                  </p>
                  <p className="text-xs text-[#6b7280]">
                    Triggered if the key&#39;s <code className="font-mono">expires_at</code> timestamp has passed.
                  </p>
                </div>

                <div className="border border-[#e5e7eb] rounded-2xl p-4 space-y-2 bg-[#fafafa] md:col-span-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-mono text-amber-600 bg-amber-50 px-2 py-0.5 rounded">403 Forbidden</span>
                    <span className="text-[10px] text-gray-400 font-mono">Scope Mismatch</span>
                  </div>
                  <p className="text-xs font-mono text-gray-800 bg-white p-2 rounded border border-gray-200">
                    &quot;This API key lacks permission to access transaction records (balance scope is disabled).&quot;
                  </p>
                  <p className="text-xs text-[#6b7280]">
                    Triggered when the key has the <code className="font-mono">balance</code> scope explicitly configured as false.
                  </p>
                </div>

              </div>
            </div>

            {/* Field Description Table */}
            <div className="space-y-4">
              <h3 className="text-xs font-black text-[#0b1e5b] uppercase tracking-wider">Response Field Descriptions</h3>
              <div className="overflow-x-auto border border-[#e5e7eb] rounded-2xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#f8fafc] text-[#0b1e5b] border-b border-[#e5e7eb]">
                    <tr>
                      <th className="p-3.5 font-bold">Field</th>
                      <th className="p-3.5 font-bold">Type</th>
                      <th className="p-3.5 font-bold">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e5e7eb] text-[#6b7280]">
                    <tr>
                      <td className="p-3.5 font-mono font-bold text-[#0b1e5b]">Data</td>
                      <td className="p-3.5 font-mono">Array</td>
                      <td className="p-3.5">List of individual user transactions.</td>
                    </tr>
                    <tr>
                      <td className="p-3.5 font-mono font-bold text-[#0b1e5b]">Data.ID</td>
                      <td className="p-3.5 font-mono">Number</td>
                      <td className="p-3.5">Unique database index identifier for the transaction record.</td>
                    </tr>
                    <tr>
                      <td className="p-3.5 font-mono font-bold text-[#0b1e5b]">Data.TypeName</td>
                      <td className="p-3.5 font-mono">String</td>
                      <td className="p-3.5">Classification type of transaction (<code className="font-mono">credit</code>, <code className="font-mono">debit</code>, or <code className="font-mono">refund</code>).</td>
                    </tr>
                    <tr>
                      <td className="p-3.5 font-mono font-bold text-[#0b1e5b]">Data.ProviderName</td>
                      <td className="p-3.5 font-mono">String</td>
                      <td className="p-3.5">Gateway provider or source channel (<code className="font-mono">paystack</code> or <code className="font-mono">system</code>).</td>
                    </tr>
                    <tr>
                      <td className="p-3.5 font-mono font-bold text-[#0b1e5b]">Data.Amount</td>
                      <td className="p-3.5 font-mono">Number</td>
                      <td className="p-3.5">The monetary transaction value amount.</td>
                    </tr>
                    <tr>
                      <td className="p-3.5 font-mono font-bold text-[#0b1e5b]">Data.Balance</td>
                      <td className="p-3.5 font-mono">Number</td>
                      <td className="p-3.5">The resulting account wallet balance right after this transaction occurred.</td>
                    </tr>
                    <tr>
                      <td className="p-3.5 font-mono font-bold text-[#0b1e5b]">Data.CreatedAt</td>
                      <td className="p-3.5 font-mono">String (ISO 8601)</td>
                      <td className="p-3.5">Timestamp indicating exactly when the transaction was processed.</td>
                    </tr>
                    <tr>
                      <td className="p-3.5 font-mono font-bold text-[#0b1e5b]">PaymentTypes</td>
                      <td className="p-3.5 font-mono">Array</td>
                      <td className="p-3.5">Supported payment/transaction type categories.</td>
                    </tr>
                    <tr>
                      <td className="p-3.5 font-mono font-bold text-[#0b1e5b]">PaymentProviders</td>
                      <td className="p-3.5 font-mono">Array</td>
                      <td className="p-3.5">Supported payment gateway handlers.</td>
                    </tr>
                    <tr>
                      <td className="p-3.5 font-mono font-bold text-[#0b1e5b]">Total</td>
                      <td className="p-3.5 font-mono">Number</td>
                      <td className="p-3.5">The total count of transactions matching the user query criteria.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

          </div>



      </main>
    </div>
  );
}

