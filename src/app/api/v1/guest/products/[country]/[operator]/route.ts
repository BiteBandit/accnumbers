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
    console.error('[API PRODUCTS] Error loading settings from Supabase:', err);
    return { defaultMarkup: 1.0, usdToNgnRate: 1500 };
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ country: string; operator: string }> }
) {
  try {
    const resolvedParams = await params;
    const country = resolvedParams?.country?.toLowerCase() || '';
    const operator = resolvedParams?.operator?.toLowerCase() || '';

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

    // Query 5-SIM's direct product endpoint for the given country and operator
    const providerRes = await fetch(`https://5sim.net/v1/guest/products/${country}/${operator}`, {
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

    let upstreamData;
    try {
      upstreamData = JSON.parse(textBody);
    } catch (parseErr) {
      return NextResponse.json(
        { error: 'Failed to parse provider JSON payload.' },
        { status: 502 }
      );
    }

    // If 5-SIM returns an error message or empty object
    if (!upstreamData || typeof upstreamData !== 'object') {
      return NextResponse.json({}, { status: 200 });
    }

    // Transform raw 5-SIM products payload: apply your markup and conversion rate
    const modifiedProducts: Record<string, { Category: string; Qty: number; Price: number }> = {};

    for (const [productName, productDetails] of Object.entries(upstreamData as Record<string, any>)) {
      const baseUsdPrice = Number(productDetails?.Price || productDetails?.cost || productDetails?.price || 0);
      const totalStock = Number(productDetails?.Qty || productDetails?.count || 0);

      if (totalStock <= 0) continue;

      const priceUsd = baseUsdPrice * defaultMarkup;
      const finalPrice = Math.ceil(priceUsd * usdToNgnRate);

      modifiedProducts[productName] = {
        Category: productDetails?.Category || productDetails?.category || 'activation',
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

