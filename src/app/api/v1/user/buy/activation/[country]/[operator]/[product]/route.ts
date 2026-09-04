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
    console.error('[API CONFIG] Error loading settings from Supabase:', err);
    return { defaultMarkup: 1.0, usdToNgnRate: 1500 };
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ country: string; operator: string; product: string }> }
) {
  try {
    const resolvedParams = await params;
    const country = resolvedParams?.country?.toLowerCase() || '';
    const operator = resolvedParams?.operator?.toLowerCase() || '';
    const product = resolvedParams?.product?.toLowerCase() || '';

    if (!country || !operator || !product) {
      return NextResponse.json(
        { error: 'Missing country, operator, or product path parameters.' },
        { status: 400 }
      );
    }

    // Authenticate user via custom API token/key from headers
    const authHeader = request.headers.get('authorization') || request.headers.get('x-api-key') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;

    if (!token) {
      return NextResponse.json(
        { error: 'Missing or invalid API token' },
        { status: 401 }
      );
    }

    // Validate API key and check purchase scope / status in Supabase
    const { data: keyData, error: keyError } = await supabase
      .from('api_keys')
      .select('*, users(*)')
      .eq('key', token)
      .single();

    if (keyError || !keyData || keyData.status !== 'active') {
      return NextResponse.json(
        { error: 'Invalid or inactive API key.' },
        { status: 401 }
      );
    }

    if (keyData.scopes && !keyData.scopes.includes('purchase')) {
      return NextResponse.json(
        { error: 'This API key lacks permission to purchase numbers (purchase scope is disabled).' },
        { status: 403 }
      );
    }

    const userId = keyData.user_id;
    const apiKey = process.env.SIM5_API_KEY || process.env.GRIZZLY_API_KEY || '';
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is missing in server environment variables.' },
        { status: 500 }
      );
    }

    const { defaultMarkup, usdToNgnRate } = await getPricingConfig();

    // Fetch upstream product catalog price first to evaluate wallet balance
    const catalogRes = await fetch(`https://5sim.net/v1/guest/products/${country}/${operator}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json',
      },
      cache: 'no-store',
    });

    const catalogText = await catalogRes.text();
    let catalogData;
    try {
      catalogData = JSON.parse(catalogText);
    } catch (e) {
      return NextResponse.json({ error: 'Failed to parse provider pricing catalog.' }, { status: 502 });
    }

    const productDetails = catalogData?.[product];
    const baseUsdPrice = Number(productDetails?.Price || productDetails?.cost || productDetails?.price || 0);
    
    if (!productDetails || baseUsdPrice <= 0) {
      return NextResponse.json({ error: 'Selected product is out of stock or unavailable.' }, { status: 400 });
    }

    const finalPrice = Math.ceil(baseUsdPrice * defaultMarkup * usdToNgnRate);

    // Check user wallet balance
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('balance')
      .eq('id', userId)
      .single();

    if (profileError || !profileData || Number(profileData.balance) < finalPrice) {
      return NextResponse.json(
        { error: 'Insufficient wallet balance to complete this purchase.' },
        { status: 400 }
      );
    }

    // Call Upstream Buy Activation Endpoint
    const providerRes = await fetch(`https://5sim.net/v1/user/buy/activation/${country}/${operator}/${product}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json',
      },
      cache: 'no-store',
    });

    const textBody = await providerRes.text();
    if (!providerRes.ok || !textBody) {
      return NextResponse.json(
        { error: 'Upstream provider failed to fulfill the purchase order.' },
        { status: 502 }
      );
    }

    let upstreamOrder;
    try {
      upstreamOrder = JSON.parse(textBody);
    } catch (parseErr) {
      return NextResponse.json(
        { error: 'Failed to parse provider purchase response payload.' },
        { status: 502 }
      );
    }

    // Deduct user balance and save order log in Supabase
    const newBalance = Number(profileData.balance) - finalPrice;
    await supabase.from('profiles').update({ balance: newBalance }).eq('id', userId);

    const orderRecord = {
      user_id: userId,
      order_id: upstreamOrder.id || upstreamOrder.ID,
      phone: upstreamOrder.phone || upstreamOrder.number,
      operator: operator,
      product: product,
      country: country,
      price: finalPrice,
      status: 'PENDING',
      expires: upstreamOrder.expires || new Date(Date.now() + 20 * 60 * 1000).toISOString(),
      sms: [],
    };

    const { data: insertedOrder, error: insertError } = await supabase
      .from('orders')
      .insert([orderRecord])
      .select()
      .single();

    if (insertError) {
      console.error('[API BUY] Error saving order to database:', insertError);
    }

    const responsePayload = {
      id: insertedOrder?.order_id || upstreamOrder.id,
      phone: upstreamOrder.phone || upstreamOrder.number,
      operator: operator,
      product: product,
      price: finalPrice,
      status: 'PENDING',
      expires: upstreamOrder.expires || orderRecord.expires,
      sms: [],
      created_at: insertedOrder?.created_at || new Date().toISOString(),
      country: country,
    };

    const response = NextResponse.json(responsePayload, { status: 200 });
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    return response;

  } catch (error: any) {
    console.error('[API BUY ACTIVATION CRITICAL ERROR]:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error while processing purchase.' },
      { status: 500 }
    );
  }
}

