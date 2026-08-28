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
                This endpoint allows authenticated users to fetch their account details, current vendor profile, and live wallet balances (including available balance and frozen funds).
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

          {/* Endpoint: User Orders & Rentals */}
          <div className="bg-white border border-[#e5e7eb] rounded-3xl p-6 sm:p-8 shadow-sm space-y-8">
            
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider">GET</span>
                <span className="text-xs font-mono font-bold text-[#0b1e5b]">/api/v1/user/orders</span>
              </div>
              <h2 className="text-lg font-black text-[#0b1e5b]">User Orders &amp; Rentals</h2>
              <p className="text-xs sm:text-sm text-[#6b7280] leading-relaxed">
                This endpoint allows authenticated users to retrieve their virtual phone number rentals and order histories with pagination support.
              </p>
            </div>

            {/* Authentication requirements note */}
            <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-2xl p-4 text-xs text-[#475569] space-y-1">
              <span className="font-bold text-[#0b1e5b]">Authentication Requirement:</span> Requires a valid API key with an active status, a valid expiration date, and the <code className="bg-white px-1.5 py-0.5 rounded border border-gray-200 font-mono text-[11px]">purchase</code> scope enabled. Pass your key via the <code className="font-mono">Authorization: Bearer &lt;YOUR_API_KEY&gt;</code> header or the <code className="font-mono">x-api-key</code> custom header.
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
                <div className="text-cyan-400">curl &quot;https://www.accnumbers.com/api/v1/user/orders?limit=5&amp;offset=0&quot; \</div>
                <div className="text-slate-300 pl-4">-H &quot;Authorization: Bearer acc_test_6ede12ca9a8ab629ab207f5346140cea&quot; \</div>
                <div className="text-slate-300 pl-4">-H &quot;Accept: application/json&quot;</div>
              </div>

              <div className="border-t border-[#222222] pt-3 space-y-2">
                <div className="text-slate-500 text-xs"># Success Response (200 OK)</div>
                <div className="text-amber-300 text-xs overflow-x-auto">
                  <pre>{`{
  "Data": [
    {
      "id": 1042,
      "phone": "+2348012345678",
      "operator": "any",
      "product": "tg",
      "price": 1500,
      "status": "PENDING",
      "expires": "2026-08-23T08:40:34.510606+00:00",
      "sms": [],
      "created_at": "2026-08-23T07:40:34.510606+00:00",
      "country": "nigeria"
    }
  ],
  "ProductNames": [],
  "Statuses": [],
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
                    Triggered when neither the authorization header nor the custom API key header is provided.
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
                    Triggered when the provided API key token does not exist in the database.
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
                    Triggered if the API key status has been deactivated or revoked.
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
                    &quot;This API key lacks permission to access order/rental records (purchase scope is disabled).&quot;
                  </p>
                  <p className="text-xs text-[#6b7280]">
                    Triggered when the key has the <code className="font-mono">purchase</code> scope explicitly configured as false.
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
                      <td className="p-3.5">List of individual rental order records.</td>
                    </tr>
                    <tr>
                      <td className="p-3.5 font-mono font-bold text-[#0b1e5b]">Data.id</td>
                      <td className="p-3.5 font-mono">Number</td>
                      <td className="p-3.5">The unique numeric index identifier of the rental order.</td>
                    </tr>
                    <tr>
                      <td className="p-3.5 font-mono font-bold text-[#0b1e5b]">Data.phone</td>
                      <td className="p-3.5 font-mono">String</td>
                      <td className="p-3.5">The virtual phone number assigned to the rental.</td>
                    </tr>
                    <tr>
                      <td className="p-3.5 font-mono font-bold text-[#0b1e5b]">Data.operator</td>
                      <td className="p-3.5 font-mono">String</td>
                      <td className="p-3.5">The telecommunication network operator (e.g., <code className="font-mono">any</code>).</td>
                    </tr>
                    <tr>
                      <td className="p-3.5 font-mono font-bold text-[#0b1e5b]">Data.product</td>
                      <td className="p-3.5 font-mono">String</td>
                      <td className="p-3.5">The target service product code (maps to service).</td>
                    </tr>
                    <tr>
                      <td className="p-3.5 font-mono font-bold text-[#0b1e5b]">Data.price</td>
                      <td className="p-3.5 font-mono">Number</td>
                      <td className="p-3.5">The cost amount charged for the activation.</td>
                    </tr>
                    <tr>
                      <td className="p-3.5 font-mono font-bold text-[#0b1e5b]">Data.status</td>
                      <td className="p-3.5 font-mono">String</td>
                      <td className="p-3.5">The current lifecycle state of the rental (e.g., <code className="font-mono">PENDING</code>, <code className="font-mono">FINISHED</code>).</td>
                    </tr>
                    <tr>
                      <td className="p-3.5 font-mono font-bold text-[#0b1e5b]">Data.expires</td>
                      <td className="p-3.5 font-mono">String (ISO 8601)</td>
                      <td className="p-3.5">Timestamp indicating when the active rental session expires.</td>
                    </tr>
                    <tr>
                      <td className="p-3.5 font-mono font-bold text-[#0b1e5b]">Data.sms</td>
                      <td className="p-3.5 font-mono">Array</td>
                      <td className="p-3.5">List of incoming SMS verification messages received on the number.</td>
                    </tr>
                    <tr>
                      <td className="p-3.5 font-mono font-bold text-[#0b1e5b]">Data.created_at</td>
                      <td className="p-3.5 font-mono">String (ISO 8601)</td>
                      <td className="p-3.5">Timestamp indicating when the rental order was initiated.</td>
                    </tr>
                    <tr>
                      <td className="p-3.5 font-mono font-bold text-[#0b1e5b]">Data.country</td>
                      <td className="p-3.5 font-mono">String</td>
                      <td className="p-3.5">The target country code or name selected for the order.</td>
                    </tr>
                    <tr>
                      <td className="p-3.5 font-mono font-bold text-[#0b1e5b]">Total</td>
                      <td className="p-3.5 font-mono">Number</td>
                      <td className="p-3.5">The total count of orders matching the user query criteria.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

          </div>


          {/* Endpoint: Global Guest Prices */}
          <div className="bg-white border border-[#e5e7eb] rounded-3xl p-6 sm:p-8 shadow-sm space-y-8">
            
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider">GET</span>
                <span className="text-xs font-mono font-bold text-[#0b1e5b]">/api/v1/guest/prices</span>
              </div>
              <h2 className="text-lg font-black text-[#0b1e5b]">Global Guest Prices Catalog</h2>
              <p className="text-xs sm:text-sm text-[#6b7280] leading-relaxed">
                This public endpoint retrieves real-time pricing catalogs for virtual number activations and services. It automatically applies your database markup configurations and local currency conversions without requiring API key authentication.
              </p>
            </div>

            {/* Authentication requirements note */}
            <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-2xl p-4 text-xs text-[#475569] space-y-1">
              <span className="font-bold text-[#0b1e5b]">Access Requirement:</span> Publicly accessible. No API key or authorization header is required to query this endpoint.
            </div>

            {/* Query Parameters note */}
            <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-2xl p-4 text-xs text-[#475569] space-y-1">
              <span className="font-bold text-[#0b1e5b]">Query Parameters (Optional):</span>
              <ul className="list-disc pl-5 pt-1 space-y-1 text-gray-600">
                <li><code className="font-mono">country</code>: Filter pricing data by a specific country name or code (e.g., <code className="font-mono">england</code>).</li>
                <li><code className="font-mono">product</code>: Filter pricing data by a specific application or service product code (e.g., <code className="font-mono">facebook</code>).</li>
              </ul>
            </div>

            {/* Code Block Terminal */}
            <div className="bg-[#111111] border border-[#222222] rounded-2xl p-5 shadow-xl space-y-6 text-slate-200 font-mono">
              <div className="flex items-center justify-between border-b border-[#222222] pb-3 text-xs">
                <span className="text-emerald-400 font-bold"># Request Examples (cURL)</span>
                <span className="text-slate-500 uppercase tracking-widest text-[10px]">terminal</span>
              </div>

              <div className="space-y-4 text-xs overflow-x-auto">
                <div>
                  <div className="text-slate-500 pb-1"># 1. Get All Prices Globally</div>
                  <div className="text-cyan-400">curl &quot;https://www.accnumbers.com/api/v1/guest/prices&quot; \</div>
                  <div className="text-slate-300 pl-4">-H &quot;Accept: application/json&quot;</div>
                </div>

                <div>
                  <div className="text-slate-500 pb-1"># 2. Filter by Country Only</div>
                  <div className="text-cyan-400">curl &quot;https://www.accnumbers.com/api/v1/guest/prices?country=england&quot; \</div>
                  <div className="text-slate-300 pl-4">-H &quot;Accept: application/json&quot;</div>
                </div>

                <div>
                  <div className="text-slate-500 pb-1"># 3. Filter by Product Only</div>
                  <div className="text-cyan-400">curl &quot;https://www.accnumbers.com/api/v1/guest/prices?product=facebook&quot; \</div>
                  <div className="text-slate-300 pl-4">-H &quot;Accept: application/json&quot;</div>
                </div>

                <div>
                  <div className="text-slate-500 pb-1"># 4. Filter by Both Country and Product</div>
                  <div className="text-cyan-400">curl &quot;https://www.accnumbers.com/api/v1/guest/prices?country=england&amp;product=facebook&quot; \</div>
                  <div className="text-slate-300 pl-4">-H &quot;Accept: application/json&quot;</div>
                </div>
              </div>

              <div className="border-t border-[#222222] pt-3 space-y-2">
                <div className="text-slate-500 text-xs"># Success Response (200 OK)</div>
                <div className="text-amber-300 text-xs overflow-x-auto">
                  <pre>{`{
  "england": {
    "facebook": {
      "any": {
        "cost": 1500,
        "count": 42,
        "rate": 1.0
      }
    }
  }
}`}</pre>
                </div>
              </div>
            </div>

            {/* Error Responses Breakdown */}
            <div className="space-y-4">
              <h3 className="text-xs font-black text-[#0b1e5b] uppercase tracking-wider">Error Messages</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div className="border border-[#e5e7eb] rounded-2xl p-4 space-y-2 bg-[#fafafa]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-mono text-red-600 bg-red-50 px-2 py-0.5 rounded">500 Internal Error</span>
                    <span className="text-[10px] text-gray-400 font-mono">Missing Env Key</span>
                  </div>
                  <p className="text-xs font-mono text-gray-800 bg-white p-2 rounded border border-gray-200">
                    &quot;API key is missing in server environment variables.&quot;
                  </p>
                  <p className="text-xs text-[#6b7280]">
                    Triggered when the backend server environment lacks the required upstream provider API configuration.
                  </p>
                </div>

                <div className="border border-[#e5e7eb] rounded-2xl p-4 space-y-2 bg-[#fafafa]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-mono text-amber-600 bg-amber-50 px-2 py-0.5 rounded">502 Bad Gateway</span>
                    <span className="text-[10px] text-gray-400 font-mono">Parse Failure</span>
                  </div>
                  <p className="text-xs font-mono text-gray-800 bg-white p-2 rounded border border-gray-200">
                    &quot;Failed to parse provider JSON payload.&quot;
                  </p>
                  <p className="text-xs text-[#6b7280]">
                    Triggered if the upstream pricing provider returns a malformed or non-JSON response body.
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
                      <td className="p-3.5 font-mono font-bold text-[#0b1e5b]">country_key</td>
                      <td className="p-3.5 font-mono">Object / Array</td>
                      <td className="p-3.5">Top-level keys representing specific countries available for service.</td>
                    </tr>
                    <tr>
                      <td className="p-3.5 font-mono font-bold text-[#0b1e5b]">product_key</td>
                      <td className="p-3.5 font-mono">Object / Array</td>
                      <td className="p-3.5">Nested keys under each country representing application/service IDs (e.g., <code className="font-mono">facebook</code>, <code className="font-mono">tg</code>).</td>
                    </tr>
                    <tr>
                      <td className="p-3.5 font-mono font-bold text-[#0b1e5b]">operator_name</td>
                      <td className="p-3.5 font-mono">Object</td>
                      <td className="p-3.5">Network operator identifier mapping (e.g., <code className="font-mono">any</code>).</td>
                    </tr>
                    <tr>
                      <td className="p-3.5 font-mono font-bold text-[#0b1e5b]">cost</td>
                      <td className="p-3.5 font-mono">Number</td>
                      <td className="p-3.5">The final calculated cost converted to local currency(NGN).</td>
                    </tr>
                    <tr>
                      <td className="p-3.5 font-mono font-bold text-[#0b1e5b]">count</td>
                      <td className="p-3.5 font-mono">Number</td>
                      <td className="p-3.5">Available stock quantity of phone numbers for that category.</td>
                    </tr>
                    <tr>
                      <td className="p-3.5 font-mono font-bold text-[#0b1e5b]">rate</td>
                      <td className="p-3.5 font-mono">Number</td>
                      <td className="p-3.5">Upstream pricing multiplier or tier rating metric.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          {/* Endpoint: Guest Products by Country & Operator */}
          <div className="bg-white border border-[#e5e7eb] rounded-3xl p-6 sm:p-8 shadow-sm space-y-8">
            
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider">GET</span>
                <span className="text-xs font-mono font-bold text-[#0b1e5b]">/api/v1/guest/products/{'{country}'}/{'{operator}'}</span>
              </div>
              <h2 className="text-lg font-black text-[#0b1e5b]">Guest Products Catalog by Country &amp; Operator</h2>
              <p className="text-xs sm:text-sm text-[#6b7280] leading-relaxed">
                This public endpoint retrieves real-time product stocks and dynamic activation prices for a specified country and network operator combination. It automatically applies your database markup configurations and local currency conversions without requiring API key authentication.
              </p>
            </div>

            {/* Authentication requirements note */}
            <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-2xl p-4 text-xs text-[#475569] space-y-1">
              <span className="font-bold text-[#0b1e5b]">Access Requirement:</span> Publicly accessible. No API key or authorization header is required to query this endpoint.
            </div>

            {/* Path Parameters note */}
            <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-2xl p-4 text-xs text-[#475569] space-y-1">
              <span className="font-bold text-[#0b1e5b]">Path Parameters (Required):</span>
              <ul className="list-disc pl-5 pt-1 space-y-1 text-gray-600">
                <li><code className="font-mono">country</code>: The target country code or name (e.g., <code className="font-mono">england</code>).</li>
                <li><code className="font-mono">operator</code>: The target telecommunication network operator name (e.g., <code className="font-mono">any</code>).</li>
              </ul>
            </div>

            {/* Code Block Terminal */}
            <div className="bg-[#111111] border border-[#222222] rounded-2xl p-5 shadow-xl space-y-6 text-slate-200 font-mono">
              <div className="flex items-center justify-between border-b border-[#222222] pb-3 text-xs">
                <span className="text-emerald-400 font-bold"># Request Example (cURL)</span>
                <span className="text-slate-500 uppercase tracking-widest text-[10px]">terminal</span>
              </div>

              <div className="space-y-2 text-xs overflow-x-auto">
                <div className="text-cyan-400">curl &quot;https://www.accnumbers.com/api/v1/guest/products/${'{country}'}/${'{operator}'}&quot; \</div>
                <div className="text-slate-300 pl-4">-H &quot;Accept: application/json&quot;</div>
              </div>

              <div className="border-t border-[#222222] pt-3 space-y-2">
                <div className="text-slate-500 text-xs"># Success Response (200 OK)</div>
                <div className="text-amber-300 text-xs overflow-x-auto">
                  <pre>{`{
  "facebook": {
    "Category": "activation",
    "Qty": 42,
    "Price": 1500
  }
}`}</pre>
                </div>
              </div>
            </div>

            {/* Error Responses Breakdown */}
            <div className="space-y-4">
              <h3 className="text-xs font-black text-[#0b1e5b] uppercase tracking-wider">Error Messages</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div className="border border-[#e5e7eb] rounded-2xl p-4 space-y-2 bg-[#fafafa]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-mono text-red-600 bg-red-50 px-2 py-0.5 rounded">400 Bad Request</span>
                    <span className="text-[10px] text-gray-400 font-mono">Missing Params</span>
                  </div>
                  <p className="text-xs font-mono text-gray-800 bg-white p-2 rounded border border-gray-200">
                    &quot;Missing country or operator path parameters.&quot;
                  </p>
                  <p className="text-xs text-[#6b7280]">
                    Triggered when either the country or operator segment is omitted from the request route path.
                  </p>
                </div>

                <div className="border border-[#e5e7eb] rounded-2xl p-4 space-y-2 bg-[#fafafa]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-mono text-red-600 bg-red-50 px-2 py-0.5 rounded">500 Internal Error</span>
                    <span className="text-[10px] text-gray-400 font-mono">Missing Env Key</span>
                  </div>
                  <p className="text-xs font-mono text-gray-800 bg-white p-2 rounded border border-gray-200">
                    &quot;API key is missing in server environment variables.&quot;
                  </p>
                  <p className="text-xs text-[#6b7280]">
                    Triggered when the backend server environment lacks the required upstream provider API configuration.
                  </p>
                </div>

                <div className="border border-[#e5e7eb] rounded-2xl p-4 space-y-2 bg-[#fafafa] md:col-span-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-mono text-amber-600 bg-amber-50 px-2 py-0.5 rounded">502 Bad Gateway</span>
                    <span className="text-[10px] text-gray-400 font-mono">Parse Failure</span>
                  </div>
                  <p className="text-xs font-mono text-gray-800 bg-white p-2 rounded border border-gray-200">
                    &quot;Failed to parse provider JSON payload.&quot;
                  </p>
                  <p className="text-xs text-[#6b7280]">
                    Triggered if the upstream pricing provider returns a malformed or non-JSON response body.
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
                      <td className="p-3.5 font-mono font-bold text-[#0b1e5b]">product_name</td>
                      <td className="p-3.5 font-mono">String (Key)</td>
                      <td className="p-3.5">The unique identification key of the target service product (e.g., <code className="font-mono">facebook</code>, <code className="font-mono">tg</code>).</td>
                    </tr>
                    <tr>
                      <td className="p-3.5 font-mono font-bold text-[#0b1e5b]">Category</td>
                      <td className="p-3.5 font-mono">String</td>
                      <td className="p-3.5">The classification category type of the activation product (e.g., <code className="font-mono">activation</code>).</td>
                    </tr>
                    <tr>
                      <td className="p-3.5 font-mono font-bold text-[#0b1e5b]">Qty</td>
                      <td className="p-3.5 font-mono">Number</td>
                      <td className="p-3.5">The available real-time active stock count of numbers for the service.</td>
                    </tr>
                    <tr>
                      <td className="p-3.5 font-mono font-bold text-[#0b1e5b]">Price</td>
                      <td className="p-3.5 font-mono">Number</td>
                      <td className="p-3.5">The final converted local price calculated with your custom database markup rules applied.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

          </div>


          
</div>

      </main>
    </div>
  );
}

