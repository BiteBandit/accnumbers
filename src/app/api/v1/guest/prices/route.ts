import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

async function getPricingConfig() {
  try {
    const { data } = await supabase.from('settings').select('key, value');
    if (!data) return { defaultMarkup: 1.0, usdToNgnRate: 1500 };

    const markupRow = data.find((row) => row.key === 'markup_multiplier');
    const usdToNgnRow = data.find((row) => row.key === 'usd_to_ngn' || row.key === 'usdt_rate');

    return {
      defaultMarkup: markupRow ? Number(markupRow.value) : 1.0,
      usdToNgnRate: usdToNgnRow ? Number(usdToNgnRow.value) : 1500,
    };
  } catch (err) {
    console.error('[API PRICES] Error loading settings from Supabase:', err);
    return { defaultMarkup: 1.0, usdToNgnRate: 1500 };
  }
}

export async function GET(request: Request) {
  try {
    const apiKey = process.env.SIM5_API_KEY || process.env.GRIZZLY_API_KEY || '';
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is missing in server environment variables.' },
        { status: 500 }
      );
    }

    // Extract query parameters from request URL
    const { searchParams } = new URL(request.url);
    const countryParam = searchParams.get('country');
    const productParam = searchParams.get('product');

    const { defaultMarkup, usdToNgnRate } = await getPricingConfig();

    // Construct target URL to 5-SIM supporting optional filters
    let providerUrl = 'https://5sim.net/v1/guest/prices';
    const queryParts: string[] = [];
    if (countryParam) queryParts.push(`country=${encodeURIComponent(countryParam)}`);
    if (productParam) queryParts.push(`product=${encodeURIComponent(productParam)}`);
    if (queryParts.length > 0) {
      providerUrl += `?${queryParts.join('&')}`;
    }

    const providerRes = await fetch(providerUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json',
      },
      cache: 'no-store',
    });

    const textBody = await providerRes.text();
    if (!textBody || textBody.trim() === '') {
      return NextResponse.json({}, { status: 200 });
    }

    let globalData;
    try {
      globalData = JSON.parse(textBody);
    } catch (parseErr) {
      return NextResponse.json(
        { error: 'Failed to parse provider JSON payload.' },
        { status: 502 }
      );
    }

    if (!globalData || typeof globalData !== 'object') {
      return NextResponse.json({}, { status: 200 });
    }

    // 5-SIM sometimes returns a flat array or object list instead of a nested object tree 
    // when specific filters like country + product are combined. Let's make the traversal safe.
    if (Array.isArray(globalData)) {
      const modifiedPricesArray = globalData.map((item: any) => {
        if (!item || typeof item !== 'object') return item;
        const details = item;
        const baseUsdPrice = Number(details.cost || details.price || 0);

        const priceUsd = baseUsdPrice * defaultMarkup;
        const finalPrice = Math.ceil(priceUsd * usdToNgnRate);

        const { price, ...restDetails } = details;

        return {
          ...restDetails,
          cost: finalPrice,
        };
      });

      const response = NextResponse.json(modifiedPricesArray, { status: 200 });
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      return response;
    }

    const modifiedPricesData: Record<string, Record<string, Record<string, any>>> = {};

    for (const [firstKey, firstObj] of Object.entries(globalData as Record<string, any>)) {
      if (!firstObj || typeof firstObj !== 'object') {
        modifiedPricesData[firstKey] = firstObj;
        continue;
      }

      modifiedPricesData[firstKey] = {};

      for (const [secondKey, secondObj] of Object.entries(firstObj as Record<string, any>)) {
        if (!secondObj || typeof secondObj !== 'object') {
          modifiedPricesData[firstKey][secondKey] = secondObj;
          continue;
        }

        // Check if secondObj is the operator details object directly (happens on specific filtered endpoints)
        if ('cost' in secondObj || 'count' in secondObj || 'price' in secondObj || 'rate' in secondObj) {
          const details = (secondObj as any) || {};
          const baseUsdPrice = Number(details.cost || details.price || 0);

          const priceUsd = baseUsdPrice * defaultMarkup;
          const finalPrice = Math.ceil(priceUsd * usdToNgnRate);

          const { price, ...restDetails } = details;

          (modifiedPricesData[firstKey] as any)[secondKey] = {
            ...restDetails,
            cost: finalPrice,
          };
          continue;
        }

        modifiedPricesData[firstKey][secondKey] = {};

        for (const [operatorName, operatorDetails] of Object.entries(secondObj as Record<string, any>)) {
          const details = (operatorDetails as any) || {};
          const baseUsdPrice = Number(details.cost || details.price || 0);

          // Apply markup and conversion rate
          const priceUsd = baseUsdPrice * defaultMarkup;
          const finalPrice = Math.ceil(priceUsd * usdToNgnRate);

          // Remove redundant 'price' field and keep only 'cost'
          const { price, ...restDetails } = details;

          modifiedPricesData[firstKey][secondKey][operatorName] = {
            ...restDetails,
            cost: finalPrice,
          };
        }
      }
    }

    const response = NextResponse.json(modifiedPricesData, { status: 200 });
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    return response;

  } catch (error: any) {
    console.error('[API PRICES CRITICAL ERROR]:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error while loading prices.' },
      { status: 500 }
    );
  }
}

