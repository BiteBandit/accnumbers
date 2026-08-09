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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const country = searchParams.get('country');
    const service = searchParams.get('service');

    if (!country || !service) {
      return NextResponse.json(
        { success: false, error: 'Missing country or service query parameters.' },
        { status: 400 }
      );
    }

    const apiKey = process.env.SIM5_API_KEY || process.env.GRIZZLY_API_KEY || '';
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'API key is missing in server environment variables.' },
        { status: 500 }
      );
    }

    const { defaultMarkup, usdToNgnRate } = await getPricingConfig();

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
      return NextResponse.json(
        { success: false, error: 'Provider returned an empty response.' },
        { status: 502 }
      );
    }

    let data;
    try {
      data = JSON.parse(textBody);
    } catch (parseErr) {
      return NextResponse.json(
        { success: false, error: 'Failed to parse provider JSON payload.' },
        { status: 502 }
      );
    }

    const countryData = data?.[country];
    const serviceData = countryData?.[service];

    if (!serviceData) {
      return NextResponse.json({ success: true, operators: [] });
    }

    const operatorsList = Object.keys(serviceData).map((opName) => {
      const opInfo = serviceData[opName];
      
      const baseUsdPrice = Number(opInfo?.cost || opInfo?.price || 0);
      const totalStock = Number(opInfo?.count || 0);
      
      // Automatically pull the highest rate across all time windows to universally match 5sim's frontend view
      const rateValues = [
        Number(opInfo?.rate),
        Number(opInfo?.rate1),
        Number(opInfo?.rate3),
        Number(opInfo?.rate24),
        Number(opInfo?.rate72),
        Number(opInfo?.rate168),
        Number(opInfo?.rate720)
      ].filter((val) => !isNaN(val) && val > 0);

      const successRate = rateValues.length > 0 ? Math.max(...rateValues) : 0;

      const priceUsd = Number((baseUsdPrice * defaultMarkup).toFixed(2));
      const priceNgn = Math.ceil(Number((priceUsd * usdToNgnRate).toFixed(2)));

      return {
        operator: opName,
        totalStock,
        successRate: Number(successRate.toFixed(1)),
        priceUsd,
        priceNgn,
      };
    }).filter(op => op.totalStock > 0);

    const response = NextResponse.json({
      success: true,
      operators: operatorsList,
    });

    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    return response;

  } catch (error: any) {
    console.error('[API PRODUCTS CRITICAL ERROR]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error while loading operators.' },
      { status: 500 }
    );
  }
}

