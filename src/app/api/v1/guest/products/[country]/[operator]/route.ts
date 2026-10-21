import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DEFAULT_MARKUP = 1;
const DEFAULT_USD_TO_NGN_RATE = 1500;
const REQUEST_TIMEOUT_MS = 15_000;

type PricingConfig = {
defaultMarkup: number;
usdToNgnRate: number;
};

type Product = {
Category: string;
Qty: number;
Price: number;
};

function jsonResponse(
body: unknown,
status = 200,
noStore = false
) {
const response = NextResponse.json(body, { status });

if (noStore) {
response.headers.set(
'Cache-Control',
'no-store, no-cache, must-revalidate, proxy-revalidate'
);
}

return response;
}

async function getPricingConfig(): Promise<PricingConfig> {
try {
const { data, error } = await supabase
.from('settings')
.select('key, value')
.in('key', ['markup_multiplier', 'usd_to_ngn', 'usdt_rate']);

if (error || !data) {
  return {
    defaultMarkup: DEFAULT_MARKUP,
    usdToNgnRate: DEFAULT_USD_TO_NGN_RATE,
  };
}

const markupRow = data.find(
  (row) => row.key === 'markup_multiplier'
);

const exchangeRateRow = data.find(
  (row) => row.key === 'usd_to_ngn' || row.key === 'usdt_rate'
);

const markup = Number(markupRow?.value);
const exchangeRate = Number(exchangeRateRow?.value);

return {
  defaultMarkup:
    Number.isFinite(markup) && markup > 0
      ? markup
      : DEFAULT_MARKUP,
  usdToNgnRate:
    Number.isFinite(exchangeRate) && exchangeRate > 0
      ? exchangeRate
      : DEFAULT_USD_TO_NGN_RATE,
};

} catch (error) {
console.error('[GUEST PRODUCTS] Failed to load pricing settings:', error);

return {
  defaultMarkup: DEFAULT_MARKUP,
  usdToNgnRate: DEFAULT_USD_TO_NGN_RATE,
};

}
}

function normalizePathParameter(value: string): string {
return value.trim().toLowerCase();
}

export async function GET(
_request: Request,
{
params,
}: {
params: Promise<{ country: string; operator: string }>;
}
) {
try {
const resolvedParams = await params;

const country = normalizePathParameter(resolvedParams?.country ?? '');
const operator = normalizePathParameter(resolvedParams?.operator ?? '');

if (!country || !operator) {
  return jsonResponse(
    { error: 'Both country and operator are required.' },
    400,
    true
  );
}

if (
  country.length > 100 ||
  operator.length > 100 ||
  !/^[a-z0-9_-]+$/.test(country) ||
  !/^[a-z0-9_-]+$/.test(operator)
) {
  return jsonResponse(
    { error: 'The country or operator parameter is invalid.' },
    400,
    true
  );
}

const apiKey =
  process.env.SIM5_API_KEY ||
  process.env.GRIZZLY_API_KEY;

if (!apiKey) {
  console.error('[GUEST PRODUCTS] Required server configuration is missing.');

  return jsonResponse(
    { error: 'Product information is temporarily unavailable.' },
    503,
    true
  );
}

const { defaultMarkup, usdToNgnRate } = await getPricingConfig();

const url =
  `https://5sim.net/v1/guest/products/` +
  `${encodeURIComponent(country)}/${encodeURIComponent(operator)}`;

let providerResponse: Response;

try {
  providerResponse = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: 'application/json',
    },
    cache: 'no-store',
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
} catch (error) {
  console.error('[GUEST PRODUCTS] Request failed:', error);

  return jsonResponse(
    { error: 'Product information is temporarily unavailable. Please try again.' },
    502,
    true
  );
}

if (!providerResponse.ok) {
  console.error(
    '[GUEST PRODUCTS] Product request returned status:',
    providerResponse.status
  );

  return jsonResponse(
    { error: 'Unable to retrieve products right now. Please try again later.' },
    502,
    true
  );
}

let data: unknown;

try {
  const textBody = await providerResponse.text();

  if (!textBody.trim()) {
    return jsonResponse({}, 200, true);
  }

  data = JSON.parse(textBody);
} catch (error) {
  console.error('[GUEST PRODUCTS] Failed to process product data:', error);

  return jsonResponse(
    { error: 'Unable to process product data. Please try again later.' },
    502,
    true
  );
}

if (
  !data ||
  typeof data !== 'object' ||
  Array.isArray(data)
) {
  return jsonResponse({}, 200, true);
}

const modifiedProducts: Record<string, Product> = {};

for (const [productName, rawDetails] of Object.entries(
  data as Record<string, unknown>
)) {
  if (
    !rawDetails ||
    typeof rawDetails !== 'object' ||
    Array.isArray(rawDetails)
  ) {
    continue;
  }

  const details = rawDetails as Record<string, unknown>;

  const rawPrice =
    details.Price ?? details.cost ?? details.price ?? 0;

  const rawQuantity =
    details.Qty ?? details.count ?? 0;

  const basePrice = Number(rawPrice);
  const quantity = Number(rawQuantity);

  if (
    !Number.isFinite(basePrice) ||
    basePrice < 0 ||
    !Number.isFinite(quantity) ||
    quantity <= 0
  ) {
    continue;
  }

  const finalPrice = Math.ceil(
    basePrice * defaultMarkup * usdToNgnRate
  );

  if (!Number.isFinite(finalPrice)) {
    continue;
  }

  const rawCategory = details.Category ?? details.category;

  modifiedProducts[productName] = {
    Category:
      typeof rawCategory === 'string' && rawCategory.trim()
        ? rawCategory
        : 'activation',
    Qty: quantity,
    Price: finalPrice,
  };
}

return jsonResponse(modifiedProducts, 200, true);

} catch (error) {
console.error('[GUEST PRODUCTS] Unexpected error:', error);

return jsonResponse(
  { error: 'An unexpected error occurred while loading products.' },
  500,
  true
);

}
}