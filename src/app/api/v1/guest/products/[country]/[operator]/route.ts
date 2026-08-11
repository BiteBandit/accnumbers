import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

async function getPricingConfig() {
  try {
    const { data } = await supabase.from('settings').select('key, value');
    if (!data) return { defaultMarkup: 1.0, usdToNgnRate: 1500 };

    const markupRow = data.find((row) => row.key === 'markup_multiplier');
    const usdToNgnRow = data.find((row) => row.key === 'usd_to_ngn' || row.key === 'usdt_rate');

    const config = {
      defaultMarkup: markupRow ? Number(markupRow.value) : 1.0,
      usdToNgnRate: usdToNgnRow ? Number(usdToNgnRow.value) : 1500,
    };
    return config;
  } catch (err) {
    console.error('[API PRODUCTS] Error loading settings from Supabase:', err);
    return { defaultMarkup: 1.0, usdToNgnRate: 1500 };
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ country: string; operator: string }> }
) {
  try {
    const { country, operator } = await params;

    if (!country || !operator) {
      return NextResponse.json(
        { error: 'Missing country or operator path parameters.' },
        { status: 400 }
      );
    }

    const apiKey = process.env.SIM5_API_KEY || process.env.GRIZZLY_API_KEY || '';
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is missing in server environment variables.' },
        { status: 500 }
      );
    }

    const { defaultMarkup, usdToNgnRate } = await getPricingConfig();

    // Fetch global prices from 5-SIM
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

    let data;
    try {
      data = JSON.parse(textBody);
    } catch (parseErr) {
      return NextResponse.json(
        { error: 'Failed to parse provider JSON payload.' },
        { status: 502 }
      );
    }

    const countryData = data?.[country.toLowerCase()];
    const operatorData = countryData?.[operator.toLowerCase()];

    if (!operatorData) {
      return NextResponse.json({}, { status: 200 });
    }

    // Transform 5-SIM's structure into the exact 5-SIM product catalog format
    // Format required: { "service_name": { "Category": "...", "Qty": 123, "Price": 456 } }
    const modifiedProducts: Record<string, { Category: string; Qty: number; Price: number }> = {};

    for (const [serviceName, serviceInfo] of Object.entries(operatorData as Record<string, any>)) {
      const baseUsdPrice = Number(serviceInfo?.cost || serviceInfo?.price || 0);
      const totalStock = Number(serviceInfo?.count || 0);

      // Skip products with 0 stock if you want, or include them
      if (totalStock <= 0) continue;

      // Apply markup and conversion rate (e.g., converting to NGN or keeping it as final store currency)
      const priceUsd = baseUsdPrice * defaultMarkup;
      const finalPrice = Math.ceil(priceUsd * usdToNgnRate); // or just Math.round(priceUsd) if using USD

      modifiedProducts[serviceName] = {
        Category: serviceInfo?.category || 'activation',
        Qty: totalStock,
        Price: finalPrice,
      };
    }

    const response = NextResponse.json(modifiedProducts, { status: 200 });
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    return response;

  } catch (error: any) {
    console.error('[API GUEST PRODUCTS CRITICAL ERROR]:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error while loading products.' },
      { status: 500 }
    );
  }
}

