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

    const { defaultMarkup, usdToNgnRate } = await getPricingConfig();

    // Fetch the global prices feed from 5-SIM
    const providerRes = await fetch('https://5sim.net/v1/guest/prices', {
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

    // Traverse: Country -> Product -> Operator -> Details
    const modifiedPricesData: Record<string, Record<string, Record<string, any>>> = {};

    for (const [countryName, countryObj] of Object.entries(globalData as Record<string, any>)) {
      if (!countryObj || typeof countryObj !== 'object') continue;

      modifiedPricesData[countryName] = {};

      for (const [productName, productObj] of Object.entries(countryObj as Record<string, any>)) {
        if (!productObj || typeof productObj !== 'object') continue;

        modifiedPricesData[countryName][productName] = {};

        for (const [operatorName, operatorDetails] of Object.entries(productObj as Record<string, any>)) {
          const details = (operatorDetails as any) || {};
          const baseUsdPrice = Number(details.cost || details.price || 0);

          // Apply markup and conversion rate
          const priceUsd = baseUsdPrice * defaultMarkup;
          const finalPrice = Math.ceil(priceUsd * usdToNgnRate);

          // Build object using only 'cost' and removing any redundant 'price' field
          const { price, ...restDetails } = details;

          modifiedPricesData[countryName][productName][operatorName] = {
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
    console.error('[API GLOBAL PRICES CRITICAL ERROR]:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error while loading global prices.' },
      { status: 500 }
    );
  }
}

