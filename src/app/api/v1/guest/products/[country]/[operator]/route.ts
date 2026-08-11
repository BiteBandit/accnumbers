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
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const apiKey = process.env.SIM5_API_KEY || process.env.GRIZZLY_API_KEY || '';
    
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

    const data = JSON.parse(textBody);

    // --- DEEP INSPECTION LOGS ---
    // This will print the first 10 country keys available in your Vercel Function logs
    console.log('[5SIM_DEBUG] Sample keys in root data:', Object.keys(data).slice(0, 10));
    console.log('[5SIM_DEBUG] Looking for country key:', country);
    
    let countryData = data?.[country];
    
    // If exact match fails, let's see if it's stored under a different variation or case
    if (!countryData) {
      const foundKey = Object.keys(data).find(k => k.toLowerCase() === country);
      if (foundKey) {
        countryData = data[foundKey];
        console.log('[5SIM_DEBUG] Found country via case-insensitive match:', foundKey);
      }
    }

    const operatorData = countryData?.[operator] || countryData?.[Object.keys(countryData || {}).find(k => k.toLowerCase() === operator) || ''];

    if (!operatorData) {
      console.log('[5SIM_DEBUG] Operator not found under country. Available operators:', countryData ? Object.keys(countryData).slice(0, 10) : 'Country is undefined');
      return NextResponse.json({}, { status: 200 });
    }

    const { defaultMarkup, usdToNgnRate } = await getPricingConfig();
    const modifiedProducts: Record<string, { Category: string; Qty: number; Price: number }> = {};

    for (const [serviceName, serviceInfo] of Object.entries(operatorData as Record<string, any>)) {
      const baseUsdPrice = Number((serviceInfo as any)?.cost || (serviceInfo as any)?.price || 0);
      const totalStock = Number((serviceInfo as any)?.count || 0);

      if (totalStock <= 0) continue;

      const priceUsd = baseUsdPrice * defaultMarkup;
      const finalPrice = Math.ceil(priceUsd * usdToNgnRate);

      modifiedProducts[serviceName] = {
        Category: (serviceInfo as any)?.category || 'activation',
        Qty: totalStock,
        Price: finalPrice,
      };
    }

    const response = NextResponse.json(modifiedProducts, { status: 200 });
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    return response;

  } catch (error: any) {
    console.error('[API GUEST PRODUCTS CRITICAL ERROR]:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

