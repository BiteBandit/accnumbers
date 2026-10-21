import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DEFAULT_MARKUP = 1.0;
const DEFAULT_USD_TO_NGN_RATE = 1500;
const PROVIDER_URL = 'https://5sim.net/v1/guest/prices';

function jsonResponse(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    },
  });
}

async function getPricingConfig(): Promise<{
  defaultMarkup: number;
  usdToNgnRate: number;
}> {
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('key, value')
      .in('key', ['markup_multiplier', 'usd_to_ngn', 'usdt_rate']);

    if (error) {
      console.error('[API PRICES] Failed to load pricing settings:', error);
      return {
        defaultMarkup: DEFAULT_MARKUP,
        usdToNgnRate: DEFAULT_USD_TO_NGN_RATE,
      };
    }

    const rows = data ?? [];
    const markupRow = rows.find((row) => row.key === 'markup_multiplier');
    const rateRow = rows.find(
      (row) => row.key === 'usd_to_ngn' || row.key === 'usdt_rate'
    );

    const configuredMarkup = Number(markupRow?.value);
    const configuredRate = Number(rateRow?.value);

    return {
      defaultMarkup:
        Number.isFinite(configuredMarkup) && configuredMarkup > 0
          ? configuredMarkup
          : DEFAULT_MARKUP,
      usdToNgnRate:
        Number.isFinite(configuredRate) && configuredRate > 0
          ? configuredRate
          : DEFAULT_USD_TO_NGN_RATE,
    };
  } catch (error) {
    console.error('[API PRICES] Error loading pricing settings:', error);

    return {
      defaultMarkup: DEFAULT_MARKUP,
      usdToNgnRate: DEFAULT_USD_TO_NGN_RATE,
    };
  }
}

function convertPriceDetails(
  value: unknown,
  markup: number,
  exchangeRate: number
): unknown {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return value;
  }

  const details = value as Record<string, unknown>;
  const rawPrice = details.cost ?? details.price;

  // Preserve the original data if it has no usable price field.
  if (rawPrice === undefined || rawPrice === null || rawPrice === '') {
    return { ...details };
  }

  const basePrice = Number(rawPrice);

  // Never silently turn malformed provider prices into zero.
  if (!Number.isFinite(basePrice) || basePrice < 0) {
    return { ...details };
  }

  const convertedPrice = Math.ceil(basePrice * markup * exchangeRate);
  const { price: _price, ...remainingDetails } = details;

  return {
    ...remainingDetails,
    cost: convertedPrice,
  };
}

function transformPrices(
  data: unknown,
  markup: number,
  exchangeRate: number
): unknown {
  if (Array.isArray(data)) {
    return data.map((item) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) {
        return item;
      }

      return convertPriceDetails(item, markup, exchangeRate);
    });
  }

  if (!data || typeof data !== 'object') {
    return data;
  }

  const result: Record<string, unknown> = {};

  for (const [firstKey, firstValue] of Object.entries(
    data as Record<string, unknown>
  )) {
    if (!firstValue || typeof firstValue !== 'object') {
      result[firstKey] = firstValue;
      continue;
    }

    if (Array.isArray(firstValue)) {
      result[firstKey] = firstValue.map((item) =>
        convertPriceDetails(item, markup, exchangeRate)
      );
      continue;
    }

    const firstObject = firstValue as Record<string, unknown>;

    // Some filtered provider responses return pricing details directly.
    if (
      'cost' in firstObject ||
      'price' in firstObject ||
      'count' in firstObject ||
      'rate' in firstObject
    ) {
      result[firstKey] = convertPriceDetails(
        firstObject,
        markup,
        exchangeRate
      );
      continue;
    }

    const secondLevel: Record<string, unknown> = {};

    for (const [secondKey, secondValue] of Object.entries(firstObject)) {
      if (!secondValue || typeof secondValue !== 'object') {
        secondLevel[secondKey] = secondValue;
        continue;
      }

      if (Array.isArray(secondValue)) {
        secondLevel[secondKey] = secondValue.map((item) =>
          convertPriceDetails(item, markup, exchangeRate)
        );
        continue;
      }

      const secondObject = secondValue as Record<string, unknown>;

      // Filtered responses may expose a price-details object at this level.
      if (
        'cost' in secondObject ||
        'price' in secondObject ||
        'count' in secondObject ||
        'rate' in secondObject
      ) {
        secondLevel[secondKey] = convertPriceDetails(
          secondObject,
          markup,
          exchangeRate
        );
        continue;
      }

      const operatorLevel: Record<string, unknown> = {};

      for (const [operatorName, operatorDetails] of Object.entries(
        secondObject
      )) {
        operatorLevel[operatorName] = convertPriceDetails(
          operatorDetails,
          markup,
          exchangeRate
        );
      }

      secondLevel[secondKey] = operatorLevel;
    }

    result[firstKey] = secondLevel;
  }

  return result;
}

export async function GET(request: Request) {
  try {
    const apiKey =
      process.env.SIM5_API_KEY || process.env.GRIZZLY_API_KEY || '';

    if (!apiKey.trim()) {
      return jsonResponse(
        { error: 'Price provider API key is not configured.' },
        500
      );
    }

    const { searchParams } = new URL(request.url);
    const country = searchParams.get('country')?.trim();
    const product = searchParams.get('product')?.trim();

    if (country !== undefined && country !== null && country.length > 100) {
      return jsonResponse(
        { error: 'The country parameter is too long.' },
        400
      );
    }

    if (product !== undefined && product !== null && product.length > 100) {
      return jsonResponse(
        { error: 'The product parameter is too long.' },
        400
      );
    }

    const providerUrl = new URL(PROVIDER_URL);

    if (country) providerUrl.searchParams.set('country', country);
    if (product) providerUrl.searchParams.set('product', product);

    const { defaultMarkup, usdToNgnRate } = await getPricingConfig();

    let providerRes: Response;

    try {
      providerRes = await fetch(providerUrl.toString(), {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Accept: 'application/json',
        },
        cache: 'no-store',
        signal: AbortSignal.timeout(15000),
      });
    } catch (error) {
      console.error('[API PRICES] Provider request failed:', error);

      return jsonResponse(
        { error: 'Unable to connect to the price provider.' },
        502
      );
    }

    const textBody = await providerRes.text();

    if (!providerRes.ok) {
      console.error(
        '[API PRICES] Provider returned HTTP status:',
        providerRes.status
      );

      return jsonResponse(
        { error: 'The price provider could not process the request.' },
        502
      );
    }

    if (!textBody.trim()) {
      return jsonResponse({});
    }

    let globalData: unknown;

    try {
      globalData = JSON.parse(textBody);
    } catch {
      console.error('[API PRICES] Provider returned invalid JSON.');

      return jsonResponse(
        { error: 'Failed to parse provider JSON payload.' },
        502
      );
    }

    if (
      globalData === null ||
      typeof globalData !== 'object'
    ) {
      return jsonResponse({});
    }

    const modifiedPrices = transformPrices(
      globalData,
      defaultMarkup,
      usdToNgnRate
    );

    return jsonResponse(modifiedPrices);
  } catch (error) {
    console.error('[API PRICES CRITICAL ERROR]:', error);

    return jsonResponse(
      { error: 'Internal server error while loading prices.' },
      500
    );
  }
}