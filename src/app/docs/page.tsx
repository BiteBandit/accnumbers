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
      Retrieve your authenticated account profile, current available wallet balance, and default vendor configuration. Access requires an active API key with the balance permission enabled.
    </p>
  </div>

  {/* Authentication requirements */}
  <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-2xl p-4 text-xs text-[#475569] space-y-2">
    <p className="font-bold text-[#0b1e5b]">Authentication Requirements</p>
    <p>
      Provide your API key using either the <code className="bg-white px-1.5 py-0.5 rounded border border-gray-200 font-mono text-[11px]">Authorization: Bearer YOUR_API_KEY</code> header or the <code className="bg-white px-1.5 py-0.5 rounded border border-gray-200 font-mono text-[11px]">x-api-key</code> header.
    </p>
    <p>The API key must exist, have an active status, not be expired, and explicitly include <code className="bg-white px-1.5 py-0.5 rounded border border-gray-200 font-mono text-[11px]">"balance": true</code> in its scopes.</p>
  </div>

  {/* Request example */}
  <div className="bg-[#111111] border border-[#222222] rounded-2xl p-5 shadow-xl space-y-6 text-slate-200 font-mono">
    <div className="flex items-center justify-between border-b border-[#222222] pb-3 text-xs">
      <span className="text-emerald-400 font-bold"># Request Example (cURL)</span>
      <span className="text-slate-500 uppercase tracking-widest text-[10px]">terminal</span>
    </div>

    <div className="space-y-2 text-xs overflow-x-auto">
      <pre className="whitespace-pre-wrap break-all text-cyan-400">{`curl "https://www.accnumbers.com/api/v1/user/profile" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Accept: application/json"`}</pre>
    </div>

    <div className="border-t border-[#222222] pt-3 space-y-2">
      <div className="text-slate-500 text-xs"># Alternative Authentication (x-api-key)</div>
      <pre className="whitespace-pre-wrap break-all text-slate-300 text-xs">{`curl "https://www.accnumbers.com/api/v1/user/profile" \\
  -H "x-api-key: YOUR_API_KEY" \\
  -H "Accept: application/json"`}</pre>
    </div>

    <div className="border-t border-[#222222] pt-3 space-y-2">
      <div className="text-slate-500 text-xs"># Success Response (200 OK)</div>
      <pre className="text-amber-300 text-xs overflow-x-auto">{`{
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
      <p className="text-slate-500 text-[10px]">
        Example values only. The returned balance and email depend on the authenticated account.
      </p>
    </div>
  </div>

  {/* Detailed Error Messages */}
  <div className="space-y-4">
    <h3 className="text-xs font-black text-[#0b1e5b] uppercase tracking-wider">Detailed Error Messages</h3>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

      <div className="border border-[#e5e7eb] rounded-2xl p-4 space-y-2 bg-[#fafafa]">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold font-mono text-red-600 bg-red-50 px-2 py-0.5 rounded">401 Unauthorized</span>
          <span className="text-[10px] text-gray-400 font-mono">Missing Token</span>
        </div>
        <p className="text-xs font-mono text-gray-800 bg-white p-2 rounded border border-gray-200">"Missing or invalid API token"</p>
        <p className="text-xs text-[#6b7280]">
          Returned when neither a valid Bearer token nor an x-api-key value is provided.
        </p>
      </div>

      <div className="border border-[#e5e7eb] rounded-2xl p-4 space-y-2 bg-[#fafafa]">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold font-mono text-red-600 bg-red-50 px-2 py-0.5 rounded">401 Unauthorized</span>
          <span className="text-[10px] text-gray-400 font-mono">Invalid Key</span>
        </div>
        <p className="text-xs font-mono text-gray-800 bg-white p-2 rounded border border-gray-200">"Unauthorized: Invalid API key"</p>
        <p className="text-xs text-[#6b7280]">
          Returned when the supplied API key does not match a key record.
        </p>
      </div>

      <div className="border border-[#e5e7eb] rounded-2xl p-4 space-y-2 bg-[#fafafa]">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold font-mono text-amber-600 bg-amber-50 px-2 py-0.5 rounded">403 Forbidden</span>
          <span className="text-[10px] text-gray-400 font-mono">Inactive Key</span>
        </div>
        <p className="text-xs font-mono text-gray-800 bg-white p-2 rounded border border-gray-200">"API key is inactive"</p>
        <p className="text-xs text-[#6b7280]">
          Returned when the key's status is not active, including revoked keys.
        </p>
      </div>

      <div className="border border-[#e5e7eb] rounded-2xl p-4 space-y-2 bg-[#fafafa]">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold font-mono text-amber-600 bg-amber-50 px-2 py-0.5 rounded">403 Forbidden</span>
          <span className="text-[10px] text-gray-400 font-mono">Expired Key</span>
        </div>
        <p className="text-xs font-mono text-gray-800 bg-white p-2 rounded border border-gray-200">"API key has expired"</p>
        <p className="text-xs text-[#6b7280]">
          Returned when the key's expires_at timestamp has elapsed.
        </p>
      </div>

      <div className="border border-[#e5e7eb] rounded-2xl p-4 space-y-2 bg-[#fafafa] md:col-span-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold font-mono text-amber-600 bg-amber-50 px-2 py-0.5 rounded">403 Forbidden</span>
          <span className="text-[10px] text-gray-400 font-mono">Insufficient Scope</span>
        </div>
        <p className="text-xs font-mono text-gray-800 bg-white p-2 rounded border border-gray-200">"This API key does not have permission to access account balance"</p>
        <p className="text-xs text-[#6b7280]">
          Returned when the balance scope is missing, false, or otherwise not explicitly enabled.
        </p>
      </div>

      <div className="border border-[#e5e7eb] rounded-2xl p-4 space-y-2 bg-[#fafafa]">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold font-mono text-amber-600 bg-amber-50 px-2 py-0.5 rounded">403 Forbidden</span>
          <span className="text-[10px] text-gray-400 font-mono">Invalid Scopes</span>
        </div>
        <p className="text-xs font-mono text-gray-800 bg-white p-2 rounded border border-gray-200">"API key permissions are misconfigured"</p>
        <p className="text-xs text-[#6b7280]">
          Returned when the scopes configuration is malformed or is not a valid object.
        </p>
      </div>

      <div className="border border-[#e5e7eb] rounded-2xl p-4 space-y-2 bg-[#fafafa]">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold font-mono text-amber-600 bg-amber-50 px-2 py-0.5 rounded">403 Forbidden</span>
          <span className="text-[10px] text-gray-400 font-mono">Unavailable Account</span>
        </div>
        <p className="text-xs font-mono text-gray-800 bg-white p-2 rounded border border-gray-200">"API key owner account is unavailable"</p>
        <p className="text-xs text-[#6b7280]">
          Returned when the API key exists but its associated Auth user cannot be found.
        </p>
      </div>

      <div className="border border-[#e5e7eb] rounded-2xl p-4 space-y-2 bg-[#fafafa]">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold font-mono text-red-600 bg-red-50 px-2 py-0.5 rounded">500 Server Error</span>
          <span className="text-[10px] text-gray-400 font-mono">Authentication Lookup</span>
        </div>
        <p className="text-xs font-mono text-gray-800 bg-white p-2 rounded border border-gray-200">"Unable to authenticate request"</p>
        <p className="text-xs text-[#6b7280]">
          Returned when the API key database lookup fails unexpectedly.
        </p>
      </div>

      <div className="border border-[#e5e7eb] rounded-2xl p-4 space-y-2 bg-[#fafafa]">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold font-mono text-red-600 bg-red-50 px-2 py-0.5 rounded">500 Server Error</span>
          <span className="text-[10px] text-gray-400 font-mono">Profile Lookup</span>
        </div>
        <p className="text-xs font-mono text-gray-800 bg-white p-2 rounded border border-gray-200">"Unable to retrieve account profile"</p>
        <p className="text-xs text-[#6b7280]">
          Returned when the associated user lookup fails.
        </p>
      </div>

      <div className="border border-[#e5e7eb] rounded-2xl p-4 space-y-2 bg-[#fafafa]">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold font-mono text-red-600 bg-red-50 px-2 py-0.5 rounded">500 Server Error</span>
          <span className="text-[10px] text-gray-400 font-mono">Wallet Lookup</span>
        </div>
        <p className="text-xs font-mono text-gray-800 bg-white p-2 rounded border border-gray-200">"Unable to retrieve wallet balance"</p>
        <p className="text-xs text-[#6b7280]">
          Returned when the wallet query fails unexpectedly.
        </p>
      </div>

      <div className="border border-[#e5e7eb] rounded-2xl p-4 space-y-2 bg-[#fafafa]">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold font-mono text-red-600 bg-red-50 px-2 py-0.5 rounded">500 Server Error</span>
          <span className="text-[10px] text-gray-400 font-mono">Missing Wallet</span>
        </div>
        <p className="text-xs font-mono text-gray-800 bg-white p-2 rounded border border-gray-200">"Wallet balance is unavailable"</p>
        <p className="text-xs text-[#6b7280]">
          Returned when the wallet or its balance is missing or the balance is not numeric.
        </p>
      </div>

      <div className="border border-[#e5e7eb] rounded-2xl p-4 space-y-2 bg-[#fafafa] md:col-span-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold font-mono text-red-600 bg-red-50 px-2 py-0.5 rounded">500 Server Error</span>
          <span className="text-[10px] text-gray-400 font-mono">Unexpected Failure</span>
        </div>
        <p className="text-xs font-mono text-gray-800 bg-white p-2 rounded border border-gray-200">"Internal Server Error"</p>
        <p className="text-xs text-[#6b7280]">
          Returned for unexpected failures that cannot be handled by a more specific error response.
        </p>
      </div>

    </div>
  </div>

  {/* Response field descriptions */}
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
            <td className="p-3.5">Unique system identifier of the authenticated user.</td>
          </tr>
          <tr>
            <td className="p-3.5 font-mono font-bold text-[#0b1e5b]">email</td>
            <td className="p-3.5 font-mono">String | null</td>
            <td className="p-3.5">Registered email address associated with the account, or null if unavailable.</td>
          </tr>
          <tr>
            <td className="p-3.5 font-mono font-bold text-[#0b1e5b]">vendor</td>
            <td className="p-3.5 font-mono">String</td>
            <td className="p-3.5">Platform identifier, currently accnumbers.</td>
          </tr>
          <tr>
            <td className="p-3.5 font-mono font-bold text-[#0b1e5b]">default_forwarding_number</td>
            <td className="p-3.5 font-mono">String</td>
            <td className="p-3.5">Default forwarding number. Currently an empty string.</td>
          </tr>
          <tr>
            <td className="p-3.5 font-mono font-bold text-[#0b1e5b]">balance</td>
            <td className="p-3.5 font-mono">Number</td>
            <td className="p-3.5">Current available wallet balance returned by the wallet database.</td>
          </tr>
          <tr>
            <td className="p-3.5 font-mono font-bold text-[#0b1e5b]">frozen_balance</td>
            <td className="p-3.5 font-mono">Number</td>
            <td className="p-3.5">Currently a fixed value of 0 in this endpoint; it is not yet calculated from locked funds.</td>
          </tr>
          <tr>
            <td className="p-3.5 font-mono font-bold text-[#0b1e5b]">rating</td>
            <td className="p-3.5 font-mono">Number</td>
            <td className="p-3.5">Current fixed rating value returned by the endpoint.</td>
          </tr>
          <tr>
            <td className="p-3.5 font-mono font-bold text-[#0b1e5b]">default_country</td>
            <td className="p-3.5 font-mono">Object</td>
            <td className="p-3.5">Default country configuration containing name, ISO country code, and telephone prefix.</td>
          </tr>
          <tr>
            <td className="p-3.5 font-mono font-bold text-[#0b1e5b]">default_operator</td>
            <td className="p-3.5 font-mono">Object</td>
            <td className="p-3.5">Default network operator preference, currently any.</td>
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
      <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider">
        GET
      </span>
      <span className="text-xs font-mono font-bold text-[#0b1e5b]">
        /api/v1/user/payments
      </span>
    </div>

    <h2 className="text-lg font-black text-[#0b1e5b]">
      User Payments &amp; Transactions
    </h2>

    <p className="text-xs sm:text-sm text-[#6b7280] leading-relaxed">
      Retrieve your transaction history, including credits, debits, and refunds.
      Results are returned in reverse chronological order with pagination support.
    </p>
  </div>

  {/* Authentication */}
  <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-2xl p-4 text-xs text-[#475569] space-y-2">
    <span className="font-bold text-[#0b1e5b]">
      Authentication Requirement
    </span>
    <p>
      Requires a valid API key with active status, a non-expired expiration
      date if configured, and the <code className="bg-white px-1.5 py-0.5 rounded border border-gray-200 font-mono text-[11px]">balance</code> scope enabled.
      Expired keys return <code>403 Forbidden</code> with the message
      <code> API key has expired</code>.
    </p>
    <p>
      Send your key using either the
      <code className="font-mono"> Authorization: Bearer YOUR_API_KEY</code>
      header or the <code className="font-mono">x-api-key</code> header.
    </p>
  </div>

  {/* Query Parameters */}
  <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-2xl p-4 text-xs text-[#475569] space-y-2">
    <span className="font-bold text-[#0b1e5b]">
      Query Parameters
    </span>
    <ul className="list-disc pl-5 space-y-2 text-gray-600">
      <li>
        <code className="font-mono">limit</code>: Maximum number of
        transaction records to return. Defaults to <code>15</code>.
      </li>
      <li>
        <code className="font-mono">offset</code>: Number of records to skip.
        Defaults to <code>0</code>.
      </li>
    </ul>
  </div>

  {/* Request and response */}
  <div className="bg-[#111111] border border-[#222222] rounded-2xl p-5 shadow-xl space-y-6 text-slate-200 font-mono">
    <div className="flex items-center justify-between border-b border-[#222222] pb-3 text-xs">
      <span className="text-emerald-400 font-bold">
        # Request Example (cURL)
      </span>
      <span className="text-slate-500 uppercase tracking-widest text-[10px]">
        terminal
      </span>
    </div>

    <div className="space-y-2 text-xs overflow-x-auto">
      <pre className="whitespace-pre-wrap break-all text-cyan-400">{`curl "https://www.accnumbers.com/api/v1/user/payments?limit=5&offset=0" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Accept: application/json"`}</pre>
    </div>

    <div className="border-t border-[#222222] pt-3 space-y-2">
      <div className="text-slate-500 text-xs">
        # Success Response (200 OK)
      </div>

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

  {/* Error responses */}
  <div className="space-y-4">
    <h3 className="text-xs font-black text-[#0b1e5b] uppercase tracking-wider">
      Detailed Error Messages
    </h3>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {[
        {
          status: "401 Unauthorized",
          label: "Missing Token",
          message: "Missing or invalid API token",
          description:
            "Returned when neither a valid Bearer token nor an x-api-key value is provided."
        },
        {
          status: "401 Unauthorized",
          label: "Invalid Key",
          message: "Unauthorized: Invalid API key",
          description:
            "Returned when the API key cannot be found in the database."
        },
        {
          status: "403 Forbidden",
          label: "Inactive Key",
          message: "API key is inactive (Status: revoked)",
          description:
            "Returned when the API key status is not active. The status shown in the message reflects the actual stored status."
        },
        {
          status: "403 Forbidden",
          label: "Expired Key",
          message: "API key has expired",
          description:
            "Returned when the expires_at timestamp has passed. Keys without an expiration timestamp are not rejected by the expiration check."
        },
        {
          status: "403 Forbidden",
          label: "Scope Mismatch",
          message:
            "This API key lacks permission to access transaction records (balance scope is disabled).",
          description:
            "Returned when the balance scope is explicitly set to false in the endpoint's current implementation."
        },
        {
          status: "403 Forbidden",
          label: "Malformed Scopes",
          message: "Malformed API key scopes configuration.",
          description:
            "Returned when the scopes configuration cannot be parsed as valid JSON."
        },
        {
          status: "500 Internal Server Error",
          label: "Server Error",
          message: "Internal Server Error",
          description:
            "Returned when an unexpected server-side error occurs."
        }
      ].map((error) => (
        <div
          key={error.label}
          className="border border-[#e5e7eb] rounded-2xl p-4 space-y-2 bg-[#fafafa]"
        >
          <div className="flex items-center justify-between gap-2">
            <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded ${
              error.status.startsWith("401")
                ? "text-red-600 bg-red-50"
                : error.status.startsWith("500")
                  ? "text-red-600 bg-red-50"
                  : "text-amber-600 bg-amber-50"
            }`}>
              {error.status}
            </span>
            <span className="text-[10px] text-gray-400 font-mono">
              {error.label}
            </span>
          </div>

          <p className="text-xs font-mono text-gray-800 bg-white p-2 rounded border border-gray-200 break-words">
            {JSON.stringify(error.message)}
          </p>

          <p className="text-xs text-[#6b7280]">
            {error.description}
          </p>
        </div>
      ))}
    </div>
  </div>

  {/* Response field descriptions */}
  <div className="space-y-4">
    <h3 className="text-xs font-black text-[#0b1e5b] uppercase tracking-wider">
      Response Field Descriptions
    </h3>

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
          {[
            ["Data", "Array", "Transaction records for the authenticated user."],
            ["Data.ID", "Number", "Transaction identifier from the database idx column."],
            ["Data.TypeName", "String", "Transaction type from the database type column."],
            ["Data.ProviderName", "String", "Provider inferred from the description: paystack or system."],
            ["Data.Amount", "Number", "Transaction amount, converted to a number."],
            ["Data.Balance", "Number", "Balance after the transaction, sourced from balance_after."],
            ["Data.CreatedAt", "String (ISO 8601)", "Transaction creation timestamp."],
            ["PaymentTypes", "Array", "Available transaction types: credit, debit, and refund."],
            ["PaymentProviders", "Array", "Provider categories returned by this endpoint: paystack and system."],
            ["Total", "Number", "Total number of matching transaction records, when the database count is available."]
          ].map(([field, type, description]) => (
            <tr key={field}>
              <td className="p-3.5 font-mono font-bold text-[#0b1e5b]">{field}</td>
              <td className="p-3.5 font-mono">{type}</td>
              <td className="p-3.5">{description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
</div>
                  

          {/* Endpoint: User Orders & Rentals */}
<div className="bg-white border border-[#e5e7eb] rounded-3xl p-6 sm:p-8 shadow-sm space-y-8">

  <div className="space-y-3">
    <div className="flex items-center gap-2">
      <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider">
        GET
      </span>
      <span className="text-xs font-mono font-bold text-[#0b1e5b]">
        /api/v1/user/orders
      </span>
    </div>

    <h2 className="text-lg font-black text-[#0b1e5b]">
      User Orders &amp; Rentals
    </h2>

    <p className="text-xs sm:text-sm text-[#6b7280] leading-relaxed">
      Retrieve your virtual phone number rentals and order history, including
      assigned numbers, service details, rental statuses, expiration times,
      and received SMS messages. Results are ordered from newest to oldest.
    </p>
  </div>

  {/* Authentication */}
  <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-2xl p-4 text-xs text-[#475569] space-y-2">
    <span className="font-bold text-[#0b1e5b]">
      Authentication Requirement
    </span>

    <p>
      Requires a valid API key with active status, a non-expired
      <code className="font-mono"> expires_at </code>
      timestamp if configured, and the
      <code className="bg-white px-1.5 py-0.5 rounded border border-gray-200 font-mono text-[11px]">
        purchase
      </code>
      scope explicitly enabled (<code>true</code>).
    </p>

    <p>
      Expired keys return <code>403 Forbidden</code> with
      <code className="font-mono"> "API key has expired"</code>.
      Keys without an expiration timestamp pass the expiration check.
    </p>

    <p>
      Send your API key using either the
      <code className="font-mono"> Authorization: Bearer YOUR_API_KEY </code>
      header or the <code className="font-mono">x-api-key</code> header.
    </p>
  </div>

  {/* Query Parameters */}
  <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-2xl p-4 text-xs text-[#475569] space-y-2">
    <span className="font-bold text-[#0b1e5b]">
      Query Parameters (Optional)
    </span>

    <ul className="list-disc pl-5 pt-1 space-y-2 text-gray-600">
      <li>
        <code className="font-mono">limit</code>: Number of records to return.
        Defaults to <code>15</code>. Accepted range: <code>1–100</code>.
      </li>
      <li>
        <code className="font-mono">offset</code>: Number of records to skip.
        Defaults to <code>0</code>. Must be a non-negative integer.
      </li>
    </ul>

    <p className="text-gray-500">
      Invalid pagination parameters return <code>400 Bad Request</code>.
    </p>
  </div>

  {/* Request and response */}
  <div className="bg-[#111111] border border-[#222222] rounded-2xl p-5 shadow-xl space-y-6 text-slate-200 font-mono">
    <div className="flex items-center justify-between border-b border-[#222222] pb-3 text-xs">
      <span className="text-emerald-400 font-bold">
        # Request Example (cURL)
      </span>
      <span className="text-slate-500 uppercase tracking-widest text-[10px]">
        terminal
      </span>
    </div>

    <div className="space-y-2 text-xs overflow-x-auto">
      <pre className="whitespace-pre-wrap break-all text-cyan-400">{`curl "https://www.accnumbers.com/api/v1/user/orders?limit=5&offset=0" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Accept: application/json"`}</pre>
    </div>

    <div className="border-t border-[#222222] pt-3 space-y-2">
      <div className="text-slate-500 text-xs">
        # Success Response (200 OK)
      </div>

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

  {/* Error responses */}
  <div className="space-y-4">
    <h3 className="text-xs font-black text-[#0b1e5b] uppercase tracking-wider">
      Detailed Error Messages
    </h3>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {[
        {
          status: "401 Unauthorized",
          label: "Missing Token",
          message: "Missing or invalid API token",
          description:
            "Returned when neither a Bearer token nor an x-api-key value is provided."
        },
        {
          status: "401 Unauthorized",
          label: "Invalid Key",
          message: "Unauthorized: Invalid API key",
          description:
            "Returned when the API key cannot be found in the database."
        },
        {
          status: "403 Forbidden",
          label: "Inactive Key",
          message: "API key is inactive (Status: revoked)",
          description:
            "Returned when the API key status is not active. The actual message includes the stored status value."
        },
        {
          status: "403 Forbidden",
          label: "Expired Key",
          message: "API key has expired",
          description:
            "Returned when the expiration timestamp has passed or is invalid."
        },
        {
          status: "403 Forbidden",
          label: "Purchase Scope",
          message:
            "This API key lacks permission to access order/rental records (purchase scope is disabled).",
          description:
            "Returned when the purchase scope is missing, false, or otherwise not explicitly true."
        },
        {
          status: "403 Forbidden",
          label: "Malformed Scopes",
          message: "Malformed API key scopes configuration.",
          description:
            "Returned when the scopes configuration is invalid JSON or is not a valid scope object."
        },
        {
          status: "400 Bad Request",
          label: "Invalid Pagination",
          message: "Invalid pagination parameters.",
          description:
            "Returned when limit or offset is not a valid integer, limit is outside 1–100, or offset is negative. The response may include a more detailed validation message."
        },
        {
          status: "500 Internal Server Error",
          label: "Database Error",
          message: "Unable to retrieve order/rental records",
          description:
            "Returned when the rentals query fails. The endpoint does not silently return an empty list for this error."
        },
        {
          status: "500 Internal Server Error",
          label: "Unexpected Error",
          message: "Internal Server Error",
          description:
            "Returned when an unexpected server-side error occurs or the required Supabase environment variables are missing."
        }
      ].map((error) => (
        <div
          key={error.label}
          className="border border-[#e5e7eb] rounded-2xl p-4 space-y-2 bg-[#fafafa]"
        >
          <div className="flex items-center justify-between gap-2">
            <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded ${
              error.status.startsWith("400") ||
              error.status.startsWith("401") ||
              error.status.startsWith("500")
                ? "text-red-600 bg-red-50"
                : "text-amber-600 bg-amber-50"
            }`}>
              {error.status}
            </span>

            <span className="text-[10px] text-gray-400 font-mono">
              {error.label}
            </span>
          </div>

          <p className="text-xs font-mono text-gray-800 bg-white p-2 rounded border border-gray-200 break-words">
            {JSON.stringify(error.message)}
          </p>

          <p className="text-xs text-[#6b7280]">
            {error.description}
          </p>
        </div>
      ))}
    </div>
  </div>

  {/* Response field descriptions */}
  <div className="space-y-4">
    <h3 className="text-xs font-black text-[#0b1e5b] uppercase tracking-wider">
      Response Field Descriptions
    </h3>

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
          {[
            ["Data", "Array", "Rental records belonging to the authenticated user."],
            ["Data.id", "Number", "Rental identifier sourced from the database idx column."],
            ["Data.phone", "String", "Virtual phone number assigned to the rental."],
            ["Data.operator", "String", "Operator associated with the rental; defaults to any when empty."],
            ["Data.product", "String", "Service/product code sourced from the service column."],
            ["Data.price", "Number", "Rental amount sourced from amount and converted to a number."],
            ["Data.status", "String", "Rental status converted to uppercase; defaults to PENDING when empty."],
            ["Data.expires", "String or null", "Rental expiration timestamp sourced from expires_at."],
            ["Data.sms", "Array", "SMS messages when the stored sms value is a valid array; otherwise an empty array."],
            ["Data.created_at", "String or null", "Rental creation timestamp."],
            ["Data.country", "String or null", "Country value associated with the rental."],
            ["ProductNames", "Array", "Currently returned as an empty array."],
            ["Statuses", "Array", "Currently returned as an empty array."],
            ["Total", "Number", "Exact count of matching rental records when provided by the database."]
          ].map(([field, type, description]) => (
            <tr key={field}>
              <td className="p-3.5 font-mono font-bold text-[#0b1e5b]">
                {field}
              </td>
              <td className="p-3.5 font-mono">{type}</td>
              <td className="p-3.5">{description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>

</div>

          

   {/* Endpoint: Global Guest Prices */}
<div className="bg-white border border-[#e5e7eb] rounded-3xl p-6 sm:p-8 shadow-sm space-y-8">

  <div className="space-y-3">
    <div className="flex items-center gap-2">
      <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider">
        GET
      </span>
      <span className="text-xs font-mono font-bold text-[#0b1e5b]">
        /api/v1/guest/prices
      </span>
    </div>

    <h2 className="text-lg font-black text-[#0b1e5b]">
      Global Guest Prices Catalog
    </h2>

    <p className="text-xs sm:text-sm text-[#6b7280] leading-relaxed">
      Retrieve the available virtual number pricing catalog from Accnumbers.
      Browse supported countries, services, operators, prices, and availability
      through a simple public API. No API key or authentication is required.
    </p>
  </div>

  {/* Authentication */}
  <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-2xl p-4 text-xs text-[#475569] space-y-1">
    <span className="font-bold text-[#0b1e5b]">Authentication</span>
    <p>
      This is a public endpoint. You can retrieve pricing information without
      an API key or authorization header.
    </p>
  </div>

  {/* Query Parameters */}
  <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-2xl p-4 text-xs text-[#475569] space-y-3">
    <span className="font-bold text-[#0b1e5b]">
      Query Parameters (Optional)
    </span>

    <div>
      <code className="font-mono font-bold">country</code>
      <p className="text-gray-600 mt-1">
        Filter prices by country. For example, <code>england</code>.
      </p>
    </div>

    <div>
      <code className="font-mono font-bold">product</code>
      <p className="text-gray-600 mt-1">
        Filter prices by service. For example, <code>facebook</code>.
      </p>
    </div>

    <p className="text-gray-500">
      Each parameter accepts up to 100 characters.
    </p>
  </div>

  {/* Request Examples */}
  <div className="bg-[#111111] border border-[#222222] rounded-2xl p-5 shadow-xl space-y-6 text-slate-200 font-mono">
    <div className="flex items-center justify-between border-b border-[#222222] pb-3 text-xs">
      <span className="text-emerald-400 font-bold">
        # Request Examples (cURL)
      </span>
      <span className="text-slate-500 uppercase tracking-widest text-[10px]">
        terminal
      </span>
    </div>

    <div className="space-y-4 text-xs overflow-x-auto">
      <div>
        <div className="text-slate-500 pb-1"># 1. Get All Prices</div>
        <pre className="text-cyan-400 whitespace-pre-wrap break-all">
{`curl "https://www.accnumbers.com/api/v1/guest/prices" \\
  -H "Accept: application/json"`}
        </pre>
      </div>

      <div>
        <div className="text-slate-500 pb-1"># 2. Filter by Country</div>
        <pre className="text-cyan-400 whitespace-pre-wrap break-all">
{`curl "https://www.accnumbers.com/api/v1/guest/prices?country=england" \\
  -H "Accept: application/json"`}
        </pre>
      </div>

      <div>
        <div className="text-slate-500 pb-1"># 3. Filter by Service</div>
        <pre className="text-cyan-400 whitespace-pre-wrap break-all">
{`curl "https://www.accnumbers.com/api/v1/guest/prices?product=facebook" \\
  -H "Accept: application/json"`}
        </pre>
      </div>

      <div>
        <div className="text-slate-500 pb-1">
          # 4. Filter by Country and Service
        </div>
        <pre className="text-cyan-400 whitespace-pre-wrap break-all">
{`curl "https://www.accnumbers.com/api/v1/guest/prices?country=england&product=facebook" \\
  -H "Accept: application/json"`}
        </pre>
      </div>
    </div>

    {/* Example Response */}
    <div className="border-t border-[#222222] pt-3 space-y-2">
      <div className="text-slate-500 text-xs">
        # Example Success Response (200 OK)
      </div>

      <pre className="text-amber-300 text-xs overflow-x-auto">
{`{
  "england": {
    "facebook": {
      "any": {
        "cost": 1500,
        "count": 42,
        "rate": 1.0
      }
    }
  }
}`}
      </pre>

      <p className="text-slate-400 text-xs leading-relaxed">
        Example response for illustration. Actual results depend on the
        selected country and service. The response may contain a nested
        catalog or a list of pricing entries.
      </p>
    </div>
  </div>

  {/* Error Responses */}
  <div className="space-y-4">
    <h3 className="text-xs font-black text-[#0b1e5b] uppercase tracking-wider">
      Error Responses
    </h3>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

      <div className="border border-[#e5e7eb] rounded-2xl p-4 space-y-2 bg-[#fafafa]">
        <span className="inline-block text-xs font-bold font-mono text-red-600 bg-red-50 px-2 py-1 rounded">
          400 Bad Request
        </span>

        <pre className="text-xs font-mono text-gray-800 bg-white p-2 rounded border border-gray-200 whitespace-pre-wrap">
{`{
  "error": "The country parameter is too long."
}`}
        </pre>

        <p className="text-xs text-[#6b7280]">
          The country or product parameter exceeds the maximum allowed length.
          The message identifies the parameter that needs correction.
        </p>
      </div>

      <div className="border border-[#e5e7eb] rounded-2xl p-4 space-y-2 bg-[#fafafa]">
        <span className="inline-block text-xs font-bold font-mono text-amber-600 bg-amber-50 px-2 py-1 rounded">
          502 Bad Gateway
        </span>

        <pre className="text-xs font-mono text-gray-800 bg-white p-2 rounded border border-gray-200 whitespace-pre-wrap">
{`{
  "error": "Unable to connect to the price provider."
}`}
        </pre>

        <p className="text-xs text-[#6b7280]">
          Pricing information is temporarily unavailable. Please try again later.
        </p>
      </div>

      <div className="border border-[#e5e7eb] rounded-2xl p-4 space-y-2 bg-[#fafafa]">
        <span className="inline-block text-xs font-bold font-mono text-amber-600 bg-amber-50 px-2 py-1 rounded">
          502 Bad Gateway
        </span>

        <pre className="text-xs font-mono text-gray-800 bg-white p-2 rounded border border-gray-200 whitespace-pre-wrap">
{`{
  "error": "The price provider could not process the request."
}`}
        </pre>

        <p className="text-xs text-[#6b7280]">
          The pricing service could not complete the request. Try again shortly.
        </p>
      </div>

      <div className="border border-[#e5e7eb] rounded-2xl p-4 space-y-2 bg-[#fafafa]">
        <span className="inline-block text-xs font-bold font-mono text-amber-600 bg-amber-50 px-2 py-1 rounded">
          502 Bad Gateway
        </span>

        <pre className="text-xs font-mono text-gray-800 bg-white p-2 rounded border border-gray-200 whitespace-pre-wrap">
{`{
  "error": "Failed to parse provider JSON payload."
}`}
        </pre>

        <p className="text-xs text-[#6b7280]">
          The pricing service returned data that could not be processed.
          Please retry your request later.
        </p>
      </div>

      <div className="border border-[#e5e7eb] rounded-2xl p-4 space-y-2 bg-[#fafafa]">
        <span className="inline-block text-xs font-bold font-mono text-red-600 bg-red-50 px-2 py-1 rounded">
          500 Internal Server Error
        </span>

        <pre className="text-xs font-mono text-gray-800 bg-white p-2 rounded border border-gray-200 whitespace-pre-wrap">
{`{
  "error": "Internal server error while loading prices."
}`}
        </pre>

        <p className="text-xs text-[#6b7280]">
          An unexpected error occurred while retrieving prices. Please try again.
        </p>
      </div>

    </div>
  </div>

  {/* Response Field Descriptions */}
  <div className="space-y-4">
    <h3 className="text-xs font-black text-[#0b1e5b] uppercase tracking-wider">
      Response Field Descriptions
    </h3>

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
            <td className="p-3.5 font-mono font-bold text-[#0b1e5b]">
              country
            </td>
            <td className="p-3.5 font-mono">Object / Array</td>
            <td className="p-3.5">
              Country entries available in the pricing catalog. Each country
              is identified by its key in the response.
            </td>
          </tr>

          <tr>
            <td className="p-3.5 font-mono font-bold text-[#0b1e5b]">
              product
            </td>
            <td className="p-3.5 font-mono">Object / Array</td>
            <td className="p-3.5">
              Service entries available under a country, such as
              <code> facebook</code> or <code>tg</code>.
            </td>
          </tr>

          <tr>
            <td className="p-3.5 font-mono font-bold text-[#0b1e5b]">
              operator
            </td>
            <td className="p-3.5 font-mono">Object</td>
            <td className="p-3.5">
              Network operator options, such as <code>any</code>, when available.
            </td>
          </tr>

          <tr>
            <td className="p-3.5 font-mono font-bold text-[#0b1e5b]">
              cost
            </td>
            <td className="p-3.5 font-mono">Number</td>
            <td className="p-3.5">
              Price of the virtual number activation, displayed in the currency
              used by Accnumbers.
            </td>
          </tr>

          <tr>
            <td className="p-3.5 font-mono font-bold text-[#0b1e5b]">
              count
            </td>
            <td className="p-3.5 font-mono">Number</td>
            <td className="p-3.5">
              Number of available activations reported for the entry, when provided.
            </td>
          </tr>

          <tr>
            <td className="p-3.5 font-mono font-bold text-[#0b1e5b]">
              rate
            </td>
            <td className="p-3.5 font-mono">Number</td>
            <td className="p-3.5">
              Additional service pricing information, when available.
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <p className="text-xs text-[#6b7280] leading-relaxed">
      Response fields may vary depending on the selected country and service.
      Only fields included in the returned result will be available.
    </p>
  </div>

</div>       


{/* Endpoint: Guest Products by Country & Operator */}

<div className="bg-white border border-[#e5e7eb] rounded-3xl p-6 sm:p-8 shadow-sm space-y-8">  <div className="space-y-3">
    <div className="flex items-center gap-2">
      <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider">
        GET
      </span>
      <span className="text-xs font-mono font-bold text-[#0b1e5b]">
        /api/v1/guest/products/{"{country}"}/{"{operator}"}
      </span>
    </div><h2 className="text-lg font-black text-[#0b1e5b]">
  Guest Products Catalog by Country &amp; Operator
</h2>

<p className="text-xs sm:text-sm text-[#6b7280] leading-relaxed">
  Retrieve available virtual number products, stock quantities, categories,
  and prices for a specific country and network operator on Accnumbers.
  The endpoint returns products with available stock and requires no API key
  authentication.
</p>

  </div>{/* Authentication */}

  <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-2xl p-4 text-xs text-[#475569] space-y-1">
    <span className="font-bold text-[#0b1e5b]">Access Requirement:</span>{" "}
    Publicly accessible. No API key or authorization header is required.
  </div>{/* Path Parameters */}

  <div className="space-y-3">
    <h3 className="text-xs font-black text-[#0b1e5b] uppercase tracking-wider">
      Path Parameters
    </h3><div className="overflow-x-auto border border-[#e5e7eb] rounded-2xl">
  <table className="w-full text-left text-xs">
    <thead className="bg-[#f8fafc] text-[#0b1e5b] border-b border-[#e5e7eb]">
      <tr>
        <th className="p-3.5 font-bold">Parameter</th>
        <th className="p-3.5 font-bold">Type</th>
        <th className="p-3.5 font-bold">Required</th>
        <th className="p-3.5 font-bold">Description</th>
      </tr>
    </thead>
    <tbody className="divide-y divide-[#e5e7eb] text-[#6b7280]">
      <tr>
        <td className="p-3.5 font-mono font-bold text-[#0b1e5b]">country</td>
        <td className="p-3.5 font-mono">String</td>
        <td className="p-3.5">Yes</td>
        <td className="p-3.5">
          Country identifier, such as <code>england</code> or <code>usa</code>.
        </td>
      </tr>
      <tr>
        <td className="p-3.5 font-mono font-bold text-[#0b1e5b]">operator</td>
        <td className="p-3.5 font-mono">String</td>
        <td className="p-3.5">Yes</td>
        <td className="p-3.5">
          Network operator identifier, such as <code>any</code> or another
          supported operator.
        </td>
      </tr>
    </tbody>
  </table>
</div>

<p className="text-xs text-[#6b7280] leading-relaxed">
  Both parameters are converted to lowercase. The route accepts lowercase
  letters, numbers, underscores, and hyphens, with a maximum length of 100
  characters per parameter.
</p>

  </div>{/* Request Examples */}

  <div className="space-y-4">
    <h3 className="text-xs font-black text-[#0b1e5b] uppercase tracking-wider">
      Request Examples
    </h3><div className="bg-[#111111] border border-[#222222] rounded-2xl p-5 shadow-xl space-y-5 text-slate-200 font-mono">
  <div className="flex items-center justify-between border-b border-[#222222] pb-3 text-xs">
    <span className="text-emerald-400 font-bold"># cURL Request</span>
    <span className="text-slate-500 uppercase tracking-widest text-[10px]">
      terminal
    </span>
  </div>

  <pre className="whitespace-pre-wrap break-all text-xs leading-6 text-cyan-400">{`curl -X GET "https://www.accnumbers.com/api/v1/guest/products/england/any" \\

-H "Accept: application/json"`}</pre>

  <div className="border-t border-[#222222] pt-4 space-y-2">
    <div className="text-slate-500 text-xs"># JavaScript Fetch</div>
    <pre className="overflow-x-auto text-xs leading-6 text-amber-300">{`const response = await fetch(

"https://www.accnumbers.com/api/v1/guest/products/england/any"
);

if (!response.ok) {
throw new Error("Unable to retrieve products.");
}

const products = await response.json();
console.log(products);`}</pre>
</div>
</div>

  </div>{/* Success Response */}

  <div className="space-y-3">
    <h3 className="text-xs font-black text-[#0b1e5b] uppercase tracking-wider">
      Success Response
    </h3><div className="bg-[#111111] border border-[#222222] rounded-2xl p-5 space-y-3">
  <span className="inline-block text-[10px] font-bold font-mono text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded">
    200 OK
  </span>

  <pre className="text-amber-300 text-xs overflow-x-auto leading-6">{`{

"facebook": {
"Category": "activation",
"Qty": 42,
"Price": 1500
},
"telegram": {
"Category": "activation",
"Qty": 18,
"Price": 1800
}
}`}</pre>
</div>

<p className="text-xs text-[#6b7280] leading-relaxed">
  Example values are illustrative. Actual product names, quantities, categories,
  and prices depend on the selected country and operator. An empty catalog may
  be returned when no usable product data is available.
</p>

  </div>{/* Error Responses */}

  <div className="space-y-4">
    <h3 className="text-xs font-black text-[#0b1e5b] uppercase tracking-wider">
      Error Responses
    </h3><div className="grid grid-cols-1 md:grid-cols-2 gap-4">

  <div className="border border-[#e5e7eb] rounded-2xl p-4 space-y-3 bg-[#fafafa]">
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs font-bold font-mono text-red-600 bg-red-50 px-2 py-1 rounded">
        400 Bad Request
      </span>
      <span className="text-[10px] text-gray-400 font-mono">Invalid Params</span>
    </div>

    <pre className="text-xs font-mono text-gray-800 bg-white p-3 rounded border border-gray-200 overflow-x-auto">{`{

"error": "The country or operator parameter is invalid."
}`}</pre>

    <p className="text-xs text-[#6b7280] leading-relaxed">
      Returned when a required path parameter is missing, exceeds the allowed
      length, or contains unsupported characters.
    </p>
  </div>

  <div className="border border-[#e5e7eb] rounded-2xl p-4 space-y-3 bg-[#fafafa]">
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs font-bold font-mono text-amber-600 bg-amber-50 px-2 py-1 rounded">
        502 Bad Gateway
      </span>
      <span className="text-[10px] text-gray-400 font-mono">Unavailable</span>
    </div>

    <pre className="text-xs font-mono text-gray-800 bg-white p-3 rounded border border-gray-200 overflow-x-auto">{`{

"error": "Unable to retrieve products right now. Please try again later."
}`}</pre>

    <p className="text-xs text-[#6b7280] leading-relaxed">
      Returned when product information cannot be retrieved or processed.
      Try again later.
    </p>
  </div>

  <div className="border border-[#e5e7eb] rounded-2xl p-4 space-y-3 bg-[#fafafa] md:col-span-2">
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs font-bold font-mono text-red-600 bg-red-50 px-2 py-1 rounded">
        503 Service Unavailable
      </span>
      <span className="text-[10px] text-gray-400 font-mono">Temporarily Unavailable</span>
    </div>

    <pre className="text-xs font-mono text-gray-800 bg-white p-3 rounded border border-gray-200 overflow-x-auto">{`{

"error": "Product information is temporarily unavailable."
}`}</pre>

    <p className="text-xs text-[#6b7280] leading-relaxed">
      Returned when the endpoint cannot serve product information because
      required service configuration is unavailable.
    </p>
  </div>

  <div className="border border-[#e5e7eb] rounded-2xl p-4 space-y-3 bg-[#fafafa] md:col-span-2">
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs font-bold font-mono text-red-600 bg-red-50 px-2 py-1 rounded">
        500 Internal Server Error
      </span>
      <span className="text-[10px] text-gray-400 font-mono">Unexpected Error</span>
    </div>

    <pre className="text-xs font-mono text-gray-800 bg-white p-3 rounded border border-gray-200 overflow-x-auto">{`{

"error": "An unexpected error occurred while loading products."
}`}</pre>

    <p className="text-xs text-[#6b7280] leading-relaxed">
      An unexpected error occurred while processing the request.
    </p>
  </div>
</div>

  </div>{/* Response Field Descriptions */}

  <div className="space-y-4">
    <h3 className="text-xs font-black text-[#0b1e5b] uppercase tracking-wider">
      Response Field Descriptions
    </h3><div className="overflow-x-auto border border-[#e5e7eb] rounded-2xl">
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
        <td className="p-3.5 font-mono font-bold text-[#0b1e5b]">
          Product name
        </td>
        <td className="p-3.5 font-mono">String (Object key)</td>
        <td className="p-3.5">
          The product identifier, such as <code>facebook</code> or{" "}
          <code>telegram</code>.
        </td>
      </tr>

      <tr>
        <td className="p-3.5 font-mono font-bold text-[#0b1e5b]">Category</td>
        <td className="p-3.5 font-mono">String</td>
        <td className="p-3.5">
          The product category, such as <code>activation</code>.
        </td>
      </tr>

      <tr>
        <td className="p-3.5 font-mono font-bold text-[#0b1e5b]">Qty</td>
        <td className="p-3.5 font-mono">Number</td>
        <td className="p-3.5">
          The number of units currently available for the product.
        </td>
      </tr>

      <tr>
        <td className="p-3.5 font-mono font-bold text-[#0b1e5b]">Price</td>
        <td className="p-3.5 font-mono">Number</td>
        <td className="p-3.5">
          The product price displayed by Accnumbers in its configured currency.
        </td>
      </tr>
    </tbody>
  </table>
</div>

  </div>
</div>
          
          {/* Endpoint: User Buy Activation */}
<div className="bg-white border border-[#e5e7eb] rounded-3xl p-6 sm:p-8 shadow-sm space-y-8">

  <div className="space-y-3">
    <div className="flex flex-wrap items-center gap-2">
      <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider shrink-0">
        GET
      </span>
      <span className="text-xs font-mono font-bold text-[#0b1e5b] break-all">
        /api/v1/user/buy/activation/{'{country}'}/{'{operator}'}/{'{product}'}
      </span>
    </div>

    <h2 className="text-lg font-black text-[#0b1e5b]">
      User Buy Activation
    </h2>

    <p className="text-xs sm:text-sm text-[#6b7280] leading-relaxed">
      Purchase a virtual phone number activation for a specified country,
      operator, and service. The endpoint checks product availability and
      wallet funds, atomically deducts the purchase price, registers the
      rental, records the debit transaction, and sends an in-app notification.
      A successful response includes the assigned phone number and activation
      details.
    </p>
  </div>

  {/* Authentication */}
  <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-2xl p-4 text-xs text-[#475569] space-y-2">
    <span className="font-bold text-[#0b1e5b]">
      Authentication Requirement
    </span>

    <p>
      Requires an active API key with the <code className="bg-white px-1.5 py-0.5 rounded border border-gray-200 font-mono text-[11px]">purchase</code> permission enabled.
      Send your key using either the Authorization Bearer header or the
      x-api-key header.
    </p>

    <div className="bg-white border border-gray-200 rounded-xl p-3 font-mono text-[11px] space-y-2 overflow-x-auto">
      <div>Authorization: Bearer YOUR_API_KEY</div>
      <div>Accept: application/json</div>
    </div>

    <p>
      Keep your API key private. Do not expose it in public frontend code.
    </p>
  </div>

  {/* Path Parameters */}
  <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-2xl p-4 text-xs text-[#475569] space-y-2">
    <span className="font-bold text-[#0b1e5b]">
      Path Parameters (Required)
    </span>

    <ul className="list-disc pl-5 pt-1 space-y-2 text-gray-600">
      <li>
        <code className="font-mono">country</code>: Target country code or
        name, such as <code className="font-mono">canada</code>.
      </li>
      <li>
        <code className="font-mono">operator</code>: Target operator or
        <code className="font-mono"> any</code> when available.
      </li>
      <li>
        <code className="font-mono">product</code>: Service or application
        identifier, such as <code className="font-mono">tiktok</code>.
      </li>
    </ul>
  </div>

  {/* Request Example */}
  <div className="bg-[#111111] border border-[#222222] rounded-2xl p-5 shadow-xl space-y-6 text-slate-200 font-mono">
    <div className="flex items-center justify-between border-b border-[#222222] pb-3 text-xs">
      <span className="text-emerald-400 font-bold">
        # Request Example (cURL)
      </span>
      <span className="text-slate-500 uppercase tracking-widest text-[10px]">
        terminal
      </span>
    </div>

    <div className="space-y-2 text-xs overflow-x-auto">
      <pre className="whitespace-pre-wrap break-all text-cyan-400">{`curl -X GET "https://www.accnumbers.com/api/v1/user/buy/activation/canada/any/tiktok" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Accept: application/json"`}</pre>
    </div>

    <div className="border-t border-[#222222] pt-3 space-y-3">
      <div className="text-slate-500 text-xs">
        # Success Response (200 OK)
      </div>

      <div className="text-amber-300 text-xs overflow-x-auto">
        <pre>{`{
  "id": 1084665247,
  "phone": "+18258520792",
  "operator": "any",
  "product": "tiktok",
  "price": 123,
  "status": "PENDING",
  "expires": "2026-09-04T11:18:34.109447399Z",
  "sms": [],
  "created_at": "2026-09-04T10:58:34.623918+00:00",
  "country": "canada"
}`}</pre>
      </div>

      <p className="text-slate-400 text-[11px] leading-relaxed">
        Example values are illustrative. Actual order details, price,
        expiration time, and timestamps depend on the purchase response.
      </p>
    </div>
  </div>

  {/* Purchase flow */}
  <div className="space-y-4">
    <h3 className="text-xs font-black text-[#0b1e5b] uppercase tracking-wider">
      How the Purchase Works
    </h3>

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {[
        {
          number: "01",
          title: "Authenticate",
          description: "Validates the API key and purchase permission.",
        },
        {
          number: "02",
          title: "Check availability",
          description: "Checks the requested product and calculates its price.",
        },
        {
          number: "03",
          title: "Deduct wallet funds",
          description: "Uses an atomic database operation to check and deduct the required amount.",
        },
        {
          number: "04",
          title: "Purchase activation",
          description: "Requests a number and activation from the service.",
        },
        {
          number: "05",
          title: "Register the rental",
          description: "Saves the rental and records the debit transaction.",
        },
        {
          number: "06",
          title: "Return the result",
          description: "Returns the phone number, order status, price, and activation details.",
        },
      ].map((step) => (
        <div
          key={step.number}
          className="border border-[#e5e7eb] rounded-2xl p-4 bg-[#fafafa] space-y-2"
        >
          <span className="text-[10px] font-black text-[#64748b]">
            STEP {step.number}
          </span>
          <h4 className="text-sm font-bold text-[#0b1e5b]">
            {step.title}
          </h4>
          <p className="text-xs text-[#6b7280] leading-relaxed">
            {step.description}
          </p>
        </div>
      ))}
    </div>

    <p className="text-xs text-[#6b7280] leading-relaxed">
      Wallet deduction is performed through an atomic database RPC to help
      prevent concurrent requests from spending the same available balance.
      This does not make the entire purchase process atomic.
    </p>
  </div>

  {/* Error Responses */}
  <div className="space-y-4">
    <h3 className="text-xs font-black text-[#0b1e5b] uppercase tracking-wider">
      Detailed Error Responses
    </h3>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

      <div className="border border-[#e5e7eb] rounded-2xl p-4 space-y-2 bg-[#fafafa]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-bold font-mono text-red-600 bg-red-50 px-2 py-0.5 rounded">
            400 Bad Request
          </span>
          <span className="text-[10px] text-gray-400 font-mono">
            Invalid Parameters
          </span>
        </div>
        <p className="text-xs font-mono text-gray-800 bg-white p-2 rounded border border-gray-200">
          "Invalid country, operator, or product parameter."
        </p>
        <p className="text-xs text-[#6b7280]">
          One or more path parameters are missing or contain unsupported characters.
        </p>
      </div>

      <div className="border border-[#e5e7eb] rounded-2xl p-4 space-y-2 bg-[#fafafa]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-bold font-mono text-red-600 bg-red-50 px-2 py-0.5 rounded">
            400 Bad Request
          </span>
          <span className="text-[10px] text-gray-400 font-mono">
            Insufficient Funds
          </span>
        </div>
        <p className="text-xs font-mono text-gray-800 bg-white p-2 rounded border border-gray-200">
          "Insufficient wallet balance."
        </p>
        <p className="text-xs text-[#6b7280]">
          The available wallet balance is less than the purchase price.
        </p>
      </div>

      <div className="border border-[#e5e7eb] rounded-2xl p-4 space-y-2 bg-[#fafafa]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-bold font-mono text-red-600 bg-red-50 px-2 py-0.5 rounded">
            401 Unauthorized
          </span>
          <span className="text-[10px] text-gray-400 font-mono">
            Authentication
          </span>
        </div>
        <p className="text-xs font-mono text-gray-800 bg-white p-2 rounded border border-gray-200">
          "A valid API key is required."
        </p>
        <p className="text-xs text-[#6b7280]">
          No API key was provided or the provided key is invalid.
        </p>
      </div>

      <div className="border border-[#e5e7eb] rounded-2xl p-4 space-y-2 bg-[#fafafa]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-bold font-mono text-red-600 bg-red-50 px-2 py-0.5 rounded">
            401 Unauthorized
          </span>
          <span className="text-[10px] text-gray-400 font-mono">
            Inactive Key
          </span>
        </div>
        <p className="text-xs font-mono text-gray-800 bg-white p-2 rounded border border-gray-200">
          "Invalid or inactive API key."
        </p>
        <p className="text-xs text-[#6b7280]">
          The supplied key does not exist, is inactive, or is not associated with a valid user.
        </p>
      </div>

      <div className="border border-[#e5e7eb] rounded-2xl p-4 space-y-2 bg-[#fafafa]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-bold font-mono text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
            403 Forbidden
          </span>
          <span className="text-[10px] text-gray-400 font-mono">
            Permission Denied
          </span>
        </div>
        <p className="text-xs font-mono text-gray-800 bg-white p-2 rounded border border-gray-200">
          "Your API key does not have purchase permission."
        </p>
        <p className="text-xs text-[#6b7280]">
          The API key does not have the required purchase permission enabled.
        </p>
      </div>

      <div className="border border-[#e5e7eb] rounded-2xl p-4 space-y-2 bg-[#fafafa]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-bold font-mono text-red-600 bg-red-50 px-2 py-0.5 rounded">
            404 Not Found
          </span>
          <span className="text-[10px] text-gray-400 font-mono">
            Wallet Missing
          </span>
        </div>
        <p className="text-xs font-mono text-gray-800 bg-white p-2 rounded border border-gray-200">
          "Wallet not found."
        </p>
        <p className="text-xs text-[#6b7280]">
          No wallet is associated with the authenticated user.
        </p>
      </div>

      <div className="border border-[#e5e7eb] rounded-2xl p-4 space-y-2 bg-[#fafafa]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-bold font-mono text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
            409 Conflict
          </span>
          <span className="text-[10px] text-gray-400 font-mono">
            Unavailable Product
          </span>
        </div>
        <p className="text-xs font-mono text-gray-800 bg-white p-2 rounded border border-gray-200">
          "The selected product is unavailable or out of stock."
        </p>
        <p className="text-xs text-[#6b7280]">
          The requested product has no available stock or a valid price.
        </p>
      </div>

      <div className="border border-[#e5e7eb] rounded-2xl p-4 space-y-2 bg-[#fafafa]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-bold font-mono text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
            502 Bad Gateway
          </span>
          <span className="text-[10px] text-gray-400 font-mono">
            Availability Check
          </span>
        </div>
        <p className="text-xs font-mono text-gray-800 bg-white p-2 rounded border border-gray-200">
          "Unable to check product availability. Please try again."
        </p>
        <p className="text-xs text-[#6b7280]">
          The service could not retrieve the requested product catalog.
        </p>
      </div>

      <div className="border border-[#e5e7eb] rounded-2xl p-4 space-y-2 bg-[#fafafa]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-bold font-mono text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
            502 Bad Gateway
          </span>
          <span className="text-[10px] text-gray-400 font-mono">
            Purchase Unconfirmed
          </span>
        </div>
        <p className="text-xs font-mono text-gray-800 bg-white p-2 rounded border border-gray-200">
          "Purchase could not be confirmed. Contact support before retrying."
        </p>
        <p className="text-xs text-[#6b7280]">
          The service could not confirm the purchase result. Check the order status before submitting another purchase to avoid duplicates.
        </p>
      </div>

      <div className="border border-[#e5e7eb] rounded-2xl p-4 space-y-2 bg-[#fafafa]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-bold font-mono text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
            503 Service Unavailable
          </span>
          <span className="text-[10px] text-gray-400 font-mono">
            Service Error
          </span>
        </div>
        <p className="text-xs font-mono text-gray-800 bg-white p-2 rounded border border-gray-200">
          "The purchase service is temporarily unavailable."
        </p>
        <p className="text-xs text-[#6b7280]">
          The service cannot process the request because required configuration is unavailable.
        </p>
      </div>

      <div className="border border-[#e5e7eb] rounded-2xl p-4 space-y-2 bg-[#fafafa] md:col-span-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-bold font-mono text-red-600 bg-red-50 px-2 py-0.5 rounded">
            500 Internal Server Error
          </span>
          <span className="text-[10px] text-gray-400 font-mono">
            Processing Error
          </span>
        </div>
        <p className="text-xs font-mono text-gray-800 bg-white p-2 rounded border border-gray-200">
          "An unexpected error occurred while processing the purchase."
        </p>
        <p className="text-xs text-[#6b7280]">
          An unexpected error occurred while processing the request. If a purchase may already have succeeded, contact support before retrying.
        </p>
      </div>

    </div>
  </div>

  {/* Response Fields */}
  <div className="space-y-4">
    <h3 className="text-xs font-black text-[#0b1e5b] uppercase tracking-wider">
      Response Field Descriptions
    </h3>

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
            <td className="p-3.5 font-mono">Number or String</td>
            <td className="p-3.5">Unique identifier for the purchased activation order.</td>
          </tr>
          <tr>
            <td className="p-3.5 font-mono font-bold text-[#0b1e5b]">phone</td>
            <td className="p-3.5 font-mono">String</td>
            <td className="p-3.5">The virtual phone number assigned to the activation.</td>
          </tr>
          <tr>
            <td className="p-3.5 font-mono font-bold text-[#0b1e5b]">operator</td>
            <td className="p-3.5 font-mono">String</td>
            <td className="p-3.5">The requested or resolved mobile network operator.</td>
          </tr>
          <tr>
            <td className="p-3.5 font-mono font-bold text-[#0b1e5b]">product</td>
            <td className="p-3.5 font-mono">String</td>
            <td className="p-3.5">The application or service associated with the activation.</td>
          </tr>
          <tr>
            <td className="p-3.5 font-mono font-bold text-[#0b1e5b]">price</td>
            <td className="p-3.5 font-mono">Number</td>
            <td className="p-3.5">The purchase price charged to the user's wallet, in NGN.</td>
          </tr>
          <tr>
            <td className="p-3.5 font-mono font-bold text-[#0b1e5b]">status</td>
            <td className="p-3.5 font-mono">String</td>
            <td className="p-3.5">The activation status returned by this endpoint, typically PENDING immediately after purchase.</td>
          </tr>
          <tr>
            <td className="p-3.5 font-mono font-bold text-[#0b1e5b]">expires</td>
            <td className="p-3.5 font-mono">String (ISO 8601)</td>
            <td className="p-3.5">Expiration timestamp for the activation, where available.</td>
          </tr>
          <tr>
            <td className="p-3.5 font-mono font-bold text-[#0b1e5b]">sms</td>
            <td className="p-3.5 font-mono">Array</td>
            <td className="p-3.5">SMS messages received for the activation. This endpoint initializes the array as empty.</td>
          </tr>
          <tr>
            <td className="p-3.5 font-mono font-bold text-[#0b1e5b]">created_at</td>
            <td className="p-3.5 font-mono">String (ISO 8601)</td>
            <td className="p-3.5">Timestamp when the rental record was created.</td>
          </tr>
          <tr>
            <td className="p-3.5 font-mono font-bold text-[#0b1e5b]">country</td>
            <td className="p-3.5 font-mono">String</td>
            <td className="p-3.5">The selected country for the activation.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  {/* Important notes */}
  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-2">
    <h3 className="text-xs font-black text-amber-900 uppercase tracking-wider">
      Important Notes
    </h3>
    <ul className="list-disc pl-5 space-y-1 text-xs text-amber-900 leading-relaxed">
      <li>This is a purchase endpoint. It does not perform refunds.</li>
      <li>A successful response means the purchase was confirmed and its rental record was saved.</li>
      <li>If a request returns an error after funds may have been deducted, check the order status or contact support before retrying.</li>
      
    </ul>
  </div>

</div>


               {/* Endpoint: User Check Order Status */}
<div className="bg-white border border-[#e5e7eb] rounded-3xl p-6 sm:p-8 shadow-sm space-y-8">

  <div className="space-y-3">
    <div className="flex flex-wrap items-center gap-2">
      <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider shrink-0">
        GET
      </span>
      <span className="text-xs font-mono font-bold text-[#0b1e5b] break-all">
        /api/v1/user/check/{'{id}'}
      </span>
    </div>

    <h2 className="text-lg font-black text-[#0b1e5b]">
      User Check Order Status
    </h2>

    <p className="text-xs sm:text-sm text-[#6b7280] leading-relaxed">
      Retrieve the details and current status of a virtual number rental
      using its order ID. The endpoint checks locally stored rental
      records first and uses the order-check service as a fallback when
      the order is not found locally.
    </p>
  </div>

  {/* Authentication */}
  <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-2xl p-4 text-xs text-[#475569] space-y-2">
    <p>
      <span className="font-bold text-[#0b1e5b]">
        Authentication Requirement:
      </span>{" "}
      Requires an active API key with at least one of these permissions
      enabled: <code className="bg-white px-1.5 py-0.5 rounded border border-gray-200 font-mono text-[11px]">check</code>,{" "}
      <code className="bg-white px-1.5 py-0.5 rounded border border-gray-200 font-mono text-[11px]">purchase</code>, or{" "}
      <code className="bg-white px-1.5 py-0.5 rounded border border-gray-200 font-mono text-[11px]">rentals</code>.
    </p>

    <p>
      Send the API key using the{" "}
      <code className="font-mono">Authorization: Bearer YOUR_API_KEY</code>{" "}
      header or the <code className="font-mono">x-api-key</code> header.
      Keep your API key private.
    </p>
  </div>

  {/* Path Parameters */}
  <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-2xl p-4 text-xs text-[#475569] space-y-2">
    <span className="font-bold text-[#0b1e5b]">
      Path Parameters (Required)
    </span>

    <ul className="list-disc pl-5 pt-1 space-y-2 text-gray-600">
      <li>
        <code className="font-mono">id</code>: The order identifier.
        For example, <code className="font-mono">106968055</code>.
        Numeric IDs can be used for the fallback lookup. Locally stored
        records may also be located by their internal rental ID or index.
      </li>
    </ul>
  </div>

  {/* Request Example */}
  <div className="bg-[#111111] border border-[#222222] rounded-2xl p-5 shadow-xl space-y-6 text-slate-200 font-mono">
    <div className="flex items-center justify-between border-b border-[#222222] pb-3 text-xs">
      <span className="text-emerald-400 font-bold">
        # Request Example (cURL)
      </span>
      <span className="text-slate-500 uppercase tracking-widest text-[10px]">
        terminal
      </span>
    </div>

    <div className="space-y-2 text-xs overflow-x-auto">
      <pre className="whitespace-pre-wrap break-all text-cyan-400">{`curl -X GET "https://www.accnumbers.com/api/v1/user/check/106968055" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Accept: application/json"`}</pre>
    </div>

    <div className="border-t border-[#222222] pt-3 space-y-3">
      <div className="text-slate-500 text-xs">
        # Example Success Response (200 OK)
      </div>

      <pre className="text-amber-300 text-xs overflow-x-auto whitespace-pre">{`{
  "id": 106968055,
  "created_at": "2026-08-13T10:10:35.43421+00:00",
  "phone": "+15306109780",
  "product": "whatsapp",
  "price": 3467,
  "status": "FINISHED",
  "expires": "2026-08-13T10:30:35.14971+00:00",
  "sms": [
    {
      "code": "650358",
      "date": "2026-08-13T10:10:52.588935Z",
      "text": "Example verification message",
      "sender": "ExampleSender",
      "created_at": "2026-08-13T10:10:52.623214Z"
    }
  ],
  "forwarding": false,
  "forwarding_number": "",
  "country": "usa"
}`}</pre>

      <p className="text-[11px] text-slate-400 leading-relaxed">
        Example values only. Actual fields and values depend on the
        returned order. SMS content above is illustrative.
      </p>
    </div>
  </div>

  {/* Error Responses */}
  <div className="space-y-4">
    <h3 className="text-xs font-black text-[#0b1e5b] uppercase tracking-wider">
      Detailed Error Responses
    </h3>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

      <div className="border border-[#e5e7eb] rounded-2xl p-4 space-y-2 bg-[#fafafa]">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold font-mono text-red-600 bg-red-50 px-2 py-0.5 rounded">
            400 Bad Request
          </span>
          <span className="text-[10px] text-gray-400 font-mono">
            Invalid ID
          </span>
        </div>
        <pre className="text-xs font-mono text-gray-800 bg-white p-2 rounded border border-gray-200 whitespace-pre-wrap">{`{
  "error": "Invalid order ID."
}`}</pre>
        <p className="text-xs text-[#6b7280]">
          The supplied order ID is empty, too long, or contains unsupported
          characters.
        </p>
      </div>

      <div className="border border-[#e5e7eb] rounded-2xl p-4 space-y-2 bg-[#fafafa]">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold font-mono text-red-600 bg-red-50 px-2 py-0.5 rounded">
            401 Unauthorized
          </span>
          <span className="text-[10px] text-gray-400 font-mono">
            Authentication
          </span>
        </div>
        <pre className="text-xs font-mono text-gray-800 bg-white p-2 rounded border border-gray-200 whitespace-pre-wrap">{`{
  "error": "A valid API key is required."
}`}</pre>
        <p className="text-xs text-[#6b7280]">
          No API key was provided.
        </p>
      </div>

      <div className="border border-[#e5e7eb] rounded-2xl p-4 space-y-2 bg-[#fafafa]">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold font-mono text-red-600 bg-red-50 px-2 py-0.5 rounded">
            401 Unauthorized
          </span>
          <span className="text-[10px] text-gray-400 font-mono">
            Invalid Key
          </span>
        </div>
        <pre className="text-xs font-mono text-gray-800 bg-white p-2 rounded border border-gray-200 whitespace-pre-wrap">{`{
  "error": "Invalid or inactive API key."
}`}</pre>
        <p className="text-xs text-[#6b7280]">
          The API key does not exist or is not active.
        </p>
      </div>

      <div className="border border-[#e5e7eb] rounded-2xl p-4 space-y-2 bg-[#fafafa]">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold font-mono text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
            403 Forbidden
          </span>
          <span className="text-[10px] text-gray-400 font-mono">
            Permission
          </span>
        </div>
        <pre className="text-xs font-mono text-gray-800 bg-white p-2 rounded border border-gray-200 whitespace-pre-wrap">{`{
  "error": "This API key does not have permission to check orders."
}`}</pre>
        <p className="text-xs text-[#6b7280]">
          The key does not have any of the accepted check, purchase, or
          rentals permissions enabled.
        </p>
      </div>

      <div className="border border-[#e5e7eb] rounded-2xl p-4 space-y-2 bg-[#fafafa]">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold font-mono text-red-600 bg-red-50 px-2 py-0.5 rounded">
            404 Not Found
          </span>
          <span className="text-[10px] text-gray-400 font-mono">
            Order Missing
          </span>
        </div>
        <pre className="text-xs font-mono text-gray-800 bg-white p-2 rounded border border-gray-200 whitespace-pre-wrap">{`{
  "error": "Order not found."
}`}</pre>
        <p className="text-xs text-[#6b7280]">
          The order could not be found, or a locally stored order belongs
          to a different API-key owner.
        </p>
      </div>

      <div className="border border-[#e5e7eb] rounded-2xl p-4 space-y-2 bg-[#fafafa]">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold font-mono text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
            409 Conflict
          </span>
          <span className="text-[10px] text-gray-400 font-mono">
            Ambiguous ID
          </span>
        </div>
        <pre className="text-xs font-mono text-gray-800 bg-white p-2 rounded border border-gray-200 whitespace-pre-wrap">{`{
  "error": "The order ID is ambiguous. Contact support."
}`}</pre>
        <p className="text-xs text-[#6b7280]">
          Multiple local rental records matched the supplied identifier.
        </p>
      </div>

      <div className="border border-[#e5e7eb] rounded-2xl p-4 space-y-2 bg-[#fafafa]">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold font-mono text-red-600 bg-red-50 px-2 py-0.5 rounded">
            500 Internal Server Error
          </span>
          <span className="text-[10px] text-gray-400 font-mono">
            Processing
          </span>
        </div>
        <pre className="text-xs font-mono text-gray-800 bg-white p-2 rounded border border-gray-200 whitespace-pre-wrap">{`{
  "error": "Unable to check the order right now."
}`}</pre>
        <p className="text-xs text-[#6b7280]">
          Authentication lookup or local rental lookup failed, or an
          unexpected server error occurred. The message varies by failure.
        </p>
      </div>

      <div className="border border-[#e5e7eb] rounded-2xl p-4 space-y-2 bg-[#fafafa]">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold font-mono text-red-600 bg-red-50 px-2 py-0.5 rounded">
            502 Bad Gateway
          </span>
          <span className="text-[10px] text-gray-400 font-mono">
            Check Service
          </span>
        </div>
        <pre className="text-xs font-mono text-gray-800 bg-white p-2 rounded border border-gray-200 whitespace-pre-wrap">{`{
  "error": "Unable to check the order right now. Try again later."
}`}</pre>
        <p className="text-xs text-[#6b7280]">
          The fallback check request timed out, failed, or returned an
          unsuccessful response. Other 502 messages may be returned for
          invalid upstream responses.
        </p>
      </div>

      <div className="border border-[#e5e7eb] rounded-2xl p-4 space-y-2 bg-[#fafafa]">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold font-mono text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
            503 Service Unavailable
          </span>
          <span className="text-[10px] text-gray-400 font-mono">
            Configuration
          </span>
        </div>
        <pre className="text-xs font-mono text-gray-800 bg-white p-2 rounded border border-gray-200 whitespace-pre-wrap">{`{
  "error": "The service is temporarily unavailable."
}`}</pre>
        <p className="text-xs text-[#6b7280]">
          Required server configuration is unavailable. The error message
          may vary depending on the configuration issue.
        </p>
      </div>

    </div>
  </div>

  {/* Response Fields */}
  <div className="space-y-4">
    <h3 className="text-xs font-black text-[#0b1e5b] uppercase tracking-wider">
      Response Field Descriptions
    </h3>

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
            <td className="p-3.5 font-mono">Number or String</td>
            <td className="p-3.5">
              The order identifier. Its type depends on the stored order
              ID and the response returned by the fallback service.
            </td>
          </tr>

          <tr>
            <td className="p-3.5 font-mono font-bold text-[#0b1e5b]">created_at</td>
            <td className="p-3.5 font-mono">String or null</td>
            <td className="p-3.5">Timestamp when the local rental was created.</td>
          </tr>

          <tr>
            <td className="p-3.5 font-mono font-bold text-[#0b1e5b]">phone</td>
            <td className="p-3.5 font-mono">String or null</td>
            <td className="p-3.5">The assigned virtual phone number.</td>
          </tr>

          <tr>
            <td className="p-3.5 font-mono font-bold text-[#0b1e5b]">product</td>
            <td className="p-3.5 font-mono">String or null</td>
            <td className="p-3.5">The target application or service.</td>
          </tr>

          <tr>
            <td className="p-3.5 font-mono font-bold text-[#0b1e5b]">price</td>
            <td className="p-3.5 font-mono">Number</td>
            <td className="p-3.5">The stored order amount.</td>
          </tr>

          <tr>
            <td className="p-3.5 font-mono font-bold text-[#0b1e5b]">status</td>
            <td className="p-3.5 font-mono">String</td>
            <td className="p-3.5">
              Current order status. Locally stored status is converted
              to uppercase; fallback status follows the returned response.
            </td>
          </tr>

          <tr>
            <td className="p-3.5 font-mono font-bold text-[#0b1e5b]">expires</td>
            <td className="p-3.5 font-mono">String or null</td>
            <td className="p-3.5">Rental expiration timestamp, when available.</td>
          </tr>

          <tr>
            <td className="p-3.5 font-mono font-bold text-[#0b1e5b]">sms</td>
            <td className="p-3.5 font-mono">Array</td>
            <td className="p-3.5">
              Received SMS messages. Locally stored non-array or invalid
              SMS data is returned as an empty array.
            </td>
          </tr>

          <tr>
            <td className="p-3.5 font-mono font-bold text-[#0b1e5b]">forwarding</td>
            <td className="p-3.5 font-mono">Boolean</td>
            <td className="p-3.5">
              Forwarding indicator in the locally formatted response.
              Set to false by this route for local records.
            </td>
          </tr>

          <tr>
            <td className="p-3.5 font-mono font-bold text-[#0b1e5b]">forwarding_number</td>
            <td className="p-3.5 font-mono">String</td>
            <td className="p-3.5">
              Forwarding number in the locally formatted response.
              Empty by default.
            </td>
          </tr>

          <tr>
            <td className="p-3.5 font-mono font-bold text-[#0b1e5b]">country</td>
            <td className="p-3.5 font-mono">String or null</td>
            <td className="p-3.5">Country associated with the rental.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  {/* Important Notes */}
  <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-2xl p-4 space-y-2">
    <h3 className="text-xs font-black text-[#0b1e5b] uppercase tracking-wider">
      Important Notes
    </h3>

    <ul className="list-disc pl-5 space-y-1.5 text-xs text-[#475569]">
      <li>
        Include an active API key with at least one accepted permission.
      </li>
      <li>
        Locally stored orders are returned only when they belong to the
        authenticated API-key owner.
      </li>
      <li>
        If no local order is found, only a numeric ID can be used for
        the fallback lookup.
      </li>
      <li>
        The fallback request has a 12-second timeout.
      </li>
      <li>
        A locally stored order and a fallback response may have different
        field types or additional fields.
      </li>
      <li>
        A 404 response can mean the order does not exist or that a local
        order belongs to a different account.
      </li>
      
    </ul>
  </div>

</div>



{/* Endpoint: User Finish Order */}
<div className="bg-white border border-[#e5e7eb] rounded-3xl p-6 sm:p-8 shadow-sm space-y-8">
  <div className="space-y-3">
    <div className="flex flex-wrap items-center gap-2">
      <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider shrink-0">
        GET
      </span>
      <span className="text-xs font-mono font-bold text-[#0b1e5b] break-all">
        /api/v1/user/finish/{'{id}'}
      </span>
    </div>

    <h2 className="text-lg font-black text-[#0b1e5b]">
      User Finish Order
    </h2>

    <p className="text-xs sm:text-sm text-[#6b7280] leading-relaxed">
      Finishes a virtual number rental order belonging to the authenticated API key owner. After the order service confirms the operation, Accnumbers updates the local rental status to <code className="font-mono">FINISHED</code>.
    </p>
  </div>

  {/* Authentication */}
  <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-2xl p-4 text-xs text-[#475569] space-y-2">
    <span className="font-bold text-[#0b1e5b]">
      Authentication Requirements
    </span>

    <p>
      Provide an active API key that has not expired and is associated with a user account.
    </p>

    <p>
      The route accepts a key with at least one of these scopes enabled:
      {" "}
      <code className="bg-white px-1.5 py-0.5 rounded border border-gray-200 font-mono text-[11px]">check</code>,
      {" "}
      <code className="bg-white px-1.5 py-0.5 rounded border border-gray-200 font-mono text-[11px]">purchase</code>,
      {" "}
      or
      {" "}
      <code className="bg-white px-1.5 py-0.5 rounded border border-gray-200 font-mono text-[11px]">rentals</code>.
    </p>

    <p>
      Pass the key using <code className="font-mono">Authorization: Bearer YOUR_API_KEY</code> or the <code className="font-mono">x-api-key</code> header.
    </p>
  </div>

  {/* Path parameter */}
  <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-2xl p-4 text-xs text-[#475569] space-y-2">
    <span className="font-bold text-[#0b1e5b]">
      Path Parameters
    </span>

    <ul className="list-disc pl-5 space-y-1 text-gray-600">
      <li>
        <code className="font-mono">id</code>: Required order identifier. Use the local rental ID or the external order ID associated with your rental.
      </li>
      <li>
        Example: <code className="font-mono">11631253</code>
      </li>
    </ul>
  </div>

  {/* Request */}
  <div className="bg-[#111111] border border-[#222222] rounded-2xl p-5 shadow-xl space-y-5 text-slate-200 font-mono">
    <div className="flex items-center justify-between border-b border-[#222222] pb-3 text-xs">
      <span className="text-emerald-400 font-bold">
        # Request Example (cURL)
      </span>
      <span className="text-slate-500 uppercase tracking-widest text-[10px]">
        terminal
      </span>
    </div>

    <pre className="text-xs whitespace-pre-wrap break-all text-slate-300">{`curl -X GET "https://www.accnumbers.com/api/v1/user/finish/11631253" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Accept: application/json"`}</pre>
  </div>

  {/* Success response */}
  <div className="space-y-3">
    <h3 className="text-xs font-black text-[#0b1e5b] uppercase tracking-wider">
      Success Response
    </h3>

    <p className="text-xs text-[#6b7280]">
      HTTP <code className="font-mono">200 OK</code> when the order is finished and the local status is synchronized successfully.
    </p>

    <div className="bg-[#111111] border border-[#222222] rounded-2xl p-5 space-y-3 text-slate-200 font-mono">
      <div className="text-slate-500 text-xs">
        # Example: 200 OK
      </div>

      <pre className="text-xs overflow-x-auto text-amber-300">{`{
  "success": true,
  "message": "Order finished successfully.",
  "id": "local-rental-id",
  "status": "FINISHED",
  "provider_response": {
    "...": "provider response fields"
  }
}`}</pre>

      <p className="text-[11px] text-slate-400 leading-relaxed">
        The <code className="text-slate-200">provider_response</code> field contains the response returned by the order service. Its exact structure depends on that service.
      </p>
    </div>

    <div className="bg-[#f0fdf4] border border-[#bbf7d0] rounded-2xl p-4 space-y-2">
      <p className="text-xs font-bold text-green-800">
        Already-finished order
      </p>
      <p className="text-xs text-green-900">
        If the local order is already marked <code className="font-mono">FINISHED</code>, the endpoint returns HTTP 200 without calling the order service again.
      </p>

      <pre className="text-xs overflow-x-auto bg-white border border-green-100 rounded-xl p-3 text-gray-700">{`{
  "success": true,
  "message": "Order is already finished.",
  "id": "local-rental-id",
  "status": "FINISHED"
}`}</pre>
    </div>

    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-2">
      <p className="text-xs font-bold text-amber-800">
        Local synchronization warning
      </p>
      <p className="text-xs text-amber-900">
        If the order service confirms the finish operation but Accnumbers cannot update the local database, the endpoint returns HTTP 200 with a warning. Check the order status before retrying.
      </p>

      <pre className="text-xs overflow-x-auto bg-white border border-amber-100 rounded-xl p-3 text-gray-700">{`{
  "success": true,
  "warning": "The order was finished, but its local status could not be synchronized. Please check the order status.",
  "id": "local-rental-id",
  "provider_response": {}
}`}</pre>
    </div>
  </div>

  {/* Errors */}
  <div className="space-y-4">
    <h3 className="text-xs font-black text-[#0b1e5b] uppercase tracking-wider">
      Error Responses
    </h3>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {[
        {
          code: "400 Bad Request",
          label: "Invalid order ID",
          message: "Invalid order ID.",
          description: "The ID is missing, too long, or contains unsupported characters.",
          color: "text-amber-700 bg-amber-50",
        },
        {
          code: "401 Unauthorized",
          label: "Authentication failed",
          message: "Missing API key.",
          description: "No API key was provided, or the key is invalid, inactive, or expired.",
          color: "text-red-600 bg-red-50",
        },
        {
          code: "403 Forbidden",
          label: "Permission denied",
          message: "You do not have permission to finish this order.",
          description: "The API key lacks the required scope, is not associated with a user, or does not own the requested order.",
          color: "text-amber-700 bg-amber-50",
        },
        {
          code: "404 Not Found",
          label: "Order not found",
          message: "Order not found.",
          description: "No matching local rental record was found for the supplied identifier.",
          color: "text-red-600 bg-red-50",
        },
        {
          code: "500 Internal Server Error",
          label: "Database or server error",
          message: "Unable to authenticate API key.",
          description: "A database lookup or unexpected server operation failed. The specific message depends on the failed operation.",
          color: "text-red-600 bg-red-50",
        },
        {
          code: "502 Bad Gateway",
          label: "Order service error",
          message: "Unable to reach the order service.",
          description: "The order service could not be reached, returned an unexpected response, or rejected its server-side authorization.",
          color: "text-red-600 bg-red-50",
        },
        {
          code: "503 Service Unavailable",
          label: "Service unavailable",
          message: "Order service is temporarily unavailable.",
          description: "Server configuration is incomplete or the order service is rate-limiting requests.",
          color: "text-amber-700 bg-amber-50",
        },
        {
          code: "504 Gateway Timeout",
          label: "Request timed out",
          message: "Order service timed out. Please try again.",
          description: "The order service did not respond within the 12-second timeout.",
          color: "text-amber-700 bg-amber-50",
        },
      ].map((error) => (
        <div
          key={error.code}
          className="border border-[#e5e7eb] rounded-2xl p-4 space-y-2 bg-[#fafafa]"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className={`text-xs font-bold font-mono px-2 py-1 rounded ${error.color}`}>
              {error.code}
            </span>
            <span className="text-[10px] text-gray-400">
              {error.label}
            </span>
          </div>

          <p className="text-xs font-mono text-gray-800 bg-white p-2 rounded border border-gray-200 break-words">
            {error.message}
          </p>

          <p className="text-xs text-[#6b7280]">
            {error.description}
          </p>
        </div>
      ))}
    </div>
  </div>

  {/* Response fields */}
  <div className="space-y-4">
    <h3 className="text-xs font-black text-[#0b1e5b] uppercase tracking-wider">
      Response Field Descriptions
    </h3>

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
            <td className="p-3.5 font-mono font-bold text-[#0b1e5b]">success</td>
            <td className="p-3.5 font-mono">Boolean</td>
            <td className="p-3.5">Indicates that the finish operation was accepted as successful by the endpoint.</td>
          </tr>
          <tr>
            <td className="p-3.5 font-mono font-bold text-[#0b1e5b]">message</td>
            <td className="p-3.5 font-mono">String</td>
            <td className="p-3.5">Human-readable result message, including when an order is already finished.</td>
          </tr>
          <tr>
            <td className="p-3.5 font-mono font-bold text-[#0b1e5b]">id</td>
            <td className="p-3.5 font-mono">String</td>
            <td className="p-3.5">The local rental identifier. Its type follows the database value.</td>
          </tr>
          <tr>
            <td className="p-3.5 font-mono font-bold text-[#0b1e5b]">status</td>
            <td className="p-3.5 font-mono">String</td>
            <td className="p-3.5">The local rental status after synchronization, typically <code className="font-mono">FINISHED</code>.</td>
          </tr>
          <tr>
            <td className="p-3.5 font-mono font-bold text-[#0b1e5b]">provider_response</td>
            <td className="p-3.5 font-mono">Object / Any</td>
            <td className="p-3.5">The response returned by the order service. This field may be absent when the order was already finished.</td>
          </tr>
          <tr>
            <td className="p-3.5 font-mono font-bold text-[#0b1e5b]">warning</td>
            <td className="p-3.5 font-mono">String</td>
            <td className="p-3.5">Returned when the remote finish succeeds but the local status update fails.</td>
          </tr>
          <tr>
            <td className="p-3.5 font-mono font-bold text-[#0b1e5b]">error</td>
            <td className="p-3.5 font-mono">String</td>
            <td className="p-3.5">Describes why the request failed.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  {/* Notes */}
  <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-2xl p-4 space-y-2">
    <h3 className="text-xs font-black text-[#0b1e5b] uppercase tracking-wider">
      Important Notes
    </h3>

    <ul className="list-disc pl-5 space-y-1 text-xs text-[#475569]">
      <li>The order must exist in Accnumbers and belong to the API key owner.</li>
      <li>The endpoint accepts GET requests and uses a 12-second timeout for the order service.</li>
      <li>The local rental status is updated only after the order service responds successfully.</li>
      
      <li>A successful HTTP response with a <code className="font-mono">warning</code> means the remote operation succeeded but local synchronization needs checking.</li>
      
    </ul>
  </div>
</div>








          
</div>

      </main>
    </div>
  );
}

