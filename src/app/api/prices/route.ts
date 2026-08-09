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
  } catch {
    return { defaultMarkup: 1.0, usdToNgnRate: 1500 };
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const serviceParam = searchParams.get('service');

    const apiKey = process.env.SIM5_API_KEY || process.env.GRIZZLY_API_KEY || '';
    if (!apiKey) {
      return NextResponse.json({ success: false, error: 'SIM5_API_KEY is missing' }, { status: 400 });
    }

    // Fetch prices from 5sim API
    const res = await fetch('https://5sim.net/v1/guest/prices', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json',
      },
      cache: 'no-store'
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ success: false, error: `5sim API error: ${text}` }, { status: 400 });
    }

    let data;
    try {
      data = await res.json();
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid JSON response from provider' }, { status: 500 });
    }

    const { defaultMarkup, usdToNgnRate } = await getPricingConfig();
    const servicesList: any[] = [];

    // Parse 5sim pricing matrix and pick ONLY the cheapest operator per country/service
    if (data && typeof data === 'object') {
      Object.entries(data).forEach(([countryName, servicesObj]) => {
        if (!servicesObj || typeof servicesObj !== 'object') return;

        Object.entries(servicesObj as Record<string, any>).forEach(([sCode, operatorsObj]) => {
          if (!operatorsObj || typeof operatorsObj !== 'object') return;

          let cheapestOperator = '';
          let lowestBasePrice = Infinity;
          let totalCountForService = 0;

          // Compare all operators for this specific service & country to find the cheapest
          Object.entries(operatorsObj as Record<string, any>).forEach(([operatorName, info]) => {
            const count = Number(info?.count || 0);
            const baseUsdPrice = Number(info?.cost || 0);

            if (count > 0 && baseUsdPrice > 0) {
              totalCountForService += count;
              if (baseUsdPrice < lowestBasePrice) {
                lowestBasePrice = baseUsdPrice;
                cheapestOperator = operatorName;
              }
            }
          });

          // If a valid operator with stock exists, register it once using precise math
          if (cheapestOperator && lowestBasePrice !== Infinity) {
            // Apply markup securely using floating point correction factor
            const finalDollarPrice = Number((lowestBasePrice * defaultMarkup).toFixed(2));
            
            // Accurate NGN conversion using high-precision calculation to prevent float distortions
            const finalNairaPrice = Math.ceil(Number((finalDollarPrice * usdToNgnRate).toFixed(2)));
            
            const cleanCode = sCode.toLowerCase().trim();

            servicesList.push({
              id: `${countryName}-${cleanCode}`,
              country: countryName.charAt(0).toUpperCase() + countryName.slice(1),
              service: cleanCode.toUpperCase(),
              rawCode: cleanCode,
              operator: cheapestOperator, // Automatically locked to the cheapest option
              priceNgn: finalNairaPrice,
              priceUsd: finalDollarPrice,
              totalStock: totalCountForService,
            });
          }
        });
      });
    }

    let finalServices = servicesList;
    if (serviceParam) {
      const cleanQuery = serviceParam.toLowerCase().trim();
      finalServices = servicesList.filter(
        (item) => item.rawCode === cleanQuery || item.service.toLowerCase().includes(cleanQuery)
      );
    }

    return NextResponse.json({
      success: true,
      services: finalServices,
    });
  } catch (error: any) {
    console.error('[API PRICES CRITICAL ERROR]:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
