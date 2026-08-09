import Link from 'next/link';

interface ServiceItem {
  id: string;
  country: string;
  service: string;
  price: number;
  totalStock: number;
}

// Direct backend fetcher
async function getLivePrices(): Promise<ServiceItem[]> {
  try {
    const res = await fetch('http://127.0.0.1:3000/api/prices', {
      cache: 'no-store',
    });

    if (!res.ok) return [];

    const json = await res.json();
    const rawData = json.data || json.services;

    if (!rawData) return [];

    // If it's already a formatted array
    if (Array.isArray(rawData)) {
      return rawData;
    }

    // Process nested route inventory JSON structure
    const parsedList: ServiceItem[] = [];
    if (typeof rawData === 'object' && rawData !== null) {
      Object.entries(rawData).forEach(([countryName, countryObj]: [string, any]) => {
        if (typeof countryObj === 'object' && countryObj !== null) {
          Object.entries(countryObj).forEach(([serviceName, serviceObj]: [string, any]) => {
            if (typeof serviceObj === 'object' && serviceObj !== null) {
              let lowestCost = Infinity;
              let totalStock = 0;

              Object.values(serviceObj).forEach((opDetails: any) => {
                if (opDetails && typeof opDetails === 'object') {
                  const cost = Number(opDetails.cost) || 0;
                  const count = Number(opDetails.count) || 0;

                  if (cost < lowestCost) lowestCost = cost;
                  totalStock += count;
                }
              });

              if (lowestCost !== Infinity) {
                parsedList.push({
                  id: `${countryName}-${serviceName}`,
                  country: countryName.charAt(0).toUpperCase() + countryName.slice(1),
                  service: serviceName.toUpperCase(),
                  price: lowestCost,
                  totalStock,
                });
              }
            }
          });
        }
      });
    }

    parsedList.sort((a, b) => b.totalStock - a.totalStock);
    return parsedList;
  } catch (err) {
    console.error('Server-side fetch error:', err);
    return [];
  }
}

export default async function PricingPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string }>;
}) {
  const resolvedParams = await searchParams;
  const searchQuery = resolvedParams?.q || '';
  const allServices = await getLivePrices();

  const filteredServices = allServices.filter(
    (item) =>
      item.service.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.country.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#fdfdfc] text-[#0b1e5b] flex flex-col justify-between">
      
      <main className="flex-1 relative bg-[#fdfdfc] bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] bg-[size:2.25rem_2.25rem]">
        
        {/* HEADER */}
        <section className="pt-16 pb-12 px-4 border-b border-[#e5e7eb]/80 bg-[#fdfdfc]/90 backdrop-blur-xs">
          <div className="max-w-3xl mx-auto space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-widest text-[#0b1e5b]">
                Live Rates & Stock
              </span>
              <span className="text-[10px] font-bold bg-[#e5e7eb] text-[#0b1e5b] px-3 py-1 rounded-full flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${allServices.length > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></span>
                {allServices.length > 0 ? 'AccNumbers Live Sync Active' : 'Connection Error'}
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-black text-[#0b1e5b] tracking-tight leading-none">
              Transparent SMS Pricing.
            </h1>
            <p className="text-sm sm:text-base text-[#6b7280] font-medium max-w-xl leading-relaxed">
              Real-time prices and stock synchronized with activation routes. Pay only when an SMS code is delivered.
            </p>
          </div>
        </section>

        {/* PRICING TABLE & SEARCH */}
        <section className="py-12 px-4">
          <div className="max-w-3xl mx-auto space-y-6">

            {/* SEARCH INPUT (Native Server-compatible Form) */}
            <form method="GET" className="bg-[#fdfdfc] border border-[#e5e7eb] rounded-2xl p-4 shadow-xs flex items-center gap-3">
              <input
                type="text"
                name="q"
                defaultValue={searchQuery}
                placeholder="Search service or country (e.g. WhatsApp, Facebook, England, USA)..."
                className="w-full bg-transparent text-xs sm:text-sm font-bold text-[#0b1e5b] placeholder-[#6b7280] focus:outline-hidden"
              />
              <button type="submit" className="text-xs font-bold bg-[#0b1e5b] text-white px-4 py-2 rounded-xl shrink-0">
                Search
              </button>
            </form>

            {/* TABLE CONTAINER */}
            <div className="bg-[#fdfdfc] border border-[#e5e7eb] rounded-2xl overflow-hidden shadow-xs">
              <div className="p-4 bg-[#e5e7eb]/20 border-b border-[#e5e7eb] flex justify-between items-center text-[10px] font-black uppercase tracking-wider text-[#6b7280]">
                <span>Service & Country</span>
                <div className="flex items-center gap-8">
                  <span>Stock</span>
                  <span>Price (RUB)</span>
                </div>
              </div>

              <div className="divide-y divide-[#e5e7eb]/60">
                {filteredServices.length > 0 ? (
                  filteredServices.map((item, idx) => (
                    <div 
                      key={item.id || idx} 
                      className="p-4 sm:p-5 flex items-center justify-between hover:bg-[#e5e7eb]/10 transition"
                    >
                      <div className="space-y-0.5">
                        <h3 className="text-sm font-black text-[#0b1e5b]">{item.service}</h3>
                        <p className="text-xs text-[#6b7280] font-medium">{item.country}</p>
                      </div>

                      <div className="flex items-center gap-6 sm:gap-10">
                        <span className={`text-xs font-extrabold px-2.5 py-1 rounded-lg ${
                          item.totalStock > 100 ? 'bg-emerald-100 text-emerald-800' :
                          item.totalStock > 0 ? 'bg-amber-100 text-amber-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {item.totalStock > 0 ? `${item.totalStock.toLocaleString()} pcs` : 'Out of stock'}
                        </span>
                        <span className="text-sm font-black text-[#0b1e5b] w-16 text-right">
                          {item.price} ₽
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-xs text-[#6b7280] font-medium">
                    {allServices.length === 0
                      ? 'Failed to pull data from internal /api/prices route.'
                      : `No services found matching "${searchQuery}".`}
                  </div>
                )}
              </div>
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
